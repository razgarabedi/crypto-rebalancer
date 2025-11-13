import { NextResponse } from 'next/server';
import axios from 'axios';

const KRAKEN_API_URL = 'https://api.kraken.com/0/public';

/**
 * GET /api/kraken/pairs
 * Fetch all available trading pairs from Kraken
 */
export async function GET() {
  try {
    const response = await axios.get(`${KRAKEN_API_URL}/AssetPairs`);
    const data = response.data;

    if (data.error && data.error.length > 0) {
      return NextResponse.json(
        { error: data.error.join(', ') },
        { status: 400 }
      );
    }

    // Extract trading pairs
    const pairs = Object.entries(data.result)
      .filter(([, info]) => {
        // Only include pairs with EUR or USD quote
        const quote = (info as Record<string, unknown>).quote as string;
        return quote === 'ZEUR' || quote === 'ZUSD' || quote === 'EUR' || quote === 'USD';
      })
      .map(([pair, info]) => {
        const infoObj = info as Record<string, unknown>;
        const base = infoObj.base as string;
        const quote = infoObj.quote as string;
        
        // Clean up the pair name for display
        const displayBase = base.replace(/^X+|^Z+/, '');
        const displayQuote = quote.replace(/^X+|^Z+/, '');
        
        return {
          pair: pair,
          wsname: infoObj.wsname,
          base: base,
          quote: quote,
          display: `${displayBase}/${displayQuote}`,
          altname: infoObj.altname,
        };
      })
      .sort((a, b) => a.display.localeCompare(b.display));

    return NextResponse.json({
      success: true,
      pairs,
      count: pairs.length,
    });
  } catch (error) {
    console.error('Error fetching trading pairs:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch trading pairs',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

