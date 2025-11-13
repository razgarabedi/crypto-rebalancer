/**
 * Portfolio Rebalancing Orchestrator
 * Coordinates fetching holdings, calculating rebalance orders, and executing trades
 */

import { getUserKrakenClient } from './kraken-user';
import {
  calculatePortfolioValue,
  calculateTargetHoldings,
  generateRebalanceOrdersWithSkipped,
  validateTargetWeights,
  type RebalanceOrder,
  type PortfolioValue,
  type SkippedOrder,
} from './portfolio';
import {
  findOptimalRoute,
  shouldUseSmartRouting,
} from './smart-routing';
import { allocateFundsSmartly, validateAdjustedOrders } from './smart-fund-allocation';
import { priceCache } from './price-cache';


// Note: validateOrderFunds function removed as it's no longer used
// The new sequential validation logic handles this more effectively

/**
 * Get available balance for a specific asset
 */
async function getAvailableAssetBalance(krakenClient: { getAccountBalance: () => Promise<Record<string, string>> }, symbol: string): Promise<number> {
  try {
    const balance = await krakenClient.getAccountBalance();
    
    // Find the Kraken asset that normalizes to our symbol
    // We need to reverse the normalization process
    for (const [krakenAsset, amount] of Object.entries(balance)) {
      const normalizedSymbol = normalizeAssetSymbol(krakenAsset);
      if (normalizedSymbol === symbol) {
        return parseFloat(amount);
      }
    }
    
    // If not found, return 0
    return 0;
  } catch (error) {
    console.warn(`Failed to get balance for ${symbol}:`, error);
    return 0;
  }
}


export interface RebalanceConfig {
  portfolioId: string;
  userId: string; // User ID to get their specific Kraken credentials
  targetWeights: Record<string, number>;
  rebalanceThreshold?: number; // Minimum difference in EUR to trigger rebalance (default: 10)
  dryRun?: boolean; // If true, don't place actual orders
  maxOrdersPerRebalance?: number; // Maximum number of orders to place (default: no limit)
  orderType?: 'market' | 'limit'; // Order type for fee optimization (default: market)
  smartRoutingEnabled?: boolean; // Enable smart route selection (default: true)
}

export interface RebalanceResult {
  success: boolean;
  portfolioId: string;
  timestamp: Date;
  portfolio: PortfolioValue;
  ordersPlanned: RebalanceOrder[];
  ordersExecuted: ExecutedOrder[];
  errors: string[];
  dryRun: boolean;
  summary: {
    totalOrders: number;
    successfulOrders: number;
    failedOrders: number;
    skippedOrders: number;
    totalValueTraded: number;
    totalFees: number; // Total trading fees paid in EUR
  };
  fundAllocation?: {
    strategy: 'full' | 'partial' | 'proportional';
    totalAvailableFunds: number;
    totalRequiredFunds: number;
    adjustments: Array<{
      orderIndex: number;
      originalAmount: number;
      adjustedAmount: number;
      reason: string;
    }>;
    validationWarnings: string[];
    netBalanceChange?: number;
  };
  skippedOrders?: SkippedOrder[];
}

export interface ExecutedOrder extends RebalanceOrder {
  executed: boolean;
  txid?: string[];
  executionPrice?: number;
  executionTime?: Date;
  fee?: number; // Trading fee paid for this order in EUR
  error?: string;
  route?: string[]; // Trading route taken (e.g., ['BTC', 'EUR', 'ADA'])
  routeSavings?: number; // Savings from smart routing (in %)
}

/**
 * Logger utility for rebalancing operations
 */
class RebalanceLogger {
  private prefix: string;

  constructor(portfolioId: string) {
    this.prefix = `[Rebalance:${portfolioId}]`;
  }

  info(message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} ${this.prefix} INFO: ${message}`, data || '');
  }

  warn(message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    console.warn(`${timestamp} ${this.prefix} WARN: ${message}`, data || '');
  }

  error(message: string, error?: unknown) {
    const timestamp = new Date().toISOString();
    console.error(`${timestamp} ${this.prefix} ERROR: ${message}`, error || '');
  }

  success(message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} ${this.prefix} SUCCESS: ${message}`, data || '');
  }
}

/**
 * Get portfolio configuration with target weights from database
 */
async function getPortfolioConfig(portfolioId: string): Promise<Record<string, number>> {
  const { prisma } = await import('./prisma');
  
  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      select: { targetWeights: true },
    });

    if (!portfolio) {
      throw new Error(`Portfolio ${portfolioId} not found in database`);
    }

    const targetWeights = portfolio.targetWeights as Record<string, number>;
    
    if (!targetWeights || Object.keys(targetWeights).length === 0) {
      throw new Error(`Portfolio ${portfolioId} has no target weights configured`);
    }

    return targetWeights;
  } catch (error) {
    console.error(`[Rebalance] Error fetching portfolio config for ${portfolioId}:`, error);
    throw error;
  }
}

/**
 * Convert Kraken asset names to standard symbols
 * Handles suffixes like .F (Flex staking), .S (Staked), .M (Margin), .P (Perpetual)
 */
export function normalizeAssetSymbol(krakenAsset: string): string {
  // Remove suffixes (.F for Flex staking, .S for Staked, .M for Margin, etc.)
  let normalized = krakenAsset.replace(/\.(F|S|M|P)$/i, '');
  
  // Remove X prefix that Kraken uses for some assets
  normalized = normalized.replace(/^X+/, '');
  
  // Handle special cases
  const mapping: Record<string, string> = {
    'XBT': 'BTC',
    'XXBT': 'BTC',
    'XETH': 'ETH',
    'ETH2': 'ETH',
    'XETH2': 'ETH',
    'ZEUR': 'EUR',
    // Add more mappings as needed for custom coins
  };

  const base = krakenAsset.replace(/\.(F|S|M|P)$/i, '');
  const mapped = mapping[base] || mapping[krakenAsset] || normalized;
  // Collapse known ETH staking variants to ETH
  if (/^X?ETH\d+$/i.test(base) || /^ETH\d+$/i.test(mapped)) {
    return 'ETH';
  }
  return mapped;
}

/**
 * Get trading pair name for Kraken
 */
export function getTradingPair(symbol: string, quoteCurrency: string = 'EUR'): string {
  const pairMapping: Record<string, string> = {
    'BTC': `XXBTZ${quoteCurrency}`,
    'ETH': `XETHZ${quoteCurrency}`,
    'SOL': `SOL${quoteCurrency}`,
    'ADA': `ADA${quoteCurrency}`,
    'DOT': `DOT${quoteCurrency}`,
    'MATIC': `MATIC${quoteCurrency}`,
    'LINK': `LINK${quoteCurrency}`,
    'AVAX': `AVAX${quoteCurrency}`,
    'ATOM': `ATOM${quoteCurrency}`,
    'UNI': `UNI${quoteCurrency}`,
    'CPOOL': `CPOOL${quoteCurrency}`,
    'RLC': `RLC${quoteCurrency}`,
    'RPL': `RPL${quoteCurrency}`,
    'EWT': `EWT${quoteCurrency}`,
    'AKT': `AKT${quoteCurrency}`,
    'FLUX': `FLUX${quoteCurrency}`,
  };

  return pairMapping[symbol] || `${symbol}${quoteCurrency}`;
}

/**
 * Main rebalancing function
 * Orchestrates the entire rebalancing process from fetching data to executing orders
 */
export async function rebalancePortfolio(
  portfolioId: string,
  config?: Partial<RebalanceConfig>
): Promise<RebalanceResult> {
  const logger = new RebalanceLogger(portfolioId);
  const errors: string[] = [];
  const startTime = new Date();

  logger.info('Starting portfolio rebalance', { portfolioId, config });

  // Initialize result object
  const result: RebalanceResult = {
    success: false,
    portfolioId,
    timestamp: startTime,
    portfolio: { totalValue: 0, holdings: [], currency: 'EUR' },
    ordersPlanned: [],
    ordersExecuted: [],
    errors,
    dryRun: config?.dryRun || false,
    summary: {
      totalOrders: 0,
      successfulOrders: 0,
      failedOrders: 0,
      skippedOrders: 0,
      totalValueTraded: 0,
      totalFees: 0,
    },
  };

  try {
    // Step 1: Get user's Kraken client with their credentials
    logger.info('Step 1: Getting user Kraken client');
    if (!config?.userId) {
      const error = 'User ID is required for rebalancing';
      logger.error(error);
      errors.push(error);
      return result;
    }

    const krakenClient = await getUserKrakenClient(config.userId);
    logger.success('User Kraken client initialized');

    // Step 2: Fetch current holdings from Kraken
    logger.info('Step 2: Fetching current holdings from Kraken');
    const krakenBalance = await krakenClient.getAccountBalance();
    logger.info('Retrieved balance', { assetCount: Object.keys(krakenBalance).length });

    // Convert Kraken balance format to our format
    const balances: Record<string, number> = {};
    for (const [asset, amount] of Object.entries(krakenBalance)) {
      const symbol = normalizeAssetSymbol(asset);
      const balance = parseFloat(amount);
      if (balance > 0) {
        balances[symbol] = balance;
      }
    }
    logger.info('Normalized balances', balances);

    // Step 3: Get target weights for portfolio
    logger.info('Step 3: Fetching target weights', { portfolioId });
    // Always fetch from database if not provided in config to ensure we use the correct portfolio
    let targetWeights: Record<string, number>;
    if (config?.targetWeights && Object.keys(config.targetWeights).length > 0) {
      targetWeights = config.targetWeights;
      logger.info('Using target weights from config');
    } else {
      logger.info('Fetching target weights from database for portfolio', { portfolioId });
      targetWeights = await getPortfolioConfig(portfolioId);
      logger.info('Fetched target weights from database');
    }
    logger.info('Target allocation', { targetWeights, portfolioId });

    // Validate target weights
    const validation = validateTargetWeights(targetWeights);
    if (!validation.valid) {
      const error = `Invalid target weights: ${validation.errors.join(', ')}`;
      logger.error(error);
      errors.push(error);
      return result;
    }
    logger.success('Target weights validated');

    // Step 4: Get current prices from Kraken (with retry logic)
    logger.info('Step 4: Fetching current prices from Kraken');
    const symbols = Object.keys(targetWeights);
    
    // Use centralized price cache to minimize API calls (includes retry logic)
    let prices: Record<string, number> = {};
    let retryAttempt = 0;
    const maxPriceRetries = 3;
    
    while (retryAttempt < maxPriceRetries) {
      if (retryAttempt > 0) {
        const waitTime = 15; // 15 seconds
        logger.warn(`Prices incomplete (attempt ${retryAttempt}/${maxPriceRetries}), waiting ${waitTime}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        // Clear cache on retry to force fresh fetch
        priceCache.clearUserCache(config.userId);
        logger.info('Cleared price cache to force fresh fetch');
      }
      
      prices = await priceCache.getPrices(config.userId, symbols);
      retryAttempt++;
      
      // Check if we got prices for ALL target symbols (EUR is always 1.0, so we check others)
      const targetNonEur = symbols.filter(s => s !== 'EUR');
      const foundTargetPrices = targetNonEur.filter(s => prices[s] !== undefined && prices[s] > 0);
      const missingTargetPrices = targetNonEur.filter(s => !prices[s] || prices[s] === 0);
      
      logger.info(`Price fetch result: ${foundTargetPrices.length}/${targetNonEur.length} target symbols found`);
      
      if (missingTargetPrices.length > 0) {
        logger.warn(`Missing prices for ${missingTargetPrices.length} target symbol(s): ${missingTargetPrices.join(', ')}`);
        
        if (retryAttempt < maxPriceRetries) {
          logger.warn(`Will retry in next iteration...`);
          // Continue loop to retry
        } else {
          // Max retries reached - break and handle error below
          logger.error(`Failed to fetch prices for ${missingTargetPrices.length} symbol(s) after ${retryAttempt} attempts`);
          break;
        }
      } else {
        // All target prices found - success!
        logger.success(`Successfully fetched prices for all ${targetNonEur.length} target symbols`);
        break;
      }
    }
    
    const skippedAssets = symbols.filter(symbol => !prices[symbol] || prices[symbol] === 0);
    if (skippedAssets.length > 0) {
      logger.warn(`Skipped ${skippedAssets.length} asset(s) due to missing trading pairs: ${skippedAssets.join(', ')}`);
      logger.warn('These assets will be excluded from rebalancing calculations');
    }

    // Check if we have prices for any target assets
    const targetAssetsWithPrices = symbols.filter(s => prices[s] && prices[s] > 0);
    if (targetAssetsWithPrices.length === 0) {
      const error = `No valid trading pairs found for any assets in the portfolio after ${retryAttempt} attempt(s). Missing prices for: ${symbols.join(', ')}. This may be due to API rate limits or unavailable trading pairs on Kraken.`;
      logger.error(error);
      errors.push(error);
      return result;
    }

    logger.info('Current prices (EUR)', prices);

    // Step 5: Calculate current portfolio value
    // IMPORTANT: Only calculate value for assets in the target portfolio
    // Filter balances to only include assets that are in targetWeights
    logger.info('Step 5: Calculating current portfolio value');
    logger.info('Filtering balances to only include target portfolio assets', { targetAssets: Object.keys(targetWeights) });
    
    // Only include balances for assets that are in the target portfolio
    const portfolioBalances: Record<string, number> = {};
    for (const symbol of Object.keys(targetWeights)) {
      if (balances[symbol] !== undefined && balances[symbol] > 0) {
        portfolioBalances[symbol] = balances[symbol];
      }
    }
    
    logger.info('Portfolio balances (filtered to target assets)', portfolioBalances);
    
    // Only calculate value using target portfolio assets
    const portfolio = calculatePortfolioValue(portfolioBalances, prices);
    result.portfolio = portfolio;
    logger.success(`Portfolio value calculated: €${portfolio.totalValue.toFixed(2)}`);
    
    if (portfolio.totalValue === 0) {
      const missingPrices = Object.keys(targetWeights).filter(symbol => !prices[symbol] && portfolioBalances[symbol] > 0);
      let error = 'Portfolio value is zero. Cannot rebalance empty portfolio.';
      if (missingPrices.length > 0) {
        error += ` This is likely because prices could not be fetched for: ${missingPrices.join(', ')}. `;
        error += 'Please check if these trading pairs are available on Kraken or try again later if API rate limits were hit.';
      } else if (Object.keys(portfolioBalances).length === 0) {
        error += ' No balances found for any target portfolio assets.';
      }
      logger.error(error);
      errors.push(error);
      return result;
    }

    // Filter out skipped assets from target weights and normalize
    const validTargetWeights: Record<string, number> = {};
    let totalValidWeight = 0;
    
    for (const [symbol, weight] of Object.entries(targetWeights)) {
      if (!skippedAssets.includes(symbol)) {
        validTargetWeights[symbol] = weight;
        totalValidWeight += weight;
      }
    }

    // Normalize weights to sum to 100%
    if (totalValidWeight > 0 && totalValidWeight !== 100) {
      logger.warn(`Adjusting target weights due to skipped assets (original total: ${totalValidWeight}%)`);
      for (const symbol in validTargetWeights) {
        validTargetWeights[symbol] = (validTargetWeights[symbol] / totalValidWeight) * 100;
      }
      logger.info('Adjusted target weights', validTargetWeights);
    }

    // Log current allocation
    logger.info('Current allocation:');
    portfolio.holdings.forEach(h => {
      logger.info(`  ${h.symbol}: ${h.amount.toFixed(6)} = €${h.value.toFixed(2)} (${h.percentage.toFixed(2)}%)`);
    });

    // Step 6: Calculate target holdings (using valid weights only)
    logger.info('Step 6: Calculating target holdings');
    const targetHoldings = calculateTargetHoldings(
      validTargetWeights,
      portfolio.totalValue,
      prices
    );
    logger.info('Target allocation:');
    targetHoldings.forEach(h => {
      logger.info(`  ${h.symbol}: ${h.amount.toFixed(6)} = €${h.value.toFixed(2)} (${h.percentage.toFixed(2)}%)`);
    });

    // Step 7: Generate rebalance orders
    logger.info('Step 7: Generating rebalance orders');
    const rebalanceThreshold = config?.rebalanceThreshold ?? 10;
    const { orders, skippedOrders } = generateRebalanceOrdersWithSkipped(
      portfolio.holdings,
      targetHoldings,
      rebalanceThreshold
    );
    result.ordersPlanned = orders;
    result.summary.totalOrders = orders.length;
    result.skippedOrders = skippedOrders;

    if (orders.length === 0) {
      if (skippedOrders.length > 0) {
        logger.info(`No orders generated. ${skippedOrders.length} order(s) skipped due to threshold.`);
      }
      logger.success('Portfolio is already balanced. No orders needed.');
      result.success = true;
      return result;
    }

    logger.info(`Generated ${orders.length} rebalance orders (threshold: €${rebalanceThreshold})`);
    if (skippedOrders.length > 0) {
      logger.info(`${skippedOrders.length} order(s) skipped due to threshold`);
    }
    
    // Check if smart routing is enabled
    const smartRoutingEnabled = config?.smartRoutingEnabled !== false; // Default to true
    if (smartRoutingEnabled) {
      logger.info('Smart routing is enabled - will analyze optimal trade paths');
    }
    orders.forEach((order, idx) => {
      logger.info(
        `  Order ${idx + 1}: ${order.side.toUpperCase()} ${order.volume.toFixed(6)} ${order.symbol} ` +
        `(Current: €${order.currentValue.toFixed(2)}, Target: €${order.targetValue.toFixed(2)}, ` +
        `Diff: €${Math.abs(order.difference).toFixed(2)})`
      );
    });

    // Apply max orders limit if specified
    const maxOrders = config?.maxOrdersPerRebalance;
    const ordersToValidate = maxOrders ? orders.slice(0, maxOrders) : orders;
    
    // Step 7.5: Smart fund allocation to prevent insufficient funds
    logger.info('Step 7.5: Smart fund allocation to prevent insufficient funds');
    
    // Get current EUR balance and asset balances
    const currentEURBalance = await getAvailableAssetBalance(krakenClient, 'EUR');
    logger.info(`Current EUR balance: €${currentEURBalance.toFixed(2)}`);
    
    // Use the balance data we already fetched and normalized earlier
    const availableAssets: Record<string, number> = {};
    for (const order of ordersToValidate) {
      if (order.side === 'sell' && !availableAssets[order.symbol]) {
        // Use the balance data from the portfolio calculation instead of making new API calls
        const currentHolding = portfolio.holdings.find(h => h.symbol === order.symbol);
        availableAssets[order.symbol] = currentHolding?.amount || 0;
        logger.info(`Available ${order.symbol} balance: ${availableAssets[order.symbol].toFixed(6)}`);
      }
    }
    
    // Use smart fund allocation to adjust orders based on available funds
    const allocationResult = allocateFundsSmartly(ordersToValidate, currentEURBalance, availableAssets);
    
    logger.info(`Smart allocation strategy: ${allocationResult.allocationStrategy}`);
    logger.info(`Available funds: €${allocationResult.totalAvailableFunds.toFixed(2)}`);
    logger.info(`Required funds: €${allocationResult.totalRequiredFunds.toFixed(2)}`);
    
    // Log adjustments made
    if (allocationResult.adjustments.length > 0) {
      logger.info(`Made ${allocationResult.adjustments.length} adjustments to orders:`);
      allocationResult.adjustments.forEach((adjustment, idx) => {
        logger.info(`  ${idx + 1}. Order ${adjustment.orderIndex}: €${adjustment.originalAmount.toFixed(2)} → €${adjustment.adjustedAmount.toFixed(2)} (${adjustment.reason})`);
      });
    }
    
    // Validate adjusted orders maintain portfolio balance
    const balanceValidation = validateAdjustedOrders(ordersToValidate, allocationResult.adjustedOrders);
    if (!balanceValidation.valid) {
      logger.warn(`Portfolio balance validation failed: ${balanceValidation.warnings.join(', ')}`);
    }
    
    if (balanceValidation.warnings.length > 0) {
      balanceValidation.warnings.forEach(warning => logger.warn(`  ⚠️  ${warning}`));
    }
    
    // Store fund allocation metadata in result
    result.fundAllocation = {
      strategy: allocationResult.allocationStrategy,
      totalAvailableFunds: allocationResult.totalAvailableFunds,
      totalRequiredFunds: allocationResult.totalRequiredFunds,
      adjustments: allocationResult.adjustments,
      validationWarnings: balanceValidation.warnings,
      netBalanceChange: balanceValidation.netChange,
    };
    
    // Filter out orders with zero volume or very small volumes (below minimum thresholds)
    // Asset-specific minimum volumes (approximate Kraken minimums); fallback to very small default
    const getMinimumOrderVolume = (symbol: string): number => {
      const map: Record<string, number> = {
        BTC: 0.00002,
        ETH: 0.0002,
        SOL: 0.01,
        ADA: 1,
        LINK: 0.1,
        AVAX: 0.01,
        ATOM: 0.01,
        UNI: 0.1,
        AAVE: 0.001,
        RENDER: 0.01,
        USDC: 0.5,
        EUR: 0.01,
      };
      return map[symbol] ?? 0.00000001;
    };
    const ordersToExecute = allocationResult.adjustedOrders.filter(order => {
      const minVol = getMinimumOrderVolume(order.symbol);
      return order.volume >= minVol && Math.abs(order.difference) > 0.01;
    });
    
    if (ordersToExecute.length === 0) {
      logger.error('No orders can be executed after fund allocation');
      errors.push('All orders were skipped due to insufficient funds');
      result.summary.skippedOrders = allocationResult.adjustedOrders.length;
      return result;
    }
    
    // Sort orders to ensure sell orders are executed first
    const sortedOrdersToExecute = ordersToExecute.sort((a, b) => {
      // Sell orders first, then buy orders
      if (a.side === 'sell' && b.side === 'buy') return -1;
      if (a.side === 'buy' && b.side === 'sell') return 1;
      // Within same type, sort by absolute difference (larger first)
      return Math.abs(b.difference) - Math.abs(a.difference);
    });
    
    logger.info(`Executing ${sortedOrdersToExecute.length} orders after smart fund allocation`);
    
    // Log the final orders to be executed in execution order
    sortedOrdersToExecute.forEach((order, idx) => {
      logger.info(
        `  Order ${idx + 1}: ${order.side.toUpperCase()} ${order.volume.toFixed(6)} ${order.symbol} ` +
        `(€${Math.abs(order.difference).toFixed(2)})`
      );
    });

    // Step 8: Execute orders (or simulate in dry-run mode)
    const orderType = config?.orderType || 'market';
    logger.info(`Order type: ${orderType.toUpperCase()}`);
    
    // Define fee rates (Kraken standard tier)
    const MAKER_FEE_RATE = 0.0016; // 0.16% for limit orders (maker)
    const TAKER_FEE_RATE = 0.0026; // 0.26% for market orders (taker)
    const feeRate = orderType === 'limit' ? MAKER_FEE_RATE : TAKER_FEE_RATE;
    
    if (result.dryRun) {
      logger.info('Step 8: DRY RUN MODE - Simulating order execution');
      for (const order of sortedOrdersToExecute) {
        // Calculate estimated fee
        const estimatedFee = Math.abs(order.difference) * feeRate;
        
        const executedOrder: ExecutedOrder = {
          ...order,
          executed: false,
          fee: estimatedFee,
        };
        result.ordersExecuted.push(executedOrder);
        result.summary.totalFees += estimatedFee;
        logger.info(
          `[DRY RUN] Would ${order.side.toUpperCase()} ${order.volume.toFixed(6)} ${order.symbol} ` +
          `(Est. fee: €${estimatedFee.toFixed(2)})`
        );
      }
      result.summary.successfulOrders = sortedOrdersToExecute.length;
      result.success = true;
      logger.success(
        `Dry run completed. ${sortedOrdersToExecute.length} orders simulated. ` +
        `Total estimated fees: €${result.summary.totalFees.toFixed(2)}`
      );
    } else {
      logger.info('Step 8: Executing orders on Kraken');
      
      for (let i = 0; i < sortedOrdersToExecute.length; i++) {
        const order = sortedOrdersToExecute[i];
        const executedOrder: ExecutedOrder = {
          ...order,
          executed: false,
          executionTime: new Date(),
        };

        try {
          logger.info(
            `Executing order ${i + 1}/${sortedOrdersToExecute.length}: ` +
            `${order.side.toUpperCase()} ${order.volume.toFixed(6)} ${order.symbol} ` +
            `(Type: ${orderType.toUpperCase()})`
          );
          
          // Smart routing analysis (currently all trades go through EUR)
          if (smartRoutingEnabled && shouldUseSmartRouting(order.symbol, 'EUR', Math.abs(order.difference))) {
            try {
              const optimalRoute = await findOptimalRoute(krakenClient, order.symbol, 'EUR', {
                amount: Math.abs(order.difference),
                orderType: orderType || 'market',
              });
              
              if (optimalRoute) {
                executedOrder.route = optimalRoute.path;
                logger.info(
                  `Smart routing analysis: ${optimalRoute.path.join(' → ')} ` +
                  `(Cost: ${optimalRoute.estimatedCost.toFixed(4)}%)`
                );
                
                // For now, we still execute through the standard EUR pair
                // Future enhancement: execute multi-hop routes
                if (optimalRoute.path.length > 2) {
                  logger.info(
                    `Note: Multi-hop route available but not executed (future feature)`
                  );
                }
              }
            } catch (routeError) {
              logger.warn('Smart routing analysis failed, using standard route', routeError);
            }
          }
          
          const pair = getTradingPair(order.symbol, 'EUR');
          
          // Get current ticker for limit price calculation
          let limitPrice: number | undefined;
          if (orderType === 'limit') {
            const ticker = await krakenClient.getTickerPrices([pair]);
            if (ticker.length > 0) {
              // For buy orders: use ask price with slight premium to ensure execution
              // For sell orders: use bid price with slight discount to ensure execution
              if (order.side === 'buy') {
                limitPrice = ticker[0].ask * 1.001; // 0.1% above ask
              } else {
                limitPrice = ticker[0].bid * 0.999; // 0.1% below bid
              }
              logger.info(`Limit price calculated: €${limitPrice.toFixed(2)}`);
            }
          }
          
          // Place order (market or limit)
          const orderResult = await krakenClient.placeOrder(
            pair,
            order.side,
            order.volume,
            limitPrice
          );

          // Calculate fee
          const orderValue = Math.abs(order.difference);
          const fee = orderValue * feeRate;

          executedOrder.executed = true;
          executedOrder.txid = orderResult.txid;
          executedOrder.executionPrice = limitPrice;
          executedOrder.fee = fee;
          
          result.summary.successfulOrders++;
          result.summary.totalValueTraded += orderValue;
          result.summary.totalFees += fee;

          logger.success(
            `Order executed successfully: ${orderResult.description} ` +
            `(TxID: ${orderResult.txid.join(', ')}, Fee: €${fee.toFixed(2)})`
          );
        } catch (error) {
          executedOrder.error = error instanceof Error ? error.message : 'Unknown error';
          
          // Check if it's an insufficient funds error
          const isInsufficientFunds = executedOrder.error.includes('Insufficient funds') || 
                                    executedOrder.error.includes('EOrder:Insufficient funds');
          
          if (isInsufficientFunds) {
            // Iteratively reduce buy size until it can be executed
            try {
              logger.warn(`⚠️  Insufficient funds/assets for full order, attempting to execute as much as possible...`);
              
              const pairForBuy = getTradingPair(order.symbol, 'EUR');
              // Helper: asset-specific minimum order volume
              const getMinimumOrderVolume = (symbol: string): number => {
                const map: Record<string, number> = {
                  BTC: 0.00002,
                  ETH: 0.0002,
                  SOL: 0.01,
                  ADA: 1,
                  LINK: 0.1,
                  AVAX: 0.01,
                  ATOM: 0.01,
                  UNI: 0.1,
                  AAVE: 0.001,
                  RENDER: 0.01,
                  USDC: 0.5,
                  EUR: 0.01,
                };
                return map[symbol] ?? 0.00000001;
              };
              const minVol = getMinimumOrderVolume(order.symbol);
              
              // Get indicative price (ask) to translate EUR→volume safely
              let indicativeAsk: number | undefined;
              try {
                const t = await krakenClient.getTickerPrices([pairForBuy]);
                if (t && t[0]?.ask) indicativeAsk = t[0].ask;
              } catch {}
              const pricePerUnit = indicativeAsk || Math.max(1e-9, Math.abs(order.difference) / Math.max(1e-9, order.volume));
              
              const MAX_ATTEMPTS = 6;
              let attempt = 0;
              let success = false;
              let bufferFactor = 0.97; // start with 3% fee/slippage buffer
              
              while (attempt < MAX_ATTEMPTS) {
                attempt++;
                // Refresh EUR balance every attempt
                const currentBalance = await krakenClient.getAccountBalance();
                const eurRaw = currentBalance.ZEUR || currentBalance.EUR || '0';
                const eurBalance = parseFloat(eurRaw);
                const spendableEUR = Math.max(0, eurBalance * bufferFactor);
                if (spendableEUR < 0.5) break; // too little to proceed
                
                const maxVolume = spendableEUR / pricePerUnit;
                const tryVolume = Math.min(order.volume, maxVolume);
                if (tryVolume < minVol) {
                  // increase buffer to reduce target slightly less aggressively next time
                  bufferFactor -= 0.05; // widen buffer and re-evaluate
                  if (bufferFactor <= 0.8) break;
                  continue;
                }
                
                const tryDiffEUR = tryVolume * pricePerUnit;
                logger.info(`🔄 Attempt ${attempt}/${MAX_ATTEMPTS}: buying ${tryVolume.toFixed(6)} ${order.symbol} (~€${tryDiffEUR.toFixed(2)}) with spendable €${spendableEUR.toFixed(2)}`);
                
                try {
                  const retryResult = await krakenClient.placeOrder(
                    pairForBuy,
                    'buy',
                    tryVolume,
                    undefined
                  );
                  // Success
                  executedOrder.txid = retryResult.txid;
                  executedOrder.volume = tryVolume;
                  executedOrder.executed = true;
                  executedOrder.error = undefined;
                  const adjustedOrderValue = tryDiffEUR;
                  const fee = adjustedOrderValue * feeRate;
                  executedOrder.fee = fee;
                  result.summary.successfulOrders++;
                  result.summary.totalValueTraded += adjustedOrderValue;
                  result.summary.totalFees += fee;
                  logger.success(`✅ Order executed with adjusted amount: buy ${tryVolume.toFixed(6)} ${order.symbol} (TxID: ${retryResult.txid.join(', ')}, Fee: €${fee.toFixed(2)})`);
                  // Update last executed order reference if present
                  const orderIndex = result.ordersExecuted.length - 1;
                  if (orderIndex >= 0) {
                    result.ordersExecuted[orderIndex] = executedOrder;
                  }
                  success = true;
                  break;
                } catch (innerErr) {
                  logger.warn(`Retry attempt ${attempt} failed: ${innerErr instanceof Error ? innerErr.message : 'Unknown error'}`);
                  // Reduce buffer further and retry
                  bufferFactor -= 0.05;
                  if (bufferFactor <= 0.8) break;
                  continue;
                }
              }
              if (success) continue; // handled
            } catch (retryError) {
              logger.error(`❌ Retry sequence failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`);
            }
          }
          
          // If we get here, the order failed and couldn't be retried
          result.summary.failedOrders++;
          
          let errorMsg: string;
          if (isInsufficientFunds) {
            errorMsg = `Insufficient funds for ${order.side} order of ${order.symbol}: ${executedOrder.error}`;
            logger.error(`❌ ${errorMsg}`);
            logger.warn(`💡 This order was validated but funds became insufficient during execution. Consider reducing order size or checking for pending orders.`);
          } else {
            errorMsg = `Failed to execute order for ${order.symbol}: ${executedOrder.error}`;
            logger.error(errorMsg, error);
          }
          
          errors.push(errorMsg);
        }

        result.ordersExecuted.push(executedOrder);

        // Add a small delay between orders to avoid rate limiting
        if (i < sortedOrdersToExecute.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Determine overall success
      result.success = result.summary.failedOrders === 0;
      
      if (result.success) {
        logger.success(
          `Rebalance completed successfully! ` +
          `Executed ${result.summary.successfulOrders} orders, ` +
          `traded €${result.summary.totalValueTraded.toFixed(2)}, ` +
          `fees paid: €${result.summary.totalFees.toFixed(2)}`
        );
      } else {
        logger.warn(
          `Rebalance completed with errors. ` +
          `Successful: ${result.summary.successfulOrders}, ` +
          `Failed: ${result.summary.failedOrders}, ` +
          `fees paid: €${result.summary.totalFees.toFixed(2)}`
        );
      }
    }

    return result;

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Fatal error during rebalancing', error);
    errors.push(`Fatal error: ${errorMsg}`);
    return result;
  }
}

/**
 * Get rebalancing preview without executing orders
 * Useful for showing users what would happen before they confirm
 */
export async function getRebalancePreview(
  portfolioId: string,
  userId: string,
  config?: Partial<RebalanceConfig>
): Promise<RebalanceResult> {
  return rebalancePortfolio(portfolioId, { ...config, userId, portfolioId, dryRun: true });
}

/**
 * Check if a portfolio needs rebalancing
 * Returns true if any asset is more than the threshold away from target
 */
export async function needsRebalancing(
  portfolioId: string,
  userId: string,
  threshold: number = 10
): Promise<{ needed: boolean; orders: RebalanceOrder[]; portfolio: PortfolioValue }> {
  const preview = await getRebalancePreview(portfolioId, userId, {
    rebalanceThreshold: threshold,
  });

  return {
    needed: preview.ordersPlanned.length > 0,
    orders: preview.ordersPlanned,
    portfolio: preview.portfolio,
  };
}

