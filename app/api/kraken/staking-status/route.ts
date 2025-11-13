import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserKrakenClient } from '@/lib/kraken-user';

/**
 * GET /api/kraken/staking-status
 * Returns raw staking status from Kraken (e.g., ETH2.S positions)
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const krakenClient = await getUserKrakenClient(user.id);

    const status = await krakenClient.getStakingStatus();

    return NextResponse.json({ success: true, status });
  } catch (error) {
    // Expose structured error for easier debugging
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';


