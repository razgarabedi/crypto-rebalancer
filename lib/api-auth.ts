import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, UserPayload } from './auth';

/**
 * Middleware to protect API routes
 */
export async function withAuth(
  handler: (request: NextRequest, user: UserPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const user = await getCurrentUser();
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized - Please login' },
          { status: 401 }
        );
      }

      return handler(request, user);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      );
    }
  };
}

