import crypto from 'crypto';
import axios from 'axios';
import { KrakenTickerResponse, KrakenBalanceResponse, KrakenAssetPairsResponse } from '@/types';
import { krakenPublicRateLimiter, krakenPrivateRateLimiter } from './rate-limiter';

const KRAKEN_API_URL = 'https://api.kraken.com';

export class KrakenAPI {
  private apiKey: string;
  private apiSecret: string;

  constructor(apiKey: string = '', apiSecret: string = '') {
    this.apiKey = apiKey || process.env.KRAKEN_API_KEY || '';
    this.apiSecret = apiSecret || process.env.KRAKEN_API_SECRET || '';
  }

  /**
   * Generate authentication signature for private API calls
   */
  private getSignature(path: string, request: Record<string, string | number>, nonce: number): string {
    const stringified = Object.fromEntries(
      Object.entries(request).map(([key, value]) => [key, String(value)])
    );
    const message = new URLSearchParams(stringified).toString();
    const secret = Buffer.from(this.apiSecret, 'base64');
    const hash = crypto.createHash('sha256');
    const hmac = crypto.createHmac('sha512', secret);
    
    const hashDigest = hash.update(nonce + message).digest();
    const hmacDigest = hmac.update(path + hashDigest).digest('base64');
    
    return hmacDigest;
  }

  /**
   * Make a public API request (no authentication required)
   */
  private async publicRequest<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
    // Wait for rate limit before making request
    await krakenPublicRateLimiter.acquire();
    
    const url = `${KRAKEN_API_URL}/0/public/${endpoint}`;
    const response = await axios.get(url, { params });
    
    if (response.data.error && response.data.error.length > 0) {
      throw new Error(response.data.error[0]);
    }
    
    return response.data;
  }

  /**
   * Make a private API request (requires authentication)
   */
  private async privateRequest<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
    // Wait for rate limit before making request
    await krakenPrivateRateLimiter.acquire();
    
    const nonce = Date.now() * 1000;
    const path = `/0/private/${endpoint}`;
    const url = `${KRAKEN_API_URL}${path}`;
    
    const request = { nonce: nonce.toString(), ...params };
    const signature = this.getSignature(path, { nonce, ...params }, nonce);
    
    const response = await axios.post(url, new URLSearchParams(request).toString(), {
      headers: {
        'API-Key': this.apiKey,
        'API-Sign': signature,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    if (response.data.error && response.data.error.length > 0) {
      throw new Error(response.data.error[0]);
    }
    
    return response.data;
  }

  /**
   * Get ticker information for asset pairs
   */
  async getTicker(pairs: string[]): Promise<KrakenTickerResponse> {
    return this.publicRequest<KrakenTickerResponse>('Ticker', {
      pair: pairs.join(','),
    });
  }

  /**
   * Get account balance (requires authentication)
   */
  async getBalance(): Promise<KrakenBalanceResponse> {
    return this.privateRequest<KrakenBalanceResponse>('Balance');
  }

  /**
   * Get tradeable asset pairs
   */
  async getAssetPairs(): Promise<KrakenAssetPairsResponse> {
    return this.publicRequest<KrakenAssetPairsResponse>('AssetPairs');
  }

  /**
   * Get current price for a specific pair
   */
  async getPrice(pair: string): Promise<number> {
    const ticker = await this.getTicker([pair]);
    const pairData = ticker.result[Object.keys(ticker.result)[0]];
    return parseFloat(pairData.c[0]);
  }

  /**
   * Get prices for multiple pairs
   */
  async getPrices(pairs: string[]): Promise<Record<string, number>> {
    const ticker = await this.getTicker(pairs);
    const prices: Record<string, number> = {};
    
    for (const [pair, data] of Object.entries(ticker.result)) {
      prices[pair] = parseFloat(data.c[0]);
    }
    
    return prices;
  }
}

// Export a singleton instance for public API calls
export const krakenAPI = new KrakenAPI();

