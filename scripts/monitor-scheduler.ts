#!/usr/bin/env tsx

/**
 * Monitor Scheduler
 * This script monitors the scheduler status and logs activity
 */

async function monitorScheduler() {
  console.log('📊 Monitoring scheduler status...');
  console.log('Press Ctrl+C to stop monitoring\n');

  const baseUrl = 'http://localhost:3010';
  let checkCount = 0;

  const checkStatus = async () => {
    try {
      checkCount++;
      const response = await fetch(`${baseUrl}/api/scheduler`);
      const status = await response.json();
      
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Check #${checkCount}:`);
      console.log(`  Running: ${status.status.isRunning}`);
      console.log(`  Interval: ${status.status.config.checkInterval}`);
      console.log(`  Active Tasks: ${status.status.activeTasks}`);
      
      if (status.schedule && status.schedule.length > 0) {
        console.log(`  Upcoming: ${status.schedule.length} portfolio(s) scheduled`);
      }
      
      console.log(''); // Empty line for readability
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error checking status:`, error);
    }
  };

  // Check immediately
  await checkStatus();

  // Check every 30 seconds
  const interval = setInterval(checkStatus, 30000);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping monitor...');
    clearInterval(interval);
    process.exit(0);
  });
}

// Start monitoring
monitorScheduler().catch(console.error);
