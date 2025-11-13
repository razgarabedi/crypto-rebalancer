import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserKrakenClient } from '@/lib/kraken-user';
import { calculatePortfolioValue } from '@/lib/portfolio';

/**
 * GET /api/holdings
 * Returns current holdings with EUR values using user-specific credentials
 * 
 * Query Parameters:
 *   - symbols: Optional comma-separated list of symbols to filter (e.g., "BTC,ETH,SOL")
 * 
 * Response:
 * {
 *   success: true,
 *   holdings: [
 *     { symbol: "BTC", amount: 0.5, value: 25000, percentage: 45.45 },
 *     { symbol: "ETH", amount: 10, value: 30000, percentage: 54.55 }
 *   ],
 *   totalValue: 55000,
 *   currency: "EUR",
 *   timestamp: "2025-10-20T12:00:00.000Z"
 * }
 */
export async function GET(request: Request) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // Get user's Kraken client with their credentials
    const krakenClient = await getUserKrakenClient(user.id);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');
    const filterSymbols = symbolsParam ? symbolsParam.split(',').map(s => s.trim()) : null;

    // Step 1: Fetch account balance from Kraken
    const krakenBalance = await krakenClient.getAccountBalance();

    // Normalize Kraken asset names (remove X prefix and suffixes like .F, .S, .M)
    const normalizeSymbol = (asset: string): string => {
      // Remove suffixes (.F for Flex staking, .S for Staked, .M for Margin, etc.)
      let normalized = asset.replace(/\.(F|S|M|P)$/i, '');
      
      // Remove X prefix
      normalized = normalized.replace(/^X+/, '');
      
      // Handle special mappings
      const mapping: Record<string, string> = {
        'XBT': 'BTC',
        'XXBT': 'BTC',
        'XETH': 'ETH',
        'ETH2': 'ETH',
        'XETH2': 'ETH',
      };
      
      const base = asset.replace(/\.(F|S|M|P)$/i, '');
      const mapped = mapping[base] || mapping[asset];
      const result = mapped || normalized;
      // Collapse known ETH staking variants to ETH (e.g., ETH2, ETH2.S, XETH2)
      if (/^X?ETH\d+$/i.test(base) || /^ETH\d+$/i.test(result)) {
        return 'ETH';
      }
      return result;
    };

    // Convert to our balance format
    const balances: Record<string, number> = {};
    for (const [asset, amount] of Object.entries(krakenBalance)) {
      const symbol = normalizeSymbol(asset);
      const balance = parseFloat(amount);
      
      // Only include non-zero balances
      if (balance > 0) {
        // Filter by symbols if specified
        if (!filterSymbols || filterSymbols.includes(symbol)) {
          balances[symbol] = balance;
        }
      }
    }

    // If no balances found
    if (Object.keys(balances).length === 0) {
      return NextResponse.json({
        success: true,
        holdings: [],
        totalValue: 0,
        currency: 'EUR',
        timestamp: new Date().toISOString(),
        message: 'No holdings found',
      });
    }

    // Step 2: Get current prices for all holdings
    const symbols = Object.keys(balances);
    const getTradingPair = (symbol: string): string => {
      const pairMapping: Record<string, string> = {
        'BTC': 'XXBTZEUR',
        'ETH': 'XETHZEUR',
        'SOL': 'SOLEUR',
        'ADA': 'ADAEUR',
        'DOT': 'DOTEUR',
        'MATIC': 'MATICEUR',
      };
      return pairMapping[symbol] || `${symbol}EUR`;
    };

    // Use only pairs known to exist by checking Kraken AssetPairs directly (avoid internal fetch base URL issues)
    const allowed = new Set<string>();
    try {
      const axios = (await import('axios')).default;
      const resp = await axios.get('https://api.kraken.com/0/public/AssetPairs');
      const data = resp.data;
      if (!(data.error && data.error.length > 0)) {
        const entries = Object.entries(data.result || {});
        for (const [pair, info] of entries) {
          const quote = (info as Record<string, unknown>).quote as string;
          if (quote === 'ZEUR' || quote === 'ZUSD' || quote === 'EUR' || quote === 'USD') {
            allowed.add(pair);
          }
        }
      }
    } catch {}
    const requestedPairs = symbols.map(getTradingPair);
    const pricePairs = allowed.size > 0 ? requestedPairs.filter(p => allowed.has(p)) : requestedPairs;
    const tickers = pricePairs.length > 0 ? await krakenClient.getTickerPrices(pricePairs) : [];

    // Convert tickers to price map
    const prices: Record<string, number> = {};
    for (const ticker of tickers) {
      const symbol = normalizeSymbol(ticker.symbol.replace(/EUR$/, '').replace(/Z$/, ''));
      prices[symbol] = ticker.price;
    }

    // Step 3: Calculate portfolio value with holdings details
    const portfolio = calculatePortfolioValue(balances, prices);

    // Format response
    return NextResponse.json({
      success: true,
      holdings: portfolio.holdings.map(h => ({
        symbol: h.symbol,
        amount: h.amount,
        value: h.value,
        percentage: h.percentage,
        price: prices[h.symbol] || 0,
      })),
      totalValue: portfolio.totalValue,
      currency: portfolio.currency,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    // Handle credentials not configured error with 400 instead of 500
    if (error instanceof Error && error.name === 'CredentialsNotConfiguredError') {
      console.log('Kraken credentials not configured for user');
      return NextResponse.json(
        {
          error: 'Credentials not configured',
          message: error.message,
          needsCredentials: true,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
    
    // Log unexpected errors
    console.error('Error fetching holdings:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch holdings',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

