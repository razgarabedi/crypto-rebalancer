import { NextResponse } from 'next/server';
import scheduler from '@/lib/scheduler';

/**
 * POST /api/scheduler/trigger
 * Manually trigger rebalancing for a specific portfolio
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { portfolioId } = body;

    if (!portfolioId) {
      return NextResponse.json(
        { error: 'Missing required field: portfolioId' },
        { status: 400 }
      );
    }

    await scheduler.triggerManualRebalance(portfolioId);

    return NextResponse.json({
      success: true,
      message: `Manual rebalance triggered for portfolio ${portfolioId}`,
    });
  } catch (error) {
    console.error('Error triggering manual rebalance:', error);
    return NextResponse.json(
      { 
        error: 'Failed to trigger manual rebalance',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

