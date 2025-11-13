import { NextResponse } from 'next/server';
import krakenClient from '@/lib/kraken';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pairs = searchParams.get('pairs')?.split(',') || ['XXBTZUSD', 'XETHZUSD', 'SOLUSD'];
    
    const tickers = await krakenClient.getTickerPrices(pairs);
    
    // Format as a simple price map for backward compatibility
    const prices = tickers.reduce((acc, ticker) => {
      acc[ticker.symbol] = ticker.price;
      return acc;
    }, {} as Record<string, number>);
    
    return NextResponse.json({ prices, tickers });
  } catch (error) {
    console.error('Error fetching ticker:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticker data' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

