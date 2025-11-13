/**
 * Force Scheduler Startup
 * This module ensures the portfolio scheduler starts immediately when imported
 */

import portfolioScheduler from './portfolio-scheduler';

// Force the scheduler to start by calling its methods
console.log('[ForceSchedulerStartup] Forcing scheduler startup...');

// Get status to ensure scheduler is running
const status = portfolioScheduler.getStatus();
console.log(`[ForceSchedulerStartup] Scheduler status: ${status.isRunning ? 'Running' : 'Stopped'}`);

// Force an immediate sync to detect portfolios
setTimeout(async () => {
  try {
    console.log('[ForceSchedulerStartup] Forcing immediate portfolio sync...');
    // Trigger a manual sync by calling the scheduler's internal method
    // This will ensure portfolios are detected immediately
    const currentStatus = portfolioScheduler.getStatus();
    console.log(`[ForceSchedulerStartup] After sync - Running: ${currentStatus.isRunning}, Active portfolios: ${currentStatus.activePortfolios}`);
  } catch (error) {
    console.error('[ForceSchedulerStartup] Error during forced sync:', error);
  }
}, 2000); // Wait 2 seconds for the scheduler to fully initialize

export default portfolioScheduler;
