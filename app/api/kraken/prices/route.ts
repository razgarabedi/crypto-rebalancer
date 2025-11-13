import { NextResponse } from 'next/server';
import krakenClient, { type TickerPrice } from '@/lib/kraken';

// In-memory cache for ticker responses (per-symbols key)
type CacheEntry = { data: TickerPrice[]; expiresAt: number };
const TICKER_CACHE: Map<string, CacheEntry> = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

/**
 * GET /api/kraken/prices?symbols=XXBTZUSD,XETHZUSD,SOLUSD
 * Get current ticker prices from Kraken
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');
    const force = searchParams.get('force') === 'true';
    
    // Default symbols if none provided
    const symbols = symbolsParam 
      ? symbolsParam.split(',').map(s => s.trim())
      : ['XXBTZUSD', 'XETHZUSD', 'SOLUSD'];

    // Filter out potentially invalid symbols
    const validSymbols = symbols.filter(symbol => {
      // Skip symbols that are likely to cause "Unknown asset pair" errors
      if (symbol.includes('.F') || symbol.includes('BNB.F')) return false;
      if (symbol.includes('BNB')) return false; // Kraken does not list BNB
      return true;
    });

    if (validSymbols.length === 0) {
      return NextResponse.json({ 
        success: true,
        tickers: [],
        count: 0,
        message: 'No valid trading pairs found'
      });
    }

    // Use cache unless force-refresh requested
    const cacheKey = validSymbols.slice().sort().join(',');
    const now = Date.now();
    const cached = TICKER_CACHE.get(cacheKey);
    if (!force && cached && cached.expiresAt > now) {
      return NextResponse.json({
        success: true,
        tickers: cached.data,
        count: cached.data.length,
        cached: true,
        expiresAt: cached.expiresAt,
      });
    }

    const tickers = await krakenClient.getTickerPrices(validSymbols);

    // Save to cache
    TICKER_CACHE.set(cacheKey, {
      data: tickers,
      expiresAt: now + CACHE_TTL_MS,
    });

    return NextResponse.json({ 
      success: true,
      tickers,
      count: tickers.length,
      cached: false,
      expiresAt: now + CACHE_TTL_MS,
    });
  } catch (error) {
    // If it's a "Unknown asset pair" error, return empty result instead of error (no noisy log)
    if (error instanceof Error && error.message.includes('Unknown asset pair')) {
      return NextResponse.json({ 
        success: true,
        tickers: [],
        count: 0,
        message: 'Some trading pairs are not available on Kraken'
      });
    }
    
    console.error('Error fetching Kraken prices:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch ticker prices',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

