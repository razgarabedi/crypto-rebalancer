# Portfolio Rebalancing Orchestrator

Complete documentation for the automated portfolio rebalancing system.

## Overview

The `/lib/rebalance.ts` module provides an end-to-end portfolio rebalancing orchestrator that:
1. Fetches current holdings from Kraken
2. Gets current market prices
3. Retrieves user's target allocation
4. Calculates rebalance orders
5. Executes trades on Kraken (with dry-run option)
6. Provides comprehensive logging and error handling

## Main Function

### `rebalancePortfolio(portfolioId, config?)`

Complete orchestration of the rebalancing process.

**Parameters:**
```typescript
{
  portfolioId: string;
  targetWeights?: Record<string, number>;     // Custom target allocation
  rebalanceThreshold?: number;                // Min EUR difference (default: 10)
  dryRun?: boolean;                          // Simulate only (default: false)
  maxOrdersPerRebalance?: number;            // Max orders to place (default: unlimited)
}
```

**Returns:** `Promise<RebalanceResult>`
```typescript
{
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
  }
}
```

**Example:**
```typescript
import { rebalancePortfolio } from '@/lib/rebalance';

const result = await rebalancePortfolio('1', {
  targetWeights: { BTC: 40, ETH: 30, SOL: 20, ADA: 10 },
  rebalanceThreshold: 10,
  dryRun: false,
});

if (result.success) {
  console.log(`Rebalanced! Executed ${result.summary.successfulOrders} orders`);
} else {
  console.error('Rebalance failed:', result.errors);
}
```

---

## Helper Functions

### `getRebalancePreview(portfolioId, config?)`

Get a preview of what would happen without executing orders.

**Example:**
```typescript
const preview = await getRebalancePreview('1');

console.log(`Portfolio Value: €${preview.portfolio.totalValue}`);
console.log(`Orders Required: ${preview.ordersPlanned.length}`);

preview.ordersPlanned.forEach(order => {
  console.log(`${order.side} ${order.volume} ${order.symbol}`);
});
```

---

### `needsRebalancing(portfolioId, threshold?)`

Quick check if portfolio needs rebalancing.

**Returns:**
```typescript
{
  needed: boolean;
  orders: RebalanceOrder[];
  portfolio: PortfolioValue;
}
```

**Example:**
```typescript
const check = await needsRebalancing('1', 50);

if (check.needed) {
  console.log(`Rebalancing needed: ${check.orders.length} orders required`);
} else {
  console.log('Portfolio is balanced');
}
```

---

## Process Flow

The rebalancing process follows these steps:

### 1. **Verify Authentication**
```
✓ Check Kraken API credentials are configured
```

### 2. **Fetch Current Holdings**
```
→ Call Kraken API: getAccountBalance()
→ Normalize asset symbols (XXBT → BTC)
→ Filter out zero balances
```

### 3. **Get Target Weights**
```
→ Load from portfolio configuration
→ Validate weights sum to 100%
```

### 4. **Fetch Current Prices**
```
→ Call Kraken API: getTickerPrices([pairs])
→ Use EUR pairs (XXBTZEUR, XETHZEUR, etc.)
→ Convert to standard format
```

### 5. **Calculate Portfolio Value**
```
→ Call: calculatePortfolioValue(balances, prices)
→ Compute total value in EUR
→ Calculate current allocation percentages
```

### 6. **Calculate Target Holdings**
```
→ Call: calculateTargetHoldings(weights, totalValue, prices)
→ Determine exact amounts needed for target allocation
```

### 7. **Generate Orders**
```
→ Call: generateRebalanceOrders(current, target, threshold)
→ Compare current vs target
→ Generate buy/sell recommendations
→ Sort by priority (highest difference first)
```

### 8. **Execute Orders** *(or simulate in dry-run)*
```
→ For each order:
  - Convert symbol to Kraken pair format
  - Call: krakenClient.placeOrder(pair, side, volume)
  - Log success/failure
  - Add delay between orders (rate limiting)
→ Collect results and statistics
```

---

## Logging System

### Log Levels

The rebalancer includes comprehensive logging:

**INFO** - Normal operations
```
[Rebalance:1] INFO: Starting portfolio rebalance
[Rebalance:1] INFO: Retrieved balance { assetCount: 4 }
```

**SUCCESS** - Successful operations
```
[Rebalance:1] SUCCESS: Authentication verified
[Rebalance:1] SUCCESS: Portfolio value calculated: €27,500.00
```

**WARN** - Warnings (non-fatal)
```
[Rebalance:1] WARN: Limiting to 5 orders (2 orders skipped)
```

**ERROR** - Errors
```
[Rebalance:1] ERROR: Failed to execute order for BTC: Insufficient balance
```

### Log Format
```
<timestamp> [Rebalance:<portfolioId>] <level>: <message> <data>
```

---

## Error Handling

### Authentication Errors
```typescript
if (!krakenClient.isAuthenticated()) {
  // Returns error result immediately
  // Error: "Kraken API credentials not configured"
}
```

### Validation Errors
```typescript
// Invalid target weights (don't sum to 100%)
{
  success: false,
  errors: ["Total weights sum to 120.00%, should be 100%"]
}
```

### API Errors
```typescript
// Kraken API call failed
{
  success: false,
  errors: ["Failed to execute order for BTC: Insufficient balance"]
}
```

### Partial Failures
```typescript
// Some orders succeed, some fail
{
  success: false,
  summary: {
    successfulOrders: 3,
    failedOrders: 1,
  },
  errors: ["Failed to execute order for SOL: Rate limit exceeded"]
}
```

---

## API Endpoints

### POST `/api/rebalance/execute`

Execute or preview portfolio rebalancing.

**Request:**
```json
{
  "portfolioId": "1",
  "targetWeights": { "BTC": 40, "ETH": 30, "SOL": 20, "ADA": 10 },
  "rebalanceThreshold": 10,
  "dryRun": true,
  "maxOrdersPerRebalance": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "portfolioId": "1",
    "timestamp": "2025-10-20T14:30:00.000Z",
    "dryRun": true,
    "portfolio": {
      "totalValue": 27500,
      "currency": "EUR",
      "holdings": [...]
    },
    "orders": {
      "planned": [...],
      "executed": [...]
    },
    "summary": {
      "totalOrders": 4,
      "successfulOrders": 4,
      "failedOrders": 0,
      "skippedOrders": 0,
      "totalValueTraded": 9000
    }
  },
  "errors": []
}
```

---

### GET `/api/rebalance/execute?portfolioId=1`

Get rebalancing preview (always dry-run).

**Response:**
```json
{
  "success": true,
  "data": {
    "portfolioId": "1",
    "timestamp": "2025-10-20T14:30:00.000Z",
    "portfolio": {...},
    "ordersPlanned": [...],
    "summary": {
      "totalOrders": 4,
      "estimatedValueToTrade": 9000
    }
  }
}
```

---

### GET `/api/rebalance/check?portfolioId=1&threshold=10`

Check if rebalancing is needed.

**Response:**
```json
{
  "success": true,
  "data": {
    "portfolioId": "1",
    "threshold": 10,
    "needsRebalancing": true,
    "portfolio": {...},
    "orders": [...],
    "summary": {
      "ordersRequired": 4,
      "totalValueToRebalance": 9000,
      "buyOrders": 3,
      "sellOrders": 1
    }
  }
}
```

---

## Configuration Options

### Target Weights

Define desired allocation percentages:
```typescript
{
  BTC: 40,   // 40% in Bitcoin
  ETH: 30,   // 30% in Ethereum
  SOL: 20,   // 20% in Solana
  ADA: 10    // 10% in Cardano
}
// Must sum to 100%
```

### Rebalance Threshold

Minimum EUR difference to trigger a trade:
```typescript
rebalanceThreshold: 10  // Only rebalance if difference > €10
```

**Benefits:**
- Reduces trading fees
- Prevents micro-transactions
- Filters out noise

### Dry Run Mode

Test without executing:
```typescript
dryRun: true  // Simulate only, don't place orders
```

**Use cases:**
- Testing strategies
- User preview/confirmation
- Development/debugging

### Max Orders

Limit orders per rebalance:
```typescript
maxOrdersPerRebalance: 5  // Only execute top 5 orders
```

**Benefits:**
- Gradual rebalancing
- Risk management
- Rate limit compliance

---

## Safety Features

### 1. **Dry Run by Default**
```typescript
// API endpoint defaults to dry-run
dryRun: body.dryRun ?? true
```

### 2. **Order Prioritization**
Orders sorted by absolute difference (highest first):
```typescript
// Execute most important orders first
orders.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
```

### 3. **Rate Limiting**
1-second delay between orders:
```typescript
await new Promise(resolve => setTimeout(resolve, 1000));
```

### 4. **Validation**
- Target weights must sum to 100%
- Prices must be positive
- API credentials must be configured
- Portfolio value must be non-zero

### 5. **Error Recovery**
- Partial success handling
- Detailed error logging
- Failed orders don't stop others
- Comprehensive error messages

### 6. **Transaction IDs**
All executed orders return Kraken transaction IDs:
```typescript
{
  executed: true,
  txid: ["OXXXXX-XXXXX-XXXXXX"],
  executionTime: "2025-10-20T14:30:00.000Z"
}
```

---

## Example Workflows

### Basic Rebalance
```typescript
// 1. Check if needed
const check = await needsRebalancing('1');
if (!check.needed) return;

// 2. Get preview
const preview = await getRebalancePreview('1');
console.log(`Will execute ${preview.ordersPlanned.length} orders`);

// 3. Execute
const result = await rebalancePortfolio('1', { dryRun: false });
console.log(`Success: ${result.success}`);
```

### Conservative Rebalance
```typescript
// Only rebalance if difference > €100
// Execute max 3 orders per run
const result = await rebalancePortfolio('1', {
  rebalanceThreshold: 100,
  maxOrdersPerRebalance: 3,
  dryRun: false,
});
```

### Custom Allocation
```typescript
// Use custom target weights
const result = await rebalancePortfolio('custom', {
  targetWeights: {
    BTC: 50,
    ETH: 30,
    SOL: 20,
  },
});
```

---

## Best Practices

### 1. **Always Preview First**
```typescript
const preview = await getRebalancePreview(portfolioId);
// Review orders before executing
const result = await rebalancePortfolio(portfolioId, { dryRun: false });
```

### 2. **Set Appropriate Thresholds**
```typescript
// For small portfolios (< €1,000)
rebalanceThreshold: 5

// For medium portfolios (€1,000 - €10,000)
rebalanceThreshold: 20

// For large portfolios (> €10,000)
rebalanceThreshold: 100
```

### 3. **Monitor Execution**
```typescript
const result = await rebalancePortfolio(portfolioId, { dryRun: false });

// Check for partial failures
if (result.summary.failedOrders > 0) {
  console.error('Some orders failed:', result.errors);
  // Take corrective action
}
```

### 4. **Schedule Rebalancing**
```typescript
// Check daily, rebalance only if needed
const check = await needsRebalancing(portfolioId, 50);
if (check.needed) {
  await rebalancePortfolio(portfolioId, { dryRun: false });
}
```

### 5. **Log Results**
```typescript
// Save rebalance results to database
await saveRebalanceHistory({
  portfolioId,
  timestamp: result.timestamp,
  ordersExecuted: result.summary.successfulOrders,
  valueTraded: result.summary.totalValueTraded,
});
```

---

## Troubleshooting

### "Kraken API credentials not configured"
```bash
# Set environment variables
export KRAKEN_API_KEY="your-key"
export KRAKEN_API_SECRET="your-secret"
```

### "Invalid target weights: Total weights sum to X%"
```typescript
// Ensure weights sum to exactly 100%
{ BTC: 40, ETH: 30, SOL: 30 }  // ✓ Valid (100%)
{ BTC: 40, ETH: 30, SOL: 20 }  // ✗ Invalid (90%)
```

### "Failed to execute order: Insufficient balance"
```
Portfolio may have changed between calculation and execution.
Run preview again or increase threshold.
```

### Rate Limiting
```
Built-in 1-second delay between orders.
Adjust maxOrdersPerRebalance if hitting limits.
```

---

## Performance

- **Fetch Holdings:** ~500ms
- **Fetch Prices:** ~300ms per pair
- **Calculate Orders:** <10ms
- **Execute Order:** ~1-2s per order
- **Total:** ~5-30s depending on order count

---

## Future Enhancements

- [ ] Limit order support (custom prices)
- [ ] Fee optimization (minimize trading costs)
- [ ] Slippage protection
- [ ] Multi-currency support (USD, GBP)
- [ ] Scheduled rebalancing (cron jobs)
- [ ] Email/webhook notifications
- [ ] Performance tracking
- [ ] Backtesting support
- [ ] Risk metrics
- [ ] Portfolio comparison

---

## Related Documentation

- `/lib/KRAKEN_API.md` - Kraken API client
- `/lib/PORTFOLIO.md` - Portfolio calculations
- `/lib/rebalance.example.ts` - Usage examples

