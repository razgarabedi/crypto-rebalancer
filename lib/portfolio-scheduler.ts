/**
 * Per-Portfolio Scheduler
 * Individual scheduling system for each portfolio based on their settings
 */

import cron, { ScheduledTask } from 'node-cron';
import prisma from './prisma';
import { rebalancePortfolio } from './rebalance';

interface PortfolioTask {
  portfolioId: string;
  task: ScheduledTask;
  frequency: string;
  lastRun: Date | null;
  nextRun: Date | null;
}

class PortfolioScheduler {
  private portfolioTasks: Map<string, PortfolioTask> = new Map();
  private isRunning: boolean = false;
  private globalTask: ScheduledTask | null = null;
  private static instance: PortfolioScheduler | null = null;

  constructor() {
    // Start the global monitor that checks for portfolio changes
    this.startGlobalMonitor();
  }

  /**
   * Get the singleton instance of the portfolio scheduler
   */
  static getInstance(): PortfolioScheduler {
    if (!PortfolioScheduler.instance) {
      PortfolioScheduler.instance = new PortfolioScheduler();
    }
    return PortfolioScheduler.instance;
  }

  /**
   * Start the global monitor that checks for portfolio changes every minute
   */
  private startGlobalMonitor() {
    if (this.globalTask) {
      this.globalTask.stop();
    }

    // Check every minute for portfolio changes
    this.globalTask = cron.schedule('* * * * *', async () => {
      await this.syncPortfolioTasks();
    });

    this.isRunning = true;
    console.log('[PortfolioScheduler] Global monitor started - checking for portfolio changes every minute');
    
    // Perform initial sync immediately
    this.performInitialSync();
  }

  /**
   * Perform initial sync to start monitoring portfolios immediately
   */
  private async performInitialSync() {
    try {
      console.log('[PortfolioScheduler] Performing initial portfolio sync...');
      await this.syncPortfolioTasks();
      const status = this.getStatus();
      console.log(`[PortfolioScheduler] Initial sync complete - Active portfolios: ${status.activePortfolios}`);
    } catch (error) {
      console.error('[PortfolioScheduler] Error during initial sync:', error);
    }
  }

  /**
   * Sync portfolio tasks based on current portfolio settings
   */
  private async syncPortfolioTasks() {
    try {
      // Get all portfolios with scheduler enabled
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
          thresholdRebalancePercentage: true,
        }
      });

      console.log(`[PortfolioScheduler] Found ${portfolios.length} portfolios with scheduler enabled`);

      // Update or create tasks for each portfolio
      for (const portfolio of portfolios) {
        const frequency = portfolio.checkFrequency || 'hourly';
        const existingTask = this.portfolioTasks.get(portfolio.id);

        // Check if we need to update the task
        if (!existingTask || existingTask.frequency !== frequency) {
          // Stop existing task if it exists
          if (existingTask) {
            existingTask.task.stop();
            console.log(`[PortfolioScheduler] Stopped old task for portfolio ${portfolio.name} (${portfolio.id})`);
          }

          // Create new task with correct frequency
          const cronExpression = this.getCronExpression(frequency);
          const task = cron.schedule(cronExpression, async () => {
            await this.runPortfolioCheck(portfolio.id);
          });

          // Store the new task
          this.portfolioTasks.set(portfolio.id, {
            portfolioId: portfolio.id,
            task,
            frequency,
            lastRun: null,
            nextRun: this.calculateNextRun(frequency)
          });

          console.log(`[PortfolioScheduler] Created task for portfolio ${portfolio.name} (${portfolio.id}) with frequency ${frequency} (${cronExpression})`);
        }
      }

      // Remove tasks for portfolios that no longer exist or have scheduler disabled
      const activePortfolioIds = new Set(portfolios.map(p => p.id));
      for (const [portfolioId, task] of this.portfolioTasks.entries()) {
        if (!activePortfolioIds.has(portfolioId)) {
          task.task.stop();
          this.portfolioTasks.delete(portfolioId);
          console.log(`[PortfolioScheduler] Removed task for portfolio ${portfolioId}`);
        }
      }

    } catch (error) {
      console.error('[PortfolioScheduler] Error syncing portfolio tasks:', error);
    }
  }

  /**
   * Run a check for a specific portfolio
   */
  private async runPortfolioCheck(portfolioId: string) {
    const task = this.portfolioTasks.get(portfolioId);
    if (!task) {
      console.warn(`[PortfolioScheduler] No task found for portfolio ${portfolioId}`);
      return;
    }

    task.lastRun = new Date();
    task.nextRun = this.calculateNextRun(task.frequency);

    console.log(`[PortfolioScheduler] Running check for portfolio ${portfolioId} (frequency: ${task.frequency})`);

    try {
      // Get portfolio details
      const portfolio = await prisma.portfolio.findUnique({
        where: { id: portfolioId },
        select: {
          id: true,
          name: true,
          userId: true,
          targetWeights: true,
          rebalanceEnabled: true,
          thresholdRebalanceEnabled: true,
          thresholdRebalancePercentage: true,
          rebalanceThreshold: true,
          maxOrdersPerRebalance: true,
          orderType: true,
          smartRoutingEnabled: true,
          checkFrequency: true,
        }
      });

      if (!portfolio) {
        console.warn(`[PortfolioScheduler] Portfolio ${portfolioId} not found`);
        return;
      }

      if (!portfolio.userId) {
        console.warn(`[PortfolioScheduler] Portfolio ${portfolio.name} has no userId`);
        return;
      }

      // Check time-based rebalancing
      if (portfolio.rebalanceEnabled) {
        await this.checkTimeBasedRebalancing({
          ...portfolio,
          targetWeights: portfolio.targetWeights as Record<string, number>
        });
      }

      // Check threshold-based rebalancing
      if (portfolio.thresholdRebalanceEnabled) {
        await this.checkThresholdBasedRebalancing({
          ...portfolio,
          targetWeights: portfolio.targetWeights as Record<string, number>
        });
      }

    } catch (error) {
      console.error(`[PortfolioScheduler] Error checking portfolio ${portfolioId}:`, error);
    }
  }

  /**
   * Check time-based rebalancing for a portfolio
   */
  private async checkTimeBasedRebalancing(portfolio: {
    id: string;
    name: string;
    userId: string;
    targetWeights: Record<string, number>;
    rebalanceThreshold: number;
    maxOrdersPerRebalance: number | null;
    orderType: string;
    smartRoutingEnabled: boolean;
    rebalanceInterval?: string;
    nextRebalanceAt?: Date | null;
  }) {
    console.log(`[PortfolioScheduler] Checking time-based rebalancing for ${portfolio.name}`);

    // Check if it's time to rebalance
    const now = new Date();
    const shouldRebalance = !portfolio.nextRebalanceAt || portfolio.nextRebalanceAt <= now;

    if (!shouldRebalance) {
      console.log(`[PortfolioScheduler] ${portfolio.name} - not time to rebalance yet`);
      return;
    }

    console.log(`[PortfolioScheduler] ${portfolio.name} - time to rebalance!`);

    // Execute rebalancing
    const result = await rebalancePortfolio(portfolio.id, {
      userId: portfolio.userId,
      portfolioId: portfolio.id,
      targetWeights: portfolio.targetWeights as Record<string, number>,
      rebalanceThreshold: portfolio.rebalanceThreshold,
      maxOrdersPerRebalance: portfolio.maxOrdersPerRebalance ?? undefined,
      orderType: (portfolio.orderType as 'market' | 'limit') || 'market',
      smartRoutingEnabled: portfolio.smartRoutingEnabled !== false,
      dryRun: false,
    });

    // Save to history
    const ordersWithMetadata = {
      orders: result.ordersExecuted,
      fundAllocation: result.fundAllocation,
    };
    
    await prisma.rebalanceHistory.create({
      data: {
        portfolioId: portfolio.id,
        executedAt: new Date(),
        success: result.success,
        dryRun: false,
        portfolioValue: result.portfolio.totalValue,
        ordersPlanned: result.ordersPlanned.length,
        ordersExecuted: result.summary.successfulOrders,
        ordersFailed: result.summary.failedOrders,
        totalValueTraded: result.summary.totalValueTraded,
        totalFees: result.summary.totalFees,
        orders: ordersWithMetadata as unknown as object,
        errors: result.errors.length > 0 ? (result.errors as unknown as object) : undefined,
        triggeredBy: 'scheduler',
        duration: 0,
      },
    });

    // Update portfolio
    if (result.success) {
      const nextRebalanceAt = this.calculateNextRebalanceTime(portfolio.rebalanceInterval || 'weekly');
      await prisma.portfolio.update({
        where: { id: portfolio.id },
        data: {
          lastRebalancedAt: new Date(),
          nextRebalanceAt,
          totalFeesPaid: { increment: result.summary.totalFees },
        },
      });
    }

    console.log(`[PortfolioScheduler] Time-based rebalance ${result.success ? 'completed' : 'failed'} for ${portfolio.name}`);
  }

  /**
   * Check threshold-based rebalancing for a portfolio
   */
  private async checkThresholdBasedRebalancing(portfolio: {
    id: string;
    name: string;
    userId: string;
    targetWeights: Record<string, number>;
    rebalanceThreshold: number;
    maxOrdersPerRebalance: number | null;
    orderType: string;
    smartRoutingEnabled: boolean;
    thresholdRebalancePercentage: number;
  }) {
    console.log(`[PortfolioScheduler] Checking threshold-based rebalancing for ${portfolio.name}`);

    try {
      // Import necessary functions
      const { getUserKrakenClient } = await import('./kraken-user');
      const { normalizeAssetSymbol } = await import('./rebalance');
      const { calculatePortfolioValue } = await import('./portfolio');

      const targetWeights = portfolio.targetWeights as Record<string, number>;
      const thresholdPercentage = portfolio.thresholdRebalancePercentage || 3;

      // Get current holdings
      const krakenClient = await getUserKrakenClient(portfolio.userId);
      const krakenBalance = await krakenClient.getAccountBalance();
      const balances: Record<string, number> = {};
      
      for (const [asset, amount] of Object.entries(krakenBalance)) {
        const symbol = normalizeAssetSymbol(asset);
        const balance = parseFloat(amount);
        if (balance > 0) {
          balances[symbol] = balance;
        }
      }

      // Get current prices using centralized cache
      const symbols = Object.keys(targetWeights);
      const { priceCache } = await import('./price-cache');
      const prices = await priceCache.getPrices(portfolio.userId, symbols);

      // Calculate current portfolio
      const currentPortfolio = calculatePortfolioValue(balances, prices);

      // Check if any asset exceeds threshold
      let needsRebalancing = false;
      const deviations: { symbol: string; currentPct: number; targetPct: number; deviation: number }[] = [];

      // Check all target assets
      for (const [symbol, targetPct] of Object.entries(targetWeights)) {
        const holding = currentPortfolio.holdings.find((h: { symbol: string }) => h.symbol === symbol);
        const currentPct = holding ? holding.percentage : 0;
        
        const deviation = Math.abs(currentPct - targetPct);
        
        deviations.push({ 
          symbol, 
          currentPct, 
          targetPct, 
          deviation 
        });

        if (deviation >= thresholdPercentage) {
          needsRebalancing = true;
          console.log(
            `[PortfolioScheduler] ${symbol} exceeds threshold: ` +
            `Current ${currentPct.toFixed(2)}% vs Target ${targetPct}% ` +
            `(Deviation: ${deviation.toFixed(2)}%)`
          );
        }
      }

      if (!needsRebalancing) {
        console.log(`[PortfolioScheduler] ${portfolio.name} is within threshold`);
        return;
      }

      console.log(`[PortfolioScheduler] Threshold exceeded - triggering rebalance for ${portfolio.name}`);

      // Execute rebalancing
      const result = await rebalancePortfolio(portfolio.id, {
        userId: portfolio.userId,
        portfolioId: portfolio.id,
        targetWeights,
        rebalanceThreshold: portfolio.rebalanceThreshold,
        maxOrdersPerRebalance: portfolio.maxOrdersPerRebalance ?? undefined,
        orderType: (portfolio.orderType as 'market' | 'limit') || 'market',
        smartRoutingEnabled: portfolio.smartRoutingEnabled !== false,
        dryRun: false,
      });

      // Save to history
      const ordersWithMetadata = {
        orders: result.ordersExecuted,
        fundAllocation: result.fundAllocation,
        skippedOrders: result.skippedOrders || [],
      };
      
      await prisma.rebalanceHistory.create({
        data: {
          portfolioId: portfolio.id,
          executedAt: new Date(),
          success: result.success,
          dryRun: false,
          portfolioValue: result.portfolio.totalValue,
          ordersPlanned: result.ordersPlanned.length,
          ordersExecuted: result.summary.successfulOrders,
          ordersFailed: result.summary.failedOrders,
          totalValueTraded: result.summary.totalValueTraded,
          totalFees: result.summary.totalFees,
          orders: ordersWithMetadata as unknown as object,
          errors: result.errors.length > 0 ? (result.errors as unknown as object) : undefined,
          triggeredBy: 'threshold',
          duration: 0,
        },
      });

      // Update portfolio
      if (result.success) {
        await prisma.portfolio.update({
          where: { id: portfolio.id },
          data: {
            lastRebalancedAt: new Date(),
            totalFeesPaid: { increment: result.summary.totalFees },
          },
        });
      }

      console.log(
        `[PortfolioScheduler] Threshold rebalance ${result.success ? 'completed' : 'failed'} for ${portfolio.name} ` +
        `(${result.summary.successfulOrders}/${result.ordersPlanned.length} orders)`
      );

    } catch (error) {
      console.error(`[PortfolioScheduler] Error rebalancing threshold portfolio ${portfolio.id}:`, error);
    }
  }

  /**
   * Get cron expression for check frequency
   */
  private getCronExpression(frequency: string): string {
    switch (frequency) {
      case 'every_30_minutes':
        return '*/30 * * * *'; // Every 30 minutes
      case 'hourly':
        return '0 * * * *'; // Every hour at minute 0
      case 'every_2_hours':
        return '0 */2 * * *'; // Every 2 hours
      case 'every_4_hours':
        return '0 */4 * * *'; // Every 4 hours
      case 'daily':
        return '0 9 * * *'; // Daily at 9 AM
      default:
        return '*/30 * * * *'; // Default to every 30 minutes
    }
  }

  /**
   * Calculate next run time
   */
  private calculateNextRun(frequency: string): Date {
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
   * Calculate next rebalance time based on interval
   */
  private calculateNextRebalanceTime(interval: string): Date {
    const now = new Date();
    
    switch (interval) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      case 'hourly': // For testing
        return new Date(now.getTime() + 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activePortfolios: this.portfolioTasks.size,
      portfolioTasks: Array.from(this.portfolioTasks.entries()).map(([id, task]) => ({
        portfolioId: id,
        frequency: task.frequency,
        lastRun: task.lastRun,
        nextRun: task.nextRun,
      })),
    };
  }

  /**
   * Stop the scheduler
   */
  stop() {
    console.log('[PortfolioScheduler] Stopping scheduler...');
    
    // Stop all portfolio tasks
    this.portfolioTasks.forEach(task => {
      task.task.stop();
    });
    this.portfolioTasks.clear();

    // Stop global monitor
    if (this.globalTask) {
      this.globalTask.stop();
      this.globalTask = null;
    }

    this.isRunning = false;
    console.log('[PortfolioScheduler] Scheduler stopped');
  }

  /**
   * Manually trigger a portfolio check
   */
  async triggerPortfolioCheck(portfolioId: string) {
    console.log(`[PortfolioScheduler] Manual trigger for portfolio ${portfolioId}`);
    await this.runPortfolioCheck(portfolioId);
  }
}

// Export singleton instance
export const portfolioScheduler = PortfolioScheduler.getInstance();

// Auto-start the scheduler when the module is imported
if (typeof window === 'undefined') {
  // Only start on server side
  console.log('[PortfolioScheduler] Auto-starting portfolio scheduler...');
  
  try {
    const status = portfolioScheduler.getStatus();
    console.log(`[PortfolioScheduler] Scheduler status: ${status.isRunning ? 'Running' : 'Stopped'}`);
    console.log('[PortfolioScheduler] Scheduler will perform initial portfolio sync automatically');
    
    // Force immediate startup by calling the internal sync method
    setTimeout(async () => {
      try {
        console.log('[PortfolioScheduler] Forcing immediate startup...');
        // Access the private method through the instance
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scheduler = portfolioScheduler as any;
        if (scheduler.performInitialSync) {
          await scheduler.performInitialSync();
        }
      } catch (error) {
        console.error('[PortfolioScheduler] Error during forced startup:', error);
      }
    }, 1000);
  } catch (error) {
    console.error('[PortfolioScheduler] Error during auto-start:', error);
  }
}

export default portfolioScheduler;
