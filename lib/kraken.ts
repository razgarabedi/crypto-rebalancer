import crypto from 'crypto';
import axios from 'axios';
import { krakenPublicRateLimiter, krakenPrivateRateLimiter } from './rate-limiter';

const KRAKEN_API_URL = 'https://api.kraken.com';
const API_VERSION = '0';

interface KrakenConfig {
  apiKey?: string;
  apiSecret?: string;
}

interface AccountBalance {
  [asset: string]: string;
}

interface TickerPrice {
  symbol: string;
  price: number;
  ask: number;
  bid: number;
  volume24h: number;
}

interface OrderResponse {
  descr: {
    order: string;
  };
  txid: string[];
}

interface KrakenApiResponse<T> {
  error: string[];
  result: T;
}

/**
 * Kraken API Client with built-in rate limiting
 * Automatically respects Kraken's 15 requests per 3 seconds limit
 */
class KrakenClient {
  private apiKey: string;
  private apiSecret: string;

  constructor(config: KrakenConfig = {}) {
    this.apiKey = config.apiKey || process.env.KRAKEN_API_KEY || '';
    this.apiSecret = config.apiSecret || process.env.KRAKEN_API_SECRET || '';
  }

  /**
   * Get rate limiter status for monitoring
   */
  getRateLimiterStatus() {
    return {
      public: krakenPublicRateLimiter.getStatus(),
      private: krakenPrivateRateLimiter.getStatus(),
    };
  }

  /**
   * Generate authentication signature for private API calls
   */
  private generateSignature(
    path: string,
    nonce: number,
    postData: string
  ): string {
    const message = nonce + postData;
    const secret = Buffer.from(this.apiSecret, 'base64');
    const hash = crypto.createHash('sha256').update(message).digest();
    const hmac = crypto
      .createHmac('sha512', secret)
      .update(path + hash.toString('binary'), 'binary')
      .digest('base64');

    return hmac;
  }

  /**
   * Make a public API request (no authentication required)
   * Automatically rate-limited to 15 requests per 3 seconds
   */
  private async publicRequest<T>(
    endpoint: string,
    params: Record<string, string | number> = {}
  ): Promise<T> {
    // Wait for rate limit before making request
    await krakenPublicRateLimiter.acquire();
    
    const url = `${KRAKEN_API_URL}/${API_VERSION}/public/${endpoint}`;

    try {
      const response = await axios.get<KrakenApiResponse<T>>(url, { params });

      if (response.data.error && response.data.error.length > 0) {
        throw new Error(`Kraken API Error: ${response.data.error.join(', ')}`);
      }

      return response.data.result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Kraken API Request Failed: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Make a private API request (requires authentication)
   * Automatically rate-limited to 15 requests per 3 seconds
   */
  private async privateRequest<T>(
    endpoint: string,
    params: Record<string, string | number> = {}
  ): Promise<T> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error(
        'Kraken API credentials not configured. Set KRAKEN_API_KEY and KRAKEN_API_SECRET environment variables.'
      );
    }

    // Wait for rate limit before making request
    await krakenPrivateRateLimiter.acquire();

    const nonce = Date.now() * 1000;
    const path = `/${API_VERSION}/private/${endpoint}`;
    const url = `${KRAKEN_API_URL}${path}`;

    const postData = new URLSearchParams({
      nonce: nonce.toString(),
      ...params,
    }).toString();

    const signature = this.generateSignature(path, nonce, postData);

    try {
      const response = await axios.post<KrakenApiResponse<T>>(url, postData, {
        headers: {
          'API-Key': this.apiKey,
          'API-Sign': signature,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.data.error && response.data.error.length > 0) {
        throw new Error(`Kraken API Error: ${response.data.error.join(', ')}`);
      }

      return response.data.result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Kraken API Request Failed: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Get account balance for all assets
   * Returns a map of asset names to their balance
   */
  async getAccountBalance(): Promise<AccountBalance> {
    return this.privateRequest<AccountBalance>('Balance');
  }

  /**
   * Get current ticker prices for specified symbols
   * @param symbols - Array of trading pair symbols (e.g., ['XXBTZUSD', 'XETHZUSD'])
   * @returns Array of ticker price information
   */
  async getTickerPrices(symbols: string[]): Promise<TickerPrice[]> {
    const response = await this.publicRequest<{
      [pair: string]: {
        a: [string, string, string]; // ask [price, whole lot volume, lot volume]
        b: [string, string, string]; // bid [price, whole lot volume, lot volume]
        c: [string, string]; // last trade closed [price, lot volume]
        v: [string, string]; // volume [today, last 24 hours]
        p: [string, string]; // volume weighted average price [today, last 24 hours]
        t: [number, number]; // number of trades [today, last 24 hours]
        l: [string, string]; // low [today, last 24 hours]
        h: [string, string]; // high [today, last 24 hours]
        o: string; // today's opening price
      };
    }>('Ticker', { pair: symbols.join(',') });

    const tickers: TickerPrice[] = [];

    for (const [symbol, data] of Object.entries(response)) {
      tickers.push({
        symbol,
        price: parseFloat(data.c[0]), // last trade price
        ask: parseFloat(data.a[0]), // ask price
        bid: parseFloat(data.b[0]), // bid price
        volume24h: parseFloat(data.v[1]), // 24h volume
      });
    }

    return tickers;
  }

  /**
   * Get staking status (active stakes and rewards)
   */
  async getStakingStatus(): Promise<unknown> {
    return this.privateRequest<unknown>('Staking/StakeStatus');
  }

  /**
   * Place a market or limit order
   * @param pair - Asset pair to trade (e.g., 'XXBTZUSD')
   * @param type - Order type: 'buy' or 'sell'
   * @param volume - Order volume (amount to buy/sell)
   * @param price - Optional limit price. If not provided, will place a market order
   * @returns Order transaction ID and description
   */
  async placeOrder(
    pair: string,
    type: 'buy' | 'sell',
    volume: number,
    price?: number
  ): Promise<{ txid: string[]; description: string }> {
    const orderParams: Record<string, string | number> = {
      pair,
      type,
      ordertype: price ? 'limit' : 'market',
      volume: volume.toString(),
    };

    // Add price for limit orders
    if (price) {
      orderParams.price = price.toString();
    }

    // Validate order params
    if ((orderParams as Record<string, unknown>).validate === undefined) {
      orderParams.validate = 'false'; // Set to 'true' to validate without placing
    }

    const result = await this.privateRequest<OrderResponse>('AddOrder', orderParams);

    return {
      txid: result.txid,
      description: result.descr.order,
    };
  }

  /**
   * Check if API credentials are configured
   */
  isAuthenticated(): boolean {
    return !!(this.apiKey && this.apiSecret);
  }
}

// Export a singleton instance
const krakenClient = new KrakenClient();

export default krakenClient;
export { KrakenClient, type AccountBalance, type TickerPrice };

