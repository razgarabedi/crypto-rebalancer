import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { rebalancePortfolio } from '@/lib/rebalance';

/**
 * POST /api/portfolios/[id]/rebalance-if-needed
 * Check if threshold is breached and trigger rebalancing if needed
 * 
 * This endpoint is designed to be called periodically to check for threshold breaches
 * 
 * Request Body:
 * {
 *   dryRun?: boolean; // Preview without executing
 * }
 * 
 * Returns:
 * {
 *   thresholdBreached: boolean;
 *   rebalanceTriggered: boolean;
 *   maxDeviation: number;
 *   result?: RebalanceResult; // If rebalancing was triggered
 * }
 */
export async function POST(
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
    const body = await request.json();
    const { dryRun = false } = body;

    // Fetch portfolio from database
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      select: {
        userId: true,
        targetWeights: true,
        thresholdRebalanceEnabled: true,
        thresholdRebalancePercentage: true,
        rebalanceThreshold: true,
        maxOrdersPerRebalance: true,
        orderType: true,
        smartRoutingEnabled: true,
        totalFeesPaid: true,
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
        thresholdBreached: false,
        rebalanceTriggered: false,
        maxDeviation: 0,
        message: 'Threshold-based rebalancing is not enabled',
      });
    }

    // Check threshold by calling the check-threshold endpoint
    const checkUrl = new URL(
      `/api/portfolios/${portfolioId}/check-threshold`,
      request.url
    );
    
    const checkResponse = await fetch(checkUrl.toString(), {
      headers: {
        'Cookie': request.headers.get('Cookie') || '',
      },
    });

    if (!checkResponse.ok) {
      throw new Error('Failed to check threshold');
    }

    const checkResult = await checkResponse.json();

    // If threshold is breached, trigger rebalancing
    if (checkResult.thresholdBreached) {
      console.log(`[Threshold Rebalance] Portfolio ${portfolioId} threshold breached (${checkResult.maxDeviation}% > ${checkResult.thresholdPercentage}%)`);

      const rebalanceResult = await rebalancePortfolio(portfolioId, {
        userId: user.id,
        targetWeights: portfolio.targetWeights as Record<string, number>,
        dryRun,
        rebalanceThreshold: portfolio.rebalanceThreshold,
        maxOrdersPerRebalance: portfolio.maxOrdersPerRebalance || undefined,
        orderType: (portfolio.orderType as 'market' | 'limit') || 'market',
        smartRoutingEnabled: (portfolio.smartRoutingEnabled as boolean) !== false, // Default to true
      });

      // If not a dry run and rebalancing was successful, update database
      if (!dryRun && rebalanceResult.success) {
        try {
          const currentTotalFees = (portfolio.totalFeesPaid as number | null) || 0;
          const newTotalFees = currentTotalFees + rebalanceResult.summary.totalFees;

          console.log(`[Threshold Fee Tracking] Current fees: €${currentTotalFees}, New fees: €${rebalanceResult.summary.totalFees}, Total: €${newTotalFees}`);

          await prisma.portfolio.update({
            where: { id: portfolioId },
            data: {
              lastRebalancedAt: new Date(),
              totalFeesPaid: newTotalFees,
            },
          });

          console.log(`[Threshold Fee Tracking] Portfolio updated with total fees: €${newTotalFees}`);

          const ordersWithMetadata = {
            orders: rebalanceResult.ordersExecuted,
            fundAllocation: rebalanceResult.fundAllocation,
            skippedOrders: rebalanceResult.skippedOrders || [],
          };
          
          await prisma.rebalanceHistory.create({
            data: {
              portfolioId,
              executedAt: rebalanceResult.timestamp,
              success: rebalanceResult.success,
              dryRun: rebalanceResult.dryRun,
              portfolioValue: rebalanceResult.portfolio.totalValue,
              ordersPlanned: rebalanceResult.ordersPlanned.length,
              ordersExecuted: rebalanceResult.summary.successfulOrders,
              ordersFailed: rebalanceResult.summary.failedOrders,
              totalValueTraded: rebalanceResult.summary.totalValueTraded,
              totalFees: rebalanceResult.summary.totalFees,
              orders: ordersWithMetadata as unknown as object,
              errors: rebalanceResult.errors.length > 0 ? (rebalanceResult.errors as unknown as object) : undefined,
              triggeredBy: 'threshold',
            },
          });

          console.log(`[Threshold Fee Tracking] Rebalance history created with fees: €${rebalanceResult.summary.totalFees}`);
        } catch (dbError) {
          console.error('Failed to update database:', dbError);
          if (dbError instanceof Error) {
            console.error('Error details:', dbError.message);
            console.error('Error stack:', dbError.stack);
          }
        }
      }

      return NextResponse.json({
        thresholdBreached: true,
        rebalanceTriggered: true,
        maxDeviation: checkResult.maxDeviation,
        thresholdPercentage: checkResult.thresholdPercentage,
        result: {
          ...rebalanceResult,
          timestamp: rebalanceResult.timestamp.toISOString(),
        },
      });
    }

    return NextResponse.json({
      thresholdBreached: false,
      rebalanceTriggered: false,
      maxDeviation: checkResult.maxDeviation,
      thresholdPercentage: checkResult.thresholdPercentage,
      message: 'Threshold not breached, no rebalancing needed',
    });

  } catch (error) {
    console.error('Error checking/triggering threshold rebalance:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to process threshold rebalance',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

