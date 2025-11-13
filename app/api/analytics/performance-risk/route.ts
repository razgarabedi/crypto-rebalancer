import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

/**
 * GET /api/analytics/performance-risk
 * Fetch performance and risk analytics for portfolio coins
 * 
 * Query params:
 * - symbols: Comma-separated list of coin symbols (e.g., "BTC,ETH,SOL")
 */

const KRAKEN_API_URL = 'https://api.kraken.com/0/public';

interface PriceData {
  timestamp: number;
  close: number;
}

interface PerformanceMetric {
  symbol: string;
  return7d: number;
  return30d: number;
  return90d: number;
  volatility: number;
  prices: number[];
  timestamps: number[];
}

interface CorrelationMatrix {
  [symbol: string]: {
    [symbol: string]: number;
  };
}

/**
 * Get CoinGecko ID for symbol (for historical data fallback)
 */
function getCoinGeckoId(symbol: string): string | null {
  const map: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'ADA': 'cardano',
    'DOT': 'polkadot',
    'AVAX': 'avalanche-2',
    'MATIC': 'matic-network',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'AAVE': 'aave',
    'ATOM': 'cosmos',
    'RENDER': 'render-token',
    'XRP': 'ripple',
    'BNB': 'binancecoin',
    'DOGE': 'dogecoin',
    'LTC': 'litecoin',
    'BCH': 'bitcoin-cash',
    'XLM': 'stellar',
    'ALGO': 'algorand',
    'VET': 'vechain',
    'ICP': 'internet-computer',
    'FIL': 'filecoin',
    'TRX': 'tron',
    'ETC': 'ethereum-classic',
    'HBAR': 'hedera-hashgraph',
    'FLUX': 'zelcash',
    'RPL': 'rocket-pool',
  };
  
  return map[symbol.toUpperCase()] || null;
}

/**
 * Symbol to Kraken pair mapping for common assets
 */
function getKrakenPair(symbol: string): string[] {
  const mapping: Record<string, string[]> = {
    'BTC': ['XXBTZEUR', 'XBTZEUR'],
    'ETH': ['XETHZEUR'],
    'SOL': ['SOLEUR'],
    'ADA': ['ADAEUR'],
    'DOT': ['DOTEUR'],
    'MATIC': ['MATICEUR'],
    'LINK': ['LINKEUR'],
    'AVAX': ['AVAXEUR'],
    'ATOM': ['ATOMEUR'],
    'UNI': ['UNIEUR'],
    'AAVE': ['AAVEEUR'],
    'ALGO': ['ALGOEUR'],
    'XRP': ['XXRPZEUR'],
    'LTC': ['XLTCZEUR'],
    'BCH': ['BCHZEUR'],
    'XLM': ['XXLMZEUR'],
    'FIL': ['FILEUR'],
    'ETC': ['XETCZEUR'],
    'DOGE': ['XDGZEUR', 'DOGEEUR'],
  };
  
  if (mapping[symbol]) {
    return mapping[symbol];
  }
  
  // Try common patterns
  return [
    `${symbol}EUR`,
    `X${symbol}ZEUR`,
    `${symbol}ZEUR`,
    `Z${symbol}ZEUR`,
  ];
}

/**
 * Fetch historical OHLC data from Kraken (optimized with proper pair mapping)
 */
async function fetchKrakenOHLC(symbol: string, days: number): Promise<PriceData[]> {
  try {
    // Calculate since timestamp (days ago)
    const since = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
    
    // Get candidate pairs for this symbol
    const pairs = getKrakenPair(symbol);
    
    for (const pair of pairs) {
      try {
        const response = await axios.get(`${KRAKEN_API_URL}/OHLC`, {
          params: {
            pair: pair,
            interval: 1440, // Daily candles
            since: since,
          },
          timeout: 8000, // Reduced timeout for faster failure
        });
        
        if (response.data.error && response.data.error.length > 0) {
          continue;
        }
        
        const pairKey = Object.keys(response.data.result).find(k => k !== 'last');
        if (pairKey && response.data.result[pairKey]) {
          const ohlc = response.data.result[pairKey];
          if (ohlc && ohlc.length > 0) {
            return ohlc.map((candle: (string | number)[]) => ({
              timestamp: (typeof candle[0] === 'number' ? candle[0] : parseFloat(String(candle[0]))) * 1000, // Convert to milliseconds
              close: typeof candle[4] === 'number' ? candle[4] : parseFloat(String(candle[4])), // Close price
            }));
          }
        }
      } catch {
        continue;
      }
    }
    
    return [];
  } catch {
    // Silent fail - will fallback to CoinGecko
    return [];
  }
}

/**
 * Fetch historical data from CoinGecko (fallback)
 * Implements retry logic with exponential backoff for rate limiting
 */
async function fetchCoinGeckoHistory(coinId: string, days: number, retries = 3): Promise<PriceData[]> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`,
        {
          params: {
            vs_currency: 'eur',
            days: days,
            interval: 'daily',
          },
          timeout: 10000,
        }
      );
      
      if (response.data.prices) {
        return response.data.prices.map(([timestamp, price]: [number, number]) => ({
          timestamp,
          close: price,
        }));
      }
      
      return [];
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        // Rate limited - check retry-after header
        const retryAfter = error.response.headers['retry-after'];
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 1000;
        
        if (attempt < retries - 1) {
          console.warn(`Rate limited for ${coinId}, waiting ${waitTime}ms before retry ${attempt + 2}/${retries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      
      // For non-rate-limit errors or final attempt, log and return empty
      console.error(`Error fetching CoinGecko history for ${coinId} (attempt ${attempt + 1}):`, error);
      if (attempt === retries - 1) {
        return [];
      }
    }
  }
  
  return [];
}

/**
 * Calculate returns over different periods
 */
function calculateReturns(prices: PriceData[]): { return7d: number; return30d: number; return90d: number } {
  if (prices.length < 2) {
    return { return7d: 0, return30d: 0, return90d: 0 };
  }
  
  // Sort by timestamp to ensure chronological order
  const sortedPrices = [...prices].sort((a, b) => a.timestamp - b.timestamp);
  const now = sortedPrices[sortedPrices.length - 1];
  const nowPrice = now.close;
  
  if (!nowPrice || nowPrice === 0) {
    return { return7d: 0, return30d: 0, return90d: 0 };
  }
  
  const nowTimestamp = now.timestamp;
  const sevenDaysAgoTimestamp = nowTimestamp - (7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgoTimestamp = nowTimestamp - (30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgoTimestamp = nowTimestamp - (90 * 24 * 60 * 60 * 1000);
  
  // Find the closest price point to each target date
  // Use the first price that is at or before the target date
  const findClosestPrice = (targetTimestamp: number): PriceData | null => {
    // Start from the end and work backwards to find the closest price <= targetTimestamp
    for (let i = sortedPrices.length - 1; i >= 0; i--) {
      if (sortedPrices[i].timestamp <= targetTimestamp) {
        return sortedPrices[i];
      }
    }
    // If no price is old enough, use the oldest available
    return sortedPrices[0];
  };
  
  const sevenDaysAgo = findClosestPrice(sevenDaysAgoTimestamp);
  const thirtyDaysAgo = findClosestPrice(thirtyDaysAgoTimestamp);
  const ninetyDaysAgo = findClosestPrice(ninetyDaysAgoTimestamp);
  
  const calcReturn = (oldPrice: number, periodDays: number, actualOldTimestamp: number) => {
    if (!oldPrice || oldPrice === 0) return 0;
    
    // Only calculate if we have data from the appropriate time period
    // Allow some tolerance (e.g., if we asked for 7 days ago, accept 6-8 days ago)
    const daysDiff = (nowTimestamp - actualOldTimestamp) / (24 * 60 * 60 * 1000);
    const tolerance = periodDays * 0.5; // 50% tolerance
    
    // If the data is too old (more than 50% beyond the period), return 0
    if (daysDiff > periodDays * (1 + tolerance)) {
      return 0;
    }
    
    return ((nowPrice - oldPrice) / oldPrice) * 100;
  };
  
  return {
    return7d: sevenDaysAgo ? calcReturn(sevenDaysAgo.close, 7, sevenDaysAgo.timestamp) : 0,
    return30d: thirtyDaysAgo ? calcReturn(thirtyDaysAgo.close, 30, thirtyDaysAgo.timestamp) : 0,
    return90d: ninetyDaysAgo ? calcReturn(ninetyDaysAgo.close, 90, ninetyDaysAgo.timestamp) : 0,
  };
}

/**
 * Calculate volatility (annualized standard deviation of daily returns)
 */
function calculateVolatility(prices: PriceData[]): number {
  if (prices.length < 2) return 0;
  
  // Calculate daily returns
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prevPrice = prices[i - 1].close;
    const currPrice = prices[i].close;
    if (prevPrice > 0) {
      returns.push((currPrice - prevPrice) / prevPrice);
    }
  }
  
  if (returns.length === 0) return 0;
  
  // Calculate mean return
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  
  // Calculate variance
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  
  // Standard deviation (daily)
  const stdDev = Math.sqrt(variance);
  
  // Annualize (multiply by sqrt of trading days, ~252 for crypto)
  const annualizedVolatility = stdDev * Math.sqrt(252);
  
  // Return as percentage
  return annualizedVolatility * 100;
}

/**
 * Calculate correlation matrix between assets
 */
function calculateCorrelation(
  metrics: PerformanceMetric[]
): CorrelationMatrix {
  const matrix: CorrelationMatrix = {};
  
  // Initialize matrix
  metrics.forEach(m => {
    matrix[m.symbol] = {};
    metrics.forEach(n => {
      matrix[m.symbol][n.symbol] = m.symbol === n.symbol ? 1 : 0;
    });
  });
  
  // Calculate correlations
  for (let i = 0; i < metrics.length; i++) {
    for (let j = i + 1; j < metrics.length; j++) {
      const asset1 = metrics[i];
      const asset2 = metrics[j];
      
      const correlation = calculateCorrelationCoefficient(
        asset1.prices,
        asset2.prices
      );
      
      matrix[asset1.symbol][asset2.symbol] = correlation;
      matrix[asset2.symbol][asset1.symbol] = correlation;
    }
  }
  
  return matrix;
}

/**
 * Calculate Pearson correlation coefficient between two price series
 */
function calculateCorrelationCoefficient(
  prices1: number[],
  prices2: number[]
): number {
  if (prices1.length !== prices2.length || prices1.length < 2) {
    return 0;
  }
  
  // Calculate daily returns for both assets
  const returns1: number[] = [];
  const returns2: number[] = [];
  
  for (let i = 1; i < prices1.length; i++) {
    const r1 = prices1[i - 1] > 0 ? (prices1[i] - prices1[i - 1]) / prices1[i - 1] : 0;
    const r2 = prices2[i - 1] > 0 ? (prices2[i] - prices2[i - 1]) / prices2[i - 1] : 0;
    returns1.push(r1);
    returns2.push(r2);
  }
  
  if (returns1.length < 2) return 0;
  
  // Calculate means
  const mean1 = returns1.reduce((sum, r) => sum + r, 0) / returns1.length;
  const mean2 = returns2.reduce((sum, r) => sum + r, 0) / returns2.length;
  
  // Calculate correlation coefficient
  let numerator = 0;
  let sumSq1 = 0;
  let sumSq2 = 0;
  
  for (let i = 0; i < returns1.length; i++) {
    const diff1 = returns1[i] - mean1;
    const diff2 = returns2[i] - mean2;
    numerator += diff1 * diff2;
    sumSq1 += diff1 * diff1;
    sumSq2 += diff2 * diff2;
  }
  
  const denominator = Math.sqrt(sumSq1 * sumSq2);
  if (denominator === 0) return 0;
  
  return numerator / denominator;
}

/**
 * Calculate portfolio volatility (weighted average with correlations)
 */
function calculatePortfolioVolatility(
  metrics: PerformanceMetric[],
  weights: Record<string, number>,
  correlationMatrix: CorrelationMatrix
): number {
  if (metrics.length === 0) return 0;
  
  let portfolioVariance = 0;
  
  // Calculate weighted portfolio variance
  for (let i = 0; i < metrics.length; i++) {
    const weight1 = (weights[metrics[i].symbol] || 0) / 100; // Convert percentage to decimal
    const vol1 = metrics[i].volatility / 100; // Convert to decimal
    
    for (let j = 0; j < metrics.length; j++) {
      const weight2 = (weights[metrics[j].symbol] || 0) / 100;
      const vol2 = metrics[j].volatility / 100;
      const correlation = correlationMatrix[metrics[i].symbol]?.[metrics[j].symbol] || 0;
      
      portfolioVariance += weight1 * weight2 * vol1 * vol2 * correlation;
    }
  }
  
  // Convert variance to volatility (standard deviation)
  const portfolioVolatility = Math.sqrt(portfolioVariance) * 100;
  
  return portfolioVolatility;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');
    const weightsParam = searchParams.get('weights'); // JSON string of weights
    
    if (!symbolsParam) {
      return NextResponse.json(
        { error: 'symbols parameter is required' },
        { status: 400 }
      );
    }

    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
    const weights: Record<string, number> = weightsParam 
      ? JSON.parse(weightsParam) 
      : {};
    
    const metrics: PerformanceMetric[] = [];
    
    // Optimize: Try Kraken first (faster, no rate limits for public API)
    // Then fallback to CoinGecko if needed
    // Process in batches to avoid overwhelming the API
    const symbolsToProcess = symbols.filter(s => s !== 'EUR' && s !== 'USDC' && s !== 'USDT');
    
    // Optimized fetching strategy:
    // 1. Try all Kraken fetches in parallel (no rate limits)
    // 2. Then fetch CoinGecko for any failures (with delays)
    
    const krakenPromises = symbolsToProcess.map(async (symbol) => {
      const priceData = await fetchKrakenOHLC(symbol, 90);
      return { symbol, priceData };
    });
    
    const krakenResults = await Promise.all(krakenPromises);
    
    // Separate symbols that need CoinGecko fallback
    const coinGeckoSymbols: Array<{ symbol: string; index: number }> = [];
    const krakenMetrics: PerformanceMetric[] = [];
    
    krakenResults.forEach((result, originalIndex) => {
      if (result.priceData.length > 0) {
        const { priceData } = result;
        const returns = calculateReturns(priceData);
        const volatility = calculateVolatility(priceData);
        const prices = priceData.map(p => p.close);
        const timestamps = priceData.map(p => p.timestamp);
        
        krakenMetrics.push({
          symbol: result.symbol,
          ...returns,
          volatility,
          prices,
          timestamps,
        });
      } else {
        coinGeckoSymbols.push({ symbol: result.symbol, index: originalIndex });
      }
    });
    
    // Fetch CoinGecko data sequentially with delays (rate limited)
    for (let i = 0; i < coinGeckoSymbols.length; i++) {
      const { symbol } = coinGeckoSymbols[i];
      const coinGeckoId = getCoinGeckoId(symbol);
      
      if (coinGeckoId) {
        // Delay between CoinGecko requests (2 seconds instead of 3.5)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        const priceData = await fetchCoinGeckoHistory(coinGeckoId, 90);
        
        if (priceData.length > 0) {
          const returns = calculateReturns(priceData);
          const volatility = calculateVolatility(priceData);
          const prices = priceData.map(p => p.close);
          const timestamps = priceData.map(p => p.timestamp);
          
          krakenMetrics.push({
            symbol,
            ...returns,
            volatility,
            prices,
            timestamps,
          });
        }
      }
    }
    
    metrics.push(...krakenMetrics);
    
    // Calculate correlation matrix
    const correlationMatrix = calculateCorrelation(metrics);
    
    // Calculate portfolio volatility
    const portfolioVolatility = calculatePortfolioVolatility(metrics, weights, correlationMatrix);
    
    return NextResponse.json({
      success: true,
      metrics,
      correlationMatrix,
      portfolioVolatility,
      topMovers: {
        best7d: [...metrics]
          .filter(m => !isNaN(m.return7d) && isFinite(m.return7d))
          .sort((a, b) => b.return7d - a.return7d)
          .slice(0, 5)
          .map(m => ({ symbol: m.symbol, return7d: m.return7d })),
        worst7d: [...metrics]
          .filter(m => !isNaN(m.return7d) && isFinite(m.return7d))
          .sort((a, b) => a.return7d - b.return7d)
          .slice(0, 5)
          .map(m => ({ symbol: m.symbol, return7d: m.return7d })),
        best30d: [...metrics]
          .filter(m => !isNaN(m.return30d) && isFinite(m.return30d))
          .sort((a, b) => b.return30d - a.return30d)
          .slice(0, 5)
          .map(m => ({ symbol: m.symbol, return30d: m.return30d })),
        worst30d: [...metrics]
          .filter(m => !isNaN(m.return30d) && isFinite(m.return30d))
          .sort((a, b) => a.return30d - b.return30d)
          .slice(0, 5)
          .map(m => ({ symbol: m.symbol, return30d: m.return30d })),
        best90d: [...metrics]
          .filter(m => !isNaN(m.return90d) && isFinite(m.return90d))
          .sort((a, b) => b.return90d - a.return90d)
          .slice(0, 5)
          .map(m => ({ symbol: m.symbol, return90d: m.return90d })),
        worst90d: [...metrics]
          .filter(m => !isNaN(m.return90d) && isFinite(m.return90d))
          .sort((a, b) => a.return90d - b.return90d)
          .slice(0, 5)
          .map(m => ({ symbol: m.symbol, return90d: m.return90d })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching performance and risk analytics:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch performance and risk analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

