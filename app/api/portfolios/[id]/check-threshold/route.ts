import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getUserKrakenClient } from '@/lib/kraken-user';

// Force TypeScript to re-analyze this file
// This comment forces the TypeScript language server to re-analyze the file

/**
 * GET /api/portfolios/[id]/check-threshold
 * Check if portfolio has breached its threshold-based rebalancing trigger
 * 
 * Returns:
 * {
 *   portfolioId: string;
 *   thresholdBreached: boolean;
 *   maxDeviation: number;
 *   thresholdPercentage: number;
 *   deviations: Array<{
 *     symbol: string;
 *     currentPercentage: number;
 *     targetPercentage: number;
 *     deviation: number;
 *   }>;
 * }
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const portfolioId = params.id;

    // Fetch portfolio from database
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      select: {
        userId: true,
        targetWeights: true,
        thresholdRebalanceEnabled: true,
        thresholdRebalancePercentage: true,
      },
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    if (portfolio.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Portfolio does not belong to you' },
        { status: 403 }
      );
    }

    // Check if threshold rebalancing is enabled
    if (!portfolio.thresholdRebalanceEnabled) {
      return NextResponse.json({
        portfolioId,
        thresholdBreached: false,
        maxDeviation: 0,
        thresholdPercentage: portfolio.thresholdRebalancePercentage || 0,
        deviations: [],
        message: 'Threshold-based rebalancing is not enabled',
      });
    }

    // Get user's Kraken client
    const krakenClient = await getUserKrakenClient(user.id);

    // Fetch current balances from Kraken
    const krakenBalance = await krakenClient.getAccountBalance();

    // Normalize asset symbols
    const balances: Record<string, number> = {};
    for (const [asset, amount] of Object.entries(krakenBalance)) {
      let symbol = asset.replace(/^X+/, ''); // Remove X prefix
      // Handle special cases
      if (asset === 'XXBT') symbol = 'BTC';
      if (asset === 'XETH') symbol = 'ETH';
      if (asset === 'ZEUR') symbol = 'EUR';
      balances[symbol] = parseFloat(amount);
    }

    // Get target weights
    const targetWeights = portfolio.targetWeights as Record<string, number>;
    const targetSymbols = Object.keys(targetWeights);

    // Fetch prices for target assets
    const prices: Record<string, number> = {};
    prices['EUR'] = 1.0; // EUR base currency

    // Map symbols to Kraken pairs
    const pairMapping: Record<string, string> = {
      'BTC': 'XXBTZEUR',
      'ETH': 'XETHZEUR',
      'SOL': 'SOLEUR',
      'ADA': 'ADAEUR',
      'DOT': 'DOTEUR',
      'MATIC': 'MATICEUR',
      'LINK': 'LINKEUR',
      'AVAX': 'AVAXEUR',
      'ATOM': 'ATOMEUR',
      'UNI': 'UNIEUR',
    };

    // Fetch prices for non-EUR assets
    const nonEurSymbols = targetSymbols.filter(s => s !== 'EUR');
    if (nonEurSymbols.length > 0) {
      const pricePairs = nonEurSymbols
        .map(symbol => pairMapping[symbol] || `${symbol}EUR`)
        .filter(Boolean);

      if (pricePairs.length > 0) {
        const tickers = await krakenClient.getTickerPrices(pricePairs);
        for (const ticker of tickers) {
          let symbol = ticker.symbol.replace(/EUR$/, '').replace(/Z$/, '').replace(/^X+/, '');
          if (ticker.symbol === 'XXBTZEUR') symbol = 'BTC';
          if (ticker.symbol === 'XETHZEUR') symbol = 'ETH';
          prices[symbol] = ticker.price;
        }
      }
    }

    // Calculate current values and percentages
    let totalValue = 0;
    const holdings: Record<string, number> = {};

    for (const symbol of targetSymbols) {
      const balance = balances[symbol] || 0;
      const price = prices[symbol] || 0;
      const value = balance * price;
      holdings[symbol] = value;
      totalValue += value;
    }

    // Calculate deviations
    const deviations = targetSymbols.map(symbol => {
      const currentPercentage = totalValue > 0 ? (holdings[symbol] / totalValue) * 100 : 0;
      const targetPercentage = targetWeights[symbol];
      const deviation = Math.abs(currentPercentage - targetPercentage);

      return {
        symbol,
        currentPercentage,
        targetPercentage,
        deviation,
      };
    });

    // Find maximum deviation
    const maxDeviation = Math.max(...deviations.map(d => d.deviation));
    const thresholdPercentage = portfolio.thresholdRebalancePercentage || 3;
    const thresholdBreached = maxDeviation >= thresholdPercentage;

    return NextResponse.json({
      portfolioId,
      thresholdBreached,
      maxDeviation,
      thresholdPercentage,
      deviations,
      totalValue,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error checking threshold:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to check threshold',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

