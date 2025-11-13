/**
 * Server Initialization
 * Ensures critical services start when the server starts
 */

// Import the portfolio scheduler to ensure it starts
import './portfolio-scheduler';

// Import other critical services
import './startup-scheduler';

console.log('[ServerInit] Server initialization complete - all services started');
