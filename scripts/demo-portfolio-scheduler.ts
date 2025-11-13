#!/usr/bin/env tsx

/**
 * Demo Portfolio Scheduler
 * This script demonstrates how the new per-portfolio scheduler works
 */

import { PrismaClient } from '@prisma/client';
import portfolioScheduler from '../lib/portfolio-scheduler';

const prisma = new PrismaClient();

async function demoPortfolioScheduler() {
  console.log('🎯 Portfolio Scheduler Demo');
  console.log('==========================\n');

  try {
    // 1. Show current status
    console.log('1. Current Scheduler Status:');
    const status = portfolioScheduler.getStatus();
    console.log(`   Running: ${status.isRunning}`);
    console.log(`   Active Portfolios: ${status.activePortfolios}`);
    console.log(`   Portfolio Tasks: ${status.portfolioTasks.length}\n`);

    // 2. Show individual portfolio tasks
    if (status.portfolioTasks.length > 0) {
      console.log('2. Individual Portfolio Tasks:');
      status.portfolioTasks.forEach((task, index) => {
        console.log(`   ${index + 1}. Portfolio: ${task.portfolioId}`);
        console.log(`      Frequency: ${task.frequency}`);
        console.log(`      Last Run: ${task.lastRun || 'Never'}`);
        console.log(`      Next Run: ${task.nextRun || 'Unknown'}`);
        console.log('');
      });
    }

    // 3. Show portfolio schedule from database
    console.log('3. Portfolio Schedule (from database):');
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
        lastRebalancedAt: true,
        nextRebalanceAt: true,
      },
      orderBy: {
        checkFrequency: 'asc',
      },
    });

    portfolios.forEach((portfolio, index) => {
      console.log(`   ${index + 1}. ${portfolio.name}`);
      console.log(`      ID: ${portfolio.id}`);
      console.log(`      Check Frequency: ${portfolio.checkFrequency}`);
      console.log(`      Time-based Rebalancing: ${portfolio.rebalanceEnabled ? '✅' : '❌'}`);
      console.log(`      Threshold-based Rebalancing: ${portfolio.thresholdRebalanceEnabled ? '✅' : '❌'}`);
      if (portfolio.thresholdRebalanceEnabled) {
        console.log(`      Threshold: ${portfolio.thresholdRebalancePercentage}%`);
      }
      console.log(`      Last Rebalanced: ${portfolio.lastRebalancedAt || 'Never'}`);
      console.log(`      Next Rebalance: ${portfolio.nextRebalanceAt || 'Not scheduled'}`);
      console.log('');
    });

    // 4. Explain how it works
    console.log('4. How the New System Works:');
    console.log('   ✅ Each portfolio has its own individual scheduler task');
    console.log('   ✅ Tasks run based on the portfolio\'s "Check Frequency" setting');
    console.log('   ✅ Scheduler persists across server restarts');
    console.log('   ✅ No more global scheduler conflicts');
    console.log('   ✅ Automatic monitoring respects individual portfolio settings\n');

    // 5. Show frequency mappings
    console.log('5. Check Frequency Mappings:');
    const frequencyMappings = {
      '5_minutes': 'Every 5 minutes (*/5 * * * *)',
      'hourly': 'Every hour (0 * * * *)',
      'every_2_hours': 'Every 2 hours (0 */2 * * *)',
      'every_4_hours': 'Every 4 hours (0 */4 * * *)',
      'daily': 'Daily at 9 AM (0 9 * * *)',
    };

    Object.entries(frequencyMappings).forEach(([frequency, description]) => {
      console.log(`   ${frequency}: ${description}`);
    });

    console.log('\n🎉 Portfolio Scheduler Demo Complete!');
    console.log('The scheduler now respects individual portfolio settings and will not reset.');

  } catch (error) {
    console.error('Error in portfolio scheduler demo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the demo
demoPortfolioScheduler().catch(console.error);
