/**
 * Scheduler Initialization
 * Call this to start the scheduler in your application
 */

import scheduler from './scheduler';

let initialized = false;

export function initScheduler() {
  if (initialized) {
    console.warn('[Scheduler] Already initialized');
    return;
  }

  console.log('[Scheduler] Initializing scheduler...');
  
  try {
    // Start the scheduler
    scheduler.start();
    initialized = true;
    console.log('[Scheduler] Scheduler initialized successfully');
  } catch (error) {
    console.error('[Scheduler] Failed to initialize scheduler:', error);
    throw error;
  }
}

export function stopScheduler() {
  if (!initialized) {
    console.warn('[Scheduler] Not initialized');
    return;
  }

  console.log('[Scheduler] Stopping scheduler...');
  scheduler.stop();
  initialized = false;
  console.log('[Scheduler] Scheduler stopped');
}

// Auto-initialize in production (not in development to avoid conflicts with hot reload)
if (process.env.NODE_ENV === 'production' && process.env.SCHEDULER_AUTO_START !== 'false') {
  initScheduler();
}

const schedulerInit = { initScheduler, stopScheduler };

export default schedulerInit;

