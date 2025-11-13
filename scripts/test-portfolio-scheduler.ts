#!/usr/bin/env tsx

/**
 * Test Portfolio Scheduler
 * This script tests the new per-portfolio scheduler implementation
 */

import { PrismaClient } from '@prisma/client';
import portfolioScheduler from '../lib/portfolio-scheduler';

const prisma = new PrismaClient();

async function testPortfolioScheduler() {
  console.log('🧪 Testing Portfolio Scheduler...');

  try {
    // 1. Check current scheduler status
    console.log('\n1. Checking portfolio scheduler status...');
    const status = portfolioScheduler.getStatus();
    console.log('Scheduler status:', JSON.stringify(status, null, 2));

    // 2. Get portfolios with different check frequencies
    console.log('\n2. Checking portfolios with different frequencies...');
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
      },
    });

    console.log(`Found ${portfolios.length} portfolios with scheduler enabled:`);
    portfolios.forEach(portfolio => {
      console.log(`  - ${portfolio.name} (${portfolio.id})`);
      console.log(`    Frequency: ${portfolio.checkFrequency}`);
      console.log(`    Time-based: ${portfolio.rebalanceEnabled}`);
      console.log(`    Threshold-based: ${portfolio.thresholdRebalanceEnabled}`);
      if (portfolio.thresholdRebalanceEnabled) {
        console.log(`    Threshold: ${portfolio.thresholdRebalancePercentage}%`);
      }
    });

    // 3. Test manual trigger for each portfolio
    console.log('\n3. Testing manual triggers...');
    for (const portfolio of portfolios) {
      console.log(`\nTesting manual trigger for: ${portfolio.name}`);
      
      try {
        await portfolioScheduler.triggerPortfolioCheck(portfolio.id);
        console.log(`✅ Manual trigger completed for ${portfolio.name}`);
      } catch (error) {
        console.error(`❌ Error triggering ${portfolio.name}:`, error);
      }
    }

    // 4. Check final status
    console.log('\n4. Final scheduler status:');
    const finalStatus = portfolioScheduler.getStatus();
    console.log(JSON.stringify(finalStatus, null, 2));

    console.log('\n🎉 Portfolio scheduler test completed!');
    console.log('The scheduler should now be running individual tasks for each portfolio based on their check frequency.');

  } catch (error) {
    console.error('Error testing portfolio scheduler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPortfolioScheduler().catch(console.error);
