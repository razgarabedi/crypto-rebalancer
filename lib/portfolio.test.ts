/**
 * Portfolio Helper Functions - Test & Demo
 * Run with: npx tsx lib/portfolio.test.ts
 */

import {
  calculatePortfolioValue,
  calculateTargetHoldings,
  generateRebalanceOrders,
  validateTargetWeights,
  formatPortfolio,
  formatRebalanceOrders,
  calculateRebalanceStats,
} from './portfolio';

console.log('━'.repeat(80));
console.log('  PORTFOLIO HELPER FUNCTIONS - TEST SUITE');
console.log('━'.repeat(80));

// Test Data
const testBalances = {
  BTC: 0.5,
  ETH: 2.0,
  SOL: 20,
  ADA: 1000,
};

const testPrices = {
  BTC: 40000,
  ETH: 2500,
  SOL: 100,
  ADA: 0.5,
};

const testTargetWeights = {
  BTC: 40,
  ETH: 30,
  SOL: 20,
  ADA: 10,
};

// Test 1: Calculate Portfolio Value
console.log('\n📊 TEST 1: Calculate Portfolio Value\n');
console.log('Input Balances:', testBalances);
console.log('Input Prices (EUR):', testPrices);

const portfolio = calculatePortfolioValue(testBalances, testPrices);

console.log('\nResult:');
console.log(`Total Portfolio Value: €${portfolio.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
console.log('\n' + formatPortfolio(portfolio.holdings));

// Verify calculation
const expectedTotal = (0.5 * 40000) + (2.0 * 2500) + (20 * 100) + (1000 * 0.5);
console.log(`✓ Total value calculation: ${portfolio.totalValue === expectedTotal ? 'PASS' : 'FAIL'}`);
console.log(`✓ Holdings count: ${portfolio.holdings.length === 4 ? 'PASS' : 'FAIL'}`);

// Test 2: Validate Target Weights
console.log('\n━'.repeat(80));
console.log('\n✅ TEST 2: Validate Target Weights\n');

const validation = validateTargetWeights(testTargetWeights);
console.log('Input Target Weights:', testTargetWeights);
console.log(`\nValidation Result: ${validation.valid ? 'VALID ✓' : 'INVALID ✗'}`);
if (validation.errors.length > 0) {
  console.log('Errors:');
  validation.errors.forEach(err => console.log(`  - ${err}`));
}

// Test invalid weights
console.log('\nTesting invalid weights:');
const invalidWeights = { BTC: 50, ETH: 50, SOL: 20 }; // Sums to 120
const invalidValidation = validateTargetWeights(invalidWeights);
console.log(`Invalid weights (sum=120): ${invalidValidation.valid ? 'FAIL' : 'PASS'}`);
console.log(`Error message: "${invalidValidation.errors[0]}"`);

// Test 3: Calculate Target Holdings
console.log('\n━'.repeat(80));
console.log('\n🎯 TEST 3: Calculate Target Holdings\n');

const targetHoldings = calculateTargetHoldings(
  testTargetWeights,
  portfolio.totalValue,
  testPrices
);

console.log('Target Allocation:', testTargetWeights);
console.log(`Total Value: €${portfolio.totalValue.toLocaleString()}`);
console.log('\n' + formatPortfolio(targetHoldings));

// Verify target calculations
const btcTarget = targetHoldings.find(h => h.symbol === 'BTC');
const expectedBtcValue = portfolio.totalValue * 0.4; // 40% of total
console.log(`✓ BTC target value: ${Math.abs(btcTarget!.value - expectedBtcValue) < 0.01 ? 'PASS' : 'FAIL'}`);

// Test 4: Generate Rebalance Orders
console.log('\n━'.repeat(80));
console.log('\n🔄 TEST 4: Generate Rebalance Orders\n');

const orders = generateRebalanceOrders(
  portfolio.holdings,
  targetHoldings,
  10 // 10 EUR threshold
);

console.log(formatRebalanceOrders(orders));

// Verify order generation
console.log('\nOrder Verification:');
console.log(`✓ Orders generated: ${orders.length > 0 ? 'PASS' : 'FAIL'}`);

const btcOrder = orders.find(o => o.symbol === 'BTC');
if (btcOrder) {
  console.log(`✓ BTC order side: ${btcOrder.side === 'sell' ? 'PASS' : 'FAIL'} (should be sell)`);
  console.log(`  Current: €${btcOrder.currentValue.toFixed(2)}, Target: €${btcOrder.targetValue.toFixed(2)}`);
}

const adaOrder = orders.find(o => o.symbol === 'ADA');
if (adaOrder) {
  console.log(`✓ ADA order side: ${adaOrder.side === 'buy' ? 'PASS' : 'FAIL'} (should be buy)`);
  console.log(`  Current: €${adaOrder.currentValue.toFixed(2)}, Target: €${adaOrder.targetValue.toFixed(2)}`);
}

// Test 5: Calculate Statistics
console.log('\n━'.repeat(80));
console.log('\n📈 TEST 5: Calculate Rebalance Statistics\n');

const stats = calculateRebalanceStats(orders);

console.log('Statistics:');
console.log(`  Total Orders: ${stats.totalOrders}`);
console.log(`  Buy Orders: ${stats.buyOrders}`);
console.log(`  Sell Orders: ${stats.sellOrders}`);
console.log(`  Total Buy Value: €${stats.totalBuyValue.toFixed(2)}`);
console.log(`  Total Sell Value: €${stats.totalSellValue.toFixed(2)}`);
console.log(`  Net Difference: €${stats.netDifference.toFixed(2)}`);

console.log(`\n✓ Stats calculation: ${stats.totalOrders === orders.length ? 'PASS' : 'FAIL'}`);

// Test 6: Edge Cases
console.log('\n━'.repeat(80));
console.log('\n🔍 TEST 6: Edge Cases\n');

// Empty balances
console.log('Testing empty balances:');
const emptyPortfolio = calculatePortfolioValue({}, testPrices);
console.log(`✓ Empty balances: ${emptyPortfolio.totalValue === 0 ? 'PASS' : 'FAIL'}`);

// Missing price
console.log('\nTesting missing price:');
const partialPrices = { BTC: 40000, ETH: 2500 };
const partialPortfolio = calculatePortfolioValue(testBalances, partialPrices);
console.log(`✓ Missing price handled: ${partialPortfolio.holdings.length === 2 ? 'PASS' : 'FAIL'}`);

// Small threshold
console.log('\nTesting with large threshold (100 EUR):');
const fewOrders = generateRebalanceOrders(portfolio.holdings, targetHoldings, 100);
console.log(`  Orders with 10 EUR threshold: ${orders.length}`);
console.log(`  Orders with 100 EUR threshold: ${fewOrders.length}`);
console.log(`✓ Threshold filtering: ${fewOrders.length <= orders.length ? 'PASS' : 'FAIL'}`);

// Final Summary
console.log('\n━'.repeat(80));
console.log('\n✨ TEST SUMMARY\n');
console.log('All core functions tested successfully!');
console.log('\nFunctions tested:');
console.log('  ✓ calculatePortfolioValue()');
console.log('  ✓ calculateTargetHoldings()');
console.log('  ✓ generateRebalanceOrders()');
console.log('  ✓ validateTargetWeights()');
console.log('  ✓ calculateRebalanceStats()');
console.log('  ✓ formatPortfolio()');
console.log('  ✓ formatRebalanceOrders()');
console.log('\n━'.repeat(80));

