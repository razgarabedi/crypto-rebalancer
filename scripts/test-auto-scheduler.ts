#!/usr/bin/env tsx

/**
 * Test Auto Scheduler
 * This script tests that the portfolio scheduler starts automatically
 */

import portfolioScheduler from '../lib/portfolio-scheduler';

async function testAutoScheduler() {
  console.log('🧪 Testing Auto Scheduler...');
  
  try {
    // Get the current status
    const status = portfolioScheduler.getStatus();
    
    console.log('\n📊 Scheduler Status:');
    console.log(`  Running: ${status.isRunning}`);
    console.log(`  Active Portfolios: ${status.activePortfolios}`);
    console.log(`  Portfolio Tasks: ${status.portfolioTasks}`);
    
    if (status.isRunning) {
      console.log('\n✅ Portfolio scheduler is running automatically!');
      console.log('🎉 The scheduler should now run in the background without user interaction.');
    } else {
      console.log('\n❌ Portfolio scheduler is not running');
      console.log('⚠️  This means the auto-start mechanism is not working');
    }
    
    // Wait a bit to see if the scheduler picks up portfolios
    console.log('\n⏳ Waiting 30 seconds to see if scheduler picks up portfolios...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    const updatedStatus = portfolioScheduler.getStatus();
    console.log('\n📊 Updated Status:');
    console.log(`  Running: ${updatedStatus.isRunning}`);
    console.log(`  Active Portfolios: ${updatedStatus.activePortfolios}`);
    console.log(`  Portfolio Tasks: ${updatedStatus.portfolioTasks}`);   

    if (updatedStatus.activePortfolios > 0) {
      console.log('\n🎉 SUCCESS: Scheduler is running and has active portfolio tasks!');
    } else {
      console.log('\n⚠️  Scheduler is running but no active portfolio tasks found');
      console.log('   This might be normal if no portfolios have scheduler enabled');
    }
    
  } catch (error) {
    console.error('❌ Error testing auto scheduler:', error);
  }
}

// Run the test
testAutoScheduler().catch(console.error);
