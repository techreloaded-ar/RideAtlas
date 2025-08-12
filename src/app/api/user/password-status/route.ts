import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/core/prisma';

/**
 * HEAD endpoint to check if user has existing password
 * Returns 200 if user has password, 404 if not
 * Follows REST conventions for status checking
 */
export async function HEAD() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse(null, { status: 401 });
    }

    // Query user password status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true }
    });

    if (!user) {
      return new NextResponse(null, { status: 404 });
    }

    // Return 200 if user has password, 404 if not
    return new NextResponse(null, { 
      status: user.password ? 200 : 404 
    });

  } catch (error) {
    console.error('Error checking password status:', error);
    return new NextResponse(null, { status: 500 });
  }
}
