import { NextResponse } from 'next/server';
import '@/lib/server-init'; // Ensure scheduler starts on server startup
import portfolioScheduler from '@/lib/portfolio-scheduler';
import prisma from '@/lib/prisma';

/**
 * GET /api/scheduler
 * Get scheduler status and upcoming schedule
 */
export async function GET() {
  try {
    const status = portfolioScheduler.getStatus();
    
    // Get portfolio schedule information
    const portfolios = await prisma.portfolio.findMany({
      where: {
        schedulerEnabled: true,
        OR: [
          { rebalanceEnabled: true },
          { thresholdRebalanceEnabled: true }
        ]
      },
      select: {
        id: true,
        name: true,
        checkFrequency: true,
        rebalanceEnabled: true,
        thresholdRebalanceEnabled: true,
        lastRebalancedAt: true,
        nextRebalanceAt: true,
      },
      orderBy: {
        nextRebalanceAt: 'asc',
      },
    });

    // Get actual next run times from the scheduler's internal state
    const scheduleWithNextRun = portfolios.map(portfolio => {
      // Try to get the actual next run time from the scheduler's internal state
      const schedulerStatus = portfolioScheduler.getStatus();
      const portfolioTask = schedulerStatus.portfolioTasks?.find((task: { portfolioId: string; nextRun: Date | null }) => task.portfolioId === portfolio.id);
      
      let actualNextRun: Date;
      
      if (portfolioTask && portfolioTask.nextRun) {
        // Use the actual scheduled time from the scheduler
        actualNextRun = new Date(portfolioTask.nextRun);
      } else {
        // Fallback to calculating from current time if scheduler doesn't have the time
        const frequency = portfolio.checkFrequency || 'hourly';
        actualNextRun = calculateNextRunTime(frequency);
      }
      
      return {
        ...portfolio,
        nextRebalanceAt: actualNextRun,
        actualNextRun: actualNextRun
      };
    });

    return NextResponse.json({
      success: true,
      status,
      schedule: scheduleWithNextRun,
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get scheduler status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate next run time based on frequency
 */
function calculateNextRunTime(frequency: string): Date {
  const now = new Date();
  
  switch (frequency) {
    case 'every_30_minutes':
      return new Date(now.getTime() + 30 * 60 * 1000);
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case 'every_2_hours':
      return new Date(now.getTime() + 2 * 60 * 60 * 1000);
    case 'every_4_hours':
      return new Date(now.getTime() + 4 * 60 * 60 * 1000);
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 30 * 60 * 1000);
  }
}

/**
 * POST /api/scheduler
 * Control scheduler (start/stop)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, config } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action parameter (start/stop)' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'start':
        // Portfolio scheduler starts automatically, no manual start needed
        break;
      
      case 'stop':
        portfolioScheduler.stop();
        break;
      
      case 'restart':
        portfolioScheduler.stop();
        // Portfolio scheduler will restart automatically
        break;
      
      case 'update-config':
        // Portfolio scheduler doesn't use global config, it reads from database
        console.log('[Scheduler] Config update ignored - portfolio scheduler uses database settings');
        break;
      
      case 'trigger-portfolio':
        if (!config?.portfolioId) {
          return NextResponse.json(
            { error: 'Missing portfolioId parameter' },
            { status: 400 }
          );
        }
        await portfolioScheduler.triggerPortfolioCheck(config.portfolioId);
        break;
      
      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }

    const status = portfolioScheduler.getStatus();

    return NextResponse.json({
      success: true,
      message: `Scheduler ${action} successful`,
      status,
    });
  } catch (error) {
    console.error('Error controlling scheduler:', error);
    return NextResponse.json(
      { 
        error: 'Failed to control scheduler',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

