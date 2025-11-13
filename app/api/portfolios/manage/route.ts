import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import scheduler from '@/lib/scheduler';

interface CreatePortfolioRequest {
  name: string;
  targetWeights: Record<string, number>;
  rebalanceEnabled?: boolean;
  rebalanceInterval?: string;
  rebalanceThreshold?: number;
  maxOrdersPerRebalance?: number;
  thresholdRebalanceEnabled?: boolean;
  thresholdRebalancePercentage?: number;
  orderType?: string;
  smartRoutingEnabled?: boolean;
  schedulerEnabled?: boolean;
  checkFrequency?: string;
}

/**
 * GET /api/portfolios/manage
 * Get all portfolios from database for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('includeHistory') === 'true';

    // Only get portfolios for the authenticated user
    const portfolios = await prisma.portfolio.findMany({
      where: { userId: user.id },
      include: includeHistory ? {
        rebalanceHistory: {
          orderBy: { executedAt: 'desc' },
          take: 10, // Last 10 rebalances
        },
      } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      portfolios,
      count: portfolios.length,
    });
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch portfolios',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portfolios/manage
 * Create a new portfolio for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const body: CreatePortfolioRequest = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    if (!body.targetWeights) {
      return NextResponse.json(
        { error: 'Missing required field: targetWeights' },
        { status: 400 }
      );
    }

    // Validate target weights sum to 100
    const totalWeight = Object.values(body.targetWeights).reduce((sum, w) => sum + w, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      return NextResponse.json(
        { error: `Target weights sum to ${totalWeight}%, must be 100%` },
        { status: 400 }
      );
    }

    // Calculate initial next rebalance time if enabled
    const now = new Date();
    let nextRebalanceAt: Date | null = null;
    
    if (body.rebalanceEnabled) {
      const interval = body.rebalanceInterval || 'weekly';
      nextRebalanceAt = calculateNextRebalanceTime(interval, now);
    }

    // Create portfolio for the authenticated user
    const portfolio = await prisma.portfolio.create({
      data: {
        name: body.name,
        userId: user.id, // Use authenticated user's ID
        targetWeights: body.targetWeights,
        rebalanceEnabled: body.rebalanceEnabled ?? false,
        rebalanceInterval: body.rebalanceInterval || 'weekly',
        rebalanceThreshold: body.rebalanceThreshold ?? 10.0,
        maxOrdersPerRebalance: body.maxOrdersPerRebalance,
        thresholdRebalanceEnabled: body.thresholdRebalanceEnabled ?? false,
        thresholdRebalancePercentage: body.thresholdRebalancePercentage ?? 3.0,
        orderType: body.orderType || 'market',
        smartRoutingEnabled: body.smartRoutingEnabled ?? true,
        schedulerEnabled: body.schedulerEnabled ?? true,
        checkFrequency: body.checkFrequency || 'hourly',
        nextRebalanceAt,
      },
    });

    // Auto-start scheduler if needed
    await scheduler.autoStartIfNeeded();

    return NextResponse.json({
      success: true,
      portfolio,
      message: 'Portfolio created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating portfolio:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create portfolio',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/portfolios/manage
 * Update an existing portfolio (only if owned by authenticated user)
 */
export async function PUT(request: NextRequest) {
  try {
    // Require authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // Verify portfolio belongs to user
    const existingPortfolio = await prisma.portfolio.findUnique({
      where: { id },
    });

    if (!existingPortfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    if (existingPortfolio.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this portfolio' },
        { status: 403 }
      );
    }

    // If updating target weights, validate
    if (updates.targetWeights) {
      const totalWeight = Object.values(updates.targetWeights as Record<string, number>)
        .reduce((sum, w) => sum + w, 0);
      
      if (Math.abs(totalWeight - 100) > 0.01) {
        return NextResponse.json(
          { error: `Target weights sum to ${totalWeight}%, must be 100%` },
          { status: 400 }
        );
      }
    }

    // If enabling rebalancing or changing interval, update next rebalance time
    if (updates.rebalanceEnabled || updates.rebalanceInterval) {
      const portfolio = await prisma.portfolio.findUnique({ where: { id } });
      if (portfolio) {
        const interval = updates.rebalanceInterval || portfolio.rebalanceInterval;
        updates.nextRebalanceAt = calculateNextRebalanceTime(interval, new Date());
      }
    }

    const portfolio = await prisma.portfolio.update({
      where: { id },
      data: updates,
    });

    // Auto-start/stop scheduler if needed
    await scheduler.autoStartIfNeeded();

    return NextResponse.json({
      success: true,
      portfolio,
      message: 'Portfolio updated successfully',
    });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update portfolio',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/portfolios/manage
 * Delete a portfolio (only if owned by authenticated user)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Require authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    // Verify portfolio belongs to user
    const existingPortfolio = await prisma.portfolio.findUnique({
      where: { id },
    });

    if (!existingPortfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    if (existingPortfolio.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this portfolio' },
        { status: 403 }
      );
    }

    await prisma.portfolio.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Portfolio deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete portfolio',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to calculate next rebalance time
 */
function calculateNextRebalanceTime(interval: string, from: Date): Date {
  const result = new Date(from);
  
  switch (interval) {
    case 'hourly': // For testing
      result.setHours(result.getHours() + 1);
      break;
    case 'daily':
      result.setDate(result.getDate() + 1);
      break;
    case 'weekly':
      result.setDate(result.getDate() + 7);
      break;
    case 'monthly':
      result.setMonth(result.getMonth() + 1);
      break;
    default:
      result.setDate(result.getDate() + 7); // Default to weekly
  }
  
  return result;
}

export const dynamic = 'force-dynamic';

