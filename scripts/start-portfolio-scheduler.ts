#!/usr/bin/env tsx

/**
 * Start Portfolio Scheduler
 * This script starts the portfolio scheduler and keeps it running
 */

import portfolioScheduler from '../lib/portfolio-scheduler';

async function startPortfolioScheduler() {
  console.log('🚀 Starting Portfolio Scheduler...');
  
  try {
    // Get the current status
    const status = portfolioScheduler.getStatus();
    
    console.log('📊 Scheduler Status:');
    console.log(`  Running: ${status.isRunning}`);
    console.log(`  Active Portfolios: ${status.activePortfolios}`);
    
    if (status.isRunning) {
      console.log('✅ Portfolio scheduler is already running');
    } else {
      console.log('⚠️  Portfolio scheduler is not running - this should not happen');
    }
    
    // Keep the process running
    console.log('🔄 Portfolio scheduler is running in the background...');
    console.log('Press Ctrl+C to stop');
    
    // Keep the process alive
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping portfolio scheduler...');
      portfolioScheduler.stop();
      process.exit(0);
    });
    
    // Keep the process running
    setInterval(() => {
      const currentStatus = portfolioScheduler.getStatus();
      console.log(`[${new Date().toISOString()}] Scheduler running: ${currentStatus.isRunning}, Active portfolios: ${currentStatus.activePortfolios}`);
    }, 60000); // Log status every minute
    
  } catch (error) {
    console.error('❌ Error starting portfolio scheduler:', error);
    process.exit(1);
  }
}

// Start the scheduler
startPortfolioScheduler().catch(console.error);
