/**
 * Rebalancing Orchestrator - Usage Examples
 * Demonstrates how to use the rebalancing functions
 */

import { rebalancePortfolio, getRebalancePreview, needsRebalancing } from './rebalance';

/**
 * Example 1: Basic rebalancing (dry run)
 */
export async function exampleBasicRebalance() {
  console.log('\n=== Example 1: Basic Rebalance (Dry Run) ===\n');

  try {
    // Note: Replace 'user-id-here' with actual user ID in production
    const result = await rebalancePortfolio('1', {
      userId: 'user-id-here',
      portfolioId: '1',
      dryRun: true,
      rebalanceThreshold: 10,
    });

    console.log(`Success: ${result.success}`);
    console.log(`Portfolio Value: €${result.portfolio.totalValue.toFixed(2)}`);
    console.log(`Orders Planned: ${result.ordersPlanned.length}`);
    console.log(`Dry Run: ${result.dryRun}`);

    if (result.ordersPlanned.length > 0) {
      console.log('\nPlanned Orders:');
      result.ordersPlanned.forEach((order, idx) => {
        console.log(
          `  ${idx + 1}. ${order.side.toUpperCase()} ${order.volume.toFixed(6)} ${order.symbol} ` +
          `(Diff: €${order.difference.toFixed(2)})`
        );
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 2: Execute actual rebalance
 */
export async function exampleExecuteRebalance() {
  console.log('\n=== Example 2: Execute Rebalance ===\n');

  try {
    // First, get a preview
    // Note: Replace 'user-id-here' with actual user ID in production
    console.log('Getting preview...');
    const preview = await getRebalancePreview('1', 'user-id-here');

    if (preview.ordersPlanned.length === 0) {
      console.log('Portfolio is already balanced!');
      return;
    }

    console.log(`\nPreview: ${preview.ordersPlanned.length} orders planned`);
    console.log('Orders:');
    preview.ordersPlanned.forEach((order, idx) => {
      console.log(
        `  ${idx + 1}. ${order.side.toUpperCase()} ${order.volume.toFixed(6)} ${order.symbol}`
      );
    });

    // Ask for user confirmation (in real app)
    // const confirmed = await askUserConfirmation();
    const confirmed = false; // Safety: don't actually execute in example

    if (!confirmed) {
      console.log('\nRebalance cancelled by user');
      return;
    }

    // Execute the rebalance
    console.log('\nExecuting rebalance...');
    const result = await rebalancePortfolio('1', {
      userId: 'user-id-here',
      portfolioId: '1',
      dryRun: false,
      rebalanceThreshold: 10,
    });

    console.log(`\nRebalance ${result.success ? 'SUCCESSFUL' : 'FAILED'}`);
    console.log(`Executed: ${result.summary.successfulOrders} orders`);
    console.log(`Failed: ${result.summary.failedOrders} orders`);
    console.log(`Total Traded: €${result.summary.totalValueTraded.toFixed(2)}`);

    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach(err => console.log(`  - ${err}`));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 3: Custom target weights
 */
export async function exampleCustomTargets() {
  console.log('\n=== Example 3: Custom Target Weights ===\n');

  try {
    const customWeights = {
      BTC: 50,  // 50% in Bitcoin
      ETH: 30,  // 30% in Ethereum
      SOL: 15,  // 15% in Solana
      ADA: 5,   // 5% in Cardano
    };

    console.log('Custom allocation:', customWeights);

    // Note: Replace 'user-id-here' with actual user ID in production
    const result = await rebalancePortfolio('custom-portfolio', {
      userId: 'user-id-here',
      portfolioId: 'custom-portfolio',
      targetWeights: customWeights,
      rebalanceThreshold: 20, // Higher threshold
      dryRun: true,
    });

    console.log(`\nPortfolio Value: €${result.portfolio.totalValue.toFixed(2)}`);
    console.log(`Orders Required: ${result.ordersPlanned.length}`);

    if (result.ordersPlanned.length > 0) {
      console.log('\nRebalancing needed:');
      result.ordersPlanned.forEach(order => {
        const percentage = (order.difference / result.portfolio.totalValue) * 100;
        console.log(
          `  ${order.symbol}: ${order.side.toUpperCase()} ` +
          `€${Math.abs(order.difference).toFixed(2)} (${percentage.toFixed(2)}%)`
        );
      });
    } else {
      console.log('Portfolio is within target allocation!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 4: Check if rebalancing is needed
 */
export async function exampleCheckRebalanceNeeded() {
  console.log('\n=== Example 4: Check if Rebalancing Needed ===\n');

  try {
    const threshold = 50; // Only rebalance if difference > €50
    // Note: Replace 'user-id-here' with actual user ID in production
    const check = await needsRebalancing('1', 'user-id-here', threshold);

    console.log(`Threshold: €${threshold}`);
    console.log(`Portfolio Value: €${check.portfolio.totalValue.toFixed(2)}`);
    console.log(`Rebalancing Needed: ${check.needed ? 'YES' : 'NO'}`);

    if (check.needed) {
      console.log(`\nOrders Required: ${check.orders.length}`);
      console.log('Details:');
      check.orders.forEach(order => {
        console.log(
          `  ${order.symbol}: ${order.side.toUpperCase()} ` +
          `${order.volume.toFixed(6)} (€${Math.abs(order.difference).toFixed(2)} difference)`
        );
      });
    } else {
      console.log('\nNo rebalancing needed at this threshold.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 5: Limited order execution
 */
export async function exampleLimitedOrders() {
  console.log('\n=== Example 5: Limited Order Execution ===\n');

  try {
    // Only execute top 2 orders (highest differences)
    // Note: Replace 'user-id-here' with actual user ID in production
    const result = await rebalancePortfolio('1', {
      userId: 'user-id-here',
      portfolioId: '1',
      dryRun: true,
      maxOrdersPerRebalance: 2,
      rebalanceThreshold: 10,
    });

    console.log(`Total Orders Planned: ${result.ordersPlanned.length}`);
    console.log(`Orders to Execute: ${Math.min(2, result.ordersPlanned.length)}`);
    console.log(`Orders Skipped: ${result.summary.skippedOrders}`);

    if (result.ordersExecuted.length > 0) {
      console.log('\nOrders that would be executed:');
      result.ordersExecuted.forEach((order, idx) => {
        console.log(
          `  ${idx + 1}. ${order.side.toUpperCase()} ${order.volume.toFixed(6)} ${order.symbol} ` +
          `(Priority: highest difference)`
        );
      });
    }

    if (result.summary.skippedOrders > 0) {
      console.log(`\n${result.summary.skippedOrders} orders skipped (lower priority)`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example 6: Error handling
 */
export async function exampleErrorHandling() {
  console.log('\n=== Example 6: Error Handling ===\n');

  try {
    // Try with invalid target weights
    // Note: Replace 'user-id-here' with actual user ID in production
    const result = await rebalancePortfolio('1', {
      userId: 'user-id-here',
      portfolioId: '1',
      targetWeights: {
        BTC: 50,
        ETH: 50,
        SOL: 20, // Sum = 120%, invalid!
      },
      dryRun: true,
    });

    console.log(`Success: ${result.success}`);
    
    if (result.errors.length > 0) {
      console.log('\nErrors encountered:');
      result.errors.forEach(err => console.log(`  - ${err}`));
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

/**
 * Example 7: Complete workflow with logging
 */
export async function exampleCompleteWorkflow() {
  console.log('\n=== Example 7: Complete Rebalancing Workflow ===\n');

  try {
    const portfolioId = '1';

    // Step 1: Check if rebalancing is needed
    // Note: Replace 'user-id-here' with actual user ID in production
    const userId = 'user-id-here';
    console.log('Step 1: Checking if rebalancing is needed...');
    const check = await needsRebalancing(portfolioId, userId, 10);
    
    if (!check.needed) {
      console.log('✓ Portfolio is balanced. No action needed.');
      return;
    }

    console.log(`✓ Rebalancing needed. ${check.orders.length} orders required.`);

    // Step 2: Get detailed preview
    console.log('\nStep 2: Getting detailed preview...');
    const preview = await getRebalancePreview(portfolioId, userId);

    console.log(`✓ Preview generated`);
    console.log(`  Portfolio Value: €${preview.portfolio.totalValue.toFixed(2)}`);
    console.log(`  Orders: ${preview.ordersPlanned.length}`);
    console.log(`  Total Value to Trade: €${
      preview.ordersPlanned.reduce((sum, o) => sum + Math.abs(o.difference), 0).toFixed(2)
    }`);

    // Step 3: Display orders for user review
    console.log('\nStep 3: Review planned orders:');
    preview.ordersPlanned.forEach((order, idx) => {
      console.log(
        `  ${idx + 1}. ${order.side.toUpperCase().padEnd(4)} ` +
        `${order.volume.toFixed(8).padEnd(12)} ${order.symbol.padEnd(6)} ` +
        `€${Math.abs(order.difference).toFixed(2)}`
      );
    });

    // Step 4: Execute (simulated)
    console.log('\nStep 4: Executing rebalance (DRY RUN)...');
    const result = await rebalancePortfolio(portfolioId, {
      userId,
      portfolioId,
      dryRun: true, // Change to false for real execution
    });

    if (result.success) {
      console.log('\n✓ Rebalance completed successfully!');
      console.log(`  Orders Executed: ${result.summary.successfulOrders}`);
      console.log(`  Value Traded: €${result.summary.totalValueTraded.toFixed(2)}`);
    } else {
      console.log('\n✗ Rebalance failed');
      console.log(`  Errors: ${result.errors.length}`);
    }

    // Step 5: Summary
    console.log('\nStep 5: Summary');
    console.log(`  Start Time: ${result.timestamp.toISOString()}`);
    console.log(`  Portfolio ID: ${result.portfolioId}`);
    console.log(`  Orders Planned: ${result.summary.totalOrders}`);
    console.log(`  Orders Successful: ${result.summary.successfulOrders}`);
    console.log(`  Orders Failed: ${result.summary.failedOrders}`);
    console.log(`  Orders Skipped: ${result.summary.skippedOrders}`);

  } catch (error) {
    console.error('Workflow error:', error);
  }
}

// Run all examples (commented out by default)
if (require.main === module) {
  (async () => {
    console.log('='.repeat(80));
    console.log('  REBALANCING ORCHESTRATOR - USAGE EXAMPLES');
    console.log('='.repeat(80));

    // await exampleBasicRebalance();
    // await exampleExecuteRebalance();
    // await exampleCustomTargets();
    // await exampleCheckRebalanceNeeded();
    // await exampleLimitedOrders();
    // await exampleErrorHandling();
    // await exampleCompleteWorkflow();

    console.log('\n' + '='.repeat(80));
    console.log('Examples completed. Uncomment to run specific examples.');
  })();
}

export {
  rebalancePortfolio,
  getRebalancePreview,
  needsRebalancing,
};

