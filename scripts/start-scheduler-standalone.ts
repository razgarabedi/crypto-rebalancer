#!/usr/bin/env tsx

/**
 * Standalone Portfolio Scheduler
 * This script starts the portfolio scheduler and keeps it running independently
 */

import { PrismaClient } from '@prisma/client';
import cron, { ScheduledTask } from 'node-cron';
import { rebalancePortfolio } from '../lib/rebalance';

const prisma = new PrismaClient();

interface PortfolioTask {
  portfolioId: string;
  task: ScheduledTask;
  frequency: string;
  lastRun: Date | null;
  nextRun: Date | null;
}

class StandalonePortfolioScheduler {
  private portfolioTasks: Map<string, PortfolioTask> = new Map();
  private isRunning: boolean = false;
  private globalTask: ScheduledTask | null = null;

  constructor() {
    console.log('🚀 Starting Standalone Portfolio Scheduler...');
    this.startGlobalMonitor();
  }

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
  }

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
          targetWeights: true,
          rebalanceThreshold: true,
          maxOrdersPerRebalance: true,
          orderType: true,
          smartRoutingEnabled: true,
          userId: true,
        }
      });

      console.log(`[PortfolioScheduler] Found ${portfolios.length} portfolios with scheduler enabled`);

      // Create or update tasks for each portfolio
      for (const portfolio of portfolios) {
        const frequency = portfolio.checkFrequency || 'hourly';
        const cronExpression = this.getCronExpression(frequency);
        
        if (this.portfolioTasks.has(portfolio.id)) {
          const existingTask = this.portfolioTasks.get(portfolio.id)!;
          if (existingTask.frequency !== frequency) {
            // Update task with new frequency
            existingTask.task.stop();
            const newTask = cron.schedule(cronExpression, async () => {
              await this.runPortfolioCheck(portfolio.id);
            });
            existingTask.task = newTask;
            existingTask.frequency = frequency;
            console.log(`[PortfolioScheduler] Updated task for portfolio ${portfolio.name} with frequency ${frequency}`);
          }
        } else {
          // Create new task
          const task = cron.schedule(cronExpression, async () => {
            await this.runPortfolioCheck(portfolio.id);
          });
          
          this.portfolioTasks.set(portfolio.id, {
            portfolioId: portfolio.id,
            task,
            frequency,
            lastRun: null,
            nextRun: new Date(Date.now() + 60000) // Next run in 1 minute
          });
          
          console.log(`[PortfolioScheduler] Created task for portfolio ${portfolio.name} with frequency ${frequency} (${cronExpression})`);
        }
      }

      // Remove tasks for portfolios that no longer exist or have scheduler disabled
      for (const [portfolioId, taskInfo] of this.portfolioTasks) {
        const portfolio = portfolios.find(p => p.id === portfolioId);
        if (!portfolio) {
          taskInfo.task.stop();
          this.portfolioTasks.delete(portfolioId);
          console.log(`[PortfolioScheduler] Removed task for portfolio ${portfolioId}`);
        }
      }

    } catch (error) {
      console.error('[PortfolioScheduler] Error syncing portfolio tasks:', error);
    }
  }

  private getCronExpression(frequency: string): string {
    switch (frequency) {
      case '5_minutes': return '*/5 * * * *';
      case 'hourly': return '0 * * * *';
      case 'every_2_hours': return '0 */2 * * *';
      case 'every_4_hours': return '0 */4 * * *';
      case 'daily': return '0 9 * * *';
      default: return '0 * * * *';
    }
  }

  private async runPortfolioCheck(portfolioId: string) {
    try {
      const portfolio = await prisma.portfolio.findUnique({
        where: { id: portfolioId },
        select: {
          id: true,
          name: true,
          checkFrequency: true,
          rebalanceEnabled: true,
          thresholdRebalanceEnabled: true,
          thresholdRebalancePercentage: true,
          targetWeights: true,
          rebalanceThreshold: true,
          maxOrdersPerRebalance: true,
          orderType: true,
          smartRoutingEnabled: true,
          userId: true,
        }
      });

      if (!portfolio) {
        console.log(`[PortfolioScheduler] Portfolio ${portfolioId} not found`);
        return;
      }

      console.log(`[PortfolioScheduler] Running check for portfolio ${portfolio.name} (${portfolioId})`);

      // Update task info
      const taskInfo = this.portfolioTasks.get(portfolioId);
      if (taskInfo) {
        taskInfo.lastRun = new Date();
        taskInfo.nextRun = new Date(Date.now() + 60000); // Next run in 1 minute
      }

      // Check threshold-based rebalancing
      if (portfolio.thresholdRebalanceEnabled) {
        await this.checkThresholdBasedRebalancing(portfolio);
      }

    } catch (error) {
      console.error(`[PortfolioScheduler] Error checking portfolio ${portfolioId}:`, error);
    }
  }

  private async checkThresholdBasedRebalancing(portfolio: any) {
    try {
      console.log(`[PortfolioScheduler] Checking threshold-based rebalancing for ${portfolio.name}`);
      
      // Get current prices and balances
      const { getUserKrakenClient } = await import('../lib/kraken-user');
      const { calculatePortfolioValue } = await import('../lib/portfolio');
      const { normalizeAssetSymbol, getTradingPair } = await import('../lib/rebalance');
      
      const krakenClient = await getUserKrakenClient(portfolio.userId);
      const krakenBalance = await krakenClient.getAccountBalance();
      
      // Convert Kraken balance format to our format
      const balances: Record<string, number> = {};
      for (const [asset, amount] of Object.entries(krakenBalance)) {
        const symbol = normalizeAssetSymbol(asset);
        const balance = parseFloat(amount);
        if (balance > 0) {
          balances[symbol] = balance;
        }
      }
      
      const targetWeights = portfolio.targetWeights as Record<string, number>;
      const symbols = Object.keys(targetWeights);
      const pricePairs = symbols.map(symbol => getTradingPair(symbol, 'EUR'));
      const tickers = await krakenClient.getTickerPrices(pricePairs);
      const prices: Record<string, number> = {};
      
      for (const ticker of tickers) {
        const symbol = normalizeAssetSymbol(ticker.symbol.replace(/EUR$/, '').replace(/Z$/, ''));
        prices[symbol] = ticker.price;
      }

      const currentPortfolio = calculatePortfolioValue(balances, prices);
      
      // Check if any asset exceeds threshold
      let needsRebalancing = false;
      const deviations: { symbol: string; currentPct: number; targetPct: number; deviation: number }[] = [];

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
        
        if (deviation > portfolio.thresholdRebalancePercentage) {
          needsRebalancing = true;
          console.log(`[PortfolioScheduler] ${symbol} exceeds threshold: Current ${currentPct.toFixed(2)}% vs Target ${targetPct}% (Deviation: ${deviation.toFixed(2)}%)`);
        }
      }

      if (needsRebalancing) {
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
            orders: result.ordersExecuted as unknown as object,
            errors: result.errors.length > 0 ? (result.errors as unknown as object) : undefined,
            triggeredBy: 'threshold',
            duration: 0,
          },
        });

        console.log(`[PortfolioScheduler] Threshold rebalance ${result.success ? 'completed' : 'failed'} for ${portfolio.name} (${result.summary.successfulOrders}/${result.ordersPlanned.length} orders)`);
      } else {
        console.log(`[PortfolioScheduler] ${portfolio.name} is within threshold`);
      }

    } catch (error) {
      console.error(`[PortfolioScheduler] Error in threshold rebalancing for ${portfolio.name}:`, error);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      activeTasks: this.portfolioTasks.size,
      portfolioTasks: Array.from(this.portfolioTasks.entries()).map(([id, task]) => ({
        portfolioId: id,
        frequency: task.frequency,
        lastRun: task.lastRun,
        nextRun: task.nextRun,
      })),
    };
  }

  stop() {
    if (this.globalTask) {
      this.globalTask.stop();
      this.globalTask = null;
    }

    for (const [portfolioId, taskInfo] of this.portfolioTasks) {
      taskInfo.task.stop();
    }
    this.portfolioTasks.clear();

    this.isRunning = false;
    console.log('[PortfolioScheduler] Scheduler stopped');
  }
}

// Start the scheduler
const scheduler = new StandalonePortfolioScheduler();

// Keep the process running
console.log('🔄 Portfolio scheduler is running in the background...');
console.log('Press Ctrl+C to stop');

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping portfolio scheduler...');
  scheduler.stop();
  process.exit(0);
});

// Log status every minute
setInterval(() => {
  const status = scheduler.getStatus();
  console.log(`[${new Date().toISOString()}] Scheduler running: ${status.isRunning}, Active tasks: ${status.activeTasks}`);
}, 60000);
