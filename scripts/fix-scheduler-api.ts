#!/usr/bin/env tsx

/**
 * Fix Scheduler via API
 * This script directly calls the API to fix the scheduler configuration
 */

async function fixSchedulerAPI() {
  console.log('🔧 Fixing scheduler via API...');

  try {
    const baseUrl = 'http://localhost:3010';

    // 1. Check current status
    console.log('\n1. Checking current status...');
    const statusResponse = await fetch(`${baseUrl}/api/scheduler`);
    const status = await statusResponse.json();
    console.log('Current status:', JSON.stringify(status, null, 2));

    // 2. Update configuration
    console.log('\n2. Updating configuration to 5-minute intervals...');
    const updateResponse = await fetch(`${baseUrl}/api/scheduler`, {
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
    console.log('Update result:', updateResult);

    // 3. Start the scheduler
    console.log('\n3. Starting scheduler...');
    const startResponse = await fetch(`${baseUrl}/api/scheduler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'start',
      }),
    });

    const startResult = await startResponse.json();
    console.log('Start result:', startResult);

    // 4. Check final status
    console.log('\n4. Checking final status...');
    const finalResponse = await fetch(`${baseUrl}/api/scheduler`);
    const finalStatus = await finalResponse.json();
    console.log('Final status:', JSON.stringify(finalStatus, null, 2));

    if (finalStatus.status.isRunning) {
      console.log('\n✅ Scheduler is now running with 5-minute intervals!');
    } else {
      console.log('\n❌ Scheduler failed to start');
    }

  } catch (error) {
    console.error('Error fixing scheduler:', error);
  }
}

// Run the fix
fixSchedulerAPI().catch(console.error);
