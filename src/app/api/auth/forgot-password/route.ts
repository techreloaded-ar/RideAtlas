import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generatePasswordResetToken, canRequestPasswordReset } from '@/lib/auth/password-reset';
import { sendPasswordResetEmail } from '@/lib/core/email';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email non valida'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validazione input
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Email non valida' },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Rate limiting: verifica se l'utente può richiedere un reset
    const canRequest = await canRequestPasswordReset(email);
    if (!canRequest) {
      return NextResponse.json(
        { error: 'Troppe richieste. Riprova tra un\'ora.' },
        { status: 429 }
      );
    }

    // Genera token di reset
    const token = await generatePasswordResetToken(email);
    
    // Anche se l'utente non esiste, non rivelare questa informazione
    // per motivi di sicurezza (previene enumerazione degli utenti)
    if (token) {
      // Invia email di reset
      const emailResult = await sendPasswordResetEmail(email, token);
      
      if (!emailResult.success) {
        console.error('Errore invio email reset password:', emailResult.error);
        return NextResponse.json(
          { error: 'Errore durante l\'invio dell\'email' },
          { status: 500 }
        );
      }
    }

    // Risposta sempre positiva per sicurezza
    return NextResponse.json({
      message: 'Se l\'email esiste nel nostro sistema, riceverai un link per reimpostare la password.'
    });

  } catch (error) {
    console.error('Errore API forgot-password:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}