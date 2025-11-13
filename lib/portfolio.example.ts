/**
 * Example usage of portfolio helper functions
 * Demonstrates how to calculate portfolio values and generate rebalance orders
 */

import {
  calculatePortfolioValue,
  calculateTargetHoldings,
  generateRebalanceOrders,
  formatPortfolio,
  formatRebalanceOrders,
  validateTargetWeights,
  calculateRebalanceStats,
} from './portfolio';

/**
 * Example 1: Calculate portfolio value from balances and prices
 */
export function exampleCalculatePortfolioValue() {
  console.log('\n=== Example 1: Calculate Portfolio Value ===\n');

  // Current balances (amount of each asset held)
  const balances = {
    BTC: 0.5,
    ETH: 2.0,
    SOL: 20,
    ADA: 1000,
  };

  // Current prices in EUR
  const prices = {
    BTC: 40000,
    ETH: 2500,
    SOL: 100,
    ADA: 0.5,
  };

  const portfolio = calculatePortfolioValue(balances, prices);

  console.log(`Total Portfolio Value: €${portfolio.totalValue.toFixed(2)}`);
  console.log(formatPortfolio(portfolio.holdings));

  return portfolio;
}

/**
 * Example 2: Calculate target holdings based on desired allocation
 */
export function exampleCalculateTargetHoldings() {
  console.log('\n=== Example 2: Calculate Target Holdings ===\n');

  // Target allocation (percentages must sum to 100)
  const targetWeights = {
    BTC: 40,  // 40% in BTC
    ETH: 30,  // 30% in ETH
    SOL: 20,  // 20% in SOL
    ADA: 10,  // 10% in ADA
  };

  // Validate weights first
  const validation = validateTargetWeights(targetWeights);
  if (!validation.valid) {
    console.error('Invalid target weights:');
    validation.errors.forEach(err => console.error(`  - ${err}`));
    return;
  }

  const totalValue = 27500; // Total portfolio value in EUR

  const prices = {
    BTC: 40000,
    ETH: 2500,
    SOL: 100,
    ADA: 0.5,
  };

  const targetHoldings = calculateTargetHoldings(targetWeights, totalValue, prices);

  console.log('Target Holdings:');
  console.log(formatPortfolio(targetHoldings));

  return targetHoldings;
}

/**
 * Example 3: Generate rebalance orders
 */
export function exampleGenerateRebalanceOrders() {
  console.log('\n=== Example 3: Generate Rebalance Orders ===\n');

  // Current holdings
  const currentHoldings = [
    { symbol: 'BTC', amount: 0.5, value: 20000, percentage: 50 },
    { symbol: 'ETH', amount: 2.0, value: 5000, percentage: 25 },
    { symbol: 'SOL', amount: 20, value: 2000, percentage: 10 },
    { symbol: 'ADA', amount: 1000, value: 500, percentage: 2.5 },
  ];

  // Target holdings (what we want to have)
  const targetHoldings = [
    { symbol: 'BTC', amount: 0.275, value: 11000, percentage: 40 },
    { symbol: 'ETH', amount: 3.3, value: 8250, percentage: 30 },
    { symbol: 'SOL', amount: 55, value: 5500, percentage: 20 },
    { symbol: 'ADA', amount: 5500, value: 2750, percentage: 10 },
  ];

  // Generate orders with 10 EUR threshold
  const orders = generateRebalanceOrders(currentHoldings, targetHoldings, 10);

  console.log(formatRebalanceOrders(orders));

  return orders;
}

/**
 * Example 4: Complete rebalancing workflow
 */
export async function exampleCompleteRebalancingWorkflow() {
  console.log('\n=== Example 4: Complete Rebalancing Workflow ===\n');

  // Step 1: Get current balances (would come from Kraken API)
  const balances = {
    BTC: 0.5,
    ETH: 2.0,
    SOL: 20,
    ADA: 1000,
  };

  // Step 2: Get current prices in EUR (would come from Kraken API)
  const prices = {
    BTC: 40000,
    ETH: 2500,
    SOL: 100,
    ADA: 0.5,
  };

  // Step 3: Calculate current portfolio value
  const portfolio = calculatePortfolioValue(balances, prices);
  console.log(`Current Portfolio Value: €${portfolio.totalValue.toFixed(2)}`);
  console.log('\nCurrent Holdings:');
  console.log(formatPortfolio(portfolio.holdings));

  // Step 4: Define target allocation
  const targetWeights = {
    BTC: 40,
    ETH: 30,
    SOL: 20,
    ADA: 10,
  };

  // Validate target weights
  const validation = validateTargetWeights(targetWeights);
  if (!validation.valid) {
    console.error('Invalid target weights:', validation.errors);
    return;
  }

  // Step 5: Calculate target holdings
  const targetHoldings = calculateTargetHoldings(
    targetWeights,
    portfolio.totalValue,
    prices
  );

  console.log('\nTarget Holdings:');
  console.log(formatPortfolio(targetHoldings));

  // Step 6: Generate rebalance orders
  const orders = generateRebalanceOrders(
    portfolio.holdings,
    targetHoldings,
    10 // 10 EUR threshold
  );

  console.log('\n' + formatRebalanceOrders(orders));

  // Step 7: Calculate statistics
  const stats = calculateRebalanceStats(orders);
  console.log('\nRebalance Summary:');
  console.log(`  - Total orders: ${stats.totalOrders}`);
  console.log(`  - Buy orders: ${stats.buyOrders} (€${stats.totalBuyValue.toFixed(2)})`);
  console.log(`  - Sell orders: ${stats.sellOrders} (€${stats.totalSellValue.toFixed(2)})`);
  console.log(`  - Net difference: €${stats.netDifference.toFixed(2)}`);

  return { portfolio, targetHoldings, orders, stats };
}

/**
 * Example 5: Using with Kraken API
 */
export async function exampleWithKrakenAPI() {
  console.log('\n=== Example 5: Using with Kraken API ===\n');

  // This would be a real integration with the Kraken API
  // For demonstration, we'll show the structure

  try {
    // Import Kraken client
    // import krakenClient from './kraken';

    // 1. Get account balance
    // const krakenBalance = await krakenClient.getAccountBalance();
    const krakenBalance = {
      XXBT: '0.5',
      XETH: '2.0',
      SOL: '20',
      ADA: '1000',
    };

    // 2. Convert to our format
    const balances: Record<string, number> = {};
    for (const [asset, amount] of Object.entries(krakenBalance)) {
      // Strip the X prefix that Kraken uses
      const symbol = asset.replace(/^X+/, '');
      balances[symbol] = parseFloat(amount);
    }

    // 3. Get prices (need to query EUR pairs)
    // const tickers = await krakenClient.getTickerPrices([
    //   'XXBTZEUR', 'XETHZEUR', 'SOLEUR', 'ADAEUR'
    // ]);
    const tickers = [
      { symbol: 'XXBTZEUR', price: 40000 },
      { symbol: 'XETHZEUR', price: 2500 },
      { symbol: 'SOLEUR', price: 100 },
      { symbol: 'ADAEUR', price: 0.5 },
    ];

    // 4. Convert to price map
    const prices: Record<string, number> = {};
    for (const ticker of tickers) {
      const symbol = ticker.symbol.replace(/EUR$/, '').replace(/^X+/, '');
      prices[symbol] = ticker.price;
    }

    // 5. Calculate portfolio and generate orders
    const portfolio = calculatePortfolioValue(balances, prices);
    const targetWeights = { BTC: 40, ETH: 30, SOL: 20, ADA: 10 };
    const targetHoldings = calculateTargetHoldings(
      targetWeights,
      portfolio.totalValue,
      prices
    );
    const orders = generateRebalanceOrders(portfolio.holdings, targetHoldings, 10);

    // 6. Place orders (if user confirms)
    // for (const order of orders) {
    //   const pair = `${order.symbol}EUR`;
    //   await krakenClient.placeOrder(pair, order.side, order.volume);
    // }

    console.log('Portfolio calculated successfully');
    console.log(formatRebalanceOrders(orders));

  } catch (error) {
    console.error('Error in Kraken integration:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  exampleCalculatePortfolioValue();
  exampleCalculateTargetHoldings();
  exampleGenerateRebalanceOrders();
  exampleCompleteRebalancingWorkflow();
  exampleWithKrakenAPI();
}

