import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, deleteSession } from '@/lib/auth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        // Delete session from database
        await deleteSession(payload.sessionId);
      }
    }

    // Clear cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete('session');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}

