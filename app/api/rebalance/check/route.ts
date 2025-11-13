import { NextResponse } from 'next/server';
import { needsRebalancing } from '@/lib/rebalance';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/rebalance/check?portfolioId=1&threshold=10
 * Check if portfolio needs rebalancing
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

    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');
    const threshold = parseFloat(searchParams.get('threshold') || '10');

    if (!portfolioId) {
      return NextResponse.json(
        { error: 'Missing portfolioId query parameter' },
        { status: 400 }
      );
    }

    // Verify the portfolio belongs to the user
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      select: { userId: true },
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

    // Check if rebalancing is needed
    const check = await needsRebalancing(portfolioId, user.id, threshold);

    return NextResponse.json({
      success: true,
      data: {
        portfolioId,
        threshold,
        needsRebalancing: check.needed,
        portfolio: {
          totalValue: check.portfolio.totalValue,
          currency: check.portfolio.currency,
          holdings: check.portfolio.holdings,
        },
        orders: check.orders,
        summary: {
          ordersRequired: check.orders.length,
          totalValueToRebalance: check.orders.reduce(
            (sum, o) => sum + Math.abs(o.difference),
            0
          ),
          buyOrders: check.orders.filter(o => o.side === 'buy').length,
          sellOrders: check.orders.filter(o => o.side === 'sell').length,
        },
      },
    });
  } catch (error) {
    console.error('Error checking rebalance status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check rebalance status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

