/**
 * Application Startup
 * This module ensures critical services start when the application starts
 */

// Import the portfolio scheduler to ensure it starts
import portfolioScheduler from './portfolio-scheduler';

console.log('[Startup] Application startup - initializing services...');

// Force scheduler startup
const status = portfolioScheduler.getStatus();
console.log(`[Startup] Scheduler status: ${status.isRunning ? 'Running' : 'Stopped'}`);

// Export the scheduler for use in other modules
export { portfolioScheduler };
export default portfolioScheduler;
