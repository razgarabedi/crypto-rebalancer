/**
 * Price Cache Management API
 * Provides endpoints to manage the centralized price cache
 */

import { NextResponse } from 'next/server';
import { priceCache } from '@/lib/price-cache';

/**
 * GET /api/price-cache
 * Get cache statistics
 */
export async function GET() {
  try {
    const stats = priceCache.getCacheStats();
    
    return NextResponse.json({
      success: true,
      stats,
      message: 'Price cache statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting price cache stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get price cache statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/price-cache
 * Clear price cache
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (userId) {
      // Clear cache for specific user
      priceCache.clearUserCache(userId);
      return NextResponse.json({
        success: true,
        message: `Price cache cleared for user ${userId}`
      });
    } else {
      // Clear all cache
      priceCache.clearAllCache();
      return NextResponse.json({
        success: true,
        message: 'All price cache cleared'
      });
    }
  } catch (error) {
    console.error('Error clearing price cache:', error);
    return NextResponse.json(
      { 
        error: 'Failed to clear price cache',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
