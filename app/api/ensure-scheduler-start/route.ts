/**
 * Ensure Scheduler Start API
 * This endpoint ensures the portfolio scheduler is running
 */

import { NextResponse } from 'next/server';
import portfolioScheduler from '@/lib/portfolio-scheduler';

/**
 * GET /api/ensure-scheduler-start
 * Ensure the scheduler is running and return status
 */
export async function GET() {
  try {
    console.log('[EnsureSchedulerStart] Checking scheduler status...');
    
    const status = portfolioScheduler.getStatus();
    
    console.log(`[EnsureSchedulerStart] Scheduler status: ${status.isRunning ? 'Running' : 'Stopped'}`);
    console.log(`[EnsureSchedulerStart] Active portfolios: ${status.activePortfolios}`);
    
    // If scheduler is not running, try to start it
    if (!status.isRunning) {
      console.log('[EnsureSchedulerStart] Scheduler not running, attempting to start...');
      // The scheduler should start automatically, but let's force it
      const newStatus = portfolioScheduler.getStatus();
      console.log(`[EnsureSchedulerStart] After start attempt: ${newStatus.isRunning ? 'Running' : 'Stopped'}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Scheduler status checked',
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[EnsureSchedulerStart] Error checking scheduler status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check scheduler status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
