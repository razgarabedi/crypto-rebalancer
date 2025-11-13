#!/usr/bin/env tsx

/**
 * Fix Scheduler Configuration
 * This script fixes the scheduler configuration and starts it properly
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixScheduler() {
  console.log('🔧 Fixing scheduler configuration...');

  try {
    // Check current scheduler status
    const response = await fetch('http://localhost:3010/api/scheduler');
    const status = await response.json();
    
    console.log('Current scheduler status:', JSON.stringify(status, null, 2));

    // Update scheduler configuration to use 5-minute intervals
    const updateResponse = await fetch('http://localhost:3010/api/scheduler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update-config',
        config: {
          enabled: true,
          checkInterval: '*/5 * * * *', // Every 5 minutes
          dryRunMode: false,
        },
      }),
    });

    const updateResult = await updateResponse.json();
    console.log('Configuration update result:', updateResult);

    // Start the scheduler
    const startResponse = await fetch('http://localhost:3010/api/scheduler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'start',
      }),
    });

    const startResult = await startResponse.json();
    console.log('Start scheduler result:', startResult);

    // Check final status
    const finalResponse = await fetch('http://localhost:3010/api/scheduler');
    const finalStatus = await finalResponse.json();
    
    console.log('Final scheduler status:', JSON.stringify(finalStatus, null, 2));

    if (finalStatus.status.isRunning) {
      console.log('✅ Scheduler is now running with 5-minute intervals');
    } else {
      console.log('❌ Scheduler failed to start');
    }

  } catch (error) {
    console.error('Error fixing scheduler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixScheduler().catch(console.error);
