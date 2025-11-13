import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserKrakenClient } from '@/lib/kraken-user';

interface OrderRequest {
  pair: string;
  type: 'buy' | 'sell';
  volume: number;
  price?: number;
}

/**
 * POST /api/kraken/order
 * Place an order on Kraken using user-specific credentials
 * 
 * Request body:
 * {
 *   "pair": "XXBTZUSD",
 *   "type": "buy",
 *   "volume": 0.001,
 *   "price": 50000 // optional, for limit orders
 * }
 */
export async function POST(request: Request) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const body: OrderRequest = await request.json();

    // Validate request body
    if (!body.pair || !body.type || !body.volume) {
      return NextResponse.json(
        { error: 'Missing required fields: pair, type, volume' },
        { status: 400 }
      );
    }

    if (body.type !== 'buy' && body.type !== 'sell') {
      return NextResponse.json(
        { error: 'Invalid order type. Must be "buy" or "sell"' },
        { status: 400 }
      );
    }

    if (body.volume <= 0) {
      return NextResponse.json(
        { error: 'Volume must be greater than 0' },
        { status: 400 }
      );
    }

    // Get user's Kraken client with their credentials
    const krakenClient = await getUserKrakenClient(user.id);

    // Place the order
    const result = await krakenClient.placeOrder(
      body.pair,
      body.type,
      body.volume,
      body.price
    );

    return NextResponse.json({ 
      success: true,
      order: {
        txid: result.txid,
        description: result.description,
        pair: body.pair,
        type: body.type,
        volume: body.volume,
        price: body.price,
        orderType: body.price ? 'limit' : 'market',
      }
    });
  } catch (error) {
    console.error('Error placing Kraken order:', error);
    
    // Handle credentials not configured error with 400 instead of 500
    if (error instanceof Error && error.name === 'CredentialsNotConfiguredError') {
      return NextResponse.json(
        { 
          error: 'Credentials not configured',
          message: error.message,
          needsCredentials: true
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to place order',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

