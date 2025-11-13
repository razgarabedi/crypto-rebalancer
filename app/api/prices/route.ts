import { NextResponse } from 'next/server';
import krakenClient from '@/lib/kraken';

/**
 * GET /api/prices
 * Fetches latest cryptocurrency prices from Kraken
 * 
 * Query Parameters:
 *   - symbols: Comma-separated list of symbols (e.g., "BTC,ETH,SOL")
 *              Default: "BTC,ETH,SOL,ADA"
 *   - quoteCurrency: Quote currency (default: "EUR")
 *                    Options: EUR, USD, GBP
 * 
 * Response:
 * {
 *   success: true,
 *   prices: [
 *     {
 *       symbol: "BTC",
 *       price: 50000.00,
 *       ask: 50010.00,
 *       bid: 49990.00,
 *       volume24h: 1234.56,
 *       pair: "XXBTZEUR"
 *     },
 *     ...
 *   ],
 *   quoteCurrency: "EUR",
 *   timestamp: "2025-10-20T12:00:00.000Z"
 * }
 */
export async function GET(request: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');
    const quoteCurrency = searchParams.get('quoteCurrency') || 'EUR';

    // Default symbols if none provided
    const symbols = symbolsParam
      ? symbolsParam.split(',').map(s => s.trim().toUpperCase())
      : ['BTC', 'ETH', 'SOL', 'ADA'];

    // Validate quote currency
    const validQuoteCurrencies = ['EUR', 'USD', 'GBP'];
    if (!validQuoteCurrencies.includes(quoteCurrency.toUpperCase())) {
      return NextResponse.json(
        {
          error: 'Invalid quote currency',
          message: `Quote currency must be one of: ${validQuoteCurrencies.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Convert symbols to Kraken trading pairs
    const getTradingPair = (symbol: string): string => {
      const quote = quoteCurrency.toUpperCase();
      const pairMapping: Record<string, Record<string, string>> = {
        'EUR': {
          'BTC': 'XXBTZEUR',
          'ETH': 'XETHZEUR',
          'SOL': 'SOLEUR',
          'ADA': 'ADAEUR',
          'DOT': 'DOTEUR',
          'MATIC': 'MATICEUR',
          'LINK': 'LINKEUR',
          'AVAX': 'AVAXEUR',
          'ATOM': 'ATOMEUR',
        },
        'USD': {
          'BTC': 'XXBTZUSD',
          'ETH': 'XETHZUSD',
          'SOL': 'SOLUSD',
          'ADA': 'ADAUSD',
          'DOT': 'DOTUSD',
          'MATIC': 'MATICUSD',
          'LINK': 'LINKUSD',
          'AVAX': 'AVAXUSD',
          'ATOM': 'ATOMUSD',
        },
        'GBP': {
          'BTC': 'XXBTZGBP',
          'ETH': 'XETHZGBP',
          'SOL': 'SOLGBP',
          'ADA': 'ADAGBP',
          'DOT': 'DOTGBP',
        },
      };

      return pairMapping[quote]?.[symbol] || `${symbol}${quote}`;
    };

    const pricePairs = symbols.map(getTradingPair);

    // Fetch ticker prices from Kraken
    const tickers = await krakenClient.getTickerPrices(pricePairs);

    // Normalize symbol names (remove X prefix, Z suffix, and staking suffixes)
    const normalizeSymbol = (pair: string): string => {
      let symbol = pair
        .replace(quoteCurrency.toUpperCase(), '')
        .replace(/^X+/, '')
        .replace(/Z$/, '');
      
      // Remove suffixes (.F for Flex staking, .S for Staked, .M for Margin, etc.)
      symbol = symbol.replace(/\.(F|S|M|P)$/i, '');
      
      // Handle special cases
      const mapping: Record<string, string> = {
        'XBT': 'BTC',
        'XXBT': 'BTC',
        'XETH': 'ETH',
      };
      
      return mapping[symbol] || symbol;
    };

    // Format response with normalized symbols
    const prices = tickers.map(ticker => ({
      symbol: normalizeSymbol(ticker.symbol),
      price: ticker.price,
      ask: ticker.ask,
      bid: ticker.bid,
      volume24h: ticker.volume24h,
      pair: ticker.symbol,
      spread: ticker.ask - ticker.bid,
      spreadPercentage: ((ticker.ask - ticker.bid) / ticker.price) * 100,
    }));

    return NextResponse.json({
      success: true,
      prices,
      quoteCurrency: quoteCurrency.toUpperCase(),
      timestamp: new Date().toISOString(),
      count: prices.length,
    });

  } catch (error) {
    console.error('Error fetching prices:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch prices',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

