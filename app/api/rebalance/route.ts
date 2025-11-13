import { NextResponse } from 'next/server';
import { rebalancePortfolio, getRebalancePreview, needsRebalancing } from '@/lib/rebalance';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * POST /api/rebalance
 * Triggers portfolio rebalancing using the comprehensive rebalancing logic
 * 
 * Request Body:
 * {
 *   portfolioId: string;          // Portfolio ID (from database or custom)
 *   targetWeights?: {              // Optional: Override portfolio target weights
 *     BTC: 40,
 *     ETH: 30,
 *     SOL: 20,
 *     ADA: 10
 *   };
 *   dryRun?: boolean;              // Optional: Preview without executing (default: false)
 *   rebalanceThreshold?: number;   // Optional: Minimum EUR difference (default: 10)
 *   maxOrdersPerRebalance?: number;// Optional: Max orders to execute
 * }
 * 
 * Response:
 * {
 *   success: boolean;
 *   portfolioId: string;
 *   timestamp: string;
 *   portfolio: { totalValue, holdings, currency };
 *   ordersPlanned: [...];
 *   ordersExecuted: [...];
 *   errors: string[];
 *   dryRun: boolean;
 *   summary: {
 *     totalOrders: number;
 *     successfulOrders: number;
 *     failedOrders: number;
 *     skippedOrders: number;
 *     totalValueTraded: number;
 *   }
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

    const body = await request.json();
    const {
      portfolioId,
      targetWeights,
      dryRun = false,
      rebalanceThreshold = 10,
      maxOrdersPerRebalance,
    } = body;

    // Validate required fields
    if (!portfolioId) {
      return NextResponse.json(
        {
          error: 'Missing required field',
          message: 'portfolioId is required',
        },
        { status: 400 }
      );
    }

    // Fetch from database and verify ownership
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      select: { 
        userId: true, 
        targetWeights: true, 
        orderType: true as const, 
        smartRoutingEnabled: true as const,
        totalFeesPaid: true as const
      } as const,
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

    // Use target weights from body, or from portfolio in database
    const weights = targetWeights || (portfolio.targetWeights as Record<string, number>);

    // Execute rebalancing with user credentials
    const result = await rebalancePortfolio(portfolioId, {
      userId: user.id,
      targetWeights: weights,
      dryRun,
      rebalanceThreshold,
      maxOrdersPerRebalance,
      orderType: (portfolio.orderType as 'market' | 'limit') || 'market',
      smartRoutingEnabled: (portfolio.smartRoutingEnabled as boolean) !== false, // Default to true
    });

    // If not a dry run and rebalancing was successful, update database
    if (!dryRun && result.success) {
      try {
        // Calculate new cumulative fees
        const currentTotalFees = (portfolio.totalFeesPaid as number | null) || 0;
        const newTotalFees = currentTotalFees + result.summary.totalFees;
        
        console.log(`[Fee Tracking] Current fees: €${currentTotalFees}, New fees: €${result.summary.totalFees}, Total: €${newTotalFees}`);
        
        // Update portfolio last rebalanced time and cumulative fees
        await prisma.portfolio.update({
          where: { id: portfolioId },
          data: {
            lastRebalancedAt: new Date(),
            totalFeesPaid: newTotalFees,
          },
        });

        console.log(`[Fee Tracking] Portfolio updated with total fees: €${newTotalFees}`);

        // Create rebalance history entry with fee information
        // Store orders with metadata about fund allocation and skipped orders
        const ordersWithMetadata = {
          orders: result.ordersExecuted,
          fundAllocation: result.fundAllocation,
          skippedOrders: result.skippedOrders || [],
        };
        
        await prisma.rebalanceHistory.create({
          data: {
            portfolioId,
            executedAt: result.timestamp,
            success: result.success,
            dryRun: result.dryRun,
            portfolioValue: result.portfolio.totalValue,
            ordersPlanned: result.ordersPlanned.length,
            ordersExecuted: result.summary.successfulOrders,
            ordersFailed: result.summary.failedOrders,
            totalValueTraded: result.summary.totalValueTraded,
            totalFees: result.summary.totalFees,
            orders: ordersWithMetadata as unknown as object, // Prisma Json type
            errors: result.errors.length > 0 ? (result.errors as unknown as object) : undefined,
            triggeredBy: 'api',
          },
        });

        console.log(`[Fee Tracking] Rebalance history created with fees: €${result.summary.totalFees}`);
      } catch (dbError) {
        console.error('Failed to update database:', dbError);
        // Log more details about the error
        if (dbError instanceof Error) {
          console.error('Error details:', dbError.message);
          console.error('Error stack:', dbError.stack);
        }
        // Don't fail the request if database update fails
      }
    }

    // Return the rebalancing result
    return NextResponse.json({
      ...result,
      timestamp: result.timestamp.toISOString(),
    });

  } catch (error) {
    console.error('Error in rebalance API:', error);
    
    // Handle credentials not configured error with 400 instead of 500
    if (error instanceof Error && error.name === 'CredentialsNotConfiguredError') {
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
    
    return NextResponse.json(
      {
        error: 'Failed to execute rebalancing',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rebalance
 * Check if a portfolio needs rebalancing or get a preview
 * 
 * Query Parameters:
 *   - portfolioId: string (required)
 *   - action: "check" | "preview" (default: "check")
 *   - threshold: number (default: 10)
 * 
 * Response for action=check:
 * {
 *   portfolioId: string;
 *   needed: boolean;
 *   ordersCount: number;
 *   portfolio: { totalValue, holdings };
 *   threshold: number;
 * }
 * 
 * Response for action=preview:
 * {
 *   (same as POST response with dryRun: true)
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

    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');
    const action = searchParams.get('action') || 'check';
    const thresholdParam = searchParams.get('threshold');
    const threshold = thresholdParam ? parseFloat(thresholdParam) : 10;

    if (!portfolioId) {
      return NextResponse.json(
        {
          error: 'Missing required parameter',
          message: 'portfolioId is required',
        },
        { status: 400 }
      );
    }

    // Fetch target weights from database and verify ownership
    let targetWeights: Record<string, number> | undefined;
    let orderType: 'market' | 'limit' = 'market';
    let smartRoutingEnabled = true;
    try {
      const portfolio = await prisma.portfolio.findUnique({
        where: { id: portfolioId },
        select: { 
          userId: true, 
          targetWeights: true, 
          orderType: true as const,
          smartRoutingEnabled: true as const
        } as const,
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

      if (portfolio) {
        targetWeights = portfolio.targetWeights as Record<string, number>;
        orderType = ((portfolio as { orderType?: string }).orderType as 'market' | 'limit') || 'market';
        smartRoutingEnabled = ((portfolio as { smartRoutingEnabled?: boolean }).smartRoutingEnabled) !== false; // Default to true
      }
    } catch (dbError) {
      console.error('Database error fetching portfolio:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch portfolio from database' },
        { status: 500 }
      );
    }

    if (action === 'preview') {
      // Get full rebalancing preview
      const result = await getRebalancePreview(portfolioId, user.id, {
        targetWeights,
        rebalanceThreshold: threshold,
        orderType,
        smartRoutingEnabled,
      });

      return NextResponse.json({
        ...result,
        timestamp: result.timestamp.toISOString(),
      });
    } else {
      // Just check if rebalancing is needed
      const result = await needsRebalancing(portfolioId, user.id, threshold);

      return NextResponse.json({
        portfolioId,
        needed: result.needed,
        ordersCount: result.orders.length,
        portfolio: result.portfolio,
        threshold,
        timestamp: new Date().toISOString(),
      });
    }

  } catch (error) {
    console.error('Error checking rebalance status:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to check rebalance status',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';


