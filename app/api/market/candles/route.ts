import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const KRAKEN_API_URL = 'https://api.kraken.com/0/public';

/**
 * GET /api/market/candles
 * Fetch OHLC (candlestick) data from Kraken
 * 
 * Query params:
 * - symbol: Trading pair (e.g., BTCEUR, ETHEUR)
 * - interval: Time interval in minutes (1, 5, 15, 30, 60, 240, 1440, 10080, 21600)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'XXBTZEUR'; // Default to BTC/EUR
    const interval = parseInt(searchParams.get('interval') || '60'); // Default to 1 hour
    const since = searchParams.get('since'); // Optional: Unix timestamp

    // Validate interval
    const validIntervals = [1, 5, 15, 30, 60, 240, 1440, 10080, 21600];
    if (!validIntervals.includes(interval)) {
      return NextResponse.json(
        { error: `Invalid interval. Must be one of: ${validIntervals.join(', ')}` },
        { status: 400 }
      );
    }

    // Build request URL
    const url = `${KRAKEN_API_URL}/OHLC`;
    const params: Record<string, string | number> = {
      pair: symbol,
      interval: interval,
    };

    if (since) {
      params.since = since;
    }

    // Fetch from Kraken
    const response = await axios.get(url, { params });
    const data = response.data;

    if (data.error && data.error.length > 0) {
      return NextResponse.json(
        { error: data.error.join(', ') },
        { status: 400 }
      );
    }

    // Extract the OHLC data
    const pairKey = Object.keys(data.result).find(key => key !== 'last');
    if (!pairKey) {
      return NextResponse.json(
        { error: 'No data returned from Kraken' },
        { status: 500 }
      );
    }

    const ohlcData = data.result[pairKey];
    const lastId = data.result.last;

    // Transform data to a more usable format
    const candles = ohlcData.map((candle: (string | number)[]) => ({
      time: candle[0], // Unix timestamp
      open: parseFloat(String(candle[1])),
      high: parseFloat(String(candle[2])),
      low: parseFloat(String(candle[3])),
      close: parseFloat(String(candle[4])),
      vwap: parseFloat(String(candle[5])), // Volume weighted average price
      volume: parseFloat(String(candle[6])),
      count: parseInt(String(candle[7])), // Number of trades
    }));

    return NextResponse.json({
      success: true,
      symbol,
      interval,
      candles,
      lastId,
      count: candles.length,
    });
  } catch (error) {
    console.error('Error fetching candle data:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch candle data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

