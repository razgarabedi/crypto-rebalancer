import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/performance
 * Get performance history for a portfolio
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!portfolioId) {
      return NextResponse.json(
        { error: 'Missing portfolioId parameter' },
        { status: 400 }
      );
    }

    // Get the portfolio to check its target weights (current assets)
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      select: {
        id: true,
        name: true,
        targetWeights: true,
      },
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    // Get performance history for the last N days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const performanceHistory = await prisma.performanceHistory.findMany({
      where: {
        portfolioId: portfolioId,
        timestamp: {
          gte: startDate,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
      select: {
        id: true,
        totalValue: true,
        timestamp: true,
        assetValues: true,
      },
    });

    // Filter performance history to only include assets currently in the portfolio
    const targetAssets = Object.keys(portfolio.targetWeights as Record<string, number>);
    
    const filteredHistory = performanceHistory.map(entry => {
      const assetValues = entry.assetValues as Record<string, number> || {};
      
      // Calculate total value using only portfolio assets
      let portfolioValue = 0;
      const filteredAssetValues: Record<string, number> = {};
      
      targetAssets.forEach(asset => {
        if (assetValues[asset] !== undefined) {
          filteredAssetValues[asset] = assetValues[asset];
          portfolioValue += assetValues[asset];
        }
      });

      return {
        date: entry.timestamp.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        value: parseFloat(portfolioValue.toFixed(2)),
        timestamp: entry.timestamp,
        assetValues: filteredAssetValues,
      };
    });

    // If no real data exists, generate mock data based on current portfolio assets only
    if (filteredHistory.length === 0) {
      console.log(`No performance history found for portfolio ${portfolioId}, generating mock data`);
      const mockHistory = [];
      const now = new Date();
      
      // Get current portfolio value (this would need to be calculated from current balances)
      // For now, we'll use a default value - in a real implementation, 
      // this should fetch current balances and prices
      const currentValue = 50000; // This should be calculated from current holdings
      
      for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const variance = (Math.random() - 0.5) * 0.1; // ±5% variance
        const value = currentValue * (1 + variance * (i / days)); // Trend upward
        
        mockHistory.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: parseFloat(value.toFixed(2)),
          timestamp: date,
          assetValues: {}, // Mock data doesn't have asset breakdown
        });
      }
      
      return NextResponse.json({
        success: true,
        portfolio: {
          id: portfolio.id,
          name: portfolio.name,
          targetAssets,
        },
        performanceHistory: mockHistory,
        isMockData: true,
        message: 'No historical data found, showing mock data for portfolio assets only',
      });
    }

    return NextResponse.json({
      success: true,
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        targetAssets,
      },
      performanceHistory: filteredHistory,
      isMockData: false,
      count: filteredHistory.length,
    });

  } catch (error) {
    console.error('Error fetching performance history:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch performance history',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/performance
 * Record performance snapshot for a portfolio
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { portfolioId, totalValue, assetValues } = body;

    if (!portfolioId || totalValue === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: portfolioId, totalValue' },
        { status: 400 }
      );
    }

    // Verify portfolio exists
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      select: { id: true },
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    console.log(`Recording performance snapshot for portfolio ${portfolioId}:`, {
      totalValue,
      assetValues,
      assetCount: Object.keys(assetValues || {}).length
    });

    // Create performance history entry
    const performanceEntry = await prisma.performanceHistory.create({
      data: {
        portfolioId,
        totalValue: parseFloat(totalValue),
        assetValues: assetValues || {},
        timestamp: new Date(),
      },
    });

    console.log(`Performance snapshot recorded with ID: ${performanceEntry.id}`);

    return NextResponse.json({
      success: true,
      performanceEntry: {
        id: performanceEntry.id,
        totalValue: performanceEntry.totalValue,
        timestamp: performanceEntry.timestamp,
      },
    });

  } catch (error) {
    console.error('Error recording performance history:', error);
    return NextResponse.json(
      { 
        error: 'Failed to record performance history',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
