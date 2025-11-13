/**
 * Smart Route Selection for Rebalancing
 * Finds the cheapest trade path between assets considering fees and spreads
 */

import { KrakenClient } from './kraken';

export interface TradingPair {
  pair: string;
  base: string;
  quote: string;
  bid: number;
  ask: number;
  spread: number;
  volume24h: number;
}

export interface TradePath {
  from: string;
  to: string;
  path: string[];
  pairs: string[];
  estimatedCost: number; // Total cost as percentage
  estimatedFee: number; // Total fees in EUR
  steps: TradeStep[];
}

export interface TradeStep {
  from: string;
  to: string;
  pair: string;
  direction: 'buy' | 'sell';
  price: number;
  fee: number; // Fee as percentage
  spread: number; // Spread as percentage
}

interface RouteCalculationOptions {
  amount: number; // Amount in EUR to trade
  orderType: 'market' | 'limit';
  maxHops?: number; // Maximum number of intermediate trades (default: 2)
}

// Common trading pairs on Kraken
const COMMON_PAIRS: Record<string, string[]> = {
  'BTC': ['EUR', 'USD', 'ETH', 'USDT'],
  'ETH': ['EUR', 'USD', 'BTC', 'USDT'],
  'SOL': ['EUR', 'USD', 'BTC', 'ETH'],
  'ADA': ['EUR', 'USD', 'BTC', 'ETH'],
  'DOT': ['EUR', 'USD', 'BTC', 'ETH'],
  'MATIC': ['EUR', 'USD', 'BTC'],
  'LINK': ['EUR', 'USD', 'BTC', 'ETH'],
  'AVAX': ['EUR', 'USD', 'BTC'],
  'ATOM': ['EUR', 'USD', 'BTC'],
  'UNI': ['EUR', 'USD', 'BTC', 'ETH'],
  'EUR': ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'MATIC', 'LINK', 'AVAX', 'ATOM', 'UNI', 'USDT', 'USDC', 'DAI'],
  'USD': ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'MATIC', 'LINK', 'AVAX', 'ATOM', 'UNI'],
  'USDT': ['EUR', 'USD', 'BTC', 'ETH'],
  'USDC': ['EUR', 'USD', 'BTC', 'ETH'],
  'DAI': ['EUR', 'USD'],
};

// Fee rates (can be customized per user tier)
const MAKER_FEE = 0.0016; // 0.16%
const TAKER_FEE = 0.0026; // 0.26%

/**
 * Get Kraken pair name for two assets
 */
function getKrakenPair(base: string, quote: string): string {
  const pairMapping: Record<string, string> = {
    'BTC-EUR': 'XXBTZEUR',
    'ETH-EUR': 'XETHZEUR',
    'BTC-USD': 'XXBTZUSD',
    'ETH-USD': 'XETHZUSD',
    'SOL-EUR': 'SOLEUR',
    'ADA-EUR': 'ADAEUR',
    'DOT-EUR': 'DOTEUR',
    'MATIC-EUR': 'MATICEUR',
    'LINK-EUR': 'LINKEUR',
    'AVAX-EUR': 'AVAXEUR',
    'ATOM-EUR': 'ATOMEUR',
    'UNI-EUR': 'UNIEUR',
    'SOL-USD': 'SOLUSD',
    'ADA-USD': 'ADAUSD',
    'DOT-USD': 'DOTUSD',
    'USDT-EUR': 'USDTEUR',
    'USDC-EUR': 'USDCEUR',
    'DAI-EUR': 'DAIEUR',
    'BTC-ETH': 'XXBTZETH',
    'ETH-BTC': 'XETHXXBT',
  };

  const key = `${base}-${quote}`;
  const reverseKey = `${quote}-${base}`;
  
  if (pairMapping[key]) {
    return pairMapping[key];
  }
  
  if (pairMapping[reverseKey]) {
    return pairMapping[reverseKey];
  }
  
  // Fallback to standard format
  return `${base}${quote}`;
}

/**
 * Fetch trading pair information from Kraken
 */
async function fetchTradingPair(
  krakenClient: KrakenClient,
  base: string,
  quote: string
): Promise<TradingPair | null> {
  try {
    const pair = getKrakenPair(base, quote);
    const tickers = await krakenClient.getTickerPrices([pair]);
    
    if (tickers.length === 0) {
      return null;
    }
    
    const ticker = tickers[0];
    const spread = ((ticker.ask - ticker.bid) / ticker.bid) * 100;
    
    return {
      pair,
      base,
      quote,
      bid: ticker.bid,
      ask: ticker.ask,
      spread,
      volume24h: ticker.volume24h,
    };
  } catch {
    // Pair doesn't exist or error fetching
    return null;
  }
}

/**
 * Find all possible paths between two assets
 */
async function findPaths(
  krakenClient: KrakenClient,
  from: string,
  to: string,
  maxHops: number = 2
): Promise<string[][]> {
  const paths: string[][] = [];
  
  // Direct path
  const directPair = await fetchTradingPair(krakenClient, from, to);
  if (directPair) {
    paths.push([from, to]);
  }
  
  // One-hop paths (through intermediate currency)
  if (maxHops >= 1) {
    const intermediates = COMMON_PAIRS[from] || [];
    
    for (const intermediate of intermediates) {
      if (intermediate === to) continue;
      
      const pair1 = await fetchTradingPair(krakenClient, from, intermediate);
      const pair2 = await fetchTradingPair(krakenClient, intermediate, to);
      
      if (pair1 && pair2) {
        paths.push([from, intermediate, to]);
      }
    }
  }
  
  // Two-hop paths (through two intermediate currencies)
  if (maxHops >= 2 && paths.length === 0) {
    // Only check two-hop if no direct or one-hop paths found
    const intermediates1 = COMMON_PAIRS[from] || [];
    
    for (const int1 of intermediates1) {
      if (int1 === to) continue;
      
      const intermediates2 = COMMON_PAIRS[int1] || [];
      for (const int2 of intermediates2) {
        if (int2 === from || int2 === int1) continue;
        
        const pair1 = await fetchTradingPair(krakenClient, from, int1);
        const pair2 = await fetchTradingPair(krakenClient, int1, int2);
        const pair3 = await fetchTradingPair(krakenClient, int2, to);
        
        if (pair1 && pair2 && pair3) {
          paths.push([from, int1, int2, to]);
        }
      }
    }
  }
  
  return paths;
}

/**
 * Calculate the cost of a specific trade path
 */
async function calculatePathCost(
  krakenClient: KrakenClient,
  path: string[],
  amount: number,
  orderType: 'market' | 'limit'
): Promise<TradePath | null> {
  const steps: TradeStep[] = [];
  const feeRate = orderType === 'limit' ? MAKER_FEE : TAKER_FEE;
  
  let currentAmount = amount;
  let totalCostPercentage = 0;
  let totalFeeEUR = 0;
  
  const pairs: string[] = [];
  
  // Calculate cost for each step in the path
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    
    const pairInfo = await fetchTradingPair(krakenClient, from, to);
    if (!pairInfo) {
      return null; // Path not viable
    }
    
    pairs.push(pairInfo.pair);
    
    // Determine if we're buying or selling
    const isBuying = pairInfo.base === to;
    const price = isBuying ? pairInfo.ask : pairInfo.bid;
    
    // Calculate fee for this step
    const stepFee = currentAmount * feeRate;
    totalFeeEUR += stepFee;
    
    // Account for spread cost
    const spreadCost = (pairInfo.spread / 100) * currentAmount;
    
    // Total cost for this step
    const stepCost = stepFee + spreadCost;
    totalCostPercentage += (stepCost / amount) * 100;
    
    steps.push({
      from,
      to,
      pair: pairInfo.pair,
      direction: isBuying ? 'buy' : 'sell',
      price,
      fee: feeRate * 100, // Convert to percentage
      spread: pairInfo.spread,
    });
    
    // Update current amount after fees
    currentAmount -= stepFee;
  }
  
  return {
    from: path[0],
    to: path[path.length - 1],
    path,
    pairs,
    estimatedCost: totalCostPercentage,
    estimatedFee: totalFeeEUR,
    steps,
  };
}

/**
 * Find the optimal (cheapest) route between two assets
 */
export async function findOptimalRoute(
  krakenClient: KrakenClient,
  from: string,
  to: string,
  options: RouteCalculationOptions
): Promise<TradePath | null> {
  const { amount, orderType, maxHops = 2 } = options;
  
  console.log(`[Smart Routing] Finding optimal route: ${from} → ${to} (${amount} EUR)`);
  
  // If same asset, no trade needed
  if (from === to) {
    return null;
  }
  
  // Find all possible paths
  const paths = await findPaths(krakenClient, from, to, maxHops);
  
  if (paths.length === 0) {
    console.log(`[Smart Routing] No viable paths found between ${from} and ${to}`);
    return null;
  }
  
  console.log(`[Smart Routing] Found ${paths.length} possible paths`);
  
  // Calculate cost for each path
  const pathCosts: TradePath[] = [];
  
  for (const path of paths) {
    const cost = await calculatePathCost(krakenClient, path, amount, orderType);
    if (cost) {
      pathCosts.push(cost);
      console.log(
        `[Smart Routing] Path ${path.join(' → ')}: ` +
        `Cost ${cost.estimatedCost.toFixed(4)}% (€${cost.estimatedFee.toFixed(2)} fees)`
      );
    }
  }
  
  if (pathCosts.length === 0) {
    return null;
  }
  
  // Find the path with lowest total cost
  const optimalPath = pathCosts.reduce((best, current) => 
    current.estimatedCost < best.estimatedCost ? current : best
  );
  
  console.log(
    `[Smart Routing] Selected optimal path: ${optimalPath.path.join(' → ')} ` +
    `(Cost: ${optimalPath.estimatedCost.toFixed(4)}%, Saves: ${
      (pathCosts[0].estimatedCost - optimalPath.estimatedCost).toFixed(4)
    }%)`
  );
  
  return optimalPath;
}

/**
 * Calculate savings from smart routing compared to direct trade
 */
export function calculateRouteSavings(
  directPath: TradePath,
  optimalPath: TradePath
): number {
  return directPath.estimatedCost - optimalPath.estimatedCost;
}

/**
 * Determine if smart routing should be used for a trade
 */
export function shouldUseSmartRouting(
  from: string,
  to: string,
  amount: number
): boolean {
  // Don't use smart routing for:
  // 1. Trades involving EUR (usually direct is best)
  // 2. Very small trades (routing overhead not worth it)
  // 3. Same asset
  
  if (from === to) return false;
  if (from === 'EUR' || to === 'EUR') return false;
  if (amount < 50) return false; // Less than €50
  
  return true;
}

/**
 * Get recommended route with explanation
 */
export async function getRecommendedRoute(
  krakenClient: KrakenClient,
  from: string,
  to: string,
  options: RouteCalculationOptions
): Promise<{
  route: TradePath;
  explanation: string;
  savings?: number;
}> {
  const optimalRoute = await findOptimalRoute(krakenClient, from, to, options);
  
  if (!optimalRoute) {
    throw new Error(`No route found between ${from} and ${to}`);
  }
  
  let explanation = '';
  let savings: number | undefined;
  
  if (optimalRoute.path.length === 2) {
    // Direct trade
    explanation = `Direct trade ${from} → ${to} is most efficient`;
  } else {
    // Multi-hop trade
    explanation = `Route through ${optimalRoute.path.slice(1, -1).join(' → ')} saves on fees`;
    
    // Try to calculate savings vs direct route
    try {
      const directRoute = await calculatePathCost(
        krakenClient,
        [from, to],
        options.amount,
        options.orderType
      );
      
      if (directRoute) {
        savings = calculateRouteSavings(directRoute, optimalRoute);
        explanation += ` (saves ${savings.toFixed(4)}%)`;
      }
    } catch {
      // Direct route not available
    }
  }
  
  return {
    route: optimalRoute,
    explanation,
    savings,
  };
}

