import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/encryption';
import { KrakenClient } from '@/lib/kraken';

/**
 * GET /api/auth/kraken-credentials
 * Check if user has Kraken credentials configured
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

    // Get user's credentials (encrypted)
    const userDetails = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        krakenApiKey: true,
        krakenApiSecret: true,
        krakenApiAddedAt: true,
      },
    });

    const hasCredentials = !!(userDetails?.krakenApiKey && userDetails?.krakenApiSecret);

    return NextResponse.json({
      success: true,
      hasCredentials,
      addedAt: userDetails?.krakenApiAddedAt,
      // For security, we don't return the actual credentials
      // Just whether they exist
    });
  } catch (error) {
    console.error('Error checking Kraken credentials:', error);
    return NextResponse.json(
      { error: 'Failed to check credentials' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/kraken-credentials
 * Add or update Kraken API credentials
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { apiKey, apiSecret, testConnection } = body;

    // Validate input
    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'API key and secret are required' },
        { status: 400 }
      );
    }

    // Basic validation
    if (typeof apiKey !== 'string' || typeof apiSecret !== 'string') {
      return NextResponse.json(
        { error: 'Invalid credentials format' },
        { status: 400 }
      );
    }

    if (apiKey.trim().length === 0 || apiSecret.trim().length === 0) {
      return NextResponse.json(
        { error: 'API key and secret cannot be empty' },
        { status: 400 }
      );
    }

    // Test connection if requested
    if (testConnection) {
      try {
        const testClient = new KrakenClient({
          apiKey: apiKey.trim(),
          apiSecret: apiSecret.trim(),
        });

        // Try to get account balance to verify credentials work
        await testClient.getAccountBalance();
      } catch (error) {
        console.error('Kraken credentials test failed:', error);
        return NextResponse.json(
          { 
            error: 'Failed to verify credentials with Kraken API',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 400 }
        );
      }
    }

    // Encrypt credentials
    const encryptedApiKey = encrypt(apiKey.trim());
    const encryptedApiSecret = encrypt(apiSecret.trim());

    // Save to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        krakenApiKey: encryptedApiKey,
        krakenApiSecret: encryptedApiSecret,
        krakenApiAddedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Kraken API credentials saved successfully',
      addedAt: new Date(),
    });
  } catch (error) {
    console.error('Error saving Kraken credentials:', error);
    return NextResponse.json(
      { error: 'Failed to save credentials' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/kraken-credentials
 * Remove Kraken API credentials
 */
export async function DELETE() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // Remove credentials from database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        krakenApiKey: null,
        krakenApiSecret: null,
        krakenApiAddedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Kraken API credentials removed successfully',
    });
  } catch (error) {
    console.error('Error removing Kraken credentials:', error);
    return NextResponse.json(
      { error: 'Failed to remove credentials' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/kraken-credentials/test
 * Test Kraken API credentials
 */
export async function PUT() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    // Get user's encrypted credentials
    const userDetails = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        krakenApiKey: true,
        krakenApiSecret: true,
      },
    });

    if (!userDetails?.krakenApiKey || !userDetails?.krakenApiSecret) {
      return NextResponse.json(
        { error: 'No credentials configured' },
        { status: 400 }
      );
    }

    // Decrypt and test
    try {
      const apiKey = decrypt(userDetails.krakenApiKey);
      const apiSecret = decrypt(userDetails.krakenApiSecret);

      const testClient = new KrakenClient({ apiKey, apiSecret });
      
      // Test with a simple API call
      const balance = await testClient.getAccountBalance();

      return NextResponse.json({
        success: true,
        message: 'Credentials are valid',
        tested: true,
        hasBalance: Object.keys(balance).length > 0,
      });
    } catch (error) {
      console.error('Kraken credentials test failed:', error);
      return NextResponse.json(
        { 
          error: 'Credentials test failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error testing Kraken credentials:', error);
    return NextResponse.json(
      { error: 'Failed to test credentials' },
      { status: 500 }
    );
  }
}

