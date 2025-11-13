/**
 * Rate Limiter Utility
 * Implements token bucket algorithm for API rate limiting
 * 
 * Kraken API Limits:
 * - Public endpoints: 15 requests per 3 seconds
 * - Private endpoints: More complex tier system, but we use conservative 15/3s
 */

interface RateLimiterConfig {
  maxRequests: number;  // Maximum requests allowed
  timeWindowMs: number; // Time window in milliseconds
}

interface QueuedRequest {
  resolve: () => void;
  reject: (error: Error) => void;
  timestamp: number;
}

export class RateLimiter {
  private config: RateLimiterConfig;
  private requestTimestamps: number[] = [];
  private queue: QueuedRequest[] = [];
  private isProcessing: boolean = false;

  constructor(config: RateLimiterConfig) {
    this.config = config;
  }

  /**
   * Wait for rate limit availability before proceeding
   * Returns a promise that resolves when it's safe to make a request
   */
  async acquire(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        resolve,
        reject,
        timestamp: Date.now(),
      });

      // Process queue if not already processing
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process the queue of waiting requests
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      // Clean up old timestamps outside the time window
      const now = Date.now();
      const cutoffTime = now - this.config.timeWindowMs;
      this.requestTimestamps = this.requestTimestamps.filter(
        (timestamp) => timestamp > cutoffTime
      );

      // Check if we can process the next request
      if (this.requestTimestamps.length < this.config.maxRequests) {
        // We have capacity, process the next request
        const request = this.queue.shift();
        if (request) {
          this.requestTimestamps.push(now);
          request.resolve();
        }
      } else {
        // We're at capacity, wait until the oldest request expires
        const oldestTimestamp = this.requestTimestamps[0];
        const waitTime = oldestTimestamp + this.config.timeWindowMs - now;

        if (waitTime > 0) {
          await this.sleep(waitTime);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limiter status
   */
  getStatus(): {
    requestsInWindow: number;
    maxRequests: number;
    queueLength: number;
    available: number;
  } {
    const now = Date.now();
    const cutoffTime = now - this.config.timeWindowMs;
    const activeRequests = this.requestTimestamps.filter(
      (timestamp) => timestamp > cutoffTime
    ).length;

    return {
      requestsInWindow: activeRequests,
      maxRequests: this.config.maxRequests,
      queueLength: this.queue.length,
      available: this.config.maxRequests - activeRequests,
    };
  }

  /**
   * Clear all pending requests in the queue
   */
  clearQueue(): void {
    const error = new Error('Rate limiter queue cleared');
    this.queue.forEach((request) => request.reject(error));
    this.queue = [];
  }

  /**
   * Reset the rate limiter (clears timestamps and queue)
   */
  reset(): void {
    this.requestTimestamps = [];
    this.clearQueue();
  }
}

// Singleton instances for different API types
export const krakenPublicRateLimiter = new RateLimiter({
  maxRequests: 15,
  timeWindowMs: 3000, // 3 seconds
});

export const krakenPrivateRateLimiter = new RateLimiter({
  maxRequests: 15,
  timeWindowMs: 3000, // 3 seconds (conservative limit)
});

/**
 * Decorator function to apply rate limiting to async functions
 */
export function withRateLimit<T extends (...args: unknown[]) => Promise<unknown>>(
  rateLimiter: RateLimiter,
  fn: T
): T {
  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    await rateLimiter.acquire();
    return await fn(...args) as Awaited<ReturnType<T>>;
  }) as T;
}

export default RateLimiter;

