# Portfolio Helper Functions

Comprehensive portfolio calculation and rebalancing utilities for the Kraken Rebalancer project.

## Overview

The `/lib/portfolio.ts` module provides helper functions for:
1. Calculating total portfolio value in EUR
2. Computing target holdings based on desired allocation
3. Generating buy/sell recommendations for rebalancing

## Core Functions

### `calculatePortfolioValue(balances, prices)`

Calculate the total portfolio value in EUR from current balances and prices.

**Parameters:**
- `balances: Record<string, number>` - Map of asset symbols to amounts held
- `prices: Record<string, number>` - Map of asset symbols to prices in EUR

**Returns:** `PortfolioValue`
```typescript
{
  totalValue: number;      // Total portfolio value in EUR
  holdings: AssetHolding[]; // Array of individual holdings
  currency: 'EUR';
}
```

**Example:**
```typescript
const balances = { BTC: 0.5, ETH: 2.0, SOL: 20 };
const prices = { BTC: 40000, ETH: 2500, SOL: 100 };

const portfolio = calculatePortfolioValue(balances, prices);
// Result:
// {
//   totalValue: 27000,
//   holdings: [
//     { symbol: 'BTC', amount: 0.5, value: 20000, percentage: 74.07 },
//     { symbol: 'ETH', amount: 2.0, value: 5000, percentage: 18.52 },
//     { symbol: 'SOL', amount: 20, value: 2000, percentage: 7.41 }
//   ],
//   currency: 'EUR'
// }
```

---

### `calculateTargetHoldings(targetWeights, totalValue, prices)`

Calculate target holdings based on desired allocation percentages.

**Parameters:**
- `targetWeights: Record<string, number>` - Map of asset symbols to target percentages (0-100)
- `totalValue: number` - Total portfolio value in EUR
- `prices: Record<string, number>` - Map of asset symbols to prices in EUR

**Returns:** `AssetHolding[]`
```typescript
[
  {
    symbol: string;
    amount: number;      // Target amount to hold
    value: number;       // Target value in EUR
    percentage: number;  // Target percentage (0-100)
  }
]
```

**Example:**
```typescript
const targetWeights = { BTC: 40, ETH: 30, SOL: 30 };
const totalValue = 27000;
const prices = { BTC: 40000, ETH: 2500, SOL: 100 };

const targetHoldings = calculateTargetHoldings(targetWeights, totalValue, prices);
// Result:
// [
//   { symbol: 'BTC', amount: 0.27, value: 10800, percentage: 40 },
//   { symbol: 'ETH', amount: 3.24, value: 8100, percentage: 30 },
//   { symbol: 'SOL', amount: 81, value: 8100, percentage: 30 }
// ]
```

---

### `generateRebalanceOrders(currentHoldings, targetHoldings, rebalanceThreshold?)`

Generate buy/sell orders by comparing current and target holdings.

**Parameters:**
- `currentHoldings: AssetHolding[]` - Array of current holdings
- `targetHoldings: AssetHolding[]` - Array of target holdings
- `rebalanceThreshold?: number` - Minimum difference in EUR to trigger action (default: 10)

**Returns:** `RebalanceOrder[]`
```typescript
[
  {
    symbol: string;
    side: 'buy' | 'sell';
    volume: number;           // Amount of asset to trade
    currentValue: number;     // Current value in EUR
    targetValue: number;      // Target value in EUR
    difference: number;       // Difference in EUR (+ = buy, - = sell)
    currentAmount: number;    // Current amount held
    targetAmount: number;     // Target amount to hold
  }
]
```

**Example:**
```typescript
const currentHoldings = [
  { symbol: 'BTC', amount: 0.5, value: 20000, percentage: 74.07 }
];

const targetHoldings = [
  { symbol: 'BTC', amount: 0.27, value: 10800, percentage: 40 }
];

const orders = generateRebalanceOrders(currentHoldings, targetHoldings, 10);
// Result:
// [
//   {
//     symbol: 'BTC',
//     side: 'sell',
//     volume: 0.23,
//     currentValue: 20000,
//     targetValue: 10800,
//     difference: -9200,
//     currentAmount: 0.5,
//     targetAmount: 0.27
//   }
// ]
```

---

## Utility Functions

### `calculateRebalanceStats(orders)`

Calculate summary statistics for rebalance orders.

**Returns:**
```typescript
{
  totalOrders: number;
  buyOrders: number;
  sellOrders: number;
  totalBuyValue: number;
  totalSellValue: number;
  netDifference: number;
}
```

---

### `validateTargetWeights(weights)`

Validate that target weights are valid and sum to 100%.

**Returns:**
```typescript
{
  valid: boolean;
  errors: string[];
}
```

---

### `formatPortfolio(holdings)`

Format portfolio holdings as a readable string (for console output).

---

### `formatRebalanceOrders(orders)`

Format rebalance orders as a readable string (for console output).

---

## API Integration

### POST `/api/portfolio/calculate`

Calculate portfolio and generate rebalance orders using live Kraken data.

**Request Body:**
```json
{
  "targetWeights": {
    "BTC": 40,
    "ETH": 30,
    "SOL": 20,
    "ADA": 10
  },
  "rebalanceThreshold": 10,
  "symbols": ["BTC", "ETH", "SOL", "ADA"]
}
```

**Response:**
```json
{
  "success": true,
  "portfolio": {
    "totalValue": 27000,
    "currency": "EUR",
    "holdings": [...]
  },
  "target": {
    "weights": {...},
    "holdings": [...]
  },
  "rebalance": {
    "threshold": 10,
    "orders": [...],
    "stats": {
      "totalOrders": 3,
      "buyOrders": 2,
      "sellOrders": 1,
      "totalBuyValue": 5000,
      "totalSellValue": 5000,
      "netDifference": 0
    }
  },
  "prices": {...}
}
```

---

## Complete Workflow Example

```typescript
import krakenClient from '@/lib/kraken';
import {
  calculatePortfolioValue,
  calculateTargetHoldings,
  generateRebalanceOrders,
  validateTargetWeights,
} from '@/lib/portfolio';

async function rebalancePortfolio() {
  // 1. Get current balances from Kraken
  const krakenBalance = await krakenClient.getAccountBalance();
  const balances = {
    BTC: parseFloat(krakenBalance.XXBT),
    ETH: parseFloat(krakenBalance.XETH),
    SOL: parseFloat(krakenBalance.SOL),
  };

  // 2. Get current prices in EUR
  const tickers = await krakenClient.getTickerPrices([
    'XXBTZEUR',
    'XETHZEUR', 
    'SOLEUR'
  ]);
  const prices = {
    BTC: tickers[0].price,
    ETH: tickers[1].price,
    SOL: tickers[2].price,
  };

  // 3. Calculate current portfolio value
  const portfolio = calculatePortfolioValue(balances, prices);
  console.log(`Portfolio Value: €${portfolio.totalValue.toFixed(2)}`);

  // 4. Define and validate target weights
  const targetWeights = { BTC: 40, ETH: 35, SOL: 25 };
  const validation = validateTargetWeights(targetWeights);
  if (!validation.valid) {
    throw new Error(`Invalid weights: ${validation.errors.join(', ')}`);
  }

  // 5. Calculate target holdings
  const targetHoldings = calculateTargetHoldings(
    targetWeights,
    portfolio.totalValue,
    prices
  );

  // 6. Generate rebalance orders
  const orders = generateRebalanceOrders(
    portfolio.holdings,
    targetHoldings,
    10 // 10 EUR threshold
  );

  // 7. Execute orders (with user confirmation)
  console.log(`Generated ${orders.length} rebalance orders`);
  for (const order of orders) {
    console.log(`${order.side.toUpperCase()} ${order.volume.toFixed(6)} ${order.symbol}`);
    
    // Uncomment to execute:
    // const pair = `${order.symbol}EUR`;
    // await krakenClient.placeOrder(pair, order.side, order.volume);
  }

  return { portfolio, orders };
}
```

---

## Key Features

✅ **EUR-Based Calculations** - All values computed in EUR for consistency  
✅ **Threshold-Based Rebalancing** - Only rebalance when difference exceeds threshold  
✅ **Comprehensive Validation** - Validates target weights and inputs  
✅ **Flexible Configuration** - Customizable rebalance thresholds and target weights  
✅ **Type-Safe** - Full TypeScript support with detailed types  
✅ **Kraken Integration** - Works seamlessly with Kraken API client  
✅ **Statistics** - Provides summary statistics for rebalance operations  
✅ **Formatting Utilities** - Console-friendly output formatting  

---

## Configuration

### Rebalance Threshold

The `rebalanceThreshold` parameter (default: 10 EUR) determines the minimum difference required to trigger a rebalance action. This prevents unnecessary micro-transactions and trading fees.

**Example:**
```typescript
// Only rebalance if difference is > 50 EUR
const orders = generateRebalanceOrders(current, target, 50);
```

### Target Weights

Target weights must:
- Be positive numbers
- Not exceed 100%
- Sum to exactly 100% (within 0.01% tolerance)

**Valid:**
```typescript
{ BTC: 40, ETH: 30, SOL: 30 }  // Sums to 100
```

**Invalid:**
```typescript
{ BTC: 50, ETH: 50, SOL: 20 }  // Sums to 120
{ BTC: 40, ETH: 30, SOL: 20 }  // Sums to 90
{ BTC: -10, ETH: 60, SOL: 50 } // Negative weight
```

---

## Error Handling

All functions include error handling and logging:

- Missing prices → Warning logged, asset skipped
- Invalid prices → Warning logged, asset skipped
- Invalid weights → Validation errors returned
- Below threshold → Order not generated

---

## Testing

See `/lib/portfolio.example.ts` for comprehensive examples including:
- Basic calculations
- Complete rebalancing workflow
- Kraken API integration
- Error handling

Run examples:
```bash
npx tsx lib/portfolio.example.ts
```

---

## Future Enhancements

- [ ] Support for multiple currencies (USD, GBP, etc.)
- [ ] Historical portfolio tracking
- [ ] Dry-run mode for testing rebalance strategies
- [ ] Fee calculation and optimization
- [ ] Partial rebalancing (e.g., rebalance only top 3 assets)
- [ ] Time-weighted rebalancing strategies
- [ ] Risk analysis and volatility metrics

