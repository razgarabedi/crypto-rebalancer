/**
 * Portfolio calculation and rebalancing helper functions
 * Handles portfolio value calculations, target allocation, and order generation
 */

export interface AssetBalance {
  symbol: string;
  amount: number;
}

export interface AssetPrice {
  symbol: string;
  price: number; // Price in EUR
}

export interface AssetHolding {
  symbol: string;
  amount: number;
  value: number; // Value in EUR
  percentage: number; // Percentage of total portfolio (0-100)
}

export interface TargetWeight {
  symbol: string;
  weight: number; // Target percentage (0-100)
}

export interface RebalanceOrder {
  symbol: string;
  side: 'buy' | 'sell';
  volume: number; // Amount of asset to buy/sell
  currentValue: number; // Current value in EUR
  targetValue: number; // Target value in EUR
  difference: number; // Difference in EUR (positive = need to buy, negative = need to sell)
  currentAmount: number; // Current amount of asset
  targetAmount: number; // Target amount of asset
}

export interface PortfolioValue {
  totalValue: number; // Total portfolio value in EUR
  holdings: AssetHolding[];
  currency: 'EUR';
}

/**
 * Calculate the total portfolio value in EUR
 * @param balances - Map of asset symbols to amounts
 * @param prices - Map of asset symbols to prices in EUR
 * @returns Portfolio value information including total value and individual holdings
 */
export function calculatePortfolioValue(
  balances: Record<string, number>,
  prices: Record<string, number>
): PortfolioValue {
  const holdings: AssetHolding[] = [];
  let totalValue = 0;

  // Calculate value for each asset (only for assets with known prices)
  for (const [symbol, amount] of Object.entries(balances)) {
    const price = prices[symbol];
    
    if (price === undefined) {
      // Only warn about missing prices for non-zero balances
      // (assets not in target portfolio will naturally have no price)
      if (amount > 0.01) {
        console.warn(`Price not found for ${symbol} (${amount.toFixed(6)}), excluding from portfolio calculation`);
      }
      continue;
    }

    if (amount <= 0) {
      continue; // Skip assets with zero or negative balance
    }

    const value = amount * price;
    totalValue += value;

    holdings.push({
      symbol,
      amount,
      value,
      percentage: 0, // Will be calculated after we know total value
    });
  }

  // Calculate percentages
  holdings.forEach((holding) => {
    holding.percentage = totalValue > 0 ? (holding.value / totalValue) * 100 : 0;
  });

  // Sort by value (highest first)
  holdings.sort((a, b) => b.value - a.value);

  return {
    totalValue,
    holdings,
    currency: 'EUR',
  };
}

/**
 * Calculate target holdings based on target weights and total portfolio value
 * @param targetWeights - Map of asset symbols to target percentages (0-100)
 * @param totalValue - Total portfolio value in EUR
 * @param prices - Map of asset symbols to prices in EUR
 * @returns Array of target holdings with amounts and values
 */
export function calculateTargetHoldings(
  targetWeights: Record<string, number>,
  totalValue: number,
  prices: Record<string, number>
): AssetHolding[] {
  const targetHoldings: AssetHolding[] = [];

  // Validate that target weights sum to approximately 100%
  const totalWeight = Object.values(targetWeights).reduce((sum, weight) => sum + weight, 0);
  
  if (Math.abs(totalWeight - 100) > 0.01) {
    console.warn(`Target weights sum to ${totalWeight.toFixed(2)}%, not 100%. Results may be unexpected.`);
  }

  for (const [symbol, weight] of Object.entries(targetWeights)) {
    const price = prices[symbol];
    
    if (price === undefined) {
      console.warn(`Price not found for ${symbol}, skipping...`);
      continue;
    }

    if (price <= 0) {
      console.warn(`Invalid price for ${symbol}: ${price}`);
      continue;
    }

    const targetValue = (weight / 100) * totalValue;
    const targetAmount = targetValue / price;

    targetHoldings.push({
      symbol,
      amount: targetAmount,
      value: targetValue,
      percentage: weight,
    });
  }

  return targetHoldings;
}

/**
 * Generate rebalance orders by comparing current holdings to target holdings
 * @param currentHoldings - Array of current asset holdings
 * @param targetHoldings - Array of target asset holdings
 * @param rebalanceThreshold - Minimum difference (in EUR) to trigger a rebalance action (default: 10 EUR)
 * @returns Array of rebalance orders with buy/sell recommendations
 */
export interface SkippedOrder {
  symbol: string;
  difference: number;
  reason: string;
  side: 'buy' | 'sell';
}

export function generateRebalanceOrders(
  currentHoldings: AssetHolding[],
  targetHoldings: AssetHolding[],
  rebalanceThreshold: number = 10
): RebalanceOrder[] {
  const orders: RebalanceOrder[] = [];
  const skippedOrders: SkippedOrder[] = [];

  // Create maps for easier lookup
  const currentMap = new Map(
    currentHoldings.map((h) => [h.symbol, h])
  );
  const targetMap = new Map(
    targetHoldings.map((h) => [h.symbol, h])
  );

  // Get all unique symbols
  const allSymbols = new Set([
    ...currentHoldings.map((h) => h.symbol),
    ...targetHoldings.map((h) => h.symbol),
  ]);

  for (const symbol of allSymbols) {
    // Skip base currencies (EUR, ZEUR, USD, ZUSD, USDT, etc.)
    // These can't be traded directly - you get them by selling other assets
    // Note: USDC is tradeable on Kraken, so it's not included in base currencies
    const baseCurrencies = ['EUR', 'ZEUR', 'USD', 'ZUSD', 'USDT'];
    if (baseCurrencies.includes(symbol)) {
      console.log(`   ℹ️  Skipping ${symbol} (base currency - cannot be traded directly)`);
      continue;
    }

    const current = currentMap.get(symbol);
    const target = targetMap.get(symbol);

    const currentValue = current?.value || 0;
    const targetValue = target?.value || 0;
    const currentAmount = current?.amount || 0;
    const targetAmount = target?.amount || 0;

    const difference = targetValue - currentValue;
    const volumeDifference = targetAmount - currentAmount;

    // Determine if we need to buy or sell
    const side: 'buy' | 'sell' = difference > 0 ? 'buy' : 'sell';
    
    // Skip if difference is below threshold
    if (Math.abs(difference) < rebalanceThreshold) {
      if (Math.abs(difference) > 0.01) { // Only log if there's a meaningful difference
        skippedOrders.push({
          symbol,
          difference,
          side,
          reason: `Below threshold (€${Math.abs(difference).toFixed(2)} < €${rebalanceThreshold})`
        });
      }
      continue;
    }
    const volume = Math.abs(volumeDifference);

    orders.push({
      symbol,
      side,
      volume,
      currentValue,
      targetValue,
      difference,
      currentAmount,
      targetAmount,
    });
  }

  // Sort by absolute difference (highest first)
  orders.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

  // Log skipped orders for debugging
  if (skippedOrders.length > 0) {
    console.log(`\n⚠️  Skipped ${skippedOrders.length} rebalance order(s) due to threshold:`);
    skippedOrders.forEach(({ symbol, difference, reason }) => {
      const action = difference > 0 ? 'BUY' : 'SELL';
      console.log(`   ${symbol}: ${action} €${Math.abs(difference).toFixed(2)} - ${reason}`);
    });
    console.log(`   💡 Tip: Lower your rebalance threshold to €${Math.max(1, Math.floor(rebalanceThreshold / 5))} for better results with this portfolio size\n`);
  }

  return orders;
}

/**
 * Generate rebalance orders and return both orders and skipped orders
 */
export function generateRebalanceOrdersWithSkipped(
  currentHoldings: AssetHolding[],
  targetHoldings: AssetHolding[],
  rebalanceThreshold: number = 10
): { orders: RebalanceOrder[]; skippedOrders: SkippedOrder[] } {
  const orders: RebalanceOrder[] = [];
  const skippedOrders: SkippedOrder[] = [];

  // Create maps for easier lookup
  const currentMap = new Map(
    currentHoldings.map((h) => [h.symbol, h])
  );
  const targetMap = new Map(
    targetHoldings.map((h) => [h.symbol, h])
  );

  // Get all unique symbols
  const allSymbols = new Set([
    ...currentHoldings.map((h) => h.symbol),
    ...targetHoldings.map((h) => h.symbol),
  ]);

  for (const symbol of allSymbols) {
    // Skip base currencies (EUR, ZEUR, USD, ZUSD, USDT, etc.)
    const baseCurrencies = ['EUR', 'ZEUR', 'USD', 'ZUSD', 'USDT'];
    if (baseCurrencies.includes(symbol)) {
      continue;
    }

    const current = currentMap.get(symbol);
    const target = targetMap.get(symbol);

    const currentValue = current?.value || 0;
    const targetValue = target?.value || 0;
    const currentAmount = current?.amount || 0;
    const targetAmount = target?.amount || 0;

    const difference = targetValue - currentValue;
    const volumeDifference = targetAmount - currentAmount;

    // Determine if we need to buy or sell
    const side: 'buy' | 'sell' = difference > 0 ? 'buy' : 'sell';
    
    // Skip if difference is below threshold
    if (Math.abs(difference) < rebalanceThreshold) {
      if (Math.abs(difference) > 0.01) {
        skippedOrders.push({
          symbol,
          difference,
          side,
          reason: `Below threshold (€${Math.abs(difference).toFixed(2)} < €${rebalanceThreshold})`
        });
      }
      continue;
    }
    const volume = Math.abs(volumeDifference);

    orders.push({
      symbol,
      side,
      volume,
      currentValue,
      targetValue,
      difference,
      currentAmount,
      targetAmount,
    });
  }

  // Sort by absolute difference (highest first)
  orders.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

  // Log skipped orders for debugging
  if (skippedOrders.length > 0) {
    console.log(`\n⚠️  Skipped ${skippedOrders.length} rebalance order(s) due to threshold:`);
    skippedOrders.forEach(({ symbol, difference, reason }) => {
      const action = difference > 0 ? 'BUY' : 'SELL';
      console.log(`   ${symbol}: ${action} €${Math.abs(difference).toFixed(2)} - ${reason}`);
    });
    console.log(`   💡 Tip: Lower your rebalance threshold to €${Math.max(1, Math.floor(rebalanceThreshold / 5))} for better results with this portfolio size\n`);
  }

  return { orders, skippedOrders };
}

/**
 * Calculate rebalance statistics
 * @param orders - Array of rebalance orders
 * @returns Summary statistics about the rebalance
 */
export function calculateRebalanceStats(orders: RebalanceOrder[]) {
  const buyOrders = orders.filter((o) => o.side === 'buy');
  const sellOrders = orders.filter((o) => o.side === 'sell');

  const totalBuyValue = buyOrders.reduce((sum, o) => sum + o.difference, 0);
  const totalSellValue = Math.abs(sellOrders.reduce((sum, o) => sum + o.difference, 0));

  return {
    totalOrders: orders.length,
    buyOrders: buyOrders.length,
    sellOrders: sellOrders.length,
    totalBuyValue,
    totalSellValue,
    netDifference: totalBuyValue - totalSellValue,
  };
}

/**
 * Format portfolio holdings as a readable string
 * @param holdings - Array of asset holdings
 * @returns Formatted string representation
 */
export function formatPortfolio(holdings: AssetHolding[]): string {
  let output = 'Portfolio Holdings:\n';
  output += '─'.repeat(60) + '\n';
  output += `${'Symbol'.padEnd(10)} ${'Amount'.padEnd(15)} ${'Value (EUR)'.padEnd(15)} ${'%'.padEnd(10)}\n`;
  output += '─'.repeat(60) + '\n';

  for (const holding of holdings) {
    output += `${holding.symbol.padEnd(10)} `;
    output += `${holding.amount.toFixed(8).padEnd(15)} `;
    output += `${holding.value.toFixed(2).padEnd(15)} `;
    output += `${holding.percentage.toFixed(2)}%\n`;
  }

  return output;
}

/**
 * Format rebalance orders as a readable string
 * @param orders - Array of rebalance orders
 * @returns Formatted string representation
 */
export function formatRebalanceOrders(orders: RebalanceOrder[]): string {
  if (orders.length === 0) {
    return 'No rebalancing needed. Portfolio is within target allocation.';
  }

  let output = 'Rebalance Orders:\n';
  output += '─'.repeat(80) + '\n';
  output += `${'Symbol'.padEnd(10)} ${'Side'.padEnd(6)} ${'Volume'.padEnd(15)} ${'Difference (EUR)'.padEnd(20)}\n`;
  output += '─'.repeat(80) + '\n';

  for (const order of orders) {
    output += `${order.symbol.padEnd(10)} `;
    output += `${order.side.toUpperCase().padEnd(6)} `;
    output += `${order.volume.toFixed(8).padEnd(15)} `;
    output += `${order.difference > 0 ? '+' : ''}${order.difference.toFixed(2)}\n`;
  }

  const stats = calculateRebalanceStats(orders);
  output += '─'.repeat(80) + '\n';
  output += `Total Orders: ${stats.totalOrders} (${stats.buyOrders} buy, ${stats.sellOrders} sell)\n`;
  output += `Total Buy Value: €${stats.totalBuyValue.toFixed(2)}\n`;
  output += `Total Sell Value: €${stats.totalSellValue.toFixed(2)}\n`;

  return output;
}

/**
 * Validate target weights
 * @param weights - Map of asset symbols to target percentages
 * @returns Validation result with any errors
 */
export function validateTargetWeights(weights: Record<string, number>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check if weights are positive
  for (const [symbol, weight] of Object.entries(weights)) {
    if (weight < 0) {
      errors.push(`Weight for ${symbol} is negative: ${weight}`);
    }
    if (weight > 100) {
      errors.push(`Weight for ${symbol} exceeds 100%: ${weight}`);
    }
  }

  // Check if weights sum to 100%
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (Math.abs(totalWeight - 100) > 0.01) {
    errors.push(`Total weights sum to ${totalWeight.toFixed(2)}%, should be 100%`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

