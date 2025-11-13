/**
 * Scheduler Examples
 * Demonstrates scheduler usage and portfolio management
 */

import prisma from './prisma';
import scheduler from './scheduler';

/**
 * Example 1: Create a portfolio with scheduling
 */
export async function exampleCreatePortfolio() {
  console.log('\n=== Example 1: Create Portfolio with Scheduling ===\n');

  try {
    // First, get or create a user for the example
    const user = await prisma.user.findFirst() || await prisma.user.create({
      data: {
        email: 'example@test.com',
        password: 'hashedpassword',
        name: 'Example User',
      },
    });

    const portfolio = await prisma.portfolio.create({
      data: {
        name: 'Conservative Portfolio',
        targetWeights: {
          BTC: 50,
          ETH: 30,
          SOL: 15,
          ADA: 5,
        },
        rebalanceEnabled: true,
        rebalanceInterval: 'weekly',
        rebalanceThreshold: 20.0,
        maxOrdersPerRebalance: 3,
        nextRebalanceAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userId: user.id,
      },
    });

    console.log('Portfolio created:', portfolio);
    console.log(`Next rebalance: ${portfolio.nextRebalanceAt?.toISOString()}`);

    return portfolio;
  } catch (error) {
    console.error('Error creating portfolio:', error);
  }
}

/**
 * Example 2: List all portfolios
 */
export async function exampleListPortfolios() {
  console.log('\n=== Example 2: List All Portfolios ===\n');

  try {
    const portfolios = await prisma.portfolio.findMany({
      include: {
        _count: {
          select: { rebalanceHistory: true },
        },
      },
    });

    console.log(`Found ${portfolios.length} portfolio(s):\n`);

    portfolios.forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.name}`);
      console.log(`   ID: ${p.id}`);
      console.log(`   Enabled: ${p.rebalanceEnabled}`);
      console.log(`   Interval: ${p.rebalanceInterval}`);
      console.log(`   Last rebalanced: ${p.lastRebalancedAt?.toISOString() || 'Never'}`);
      console.log(`   Next rebalance: ${p.nextRebalanceAt?.toISOString() || 'Not scheduled'}`);
      console.log(`   History count: ${p._count.rebalanceHistory}`);
      console.log('');
    });

    return portfolios;
  } catch (error) {
    console.error('Error listing portfolios:', error);
  }
}

/**
 * Example 3: Update portfolio settings
 */
export async function exampleUpdatePortfolio(portfolioId: string) {
  console.log('\n=== Example 3: Update Portfolio Settings ===\n');

  try {
    const updated = await prisma.portfolio.update({
      where: { id: portfolioId },
      data: {
        rebalanceEnabled: true,
        rebalanceInterval: 'daily',
        rebalanceThreshold: 10.0,
        nextRebalanceAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    console.log('Portfolio updated:', updated);
    return updated;
  } catch (error) {
    console.error('Error updating portfolio:', error);
  }
}

/**
 * Example 4: Get rebalance history
 */
export async function exampleGetHistory(portfolioId: string) {
  console.log('\n=== Example 4: Get Rebalance History ===\n');

  try {
    const history = await prisma.rebalanceHistory.findMany({
      where: { portfolioId },
      orderBy: { executedAt: 'desc' },
      take: 10,
    });

    console.log(`Found ${history.length} rebalance(s):\n`);

    history.forEach((h, idx) => {
      console.log(`${idx + 1}. ${h.executedAt.toISOString()}`);
      console.log(`   Success: ${h.success ? '✓' : '✗'}`);
      console.log(`   Dry run: ${h.dryRun}`);
      console.log(`   Portfolio value: €${h.portfolioValue.toFixed(2)}`);
      console.log(`   Orders: ${h.ordersExecuted}/${h.ordersPlanned}`);
      console.log(`   Value traded: €${h.totalValueTraded.toFixed(2)}`);
      console.log(`   Triggered by: ${h.triggeredBy}`);
      console.log(`   Duration: ${h.duration}ms`);
      if (!h.success && h.errors) {
        console.log(`   Errors: ${JSON.stringify(h.errors)}`);
      }
      console.log('');
    });

    return history;
  } catch (error) {
    console.error('Error getting history:', error);
  }
}

/**
 * Example 5: Start scheduler
 */
export async function exampleStartScheduler() {
  console.log('\n=== Example 5: Start Scheduler ===\n');

  try {
    scheduler.start();

    const status = scheduler.getStatus();
    console.log('Scheduler status:', status);

    const schedule = await scheduler.getSchedule();
    console.log(`\nUpcoming rebalances: ${schedule.length}`);
    schedule.forEach((p) => {
      console.log(`- ${p.name}: ${p.nextRebalanceAt?.toISOString()}`);
    });
  } catch (error) {
    console.error('Error starting scheduler:', error);
  }
}

/**
 * Example 6: Manual trigger
 */
export async function exampleManualTrigger(portfolioId: string) {
  console.log('\n=== Example 6: Manual Trigger ===\n');

  try {
    console.log(`Triggering manual rebalance for portfolio: ${portfolioId}`);

    await scheduler.triggerManualRebalance(portfolioId);

    console.log('Manual rebalance completed');

    // Check history
    const latest = await prisma.rebalanceHistory.findFirst({
      where: { portfolioId },
      orderBy: { executedAt: 'desc' },
    });

    console.log('\nLatest rebalance:');
    console.log(`- Success: ${latest?.success}`);
    console.log(`- Orders: ${latest?.ordersExecuted}/${latest?.ordersPlanned}`);
    console.log(`- Value traded: €${latest?.totalValueTraded.toFixed(2)}`);
  } catch (error) {
    console.error('Error triggering manual rebalance:', error);
  }
}

/**
 * Example 7: Statistics
 */
export async function exampleStatistics() {
  console.log('\n=== Example 7: Rebalance Statistics ===\n');

  try {
    // Overall statistics
    const stats = await prisma.rebalanceHistory.aggregate({
      _count: true,
      _sum: {
        totalValueTraded: true,
        ordersExecuted: true,
      },
      _avg: {
        portfolioValue: true,
        duration: true,
      },
    });

    console.log('Overall Statistics:');
    console.log(`- Total rebalances: ${stats._count}`);
    console.log(`- Total value traded: €${stats._sum.totalValueTraded?.toFixed(2) || 0}`);
    console.log(`- Total orders: ${stats._sum.ordersExecuted || 0}`);
    console.log(`- Avg portfolio value: €${stats._avg.portfolioValue?.toFixed(2) || 0}`);
    console.log(`- Avg duration: ${stats._avg.duration?.toFixed(0) || 0}ms`);

    // Success rate
    const successful = await prisma.rebalanceHistory.count({
      where: { success: true },
    });
    const total = await prisma.rebalanceHistory.count();
    const successRate = total > 0 ? (successful / total) * 100 : 0;

    console.log(`\nSuccess rate: ${successRate.toFixed(1)}% (${successful}/${total})`);

    // By trigger type
    const byTrigger = await prisma.rebalanceHistory.groupBy({
      by: ['triggeredBy'],
      _count: true,
    });

    console.log('\nBy trigger type:');
    byTrigger.forEach((t) => {
      console.log(`- ${t.triggeredBy}: ${t._count}`);
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
  }
}

/**
 * Example 8: Cleanup old history
 */
export async function exampleCleanupHistory(daysToKeep: number = 30) {
  console.log(`\n=== Example 8: Cleanup Old History (keep ${daysToKeep} days) ===\n`);

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const deleted = await prisma.rebalanceHistory.deleteMany({
      where: {
        executedAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`Deleted ${deleted.count} old rebalance history record(s)`);
    console.log(`Cutoff date: ${cutoffDate.toISOString()}`);
  } catch (error) {
    console.error('Error cleaning up history:', error);
  }
}

/**
 * Example 9: Complete workflow
 */
export async function exampleCompleteWorkflow() {
  console.log('\n=== Example 9: Complete Workflow ===\n');

  try {
    // 1. Create portfolio
    console.log('Step 1: Creating portfolio...');
    
    // First, get or create a user for the example
    const user = await prisma.user.findFirst() || await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
      },
    });

    const portfolio = await prisma.portfolio.create({
      data: {
        name: 'Test Portfolio',
        targetWeights: { BTC: 60, ETH: 40 },
        rebalanceEnabled: true,
        rebalanceInterval: 'hourly', // For quick testing
        rebalanceThreshold: 5.0,
        nextRebalanceAt: new Date(Date.now() + 60 * 60 * 1000),
        userId: user.id,
      },
    });
    console.log(`✓ Portfolio created: ${portfolio.id}`);

    // 2. Start scheduler
    console.log('\nStep 2: Starting scheduler...');
    scheduler.start();
    console.log('✓ Scheduler started');

    // 3. Get status
    console.log('\nStep 3: Getting status...');
    const status = scheduler.getStatus();
    console.log(`✓ Scheduler running: ${status.isRunning}`);

    // 4. Manual trigger (for immediate execution)
    console.log('\nStep 4: Triggering manual rebalance...');
    await scheduler.triggerManualRebalance(portfolio.id);
    console.log('✓ Manual rebalance completed');

    // 5. Check history
    console.log('\nStep 5: Checking history...');
    const history = await prisma.rebalanceHistory.findFirst({
      where: { portfolioId: portfolio.id },
      orderBy: { executedAt: 'desc' },
    });
    
    if (history) {
      console.log(`✓ Rebalance recorded:`);
      console.log(`  - Success: ${history.success}`);
      console.log(`  - Orders: ${history.ordersExecuted}/${history.ordersPlanned}`);
      console.log(`  - Value: €${history.portfolioValue.toFixed(2)}`);
    }

    // 6. Update settings
    console.log('\nStep 6: Updating settings...');
    await prisma.portfolio.update({
      where: { id: portfolio.id },
      data: { rebalanceEnabled: false },
    });
    console.log('✓ Rebalancing disabled for portfolio');

    // 7. Get schedule
    console.log('\nStep 7: Getting schedule...');
    const schedule = await scheduler.getSchedule();
    console.log(`✓ Active portfolios: ${schedule.length}`);

    console.log('\n✅ Workflow completed successfully!');
  } catch (error) {
    console.error('Error in workflow:', error);
  }
}

// Run examples
if (require.main === module) {
  (async () => {
    console.log('='.repeat(80));
    console.log('  SCHEDULER EXAMPLES');
    console.log('='.repeat(80));

    // Uncomment to run specific examples:
    // await exampleCreatePortfolio();
    // await exampleListPortfolios();
    // await exampleStartScheduler();
    // await exampleStatistics();
    // await exampleCompleteWorkflow();

    console.log('\n' + '='.repeat(80));
    console.log('Uncomment examples in lib/scheduler.example.ts to run them');

    // Close database connection
    await prisma.$disconnect();
  })();
}

