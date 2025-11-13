#!/usr/bin/env tsx

/**
 * Test Smart Fund Allocation
 * This script tests the new smart fund allocation system
 */

import { PrismaClient } from '@prisma/client';
import { rebalancePortfolio } from '../lib/rebalance';

const prisma = new PrismaClient();

async function testSmartAllocation() {
  console.log('🧪 Testing Smart Fund Allocation...');

  try {
    // Get a portfolio with threshold rebalancing enabled
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        thresholdRebalanceEnabled: true,
        schedulerEnabled: true,
      },
      select: {
        id: true,
        name: true,
        userId: true,
        targetWeights: true,
        thresholdRebalancePercentage: true,
        rebalanceThreshold: true,
        maxOrdersPerRebalance: true,
        orderType: true,
        smartRoutingEnabled: true,
      },
    });

    if (!portfolio) {
      console.log('❌ No portfolio found with threshold rebalancing enabled');
      return;
    }

    if (!portfolio.userId) {
      console.log('❌ Portfolio has no userId');
      return;
    }

    console.log(`\n📊 Testing with portfolio: ${portfolio.name}`);
    console.log(`Threshold: ${portfolio.thresholdRebalancePercentage}%`);

    // Test rebalancing with dry run to see the smart allocation in action
    console.log('\n🔄 Running rebalancing with smart fund allocation...');
    
    const result = await rebalancePortfolio(portfolio.id, {
      userId: portfolio.userId,
      portfolioId: portfolio.id,
      targetWeights: portfolio.targetWeights as Record<string, number>,
      rebalanceThreshold: portfolio.rebalanceThreshold,
      maxOrdersPerRebalance: portfolio.maxOrdersPerRebalance ?? undefined,
      orderType: (portfolio.orderType as 'market' | 'limit') || 'market',
      smartRoutingEnabled: portfolio.smartRoutingEnabled !== false,
      dryRun: true, // Use dry run for testing
    });

    console.log('\n📈 Rebalancing Results:');
    console.log(`  Success: ${result.success}`);
    console.log(`  Portfolio Value: €${result.portfolio.totalValue.toFixed(2)}`);
    console.log(`  Orders Planned: ${result.ordersPlanned.length}`);
    console.log(`  Orders Executed: ${result.ordersExecuted.length}`);
    
    if (result.ordersPlanned.length > 0) {
      console.log('\n📋 Original Orders:');
      result.ordersPlanned.forEach((order, idx) => {
        console.log(`  ${idx + 1}. ${order.side.toUpperCase()} ${order.volume.toFixed(6)} ${order.symbol} (€${Math.abs(order.difference).toFixed(2)})`);
      });
    }

    if (result.ordersExecuted.length > 0) {
      console.log('\n✅ Executed Orders (after smart allocation):');
      result.ordersExecuted.forEach((order, idx) => {
        console.log(`  ${idx + 1}. ${order.side.toUpperCase()} ${order.volume.toFixed(6)} ${order.symbol} (€${Math.abs(order.difference).toFixed(2)})`);
      });
    }

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach((error, idx) => {
        console.log(`  ${idx + 1}. ${error}`);
      });
    }

    console.log('\n🎉 Smart fund allocation test completed!');
    console.log('The system should now adjust buy orders to match available funds.');

  } catch (error) {
    console.error('Error testing smart allocation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSmartAllocation().catch(console.error);
