#!/usr/bin/env tsx

/**
 * Test Execution Order
 * This script tests that orders are executed in the correct sequence (sell first, then buy)
 */

import { PrismaClient } from '@prisma/client';
import { rebalancePortfolio } from '../lib/rebalance';

const prisma = new PrismaClient();

async function testExecutionOrder() {
  console.log('🧪 Testing Execution Order...');

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

    // Test rebalancing with dry run to see the execution order
    console.log('\n🔄 Running rebalancing with execution order test...');
    
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
    
    if (result.ordersExecuted.length > 0) {
      console.log('\n📋 Execution Order (should be sell orders first, then buy orders):');
      result.ordersExecuted.forEach((order, idx) => {
        console.log(`  ${idx + 1}. ${order.side.toUpperCase()} ${order.volume.toFixed(6)} ${order.symbol} (€${Math.abs(order.difference).toFixed(2)})`);
      });
      
      // Check if execution order is correct
      const sellOrders = result.ordersExecuted.filter(order => order.side === 'sell');
      const buyOrders = result.ordersExecuted.filter(order => order.side === 'buy');
      
      console.log(`\n✅ Execution Order Analysis:`);
      console.log(`  Sell orders: ${sellOrders.length}`);
      console.log(`  Buy orders: ${buyOrders.length}`);
      
      if (sellOrders.length > 0 && buyOrders.length > 0) {
        const firstSellIndex = result.ordersExecuted.findIndex(order => order.side === 'sell');
        const firstBuyIndex = result.ordersExecuted.findIndex(order => order.side === 'buy');
        
        if (firstSellIndex < firstBuyIndex) {
          console.log(`  ✅ Correct order: Sell orders executed before buy orders`);
        } else {
          console.log(`  ❌ Incorrect order: Buy orders executed before sell orders`);
        }
      } else {
        console.log(`  ℹ️  Only one type of orders (${sellOrders.length > 0 ? 'sell' : 'buy'})`);
      }
    }

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach((error, idx) => {
        console.log(`  ${idx + 1}. ${error}`);
      });
    }

    console.log('\n🎉 Execution order test completed!');
    console.log('The system should now execute sell orders before buy orders.');

  } catch (error) {
    console.error('Error testing execution order:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testExecutionOrder().catch(console.error);
