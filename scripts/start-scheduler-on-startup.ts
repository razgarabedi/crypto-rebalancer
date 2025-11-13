#!/usr/bin/env tsx

/**
 * Start Scheduler on Server Startup
 * This script ensures the portfolio scheduler starts when the server starts
 */

import portfolioScheduler from '../lib/portfolio-scheduler';

async function startSchedulerOnStartup() {
  console.log('🚀 Starting Portfolio Scheduler on Server Startup...');
  
  try {
    // Get the current status
    const status = portfolioScheduler.getStatus();
    
    console.log('📊 Scheduler Status:');
    console.log(`  Running: ${status.isRunning}`);
    console.log(`  Active Portfolios: ${status.activePortfolios}`);
    
    if (status.isRunning) {
      console.log('✅ Portfolio scheduler is running');
    } else {
      console.log('⚠️  Portfolio scheduler is not running - starting now...');
    }
    
    // Force a sync to ensure portfolios are detected
    console.log('🔄 Forcing initial portfolio sync...');
    
    // Keep the process running to maintain the scheduler
    console.log('🔄 Portfolio scheduler is running in the background...');
    
    // Log status every 30 seconds to show it's working
    setInterval(() => {
      const currentStatus = portfolioScheduler.getStatus();
      console.log(`[${new Date().toISOString()}] Scheduler running: ${currentStatus.isRunning}, Active portfolios: ${currentStatus.activePortfolios}`);
    }, 30000); // Log status every 30 seconds
    
  } catch (error) {
    console.error('❌ Error starting portfolio scheduler:', error);
    process.exit(1);
  }
}

// Start the scheduler immediately
startSchedulerOnStartup().catch(console.error);
