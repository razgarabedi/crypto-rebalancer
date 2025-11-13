/**
 * Price Cache System
 * Centralized price fetching and caching to minimize Kraken API calls
 */

import { getUserKrakenClient } from './kraken-user';
import { getTradingPair, normalizeAssetSymbol } from './rebalance';

interface PriceCacheEntry {
  prices: Record<string, number>;
  timestamp: number;
  expiresAt: number;
}

class PriceCache {
  private cache: Map<string, PriceCacheEntry> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 10; // Maximum number of user caches

  /**
   * Get prices for symbols, using cache when possible
   * Includes retry logic for API rate limits and temporary failures
   */
  async getPrices(userId: string, symbols: string[], retryCount: number = 0): Promise<Record<string, number>> {
    const cacheKey = `user_${userId}`;
    const now = Date.now();
    const MAX_RETRIES = 2;
    const RETRY_DELAY = 15000; // 15 seconds as requested
    
    // Check if we have a valid cache entry
    const cached = this.cache.get(cacheKey);
    if (cached && now < cached.expiresAt) {
      // Verify cached prices include ALL requested symbols (except EUR which is always 1.0)
      const requestedNonEur = symbols.filter(s => s !== 'EUR');
      const cachedSymbols = Object.keys(cached.prices);
      const missingSymbols = requestedNonEur.filter(s => !cachedSymbols.includes(s));
      
      if (missingSymbols.length === 0) {
        console.log(`[PriceCache] Using cached prices for user ${userId} (${cachedSymbols.length} symbols, all requested symbols found)`);
        return cached.prices;
      } else {
        // Cache doesn't have all symbols - invalidate and fetch fresh
        console.log(`[PriceCache] Cache incomplete for user ${userId} - missing: ${missingSymbols.join(', ')}. Fetching fresh prices...`);
        this.cache.delete(cacheKey);
      }
    }

    console.log(`[PriceCache] Fetching fresh prices for user ${userId} (${symbols.length} symbols)${retryCount > 0 ? ` - Retry attempt ${retryCount}/${MAX_RETRIES}` : ''}`);
    
    try {
      const krakenClient = await getUserKrakenClient(userId);
      const { prices, hadErrors } = await this.fetchPricesFromKraken(krakenClient, symbols);
      
      // Check if we got any prices
      const foundPrices = Object.keys(prices).length;
      const expectedPrices = symbols.filter(s => s !== 'EUR').length; // EUR is always 1.0
      
      // Retry if no prices found OR if we had errors and got fewer prices than expected
      if ((foundPrices === 0 || (hadErrors && foundPrices < expectedPrices)) && retryCount < MAX_RETRIES) {
        // No prices found or partial failure - likely API rate limit issue
        console.warn(`[PriceCache] ${foundPrices === 0 ? 'No prices' : 'Incomplete prices'} fetched (${foundPrices}/${expectedPrices})${hadErrors ? ' with errors' : ''}, retrying in ${RETRY_DELAY / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return this.getPrices(userId, symbols, retryCount + 1);
      }
      
      // Only cache results if we got at least some prices (don't cache complete failures)
      if (foundPrices > 0) {
        this.cache.set(cacheKey, {
          prices,
          timestamp: now,
          expiresAt: now + this.CACHE_DURATION
        });
        // Clean up old cache entries
        this.cleanupCache();
      } else if (retryCount >= MAX_RETRIES) {
        // After max retries, cache empty to prevent immediate retries, but with shorter expiry
        this.cache.set(cacheKey, {
          prices,
          timestamp: now,
          expiresAt: now + 30000 // 30 seconds for failed fetches
        });
      }

      return prices;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[PriceCache] Error fetching prices for user ${userId} (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, errorMessage);
      
      // Retry on ALL API errors (rate limits, network issues, etc.)
      // Always retry unless it's a non-retryable error (like authentication)
      if (retryCount < MAX_RETRIES) {
        const isNonRetryableError = errorMessage.toLowerCase().includes('unauthorized') || 
                                    errorMessage.toLowerCase().includes('forbidden') ||
                                    errorMessage.toLowerCase().includes('invalid credentials');
        
        if (!isNonRetryableError) {
          // Retry on any other error (rate limits, timeouts, network issues, etc.)
          console.warn(`[PriceCache] API error detected (${errorMessage.substring(0, 50)}...), retrying in ${RETRY_DELAY / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return this.getPrices(userId, symbols, retryCount + 1);
        }
      }
      
      // Return cached prices if available, even if expired
      if (cached) {
        console.log(`[PriceCache] Returning expired cache for user ${userId} after ${retryCount + 1} failed attempts`);
        return cached.prices;
      }
      
      // Return empty prices as last resort
      console.warn(`[PriceCache] Returning empty prices after ${retryCount + 1} failed attempts - no cache available`);
      return {};
    }
  }

  /**
   * Fetch prices from Kraken API with optimized batching
   * Returns both prices and a flag indicating if any errors occurred
   */
  private async fetchPricesFromKraken(krakenClient: { getTickerPrices: (pairs: string[]) => Promise<Array<{ symbol: string; price: number }>> }, symbols: string[]): Promise<{ prices: Record<string, number>; hadErrors: boolean }> {
    const prices: Record<string, number> = {};
    let hadErrors = false;
    
    // Get EUR/USD rate for conversions
    let eurUsdRate = 1.0;
    try {
      const usdTickers = await krakenClient.getTickerPrices(['USDTZEUR']);
      if (usdTickers.length > 0) {
        eurUsdRate = 1 / usdTickers[0].price; // EUR to USD rate
        console.log(`[PriceCache] EUR/USD conversion rate: ${eurUsdRate.toFixed(4)}`);
      }
    } catch (error) {
      hadErrors = true;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`[PriceCache] Could not fetch EUR/USD rate, using 1.0: ${errorMsg}`);
    }
    
    // Batch all EUR pairs first
    const eurPairs = symbols
      .filter(symbol => symbol !== 'EUR')
      .map(symbol => getTradingPair(symbol, 'EUR'));
    
    if (eurPairs.length > 0) {
      try {
        const eurTickers = await krakenClient.getTickerPrices(eurPairs);
        for (const ticker of eurTickers) {
          const symbol = normalizeAssetSymbol(ticker.symbol.replace(/EUR$/, '').replace(/Z$/, ''));
          prices[symbol] = ticker.price;
        }
      } catch (error) {
        hadErrors = true;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`[PriceCache] Error fetching EUR pairs: ${errorMsg}`);
        // For rate limit errors, rethrow to trigger retry
        if (errorMsg.toLowerCase().includes('rate') || errorMsg.toLowerCase().includes('limit') || errorMsg.toLowerCase().includes('429')) {
          throw error; // Re-throw rate limit errors to trigger retry
        }
      }
    }

    // Handle remaining symbols that didn't get EUR prices
    const remainingSymbols = symbols.filter(symbol => 
      symbol !== 'EUR' && !prices[symbol]
    );

    if (remainingSymbols.length > 0) {
      console.log(`[PriceCache] Fetching USD pairs for ${remainingSymbols.length} remaining symbols`);
      
      // Batch USD pairs
      const usdPairs = remainingSymbols.map(symbol => getTradingPair(symbol, 'USD'));
      
      try {
        const usdTickers = await krakenClient.getTickerPrices(usdPairs);
        for (const ticker of usdTickers) {
          const symbol = normalizeAssetSymbol(ticker.symbol.replace(/USD$/, '').replace(/Z$/, ''));
          const usdPrice = ticker.price;
          prices[symbol] = usdPrice / eurUsdRate; // Convert USD to EUR
        }
      } catch (error) {
        hadErrors = true;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`[PriceCache] Error fetching USD pairs: ${errorMsg}`);
        // For rate limit errors, rethrow to trigger retry
        if (errorMsg.toLowerCase().includes('rate') || errorMsg.toLowerCase().includes('limit') || errorMsg.toLowerCase().includes('429')) {
          throw error; // Re-throw rate limit errors to trigger retry
        }
      }

      // Handle remaining symbols with USDT pairs
      const stillRemaining = remainingSymbols.filter(symbol => !prices[symbol]);
      if (stillRemaining.length > 0) {
        console.log(`[PriceCache] Fetching USDT pairs for ${stillRemaining.length} remaining symbols`);
        
        const usdtPairs = stillRemaining.map(symbol => getTradingPair(symbol, 'USDT'));
        
        try {
          const usdtTickers = await krakenClient.getTickerPrices(usdtPairs);
          for (const ticker of usdtTickers) {
            const symbol = normalizeAssetSymbol(ticker.symbol.replace(/USDT$/, '').replace(/Z$/, ''));
            const usdtPrice = ticker.price;
            prices[symbol] = usdtPrice / eurUsdRate; // Convert USDT to EUR
          }
        } catch (error) {
          hadErrors = true;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.warn(`[PriceCache] Error fetching USDT pairs: ${errorMsg}`);
          // For rate limit errors, rethrow to trigger retry
          if (errorMsg.toLowerCase().includes('rate') || errorMsg.toLowerCase().includes('limit') || errorMsg.toLowerCase().includes('429')) {
            throw error; // Re-throw rate limit errors to trigger retry
          }
        }
      }
    }

    // Set EUR price
    prices['EUR'] = 1.0;

    // Log results
    const foundPrices = Object.keys(prices).length;
    const totalSymbols = symbols.length;
    console.log(`[PriceCache] Successfully fetched ${foundPrices}/${totalSymbols} prices${hadErrors ? ' (with some errors)' : ''}`);

    return { prices, hadErrors };
  }

  /**
   * Clean up old cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Remove expired entries
    for (const [key, entry] of entries) {
      if (now >= entry.expiresAt) {
        this.cache.delete(key);
      }
    }

    // If still too many entries, remove oldest ones
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const toRemove = sortedEntries.slice(0, this.cache.size - this.MAX_CACHE_SIZE);
      for (const [key] of toRemove) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear cache for a specific user
   */
  clearUserCache(userId: string): void {
    const cacheKey = `user_${userId}`;
    this.cache.delete(cacheKey);
    console.log(`[PriceCache] Cleared cache for user ${userId}`);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
    console.log(`[PriceCache] Cleared all cache`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: Array<{ userId: string; symbols: number; expiresAt: number }> } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      userId: key.replace('user_', ''),
      symbols: Object.keys(entry.prices).length,
      expiresAt: entry.expiresAt
    }));

    return {
      size: this.cache.size,
      entries
    };
  }
}

// Export singleton instance
export const priceCache = new PriceCache();
export default priceCache;
