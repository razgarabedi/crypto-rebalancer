# Kraken API Integration

This document describes the Kraken REST API integration for the Kraken Rebalancer project.

## Files

### `/lib/kraken.ts`
The main Kraken API client with authentication and core functionality.

**Exports:**
- `krakenClient` (default) - Singleton instance using environment variables
- `KrakenClient` - Class for creating custom instances
- `AccountBalance` - Type for account balance response
- `TickerPrice` - Type for ticker price data

**Methods:**
- `getAccountBalance()` - Fetch account balances (private, requires auth)
- `getTickerPrices(symbols)` - Get current prices for multiple trading pairs (public)
- `placeOrder(pair, type, volume, price?)` - Place market or limit orders (private, requires auth)
- `isAuthenticated()` - Check if API credentials are configured

### `/lib/kraken.example.ts`
Example usage patterns demonstrating how to use the Kraken client in various scenarios:
- Using the singleton instance
- Creating custom instances with explicit credentials
- Using in API routes
- Portfolio rebalancing logic

### `/lib/kraken-api.ts`
Legacy API client (kept for backward compatibility). Consider migrating to the new `/lib/kraken.ts`.

## API Routes

### `GET /api/kraken/balance`
Get account balance from Kraken.

**Response:**
```json
{
  "success": true,
  "balance": [
    { "asset": "XXBT", "amount": 0.5 },
    { "asset": "XETH", "amount": 2.0 }
  ],
  "raw": { "XXBT": "0.5000000000", "XETH": "2.0000000000" }
}
```

### `GET /api/kraken/prices?symbols=XXBTZUSD,XETHZUSD`
Get current ticker prices.

**Query Parameters:**
- `symbols` (optional) - Comma-separated list of trading pairs

**Response:**
```json
{
  "success": true,
  "tickers": [
    {
      "symbol": "XXBTZUSD",
      "price": 50000.0,
      "ask": 50010.0,
      "bid": 49990.0,
      "volume24h": 1234.5
    }
  ],
  "count": 1
}
```

### `POST /api/kraken/order`
Place an order on Kraken.

**Request Body:**
```json
{
  "pair": "XXBTZUSD",
  "type": "buy",
  "volume": 0.001,
  "price": 50000
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "txid": ["OXXXXX-XXXXX-XXXXXX"],
    "description": "buy 0.00100000 XBTUSD @ limit 50000.0",
    "pair": "XXBTZUSD",
    "type": "buy",
    "volume": 0.001,
    "price": 50000,
    "orderType": "limit"
  }
}
```

### `GET /api/ticker?pairs=XXBTZUSD,XETHZUSD`
Backward-compatible ticker endpoint (updated to use new Kraken client).

## Environment Variables

```bash
KRAKEN_API_KEY=your_api_key_here
KRAKEN_API_SECRET=your_api_secret_here
```

## Authentication

The Kraken API uses HMAC-SHA512 signatures for private endpoints:

1. Generate a nonce (timestamp in microseconds)
2. Create a message with nonce + POST data
3. Hash the message with SHA-256
4. HMAC the result with your API secret (base64 decoded) using SHA-512
5. Base64 encode the HMAC result
6. Include the signature in the `API-Sign` header

This is all handled automatically by the `KrakenClient` class.

## Common Trading Pairs

- `XXBTZUSD` - Bitcoin/USD
- `XETHZUSD` - Ethereum/USD
- `SOLUSD` - Solana/USD
- `ADAUSD` - Cardano/USD
- `DOTUSD` - Polkadot/USD
- `MATICUSD` - Polygon/USD

## Error Handling

The client includes comprehensive error handling:

- Returns descriptive error messages from Kraken API
- Validates authentication before making private requests
- Checks for missing or invalid parameters
- Provides clear error responses in API routes

## Usage Examples

### Get Account Balance
```typescript
import krakenClient from '@/lib/kraken';

const balance = await krakenClient.getAccountBalance();
console.log(balance); // { XXBT: "0.5000", XETH: "2.0000" }
```

### Get Current Prices
```typescript
const tickers = await krakenClient.getTickerPrices(['XXBTZUSD', 'XETHZUSD']);
console.log(tickers[0].price); // 50000.0
```

### Place a Market Order
```typescript
const order = await krakenClient.placeOrder('XXBTZUSD', 'buy', 0.001);
console.log(order.txid); // ["OXXXXX-XXXXX-XXXXXX"]
```

### Place a Limit Order
```typescript
const order = await krakenClient.placeOrder('XXBTZUSD', 'sell', 0.001, 51000);
console.log(order.description); // "sell 0.00100000 XBTUSD @ limit 51000.0"
```

## Testing

To test the Kraken API integration without placing real orders:

1. Set up your API credentials in `.env.local`
2. Use the `/api/kraken/balance` endpoint to verify authentication
3. Use the `/api/kraken/prices` endpoint to fetch public data (no auth needed)
4. For order testing, implement a validation flag or use Kraken's testnet

## Security Notes

⚠️ **Important Security Considerations:**

1. Never commit API keys to version control
2. Use environment variables for credentials
3. Restrict API key permissions in Kraken settings
4. Implement rate limiting for production deployments
5. Use HTTPS for all API communications
6. Consider implementing IP whitelisting in Kraken settings
7. Log all trading activities for audit purposes

## Future Enhancements

- [ ] Add support for more Kraken endpoints (order history, trades, etc.)
- [ ] Implement WebSocket support for real-time price updates
- [ ] Add order validation before placement
- [ ] Implement retry logic with exponential backoff
- [ ] Add support for advanced order types (stop-loss, take-profit)
- [ ] Create a mock client for testing
- [ ] Add rate limiting to respect Kraken's API limits

## Resources

- [Kraken API Documentation](https://docs.kraken.com/rest/)
- [Kraken API Support](https://support.kraken.com/hc/en-us/articles/360000920306-Kraken-API)
- [Asset Pairs](https://api.kraken.com/0/public/AssetPairs)

