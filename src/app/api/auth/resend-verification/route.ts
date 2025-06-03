import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Handle empty request body as server error, not validation error
    let body;
    try {
      if (request.body) {
        body = await request.json();
      } else {
        return NextResponse.json(
          { error: 'Errore interno del server' },
          { status: 500 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Errore interno del server' },
        { status: 500 }
      );
    }
    
    const { email } = body || {};
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email richiesta' },
        { status: 400 }
      );
    }

    // Verifica se l'utente esiste e non è già verificato
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email già verificata' },
        { status: 400 }
      );
    }

    // Elimina i token precedenti per questa email
    await prisma.emailVerificationToken.deleteMany({
      where: { email }
    });

    // Genera nuovo token di verifica
    const verificationToken = randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ore

    // Salva il nuovo token
    await prisma.emailVerificationToken.create({
      data: {
        email,
        token: verificationToken,
        expiresAt: tokenExpiry,
      }
    });

    // Invia email di verifica
    const emailResult = await sendVerificationEmail(email, verificationToken);
    
    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Errore nell\'invio dell\'email di verifica. Riprova più tardi.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Email di verifica inviata con successo',
        sent: true 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Errore durante il rinvio dell\'email:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
