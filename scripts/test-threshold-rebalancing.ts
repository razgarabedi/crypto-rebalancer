#!/usr/bin/env tsx

/**
 * Test Threshold-Based Rebalancing
 * This script tests the threshold-based rebalancing logic with the provided deviation values
 */

import { PrismaClient } from '@prisma/client';
import { rebalancePortfolio } from '../lib/rebalance';

const prisma = new PrismaClient();

async function testThresholdRebalancing() {
  console.log('🧪 Testing threshold-based rebalancing...');

  try {
    // Get all portfolios with threshold rebalancing enabled
    const portfolios = await prisma.portfolio.findMany({
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

    console.log(`Found ${portfolios.length} portfolios with threshold rebalancing enabled`);

    for (const portfolio of portfolios) {
      console.log(`\n📊 Testing portfolio: ${portfolio.name} (${portfolio.id})`);
      console.log(`Threshold percentage: ${portfolio.thresholdRebalancePercentage}%`);

      if (!portfolio.userId) {
        console.log('❌ Portfolio has no userId - skipping');
        continue;
      }

      try {
        // Test the rebalancing logic
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

        console.log(`✅ Rebalancing test completed for ${portfolio.name}`);
        console.log(`   Success: ${result.success}`);
        console.log(`   Orders planned: ${result.ordersPlanned.length}`);
        console.log(`   Portfolio value: €${result.portfolio.totalValue.toFixed(2)}`);
        
        if (result.ordersPlanned.length > 0) {
          console.log('   Orders that would be executed:');
          result.ordersPlanned.forEach((order, idx) => {
            console.log(`     ${idx + 1}. ${order.side.toUpperCase()} ${order.volume.toFixed(6)} ${order.symbol} (€${order.difference.toFixed(2)})`);
          });
        } else {
          console.log('   No orders needed - portfolio is balanced');
        }

        // Check if any asset exceeds the threshold
        const thresholdPercentage = portfolio.thresholdRebalancePercentage || 5;
        let needsRebalancing = false;
        
        console.log(`\n🔍 Checking deviations against ${thresholdPercentage}% threshold:`);
        
        for (const holding of result.portfolio.holdings) {
          const targetWeight = (portfolio.targetWeights as Record<string, number>)[holding.symbol] || 0;
          const deviation = Math.abs(holding.percentage - targetWeight);
          
          console.log(`   ${holding.symbol}: Current ${holding.percentage.toFixed(2)}% vs Target ${targetWeight}% (Deviation: ${deviation.toFixed(2)}%)`);
          
          if (deviation >= thresholdPercentage) {
            needsRebalancing = true;
            console.log(`   ⚠️  ${holding.symbol} EXCEEDS THRESHOLD!`);
          }
        }

        if (needsRebalancing) {
          console.log(`✅ Portfolio ${portfolio.name} SHOULD trigger rebalancing`);
        } else {
          console.log(`ℹ️  Portfolio ${portfolio.name} is within threshold`);
        }

      } catch (error) {
        console.error(`❌ Error testing portfolio ${portfolio.name}:`, error);
      }
    }

  } catch (error) {
    console.error('Error in threshold rebalancing test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testThresholdRebalancing().catch(console.error);
