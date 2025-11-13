# API Reference

Complete reference for all API endpoints in the Kraken Portfolio Rebalancer.

---

## 📋 Table of Contents

1. [Holdings API](#holdings-api)
2. [Prices API](#prices-api)
3. [Rebalance API](#rebalance-api)
4. [Portfolio Management API](#portfolio-management-api)
5. [Scheduler API](#scheduler-api)
6. [Kraken Direct API](#kraken-direct-api)

---

## Holdings API

### `GET /api/holdings`

Returns current cryptocurrency holdings with EUR values calculated from live Kraken prices.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `symbols` | string | No | All | Comma-separated list of symbols to filter (e.g., "BTC,ETH,SOL") |

#### Response

```json
{
  "success": true,
  "holdings": [
    {
      "symbol": "BTC",
      "amount": 0.5,
      "value": 25000.00,
      "percentage": 45.45,
      "price": 50000.00
    },
    {
      "symbol": "ETH",
      "amount": 10.0,
      "value": 30000.00,
      "percentage": 54.55,
      "price": 3000.00
    }
  ],
  "totalValue": 55000.00,
  "currency": "EUR",
  "timestamp": "2025-10-20T12:00:00.000Z"
}
```

#### Error Responses

**401 Unauthorized** - API credentials not configured
```json
{
  "error": "Kraken API credentials not configured",
  "message": "Please set KRAKEN_API_KEY and KRAKEN_API_SECRET environment variables"
}
```

**500 Internal Server Error** - Failed to fetch data
```json
{
  "error": "Failed to fetch holdings",
  "message": "Error details...",
  "timestamp": "2025-10-20T12:00:00.000Z"
}
```

#### Example Usage

```bash
# Get all holdings
curl http://localhost:3000/api/holdings

# Get specific holdings only
curl http://localhost:3000/api/holdings?symbols=BTC,ETH

# Using JavaScript/TypeScript
const response = await fetch('/api/holdings?symbols=BTC,ETH,SOL');
const data = await response.json();

if (data.success) {
  console.log(`Total portfolio value: €${data.totalValue}`);
  data.holdings.forEach(h => {
    console.log(`${h.symbol}: ${h.amount} (€${h.value})`);
  });
}
```

---

## Prices API

### `GET /api/prices`

Fetches latest cryptocurrency prices from Kraken in specified quote currency.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `symbols` | string | No | BTC,ETH,SOL,ADA | Comma-separated list of symbols |
| `quoteCurrency` | string | No | EUR | Quote currency (EUR, USD, GBP) |

#### Response

```json
{
  "success": true,
  "prices": [
    {
      "symbol": "BTC",
      "price": 50000.00,
      "ask": 50010.00,
      "bid": 49990.00,
      "volume24h": 1234.56,
      "pair": "XXBTZEUR",
      "spread": 20.00,
      "spreadPercentage": 0.04
    },
    {
      "symbol": "ETH",
      "price": 3000.00,
      "ask": 3005.00,
      "bid": 2995.00,
      "volume24h": 5678.90,
      "pair": "XETHZEUR",
      "spread": 10.00,
      "spreadPercentage": 0.33
    }
  ],
  "quoteCurrency": "EUR",
  "timestamp": "2025-10-20T12:00:00.000Z",
  "count": 2
}
```

#### Error Responses

**400 Bad Request** - Invalid quote currency
```json
{
  "error": "Invalid quote currency",
  "message": "Quote currency must be one of: EUR, USD, GBP"
}
```

**500 Internal Server Error** - Failed to fetch prices
```json
{
  "error": "Failed to fetch prices",
  "message": "Error details...",
  "timestamp": "2025-10-20T12:00:00.000Z"
}
```

#### Example Usage

```bash
# Get default prices (BTC, ETH, SOL, ADA in EUR)
curl http://localhost:3000/api/prices

# Get specific symbols
curl http://localhost:3000/api/prices?symbols=BTC,ETH,DOT

# Get prices in USD
curl http://localhost:3000/api/prices?symbols=BTC,ETH&quoteCurrency=USD

# Using JavaScript/TypeScript
const response = await fetch('/api/prices?symbols=BTC,ETH,SOL&quoteCurrency=EUR');
const data = await response.json();

if (data.success) {
  data.prices.forEach(p => {
    console.log(`${p.symbol}: €${p.price} (24h volume: ${p.volume24h})`);
  });
}
```

---

## Rebalance API

### `POST /api/rebalance`

Triggers portfolio rebalancing using comprehensive rebalancing logic from `/lib/rebalance.ts`.

#### Request Body

```json
{
  "portfolioId": "clx123abc",
  "targetWeights": {
    "BTC": 40,
    "ETH": 30,
    "SOL": 20,
    "ADA": 10
  },
  "dryRun": false,
  "rebalanceThreshold": 10,
  "maxOrdersPerRebalance": 10
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `portfolioId` | string | Yes | - | Portfolio ID (from database or custom) |
| `targetWeights` | object | No | From DB | Target allocation percentages (must sum to 100) |
| `dryRun` | boolean | No | false | Preview without executing orders |
| `rebalanceThreshold` | number | No | 10 | Minimum EUR difference to trigger trade |
| `maxOrdersPerRebalance` | number | No | - | Maximum number of orders to execute |

#### Response

```json
{
  "success": true,
  "portfolioId": "clx123abc",
  "timestamp": "2025-10-20T12:00:00.000Z",
  "portfolio": {
    "totalValue": 55000.00,
    "holdings": [
      {
        "symbol": "BTC",
        "amount": 0.5,
        "value": 25000.00,
        "percentage": 45.45
      }
    ],
    "currency": "EUR"
  },
  "ordersPlanned": [
    {
      "symbol": "BTC",
      "side": "sell",
      "volume": 0.05,
      "currentValue": 25000.00,
      "targetValue": 22000.00,
      "difference": -3000.00
    }
  ],
  "ordersExecuted": [
    {
      "symbol": "BTC",
      "side": "sell",
      "volume": 0.05,
      "executed": true,
      "txid": ["O12345-ABCDE-FGHIJ"],
      "executionTime": "2025-10-20T12:00:05.000Z"
    }
  ],
  "errors": [],
  "dryRun": false,
  "summary": {
    "totalOrders": 1,
    "successfulOrders": 1,
    "failedOrders": 0,
    "skippedOrders": 0,
    "totalValueTraded": 3000.00
  }
}
```

#### Error Responses

**400 Bad Request** - Missing required fields
```json
{
  "error": "Missing required field",
  "message": "portfolioId is required"
}
```

**500 Internal Server Error** - Rebalancing failed
```json
{
  "error": "Failed to execute rebalancing",
  "message": "Error details...",
  "timestamp": "2025-10-20T12:00:00.000Z"
}
```

#### Example Usage

```bash
# Execute rebalancing
curl -X POST http://localhost:3000/api/rebalance \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioId": "clx123abc",
    "targetWeights": {"BTC": 50, "ETH": 50},
    "dryRun": false
  }'

# Preview rebalancing (dry run)
curl -X POST http://localhost:3000/api/rebalance \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioId": "clx123abc",
    "dryRun": true
  }'

# Using JavaScript/TypeScript
const response = await fetch('/api/rebalance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    portfolioId: 'clx123abc',
    targetWeights: { BTC: 40, ETH: 30, SOL: 20, ADA: 10 },
    dryRun: false,
    rebalanceThreshold: 10
  })
});

const result = await response.json();

if (result.success) {
  console.log(`Rebalanced! ${result.summary.successfulOrders} orders executed`);
  console.log(`Total value traded: €${result.summary.totalValueTraded}`);
} else {
  console.error('Rebalancing failed:', result.errors);
}
```

---

### `GET /api/rebalance`

Check if portfolio needs rebalancing or get a preview.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `portfolioId` | string | Yes | - | Portfolio ID |
| `action` | string | No | check | Action type: "check" or "preview" |
| `threshold` | number | No | 10 | Minimum EUR difference |

#### Response (action=check)

```json
{
  "portfolioId": "clx123abc",
  "needed": true,
  "ordersCount": 3,
  "portfolio": {
    "totalValue": 55000.00,
    "holdings": [...]
  },
  "threshold": 10,
  "timestamp": "2025-10-20T12:00:00.000Z"
}
```

#### Response (action=preview)

Same as POST response with `dryRun: true`

#### Example Usage

```bash
# Check if rebalancing is needed
curl "http://localhost:3000/api/rebalance?portfolioId=clx123abc&action=check"

# Get full preview
curl "http://localhost:3000/api/rebalance?portfolioId=clx123abc&action=preview&threshold=5"

# Using JavaScript/TypeScript
const response = await fetch('/api/rebalance?portfolioId=clx123abc&action=check');
const data = await response.json();

if (data.needed) {
  console.log(`Rebalancing needed! ${data.ordersCount} orders recommended`);
} else {
  console.log('Portfolio is balanced');
}
```

---

## Portfolio Management API

### `GET /api/portfolios/manage`

Get all portfolios or a specific portfolio.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `id` | string | No | - | Portfolio ID (returns single portfolio) |
| `includeHistory` | boolean | No | false | Include rebalance history |

#### Response (all portfolios)

```json
{
  "success": true,
  "portfolios": [
    {
      "id": "clx123abc",
      "name": "Conservative Portfolio",
      "targetWeights": {"BTC": 60, "ETH": 40},
      "rebalanceEnabled": true,
      "rebalanceInterval": "monthly",
      "lastRebalancedAt": "2025-10-15T12:00:00.000Z",
      "createdAt": "2025-10-01T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### Example Usage

```bash
# Get all portfolios
curl http://localhost:3000/api/portfolios/manage

# Get specific portfolio
curl http://localhost:3000/api/portfolios/manage?id=clx123abc

# Get portfolio with history
curl "http://localhost:3000/api/portfolios/manage?id=clx123abc&includeHistory=true"
```

---

### `POST /api/portfolios/manage`

Create a new portfolio.

#### Request Body

```json
{
  "name": "My Portfolio",
  "targetWeights": {
    "BTC": 40,
    "ETH": 30,
    "SOL": 20,
    "ADA": 10
  },
  "rebalanceEnabled": true,
  "rebalanceInterval": "weekly",
  "rebalanceThreshold": 10,
  "maxOrdersPerRebalance": 10
}
```

#### Example Usage

```bash
curl -X POST http://localhost:3000/api/portfolios/manage \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aggressive Portfolio",
    "targetWeights": {"BTC": 30, "ETH": 30, "SOL": 40},
    "rebalanceEnabled": true,
    "rebalanceInterval": "daily"
  }'
```

---

### `PUT /api/portfolios/manage`

Update an existing portfolio.

#### Request Body

```json
{
  "id": "clx123abc",
  "name": "Updated Name",
  "rebalanceEnabled": false
}
```

#### Example Usage

```bash
curl -X PUT http://localhost:3000/api/portfolios/manage \
  -H "Content-Type: application/json" \
  -d '{
    "id": "clx123abc",
    "rebalanceInterval": "monthly",
    "rebalanceThreshold": 15
  }'
```

---

### `DELETE /api/portfolios/manage`

Delete a portfolio.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Portfolio ID to delete |

#### Example Usage

```bash
curl -X DELETE "http://localhost:3000/api/portfolios/manage?id=clx123abc"
```

---

## Scheduler API

### `GET /api/scheduler`

Get scheduler status and configuration.

#### Response

```json
{
  "running": true,
  "schedule": "0 * * * *",
  "config": {
    "checkIntervalMinutes": 60,
    "enableLogging": true,
    "dryRunMode": false
  },
  "portfolioCount": 3,
  "nextCheck": "2025-10-20T13:00:00.000Z"
}
```

#### Example Usage

```bash
curl http://localhost:3000/api/scheduler
```

---

### `POST /api/scheduler`

Start, stop, or restart the scheduler.

#### Request Body

```json
{
  "action": "start" | "stop" | "restart"
}
```

#### Example Usage

```bash
# Start scheduler
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'

# Stop scheduler
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "stop"}'

# Restart scheduler
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "restart"}'
```

---

### `POST /api/scheduler/trigger`

Manually trigger rebalancing for a specific portfolio.

#### Request Body

```json
{
  "portfolioId": "clx123abc"
}
```

#### Example Usage

```bash
curl -X POST http://localhost:3000/api/scheduler/trigger \
  -H "Content-Type: application/json" \
  -d '{"portfolioId": "clx123abc"}'
```

---

## Kraken Direct API

Direct access to Kraken API endpoints (wrapper).

### `GET /api/kraken/balance`

Get Kraken account balance.

```bash
curl http://localhost:3000/api/kraken/balance
```

### `GET /api/kraken/prices`

Get ticker prices from Kraken.

```bash
curl "http://localhost:3000/api/kraken/prices?symbols=XXBTZEUR,XETHZEUR"
```

### `POST /api/kraken/order`

Place an order on Kraken.

```bash
curl -X POST http://localhost:3000/api/kraken/order \
  -H "Content-Type: application/json" \
  -d '{
    "pair": "XXBTZEUR",
    "type": "buy",
    "volume": 0.01,
    "ordertype": "market"
  }'
```

---

## Authentication

Most endpoints require Kraken API credentials to be configured:

```bash
# .env.local
KRAKEN_API_KEY=your_api_key
KRAKEN_API_SECRET=your_api_secret
DATABASE_URL=postgresql://...
```

**Public endpoints** (no auth required):
- `GET /api/prices`

**Private endpoints** (require Kraken credentials):
- `GET /api/holdings`
- `POST /api/rebalance` (for execution, preview works without)
- All `/api/kraken/*` endpoints

---

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error category",
  "message": "Detailed error message",
  "timestamp": "2025-10-20T12:00:00.000Z"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing API credentials)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Rate Limiting

Kraken API has rate limits:
- **Public API**: 1 request per second
- **Private API**: Variable based on tier (15-20 requests per second)

The API client automatically handles:
- Request delays (1 second between orders)
- Error messages for rate limit exceeded
- Retry logic (coming soon)

---

## Testing

### Test with curl

```bash
# 1. Test prices (no auth needed)
curl http://localhost:3000/api/prices

# 2. Test holdings (requires auth)
curl http://localhost:3000/api/holdings

# 3. Test rebalance preview (dry run)
curl -X POST http://localhost:3000/api/rebalance \
  -H "Content-Type: application/json" \
  -d '{
    "portfolioId": "test-123",
    "targetWeights": {"BTC": 50, "ETH": 50},
    "dryRun": true
  }'
```

### Test with JavaScript

```javascript
// Test function
async function testAPIs() {
  // 1. Get prices
  const pricesRes = await fetch('/api/prices?symbols=BTC,ETH');
  const prices = await pricesRes.json();
  console.log('Prices:', prices);

  // 2. Get holdings
  const holdingsRes = await fetch('/api/holdings');
  const holdings = await holdingsRes.json();
  console.log('Holdings:', holdings);

  // 3. Check rebalance status
  const checkRes = await fetch('/api/rebalance?portfolioId=clx123&action=check');
  const status = await checkRes.json();
  console.log('Rebalance needed:', status.needed);
}

testAPIs();
```

---

## TypeScript Types

```typescript
// Prices response
interface PricesResponse {
  success: boolean;
  prices: {
    symbol: string;
    price: number;
    ask: number;
    bid: number;
    volume24h: number;
    pair: string;
    spread: number;
    spreadPercentage: number;
  }[];
  quoteCurrency: string;
  timestamp: string;
  count: number;
}

// Holdings response
interface HoldingsResponse {
  success: boolean;
  holdings: {
    symbol: string;
    amount: number;
    value: number;
    percentage: number;
    price: number;
  }[];
  totalValue: number;
  currency: string;
  timestamp: string;
}

// Rebalance response
interface RebalanceResponse {
  success: boolean;
  portfolioId: string;
  timestamp: string;
  portfolio: {
    totalValue: number;
    holdings: any[];
    currency: string;
  };
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
  };
}
```

---

## Best Practices

1. **Always test with `dryRun: true` first**
   ```javascript
   await fetch('/api/rebalance', {
     method: 'POST',
     body: JSON.stringify({ portfolioId: 'xxx', dryRun: true })
   });
   ```

2. **Check rebalance status before executing**
   ```javascript
   const check = await fetch('/api/rebalance?portfolioId=xxx&action=check');
   if (check.needed) {
     // Execute rebalancing
   }
   ```

3. **Handle errors gracefully**
   ```javascript
   try {
     const res = await fetch('/api/holdings');
     if (!res.ok) {
       const error = await res.json();
       console.error('API Error:', error.message);
     }
   } catch (err) {
     console.error('Network error:', err);
   }
   ```

4. **Use appropriate intervals**
   - Don't poll too frequently (respect rate limits)
   - Use 30-60 second intervals for live data
   - Use WebSockets for real-time updates (coming soon)

---

**For more details, see:**
- [Dashboard Documentation](../dashboard/DASHBOARD.md)
- [Scheduler Guide](../../lib/SCHEDULER.md)
- [Rebalancing Implementation](../../lib/REBALANCE_IMPLEMENTATION.md)

