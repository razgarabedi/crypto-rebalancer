#!/usr/bin/env tsx

/**
 * Start Scheduler Script
 * This script starts the scheduler with the correct configuration
 */

import scheduler from '../lib/scheduler';

async function startScheduler() {
  console.log('🚀 Starting scheduler with 5-minute intervals...');

  try {
    // Update configuration to use 5-minute intervals
    scheduler.updateConfig({
      enabled: true,
      checkInterval: '*/5 * * * *', // Every 5 minutes
      dryRunMode: false,
    });

    // Start the scheduler
    scheduler.start();

    // Check status
    const status = scheduler.getStatus();
    console.log('Scheduler status:', JSON.stringify(status, null, 2));

    if (status.isRunning) {
      console.log('✅ Scheduler is now running with 5-minute intervals');
      console.log('📅 Next check will be in 5 minutes');
    } else {
      console.log('❌ Scheduler failed to start');
    }

    // Keep the process running
    console.log('Scheduler is running. Press Ctrl+C to stop.');
    
    // Keep alive
    setInterval(() => {
      const currentStatus = scheduler.getStatus();
      console.log(`[${new Date().toISOString()}] Scheduler running: ${currentStatus.isRunning}`);
    }, 60000); // Log every minute

  } catch (error) {
    console.error('Error starting scheduler:', error);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping scheduler...');
  scheduler.stop();
  process.exit(0);
});

// Start the scheduler
startScheduler().catch(console.error);
