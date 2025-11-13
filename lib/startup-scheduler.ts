/**
 * Startup Scheduler
 * Automatically starts the portfolio scheduler when the server starts
 */

import portfolioScheduler from './portfolio-scheduler';

// Global flag to ensure scheduler only starts once
let schedulerStarted = false;

/**
 * Initialize the portfolio scheduler on server startup
 */
export function initializeScheduler() {
  if (schedulerStarted) {
    console.log('[StartupScheduler] Scheduler already initialized');
    return;
  }

  try {
    console.log('[StartupScheduler] Initializing portfolio scheduler...');
    
    // The portfolio scheduler starts automatically in its constructor
    // We just need to ensure it's imported and instantiated
    const status = portfolioScheduler.getStatus();
    
    console.log('[StartupScheduler] Portfolio scheduler initialized successfully');
    console.log(`[StartupScheduler] Status: ${status.isRunning ? 'Running' : 'Stopped'}`);
    
    schedulerStarted = true;
  } catch (error) {
    console.error('[StartupScheduler] Failed to initialize scheduler:', error);
  }
}

/**
 * Get the startup status
 */
export function getStartupStatus() {
  return {
    schedulerStarted,
    status: portfolioScheduler.getStatus(),
  };
}
