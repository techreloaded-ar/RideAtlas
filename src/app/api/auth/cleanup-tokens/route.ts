import { NextRequest, NextResponse } from 'next/server';
import { cleanExpiredPasswordResetTokens } from '@/lib/auth/password-reset';

// Endpoint per cleanup dei token scaduti
// Può essere chiamato da un cron job o task scheduler
export async function POST(request: NextRequest) {
  try {
    // Verifica che la richiesta provenga da una fonte autorizzata
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CLEANUP_TOKEN;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const deletedCount = await cleanExpiredPasswordResetTokens();
    
    return NextResponse.json({
      message: `Cleanup completato: ${deletedCount} token scaduti rimossi`
    });

  } catch (error) {
    console.error('Errore durante cleanup token:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// GET per statistiche (solo in development)
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Endpoint disponibile solo in development' },
      { status: 403 }
    );
  }

  try {
    const { prisma } = await import('@/lib/core/prisma');
    
    const totalTokens = await prisma.passwordResetToken.count();
    const expiredTokens = await prisma.passwordResetToken.count({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    return NextResponse.json({
      totalTokens,
      expiredTokens,
      activeTokens: totalTokens - expiredTokens
    });

  } catch (error) {
    console.error('Errore durante recupero statistiche:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}