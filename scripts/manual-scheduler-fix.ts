#!/usr/bin/env tsx

/**
 * Manual Scheduler Fix
 * This script manually starts the scheduler and tests threshold rebalancing
 */

import { PrismaClient } from '@prisma/client';
import scheduler from '../lib/scheduler';

const prisma = new PrismaClient();

async function manualSchedulerFix() {
  console.log('🔧 Manual Scheduler Fix - Starting...');

  try {
    // 1. Check current scheduler status
    console.log('\n1. Checking current scheduler status...');
    const status = scheduler.getStatus();
    console.log('Current status:', JSON.stringify(status, null, 2));

    // 2. Update scheduler configuration
    console.log('\n2. Updating scheduler configuration...');
    scheduler.updateConfig({
      enabled: true,
      checkInterval: '*/5 * * * *', // Every 5 minutes
      dryRunMode: false,
    });

    // 3. Start the scheduler
    console.log('\n3. Starting scheduler...');
    scheduler.start();

    // 4. Check portfolios with threshold rebalancing
    console.log('\n4. Checking portfolios with threshold rebalancing...');
    const portfolios = await prisma.portfolio.findMany({
      where: {
        thresholdRebalanceEnabled: true,
        schedulerEnabled: true,
      },
      select: {
        id: true,
        name: true,
        userId: true,
        targetWeights: true,
        thresholdRebalancePercentage: true,
        checkFrequency: true,
      },
    });

    console.log(`Found ${portfolios.length} portfolios with threshold rebalancing enabled:`);
    portfolios.forEach(portfolio => {
      console.log(`  - ${portfolio.name} (${portfolio.id})`);
      console.log(`    Threshold: ${portfolio.thresholdRebalancePercentage}%`);
      console.log(`    Check frequency: ${portfolio.checkFrequency}`);
    });

    // 5. Manually trigger the scheduler check
    console.log('\n5. Manually triggering scheduler check...');
    await scheduler.autoStartIfNeeded();

    // 6. Check final status
    console.log('\n6. Final scheduler status:');
    const finalStatus = scheduler.getStatus();
    console.log(JSON.stringify(finalStatus, null, 2));

    if (finalStatus.isRunning) {
      console.log('\n✅ Scheduler is now running!');
      console.log('📅 It will check for rebalancing every 5 minutes');
      console.log('🔍 Threshold-based rebalancing is enabled');
    } else {
      console.log('\n❌ Scheduler failed to start');
    }

    // 7. Test threshold logic for each portfolio
    console.log('\n7. Testing threshold logic...');
    for (const portfolio of portfolios) {
      console.log(`\nTesting portfolio: ${portfolio.name}`);
      
      if (!portfolio.userId) {
        console.log('❌ No userId - skipping');
        continue;
      }

      try {
        // Import the rebalance function
        const { rebalancePortfolio } = await import('../lib/rebalance');
        
        // Test with dry run
        const result = await rebalancePortfolio(portfolio.id, {
          userId: portfolio.userId,
          portfolioId: portfolio.id,
          targetWeights: portfolio.targetWeights as Record<string, number>,
          dryRun: true,
        });

        console.log(`  Portfolio value: €${result.portfolio.totalValue.toFixed(2)}`);
        console.log(`  Orders planned: ${result.ordersPlanned.length}`);
        
        if (result.ordersPlanned.length > 0) {
          console.log('  ✅ Portfolio needs rebalancing');
          result.ordersPlanned.forEach((order, idx) => {
            console.log(`    ${idx + 1}. ${order.side.toUpperCase()} ${order.volume.toFixed(6)} ${order.symbol} (€${order.difference.toFixed(2)})`);
          });
        } else {
          console.log('  ℹ️  Portfolio is balanced');
        }

      } catch (error) {
        console.error(`  ❌ Error testing portfolio: ${error}`);
      }
    }

    console.log('\n🎉 Manual scheduler fix completed!');
    console.log('The scheduler should now be running and checking every 5 minutes.');

  } catch (error) {
    console.error('Error in manual scheduler fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
manualSchedulerFix().catch(console.error);
