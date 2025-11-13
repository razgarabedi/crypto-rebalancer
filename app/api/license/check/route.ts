import { NextResponse } from 'next/server';
import { checkLicense } from '@/lib/license';

/**
 * GET /api/license/check
 * Check if the system has a valid license
 */
export async function GET() {
  try {
    const licenseInfo = await checkLicense();
    
    return NextResponse.json(licenseInfo);
  } catch (error) {
    console.error('Error checking license:', error);
    return NextResponse.json(
      { error: 'Failed to check license' },
      { status: 500 }
    );
  }
}

