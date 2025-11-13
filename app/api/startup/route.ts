/**
 * Startup API Route
 * Automatically called when the server starts to initialize the scheduler
 */

import { NextResponse } from 'next/server';
import '@/lib/server-init'; // Ensure scheduler starts on server startup
import { initializeScheduler, getStartupStatus } from '@/lib/startup-scheduler';

/**
 * GET /api/startup
 * Initialize the scheduler on server startup
 */
export async function GET() {
  try {
    // Initialize the scheduler
    initializeScheduler();
    
    const status = getStartupStatus();
    
    return NextResponse.json({
      success: true,
      message: 'Scheduler startup initialized',
      status,
    });
  } catch (error) {
    console.error('Error initializing scheduler on startup:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize scheduler on startup',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
