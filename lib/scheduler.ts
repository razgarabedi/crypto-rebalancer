/**
 * Portfolio Rebalancing Scheduler
 * Automated cron-based scheduling system for portfolio rebalancing
 */

import cron, { ScheduledTask } from 'node-cron';
import prisma from './prisma';
import { rebalancePortfolio } from './rebalance';

interface SchedulerConfig {
  enabled: boolean;
  checkInterval: string; // Cron expression (default: every hour)
  dryRunMode: boolean;   // If true, run in simulation mode
}

class RebalanceScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private mainTask: ScheduledTask | null = null;
  private config: SchedulerConfig;
  private isRunning: boolean = false;

  constructor(config?: Partial<SchedulerConfig>) {
    this.config = {
      enabled: config?.enabled ?? true,
      checkInterval: config?.checkInterval ?? '0 * * * *', // Every hour
      dryRunMode: config?.dryRunMode ?? false,
    };
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) {
      console.warn('[Scheduler] Already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('[Scheduler] Disabled in configuration');
      return;
    }

    console.log('[Scheduler] Starting scheduler...');
    console.log(`[Scheduler] Check interval: ${this.config.checkInterval}`);
    console.log(`[Scheduler] Dry run mode: ${this.config.dryRunMode}`);

    // Main task: Check for portfolios that need rebalancing
    this.mainTask = cron.schedule(this.config.checkInterval, async () => {
      await this.checkAndRebalancePortfolios();
    });

    this.isRunning = true;
    console.log('[Scheduler] Scheduler started successfully');

    // Run immediately on start
    this.checkAndRebalancePortfolios();
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.warn('[Scheduler] Not running');
      return;
    }

    console.log('[Scheduler] Stopping scheduler...');

    // Stop main task
    if (this.mainTask) {
      this.mainTask.stop();
      this.mainTask = null;
    }

    // Stop all individual tasks
    this.tasks.forEach((task) => {
      task.stop();
    });
    this.tasks.clear();

    this.isRunning = false;
    console.log('[Scheduler] Scheduler stopped');
  }

  /**
   * Check if scheduler should be running based on active portfolios
   */
  private async shouldSchedulerRun(): Promise<boolean> {
    try {
      const activePortfolios = await prisma.portfolio.findMany({
        where: {
          schedulerEnabled: true,
          OR: [
            { rebalanceEnabled: true },
            { thresholdRebalanceEnabled: true }
          ]
        },
        select: { id: true }
      });
      
      return activePortfolios.length > 0;
    } catch (error) {
      console.error('[Scheduler] Error checking if scheduler should run:', error);
      return false;
    }
  }

  /**
   * Auto-start scheduler if portfolios have rebalancing enabled
   */
  async autoStartIfNeeded() {
    const shouldRun = await this.shouldSchedulerRun();
    
    if (shouldRun && !this.isRunning) {
      console.log('[Scheduler] Auto-starting scheduler - portfolios with rebalancing found');
      // Update the check interval based on active portfolios
      await this.updateCheckInterval();
      this.start();
    } else if (!shouldRun && this.isRunning) {
      console.log('[Scheduler] Auto-stopping scheduler - no active portfolios');
      this.stop();
    } else if (shouldRun && this.isRunning) {
      // Update interval if scheduler is already running
      await this.updateCheckInterval();
    }
  }

  /**
   * Update the check interval based on active portfolios
   */
  private async updateCheckInterval() {
    try {
      // Find the most frequent check interval needed
      const portfolios = await prisma.portfolio.findMany({
        where: {
          schedulerEnabled: true,
          OR: [
            { rebalanceEnabled: true },
            { thresholdRebalanceEnabled: true }
          ]
        },
        select: {
          checkFrequency: true
        }
      });

      if (portfolios.length === 0) {
        return;
      }

      // Find the most frequent interval
      const frequencies = portfolios.map(p => p.checkFrequency || 'hourly');
      const mostFrequent = this.getMostFrequentInterval(frequencies);
      const cronExpression = this.getCronExpression(mostFrequent);
      
      if (cronExpression !== this.config.checkInterval) {
        console.log(`[Scheduler] Updating check interval from ${this.config.checkInterval} to ${cronExpression} (${mostFrequent})`);
        this.config.checkInterval = cronExpression;
        
        // Restart scheduler with new interval if it's running
        if (this.isRunning) {
          this.stop();
          this.start();
        }
      }
    } catch (error) {
      console.error('[Scheduler] Error updating check interval:', error);
    }
  }

  /**
   * Get the most frequent check interval from a list of frequencies
   */
  private getMostFrequentInterval(frequencies: string[]): string {
    const frequencyOrder = ['5_minutes', 'hourly', 'every_2_hours', 'every_4_hours', 'daily'];
    
    for (const freq of frequencyOrder) {
      if (frequencies.includes(freq)) {
        return freq;
      }
    }
    
    return 'hourly'; // Default fallback
  }

  /**
   * Get the current frequency from the cron expression
   */
  private getCurrentFrequency(): string {
    switch (this.config.checkInterval) {
      case '*/5 * * * *':
        return '5_minutes';
      case '0 * * * *':
        return 'hourly';
      case '0 */2 * * *':
        return 'every_2_hours';
      case '0 */4 * * *':
        return 'every_4_hours';
      case '0 9 * * *':
        return 'daily';
      default:
        return 'hourly';
    }
  }

  /**
   * Get cron expression for check frequency
   */
  private getCronExpression(frequency: string): string {
    switch (frequency) {
      case '5_minutes':
        return '*/5 * * * *'; // Every 5 minutes
      case 'hourly':
        return '0 * * * *'; // Every hour at minute 0
      case 'every_2_hours':
        return '0 */2 * * *'; // Every 2 hours
      case 'every_4_hours':
        return '0 */4 * * *'; // Every 4 hours
      case 'daily':
        return '0 9 * * *'; // Daily at 9 AM
      default:
        return '0 * * * *'; // Default to hourly
    }
  }

  /**
   * Check all portfolios and rebalance those that are due
   */
  private async checkAndRebalancePortfolios() {
    const startTime = Date.now();
    console.log(`[Scheduler] ${new Date().toISOString()} - Checking portfolios for rebalancing...`);

    try {
      // Get current scheduler frequency
      const currentFrequency = this.getCurrentFrequency();
      console.log(`[Scheduler] Current scheduler frequency: ${currentFrequency}`);

      // Find portfolios with time-based rebalancing enabled and scheduler enabled
      const timeBasedPortfolios = await prisma.portfolio.findMany({
        where: {
          rebalanceEnabled: true,
          schedulerEnabled: true,
          checkFrequency: currentFrequency,
          OR: [
            { nextRebalanceAt: null },
            { nextRebalanceAt: { lte: new Date() } },
          ],
        },
        select: {
          id: true,
          name: true,
          userId: true,
          targetWeights: true,
          rebalanceThreshold: true,
          maxOrdersPerRebalance: true,
          rebalanceInterval: true,
          orderType: true,
          smartRoutingEnabled: true,
          checkFrequency: true,
        },
      });

      // Find portfolios with threshold-based rebalancing enabled and scheduler enabled
      const thresholdBasedPortfolios = await prisma.portfolio.findMany({
        where: {
          thresholdRebalanceEnabled: true,
          schedulerEnabled: true,
          checkFrequency: currentFrequency,
        },
        select: {
          id: true,
          name: true,
          userId: true,
          targetWeights: true,
          rebalanceThreshold: true,
          maxOrdersPerRebalance: true,
          thresholdRebalancePercentage: true,
          orderType: true,
          smartRoutingEnabled: true,
          checkFrequency: true,
        },
      });

      const totalPortfolios = timeBasedPortfolios.length + thresholdBasedPortfolios.length;

      if (totalPortfolios === 0) {
        console.log('[Scheduler] No portfolios need checking');
        return;
      }

      console.log(`[Scheduler] Found ${timeBasedPortfolios.length} time-based and ${thresholdBasedPortfolios.length} threshold-based portfolio(s) to check`);

      // Process time-based portfolios
      for (const portfolio of timeBasedPortfolios) {
        await this.rebalancePortfolioScheduled(portfolio, 'time-based');
      }

      // Process threshold-based portfolios
      for (const portfolio of thresholdBasedPortfolios) {
        await this.checkAndRebalanceThresholdPortfolio(portfolio);
      }

      const duration = Date.now() - startTime;
      console.log(`[Scheduler] Check completed in ${duration}ms`);
    } catch (error) {
      console.error('[Scheduler] Error checking portfolios:', error);
    }
  }

  /**
   * Check and rebalance threshold-based portfolio if needed
   */
  private async checkAndRebalanceThresholdPortfolio(portfolio: {
    id: string;
    name: string;
    userId: string | null;
    targetWeights: unknown;
    rebalanceThreshold: number;
    maxOrdersPerRebalance: number | null;
    thresholdRebalancePercentage?: number;
    orderType?: string | null;
    smartRoutingEnabled?: boolean | null;
  }) {
    console.log(`[Scheduler] Checking threshold portfolio: ${portfolio.name} (${portfolio.id})`);

    try {
      // Check if portfolio has userId
      if (!portfolio.userId) {
        console.error(`[Scheduler] Portfolio ${portfolio.id} does not have a userId`);
        return;
      }

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
      // We need to check ALL target assets, not just current holdings
      let needsRebalancing = false;
      const deviations: { symbol: string; currentPct: number; targetPct: number; deviation: number }[] = [];

      // Check all target assets
      for (const [symbol, targetPct] of Object.entries(targetWeights)) {
        // Find current holding for this asset
        const holding = currentPortfolio.holdings.find((h: { symbol: string }) => h.symbol === symbol);
        const currentPct = holding ? holding.percentage : 0;
        
        // Calculate absolute deviation in percentage points
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
            `[Scheduler] ${symbol} exceeds threshold: ` +
            `Current ${currentPct.toFixed(2)}% vs Target ${targetPct}% ` +
            `(Deviation: ${deviation.toFixed(2)}%)`
          );
        }
      }

      if (!needsRebalancing) {
        console.log(`[Scheduler] Portfolio ${portfolio.name} is within threshold`);
        return;
      }

      console.log(`[Scheduler] Threshold exceeded - triggering rebalance for ${portfolio.name}`);

      // Execute rebalancing
      const result = await rebalancePortfolio(portfolio.id, {
        userId: portfolio.userId,
        portfolioId: portfolio.id,
        targetWeights,
        rebalanceThreshold: portfolio.rebalanceThreshold,
        maxOrdersPerRebalance: portfolio.maxOrdersPerRebalance ?? undefined,
        orderType: (portfolio.orderType as 'market' | 'limit') || 'market',
        smartRoutingEnabled: portfolio.smartRoutingEnabled !== false,
        dryRun: this.config.dryRunMode,
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
          dryRun: result.dryRun,
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
      if (!this.config.dryRunMode && result.success) {
        await prisma.portfolio.update({
          where: { id: portfolio.id },
          data: {
            lastRebalancedAt: new Date(),
            totalFeesPaid: { increment: result.summary.totalFees },
          },
        });
      }

      console.log(
        `[Scheduler] Threshold rebalance ${result.success ? 'completed' : 'failed'} for ${portfolio.name} ` +
        `(${result.summary.successfulOrders}/${result.ordersPlanned.length} orders)`
      );
    } catch (error) {
      console.error(`[Scheduler] Error rebalancing threshold portfolio ${portfolio.id}:`, error);
    }
  }

  /**
   * Rebalance a specific portfolio (time-based)
   */
  private async rebalancePortfolioScheduled(
    portfolio: {
      id: string;
      name: string;
      userId: string | null;
      targetWeights: unknown;
      rebalanceThreshold: number;
      maxOrdersPerRebalance: number | null;
      rebalanceInterval: string;
      orderType?: string | null;
      smartRoutingEnabled?: boolean | null;
    },
    triggerType: 'time-based' | 'threshold' = 'time-based'
  ) {
    const startTime = Date.now();
    console.log(`[Scheduler] Rebalancing portfolio: ${portfolio.name} (${portfolio.id}) - Trigger: ${triggerType}`);

    try {
      // Check if portfolio has userId
      if (!portfolio.userId) {
        throw new Error('Portfolio does not have a userId assigned. Cannot access Kraken credentials.');
      }

      // Parse target weights
      const targetWeights = portfolio.targetWeights as Record<string, number>;

      // Execute rebalancing
      const result = await rebalancePortfolio(portfolio.id, {
        userId: portfolio.userId,
        portfolioId: portfolio.id,
        targetWeights,
        rebalanceThreshold: portfolio.rebalanceThreshold,
        maxOrdersPerRebalance: portfolio.maxOrdersPerRebalance ?? undefined,
        orderType: (portfolio.orderType as 'market' | 'limit') || 'market',
        smartRoutingEnabled: portfolio.smartRoutingEnabled !== false,
        dryRun: this.config.dryRunMode,
      });

      const duration = Date.now() - startTime;

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
          dryRun: result.dryRun,
          portfolioValue: result.portfolio.totalValue,
          ordersPlanned: result.ordersPlanned.length,
          ordersExecuted: result.summary.successfulOrders,
          ordersFailed: result.summary.failedOrders,
          totalValueTraded: result.summary.totalValueTraded,
          totalFees: result.summary.totalFees,
          orders: ordersWithMetadata as unknown as object,
          errors: result.errors.length > 0 ? (result.errors as unknown as object) : undefined,
          triggeredBy: 'scheduler',
          duration,
        },
      });

      // Update portfolio
      const nextRebalanceAt = this.calculateNextRebalanceTime(portfolio.rebalanceInterval);
      if (!this.config.dryRunMode && result.success) {
        await prisma.portfolio.update({
          where: { id: portfolio.id },
          data: {
            lastRebalancedAt: new Date(),
            nextRebalanceAt,
            totalFeesPaid: { increment: result.summary.totalFees },
          },
        });
      }

      if (result.success) {
        console.log(
          `[Scheduler] ✓ Portfolio rebalanced successfully: ${portfolio.name} ` +
          `(${result.summary.successfulOrders} orders, €${result.summary.totalValueTraded.toFixed(2)} traded, ${duration}ms)`
        );
      } else {
        console.error(
          `[Scheduler] ✗ Portfolio rebalancing failed: ${portfolio.name} ` +
          `(${result.errors.length} errors)`
        );
      }
    } catch (error) {
      console.error(`[Scheduler] Error rebalancing portfolio ${portfolio.id}:`, error);

      // Save error to history
      try {
        await prisma.rebalanceHistory.create({
          data: {
            portfolioId: portfolio.id,
            executedAt: new Date(),
            success: false,
            dryRun: this.config.dryRunMode,
            portfolioValue: 0,
            ordersPlanned: 0,
            ordersExecuted: 0,
            ordersFailed: 0,
            totalValueTraded: 0,
            orders: [],
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            triggeredBy: 'scheduler',
            duration: Date.now() - startTime,
          },
        });
      } catch (historyError) {
        console.error('[Scheduler] Failed to save error to history:', historyError);
      }
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
        // Default to weekly
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
      activeTasks: this.tasks.size,
    };
  }

  /**
   * Manually trigger rebalancing for a specific portfolio
   */
  async triggerManualRebalance(portfolioId: string) {
    console.log(`[Scheduler] Manual rebalance triggered for portfolio: ${portfolioId}`);

    try {
      const portfolio = await prisma.portfolio.findUnique({
        where: { id: portfolioId },
        select: {
          id: true,
          name: true,
          userId: true,
          targetWeights: true,
          rebalanceThreshold: true,
          maxOrdersPerRebalance: true,
          rebalanceInterval: true,
          orderType: true,
          smartRoutingEnabled: true,
        },
      });

      if (!portfolio) {
        throw new Error(`Portfolio not found: ${portfolioId}`);
      }

      if (!portfolio.userId) {
        throw new Error(`Portfolio ${portfolioId} does not have a userId assigned. Cannot access Kraken credentials.`);
      }

      await this.rebalancePortfolioScheduled(portfolio);
    } catch (error) {
      console.error(`[Scheduler] Error in manual rebalance:`, error);
      throw error;
    }
  }

  /**
   * Get upcoming rebalance schedule
   */
  async getSchedule() {
    const portfolios = await prisma.portfolio.findMany({
      where: {
        rebalanceEnabled: true,
      },
      select: {
        id: true,
        name: true,
        rebalanceInterval: true,
        lastRebalancedAt: true,
        nextRebalanceAt: true,
      },
      orderBy: {
        nextRebalanceAt: 'asc',
      },
    });

    return portfolios;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SchedulerConfig>) {
    const wasRunning = this.isRunning;
    
    if (wasRunning) {
      this.stop();
    }

    this.config = {
      ...this.config,
      ...config,
    };

    if (wasRunning && config.enabled !== false) {
      this.start();
    }

    console.log('[Scheduler] Configuration updated:', this.config);
  }
}

// Export singleton instance
export const scheduler = new RebalanceScheduler({
  enabled: process.env.SCHEDULER_ENABLED !== 'false',
  checkInterval: process.env.SCHEDULER_CHECK_INTERVAL || '0 * * * *',
  dryRunMode: process.env.SCHEDULER_DRY_RUN === 'true',
});

export default scheduler;

