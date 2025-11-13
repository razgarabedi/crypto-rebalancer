import { NextResponse } from 'next/server';
import { rebalancePortfolio, getRebalancePreview } from '@/lib/rebalance';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface RebalanceRequest {
  portfolioId: string;
  targetWeights?: Record<string, number>;
  rebalanceThreshold?: number;
  dryRun?: boolean;
  maxOrdersPerRebalance?: number;
}

/**
 * POST /api/rebalance/execute
 * Execute portfolio rebalancing
 * 
 * Request body:
 * {
 *   "portfolioId": "1",
 *   "targetWeights": { "BTC": 40, "ETH": 30, "SOL": 20, "ADA": 10 },
 *   "rebalanceThreshold": 10,
 *   "dryRun": false,
 *   "maxOrdersPerRebalance": 5
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

    const body: RebalanceRequest = await request.json();

    // Validate request
    if (!body.portfolioId) {
      return NextResponse.json(
        { error: 'Missing portfolioId in request body' },
        { status: 400 }
      );
    }

    // Verify the portfolio belongs to the user
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: body.portfolioId },
      select: { userId: true, targetWeights: true },
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

    // Execute rebalancing with user credentials
    const result = await rebalancePortfolio(body.portfolioId, {
      userId: user.id,
      targetWeights: body.targetWeights || (portfolio.targetWeights as Record<string, number>),
      rebalanceThreshold: body.rebalanceThreshold,
      dryRun: body.dryRun ?? true, // Default to dry run for safety
      maxOrdersPerRebalance: body.maxOrdersPerRebalance,
    });

    // Return result
    return NextResponse.json({
      success: result.success,
      data: {
        portfolioId: result.portfolioId,
        timestamp: result.timestamp,
        dryRun: result.dryRun,
        portfolio: {
          totalValue: result.portfolio.totalValue,
          currency: result.portfolio.currency,
          holdings: result.portfolio.holdings,
        },
        orders: {
          planned: result.ordersPlanned,
          executed: result.ordersExecuted,
        },
        summary: result.summary,
      },
      errors: result.errors,
    });
  } catch (error) {
    console.error('Error executing rebalance:', error);
    
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
        error: 'Failed to execute rebalance',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rebalance/execute?portfolioId=1
 * Get rebalancing preview (dry run)
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

    // Get preview
    const preview = await getRebalancePreview(portfolioId, user.id);

    return NextResponse.json({
      success: true,
      data: {
        portfolioId: preview.portfolioId,
        timestamp: preview.timestamp,
        portfolio: preview.portfolio,
        ordersPlanned: preview.ordersPlanned,
        summary: {
          totalOrders: preview.summary.totalOrders,
          estimatedValueToTrade: preview.ordersPlanned.reduce(
            (sum, o) => sum + Math.abs(o.difference), 
            0
          ),
        },
      },
    });
  } catch (error) {
    console.error('Error getting rebalance preview:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get rebalance preview',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

