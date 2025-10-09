import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token mancante o non valido' },
        { status: 400 }
      );
    }

    // Find token record with user relation
    const tokenRecord = await prisma.emailChangeToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Token non valido' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (tokenRecord.expiresAt < new Date()) {
      // Delete expired token
      await prisma.emailChangeToken.delete({
        where: { id: tokenRecord.id },
      });

      return NextResponse.json(
        { error: 'Token scaduto. Richiedi un nuovo cambio email.' },
        { status: 400 }
      );
    }

    // Check if new email is still available (race condition protection)
    const existingUser = await prisma.user.findUnique({
      where: { email: tokenRecord.newEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email già in uso da un altro account' },
        { status: 409 }
      );
    }

    // Update user email and delete token in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: tokenRecord.userId },
        data: {
          email: tokenRecord.newEmail,
          emailVerified: new Date(),
        },
      }),
      prisma.emailChangeToken.delete({
        where: { id: tokenRecord.id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Email modificata con successo',
    });
  } catch (error) {
    console.error('Error verifying email change:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
