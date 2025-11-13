import { NextRequest, NextResponse } from 'next/server';
import { activateLicense } from '@/lib/license';
import { getCurrentUser } from '@/lib/auth';

// Force dynamic - never cache license activation
export const dynamic = 'force-dynamic';

/**
 * POST /api/license/activate
 * Activate a license key
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseKey } = body;

    if (!licenseKey) {
      return NextResponse.json(
        { error: 'License key is required' },
        { status: 400 }
      );
    }

    // Get current user if authenticated
    const user = await getCurrentUser();
    const activatedBy = user?.email || 'system';

    // Activate the license
    const result = await activateLicense(licenseKey, activatedBy);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      license: result.license,
    });
  } catch (error) {
    console.error('Error activating license:', error);
    return NextResponse.json(
      { error: 'Failed to activate license' },
      { status: 500 }
    );
  }
}

