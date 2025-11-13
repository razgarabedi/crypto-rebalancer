import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserKrakenClient } from '@/lib/kraken-user';
import {
  calculatePortfolioValue,
  calculateTargetHoldings,
  generateRebalanceOrders,
  validateTargetWeights,
  calculateRebalanceStats,
} from '@/lib/portfolio';

interface CalculateRequest {
  targetWeights: Record<string, number>;
  rebalanceThreshold?: number;
  symbols?: string[]; // Optional: specify which assets to include
}

/**
 * POST /api/portfolio/calculate
 * Calculate portfolio value and generate rebalance orders
 * 
 * Request body:
 * {
 *   "targetWeights": { "BTC": 40, "ETH": 30, "SOL": 20, "ADA": 10 },
 *   "rebalanceThreshold": 10,
 *   "symbols": ["BTC", "ETH", "SOL", "ADA"]
 * }
 */
export async function POST(request: Request) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const body: CalculateRequest = await request.json();

    // Validate request
    if (!body.targetWeights) {
      return NextResponse.json(
        { error: 'Missing targetWeights in request body' },
        { status: 400 }
      );
    }

    // Validate target weights
    const validation = validateTargetWeights(body.targetWeights);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Invalid target weights',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    // Get user's Kraken client with their credentials
    const krakenClient = await getUserKrakenClient(user.id);

    // Get account balance from Kraken
    const krakenBalance = await krakenClient.getAccountBalance();

    // Convert Kraken balance format to our format
    const balances: Record<string, number> = {};
    for (const [asset, amount] of Object.entries(krakenBalance)) {
      let symbol = asset.replace(/^X+/, ''); // Strip X prefix that Kraken uses
      // Handle special cases for Kraken naming conventions
      if (asset === 'XXBT') symbol = 'BTC';
      if (asset === 'XETH') symbol = 'ETH';
      balances[symbol] = parseFloat(amount);
    }

    // Filter balances by requested symbols if provided
    const symbolsToInclude = body.symbols || Object.keys(body.targetWeights);
    const filteredBalances: Record<string, number> = {};
    for (const symbol of symbolsToInclude) {
      if (balances[symbol]) {
        filteredBalances[symbol] = balances[symbol];
      }
    }

    // Build trading pairs for price lookup (EUR pairs)
    const pricePairs = symbolsToInclude.map(symbol => {
      // Handle special cases for Kraken naming conventions
      if (symbol === 'BTC') return 'XXBTZEUR';
      if (symbol === 'ETH') return 'XETHZEUR';
      if (symbol === 'SOL') return 'SOLEUR';
      if (symbol === 'ADA') return 'ADAEUR';
      if (symbol === 'DOT') return 'DOTEUR';
      if (symbol === 'MATIC') return 'MATICEUR';
      if (symbol === 'LINK') return 'LINKEUR';
      if (symbol === 'AVAX') return 'AVAXEUR';
      if (symbol === 'ATOM') return 'ATOMEUR';
      if (symbol === 'UNI') return 'UNIEUR';
      if (symbol === 'CPOOL') return 'CPOOLEUR';
      if (symbol === 'RLC') return 'RLCEUR';
      if (symbol === 'RPL') return 'RPLEUR';
      if (symbol === 'EWT') return 'EWTEUR';
      // For other coins, try the standard format
      return `${symbol}EUR`;
    });

    // Get current prices from Kraken
    const tickers = await krakenClient.getTickerPrices(pricePairs);

    // Convert ticker prices to our format
    const prices: Record<string, number> = {};
    for (const ticker of tickers) {
      // Map Kraken symbols back to our symbols
      let symbol = ticker.symbol.replace(/EUR$/, '').replace(/^X+/, '');
      // Handle special cases
      if (ticker.symbol === 'XXBTZEUR') symbol = 'BTC';
      if (ticker.symbol === 'XETHZEUR') symbol = 'ETH';
      prices[symbol] = ticker.price;
    }

    // Calculate current portfolio value
    const portfolio = calculatePortfolioValue(filteredBalances, prices);

    // Calculate target holdings
    const targetHoldings = calculateTargetHoldings(
      body.targetWeights,
      portfolio.totalValue,
      prices
    );

    // Generate rebalance orders
    const rebalanceThreshold = body.rebalanceThreshold ?? 10;
    const orders = generateRebalanceOrders(
      portfolio.holdings,
      targetHoldings,
      rebalanceThreshold
    );

    // Calculate statistics
    const stats = calculateRebalanceStats(orders);

    return NextResponse.json({
      success: true,
      portfolio: {
        totalValue: portfolio.totalValue,
        currency: portfolio.currency,
        holdings: portfolio.holdings,
      },
      target: {
        weights: body.targetWeights,
        holdings: targetHoldings,
      },
      rebalance: {
        threshold: rebalanceThreshold,
        orders,
        stats,
      },
      prices,
    });
  } catch (error) {
    console.error('Error calculating portfolio:', error);
    
    // Handle credentials not configured error with 400 instead of 500
    if (error instanceof Error && error.name === 'CredentialsNotConfiguredError') {
      return NextResponse.json(
        { 
          error: 'Credentials not configured',
          message: error.message,
          needsCredentials: true
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to calculate portfolio',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

