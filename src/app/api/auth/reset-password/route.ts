import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resetPassword, validatePasswordResetToken, isTokenSafeToUse, invalidateAllPasswordResetTokens } from '@/lib/auth/password-reset';
import { passwordSchema } from '@/lib/auth/password-validation';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token richiesto'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Conferma password richiesta'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Le password non coincidono',
  path: ['confirmPassword'],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validazione input
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => err.message).join(', ');
      return NextResponse.json(
        { error: errors },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    // Verifica che il token sia sicuro da usare (anti-replay)
    const isSafe = await isTokenSafeToUse(token);
    if (!isSafe) {
      return NextResponse.json(
        { error: 'Token non valido o utilizzato troppo presto' },
        { status: 400 }
      );
    }

    // Esegui il reset della password
    const success = await resetPassword(token, password);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Token non valido o scaduto' },
        { status: 400 }
      );
    }

    // Per sicurezza aggiuntiva, invalida tutti gli altri token per questo utente
    const email = await validatePasswordResetToken(token);
    if (email) {
      await invalidateAllPasswordResetTokens(email);
    }

    return NextResponse.json({
      message: 'Password reimpostata con successo'
    });

  } catch (error) {
    console.error('Errore API reset-password:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// GET per validare un token senza resettare la password
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token richiesto' },
        { status: 400 }
      );
    }

    // Valida il token
    const email = await validatePasswordResetToken(token);
    
    if (!email) {
      return NextResponse.json(
        { error: 'Token non valido o scaduto' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      email // Utile per mostrare l'email nel form
    });

  } catch (error) {
    console.error('Errore validazione token reset:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}