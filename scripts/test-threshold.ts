/**
 * Test script to manually check and trigger threshold rebalancing
 * Usage: npx tsx scripts/test-threshold.ts <portfolio-id>
 */

import prisma from '../lib/prisma';
import { getUserKrakenClient } from '../lib/kraken-user';
import { normalizeAssetSymbol, getTradingPair } from '../lib/rebalance';
import { calculatePortfolioValue } from '../lib/portfolio';

async function testThresholdRebalancing(portfolioId: string) {
  console.log(`\n🔍 Testing threshold rebalancing for portfolio: ${portfolioId}\n`);

  try {
    // Fetch portfolio
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      select: {
        id: true,
        name: true,
        userId: true,
        targetWeights: true,
        thresholdRebalanceEnabled: true,
        thresholdRebalancePercentage: true,
        rebalanceThreshold: true,
      },
    });

    if (!portfolio) {
      console.error('❌ Portfolio not found');
      return;
    }

    console.log(`📊 Portfolio: ${portfolio.name}`);
    console.log(`   ID: ${portfolio.id}`);
    console.log(`   Threshold Enabled: ${portfolio.thresholdRebalanceEnabled}`);
    console.log(`   Threshold Percentage: ${portfolio.thresholdRebalancePercentage}%`);
    console.log(`   Min Trade Size: €${portfolio.rebalanceThreshold}\n`);

    if (!portfolio.thresholdRebalanceEnabled) {
      console.log('⚠️  Threshold rebalancing is NOT enabled for this portfolio');
      console.log('   Enable it in the portfolio edit page first\n');
      return;
    }

    if (!portfolio.userId) {
      console.error('❌ Portfolio has no userId');
      return;
    }

    const targetWeights = portfolio.targetWeights as Record<string, number>;
    const thresholdPercentage = portfolio.thresholdRebalancePercentage || 5;

    console.log('🎯 Target Allocation:');
    Object.entries(targetWeights).forEach(([symbol, pct]) => {
      console.log(`   ${symbol}: ${pct}%`);
    });
    console.log('');

    // Get current holdings
    const krakenClient = await getUserKrakenClient(portfolio.userId);
    const krakenBalance = await krakenClient.getAccountBalance();
    const balances: Record<string, number> = {};
    
    for (const [asset, amount] of Object.entries(krakenBalance)) {
      const symbol = normalizeAssetSymbol(asset);
      const balance = parseFloat(amount);
      if (balance > 0) {
        balances[symbol] = balance;
      }
    }

    // Get current prices
    const symbols = Object.keys(targetWeights);
    const pricePairs = symbols.map(symbol => getTradingPair(symbol, 'EUR'));
    const tickers = await krakenClient.getTickerPrices(pricePairs);
    const prices: Record<string, number> = {};
    
    for (const ticker of tickers) {
      const symbol = normalizeAssetSymbol(ticker.symbol.replace(/EUR$/, '').replace(/Z$/, ''));
      prices[symbol] = ticker.price;
    }

    // Calculate current portfolio
    const currentPortfolio = calculatePortfolioValue(balances, prices);

    console.log(`💰 Total Portfolio Value: €${currentPortfolio.totalValue.toFixed(2)}\n`);

    console.log('📈 Current Allocation vs Target:\n');
    console.log('Asset  | Current | Target | Deviation | Status');
    console.log('-------|---------|--------|-----------|--------');

    let needsRebalancing = false;
    const deviations: { symbol: string; currentPct: number; targetPct: number; deviation: number }[] = [];

    // Check all target assets
    for (const [symbol, targetPct] of Object.entries(targetWeights)) {
      const holding = currentPortfolio.holdings.find(h => h.symbol === symbol);
      const currentPct = holding ? holding.percentage : 0;
      const deviation = Math.abs(currentPct - targetPct);
      
      deviations.push({ symbol, currentPct, targetPct, deviation });

      const status = deviation >= thresholdPercentage ? '❌ EXCEEDS' : '✅ OK';
      const currentStr = currentPct.toFixed(2).padStart(6);
      const targetStr = targetPct.toFixed(2).padStart(6);
      const deviationStr = deviation.toFixed(2).padStart(8);
      
      console.log(`${symbol.padEnd(6)} | ${currentStr}% | ${targetStr}% | ${deviationStr}% | ${status}`);

      if (deviation >= thresholdPercentage) {
        needsRebalancing = true;
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');

    if (needsRebalancing) {
      console.log('🚨 THRESHOLD EXCEEDED - REBALANCING NEEDED');
      console.log(`   Threshold: ${thresholdPercentage}%`);
      console.log(`   Max Deviation: ${Math.max(...deviations.map(d => d.deviation)).toFixed(2)}%`);
      console.log('\n   Assets exceeding threshold:');
      deviations.filter(d => d.deviation >= thresholdPercentage).forEach(d => {
        const diff = d.currentPct - d.targetPct;
        const sign = diff > 0 ? '+' : '';
        console.log(`   - ${d.symbol}: ${sign}${diff.toFixed(2)}% (${d.deviation.toFixed(2)}% deviation)`);
      });
      console.log('\n✅ This portfolio SHOULD trigger automatic rebalancing\n');
    } else {
      console.log('✅ All assets within threshold');
      console.log(`   Threshold: ${thresholdPercentage}%`);
      console.log(`   Max Deviation: ${Math.max(...deviations.map(d => d.deviation)).toFixed(2)}%`);
      console.log('\n   No rebalancing needed at this time\n');
    }

    // Check scheduler status
    console.log('🔧 Scheduler Information:');
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log('   ⚠️  Scheduler auto-start is DISABLED in development mode');
      console.log('   To enable automatic rebalancing:');
      console.log('   1. Start the scheduler manually:');
      console.log('      curl -X POST http://localhost:3000/api/scheduler -H "Content-Type: application/json" -d \'{"action":"start"}\'');
      console.log('   2. Or set NODE_ENV=production');
      console.log('   3. Or manually trigger: curl -X POST http://localhost:3000/api/portfolios/' + portfolioId + '/rebalance-if-needed');
    } else {
      console.log('   ✅ Scheduler should be running automatically');
      console.log('   Checks run every hour');
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get portfolio ID from command line
const portfolioId = process.argv[2];

if (!portfolioId) {
  console.error('\n❌ Usage: npx tsx scripts/test-threshold.ts <portfolio-id>\n');
  console.log('Example: npx tsx scripts/test-threshold.ts cm2abc123xyz\n');
  process.exit(1);
}

testThresholdRebalancing(portfolioId);

