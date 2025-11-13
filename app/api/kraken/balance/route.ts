import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserKrakenClient } from '@/lib/kraken-user';

/**
 * GET /api/kraken/balance
 * Get account balance from Kraken using user-specific credentials
 */
export async function GET() {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // Get user's Kraken client with their credentials
    const krakenClient = await getUserKrakenClient(user.id);

    const balance = await krakenClient.getAccountBalance();

    // Normalize Kraken asset names (remove X prefix and suffixes like .F, .S, .M)
    const normalizeSymbol = (asset: string): string => {
      // Remove suffixes (.F for Flex staking, .S for Staked, .M for Margin, etc.)
      let normalized = asset.replace(/\.(F|S|M|P)$/i, '');
      
      // Remove X prefix
      normalized = normalized.replace(/^X+/, '');
      
      // Handle special mappings
      const mapping: Record<string, string> = {
        'XBT': 'BTC',
        'XXBT': 'BTC',
        'XETH': 'ETH',
        'ETH2': 'ETH',
        'XETH2': 'ETH',
      };
      
      const base = asset.replace(/\.(F|S|M|P)$/i, '');
      const mapped = mapping[base] || mapping[asset];
      const result = mapped || normalized;
      // Collapse known ETH staking variants to ETH (e.g., ETH2, ETH2.S, XETH2)
      if (/^X?ETH\d+$/i.test(base) || /^ETH\d+$/i.test(result)) {
        return 'ETH';
      }
      return result;
    };

    // Format the balance for easier consumption
    const formattedBalance = Object.entries(balance).map(([asset, amount]) => ({
      asset: normalizeSymbol(asset),
      rawAsset: asset, // Keep original for reference
      amount: parseFloat(amount),
    }));

    return NextResponse.json({ 
      success: true,
      balance: formattedBalance,
      raw: balance 
    });
  } catch (error) {
    // Handle credentials not configured error with 400 instead of 500
    if (error instanceof Error && error.name === 'CredentialsNotConfiguredError') {
      console.log('Kraken credentials not configured for user');
      return NextResponse.json(
        { 
          error: 'Credentials not configured',
          message: error.message,
          needsCredentials: true
        },
        { status: 400 }
      );
    }
    
    // Log unexpected errors
    console.error('Error fetching Kraken balance:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch account balance',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

