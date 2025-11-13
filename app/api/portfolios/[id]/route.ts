import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: params.id },
      include: {
        rebalanceHistory: {
          orderBy: { executedAt: 'desc' },
          take: 10, // Last 10 rebalances
        },
      },
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      portfolio,
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch portfolio',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Validate target weights if provided
    if (body.targetWeights) {
      const totalWeight = Object.values(body.targetWeights as Record<string, number>)
        .reduce((sum, w) => sum + w, 0);
      
      if (Math.abs(totalWeight - 100) > 0.01) {
        return NextResponse.json(
          { error: `Target weights sum to ${totalWeight}%, must be 100%` },
          { status: 400 }
        );
      }
    }

    // If enabling rebalancing or changing interval, update next rebalance time
    if (body.rebalanceEnabled || body.rebalanceInterval) {
      const portfolio = await prisma.portfolio.findUnique({ where: { id: params.id } });
      if (portfolio) {
        const interval = body.rebalanceInterval || portfolio.rebalanceInterval;
        body.nextRebalanceAt = calculateNextRebalanceTime(interval, new Date());
      }
    }

    const updatedPortfolio = await prisma.portfolio.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json({
      success: true,
      portfolio: updatedPortfolio,
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.portfolio.delete({
      where: { id: params.id },
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

