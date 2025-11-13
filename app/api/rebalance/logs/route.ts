import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/rebalance/logs
 * Fetch rebalance history logs with pagination
 */
export async function GET(request: Request) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const portfolioId = searchParams.get('portfolioId');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      portfolio: {
        userId: string;
      };
      portfolioId?: string;
    } = {
      portfolio: {
        userId: user.id,
      },
    };

    // Filter by portfolio if specified
    if (portfolioId) {
      where.portfolioId = portfolioId;
    }

    // Fetch logs with pagination
    const [logs, total] = await Promise.all([
      prisma.rebalanceHistory.findMany({
        where,
        include: {
          portfolio: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          executedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.rebalanceHistory.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching rebalance logs:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch rebalance logs',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

