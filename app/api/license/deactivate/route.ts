import { NextResponse } from 'next/server';
import { deactivateLicense } from '@/lib/license';
import { requireAuth } from '@/lib/auth';

/**
 * POST /api/license/deactivate
 * Deactivate the current license (admin only)
 */
export async function POST() {
  try {
    // Require authentication
    await requireAuth();

    await deactivateLicense();

    return NextResponse.json({
      success: true,
      message: 'License deactivated successfully',
    });
  } catch (error) {
    console.error('Error deactivating license:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to deactivate license' },
      { status: 500 }
    );
  }
}

