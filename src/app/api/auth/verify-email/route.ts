import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/core/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token di verifica mancante' },
        { status: 400 }
      );
    }

    // Trova il token di verifica
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token }
    });

    if (!verificationToken) {
      // Controlla se l'utente è già verificato con questa email
      // Questo può accadere se il token è già stato utilizzato
      const existingUser = await prisma.user.findFirst({
        where: { 
          emailVerified: { not: null }
        }
      });
      
      if (existingUser) {
        return NextResponse.json(
          { 
            message: 'Email già verificata con successo!',
            verified: true,
            alreadyVerified: true
          },
          { status: 200 }
        );
      }
      
      return NextResponse.json(
        { error: 'Token di verifica non valido' },
        { status: 400 }
      );
    }

    // Controlla se il token è scaduto
    if (verificationToken.expiresAt < new Date()) {
      // Elimina il token scaduto
      await prisma.emailVerificationToken.delete({
        where: { token }
      });
      
      return NextResponse.json(
        { error: 'Token di verifica scaduto' },
        { status: 400 }
      );
    }

    // Controlla se l'utente è già verificato
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.email }
    });

    if (user?.emailVerified) {
      // L'utente è già verificato, elimina il token e restituisci successo
      await prisma.emailVerificationToken.delete({
        where: { token }
      });
      
      return NextResponse.json(
        { 
          message: 'Email già verificata con successo!',
          verified: true,
          alreadyVerified: true
        },
        { status: 200 }
      );
    }

    // Verifica l'utente
    await prisma.user.update({
      where: { email: verificationToken.email },
      data: { emailVerified: new Date() }
    });

    // Elimina il token utilizzato
    await prisma.emailVerificationToken.delete({
      where: { token }
    });

    return NextResponse.json(
      { 
        message: 'Email verificata con successo!',
        verified: true 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Errore durante la verifica email:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token di verifica mancante' },
        { status: 400 }
      );
    }

    // Trova il token di verifica
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token }
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Token di verifica non valido' },
        { status: 400 }
      );
    }

    // Controlla se il token è scaduto
    if (verificationToken.expiresAt < new Date()) {
      // Elimina il token scaduto
      await prisma.emailVerificationToken.delete({
        where: { token }
      });
      
      return NextResponse.json(
        { error: 'Token di verifica scaduto' },
        { status: 400 }
      );
    }

    // Verifica l'utente
    await prisma.user.update({
      where: { email: verificationToken.email },
      data: { emailVerified: new Date() }
    });

    // Elimina il token utilizzato
    await prisma.emailVerificationToken.delete({
      where: { token }
    });

    return NextResponse.json(
      { 
        message: 'Email verificata con successo!',
        verified: true 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Errore durante la verifica email:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
