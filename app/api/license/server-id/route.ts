import { NextResponse } from 'next/server';
import { getServerId } from '@/lib/license';

/**
 * GET /api/license/server-id
 * Get the unique server ID for this installation
 */
export async function GET() {
  try {
    const serverId = await getServerId();
    
    return NextResponse.json({ serverId });
  } catch (error) {
    console.error('Error getting server ID:', error);
    return NextResponse.json(
      { error: 'Failed to get server ID' },
      { status: 500 }
    );
  }
}

