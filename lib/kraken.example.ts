/**
 * Example usage of the Kraken client
 * This file demonstrates how to use the Kraken API helper functions
 */

import krakenClient, { KrakenClient } from './kraken';

// Example 1: Using the singleton instance (uses environment variables)
async function exampleUsingSingleton() {
  try {
    // Get account balance
    const balance = await krakenClient.getAccountBalance();
    console.log('Account Balance:', balance);

    // Get ticker prices for multiple symbols
    const tickers = await krakenClient.getTickerPrices([
      'XXBTZUSD', // Bitcoin/USD
      'XETHZUSD', // Ethereum/USD
      'SOLUSD',   // Solana/USD
    ]);
    console.log('Ticker Prices:', tickers);

    // Place a limit buy order for 0.001 BTC at $50,000
    const limitOrder = await krakenClient.placeOrder(
      'XXBTZUSD',
      'buy',
      0.001,
      50000
    );
    console.log('Limit Order:', limitOrder);

    // Place a market sell order for 0.5 ETH
    const marketOrder = await krakenClient.placeOrder(
      'XETHZUSD',
      'sell',
      0.5
    );
    console.log('Market Order:', marketOrder);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example 2: Creating a custom instance with explicit credentials
async function exampleWithCustomCredentials() {
  const customClient = new KrakenClient({
    apiKey: 'your-api-key-here',
    apiSecret: 'your-api-secret-here',
  });

  try {
    // Check if authenticated
    if (!customClient.isAuthenticated()) {
      console.log('API credentials not configured');
      return;
    }

    const balance = await customClient.getAccountBalance();
    console.log('Balance:', balance);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example 3: Using in an API route
async function exampleApiRouteHandler() {
  try {
    // Get current prices for portfolio rebalancing
    const symbols = ['XXBTZUSD', 'XETHZUSD', 'SOLUSD'];
    const prices = await krakenClient.getTickerPrices(symbols);

    // Format the response
    const priceMap = prices.reduce((acc, ticker) => {
      acc[ticker.symbol] = {
        price: ticker.price,
        ask: ticker.ask,
        bid: ticker.bid,
        volume24h: ticker.volume24h,
      };
      return acc;
    }, {} as Record<string, unknown>);

    return priceMap;
  } catch (error) {
    throw new Error(`Failed to fetch prices: ${error}`);
  }
}

// Example 4: Rebalancing logic with order placement
async function exampleRebalancePortfolio() {
  try {
    // Get current balance
    const balance = await krakenClient.getAccountBalance();

    // Get current prices
    const tickers = await krakenClient.getTickerPrices(['XXBTZUSD', 'XETHZUSD']);

    // Calculate rebalancing actions
    // (This is simplified - real logic would be more complex)
    const btcBalance = parseFloat(balance['XXBT'] || '0');
    const targetBtcValue = 5000; // USD
    const btcPrice = tickers.find(t => t.symbol === 'XXBTZUSD')?.price || 0;

    if (btcPrice > 0) {
      const currentBtcValue = btcBalance * btcPrice;
      const difference = targetBtcValue - currentBtcValue;

      if (Math.abs(difference) > 100) { // $100 threshold
        const volumeToTrade = Math.abs(difference) / btcPrice;

        if (difference > 0) {
          // Need to buy BTC
          const order = await krakenClient.placeOrder(
            'XXBTZUSD',
            'buy',
            volumeToTrade
          );
          console.log('Buy order placed:', order);
        } else {
          // Need to sell BTC
          const order = await krakenClient.placeOrder(
            'XXBTZUSD',
            'sell',
            volumeToTrade
          );
          console.log('Sell order placed:', order);
        }
      }
    }
  } catch (error) {
    console.error('Rebalancing error:', error);
  }
}

// Export examples (for documentation purposes)
export {
  exampleUsingSingleton,
  exampleWithCustomCredentials,
  exampleApiRouteHandler,
  exampleRebalancePortfolio,
};

