#!/usr/bin/env tsx

/**
 * Simple Scheduler Test
 * Test if the portfolio scheduler can be imported and started
 */

console.log('🧪 Testing Portfolio Scheduler Import...');

try {
  // Import the portfolio scheduler
  const portfolioScheduler = require('../lib/portfolio-scheduler');
  
  console.log('✅ Portfolio scheduler imported successfully');
  
  // Get status
  const status = portfolioScheduler.getStatus();
  console.log('📊 Status:', status);
  
  if (status.isRunning) {
    console.log('🎉 SUCCESS: Portfolio scheduler is running automatically!');
  } else {
    console.log('⚠️  Portfolio scheduler is not running');
  }
  
} catch (error) {
  console.error('❌ Error importing portfolio scheduler:', error);
}
