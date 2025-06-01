import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Schema di validazione per la richiesta
const setupPasswordSchema = z.object({
  token: z.string().min(1, 'Token richiesto'),
  password: z.string().min(8, 'La password deve contenere almeno 8 caratteri')
    .regex(/[A-Z]/, 'La password deve contenere almeno una lettera maiuscola')
    .regex(/[a-z]/, 'La password deve contenere almeno una lettera minuscola')
    .regex(/[0-9]/, 'La password deve contenere almeno un numero'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = setupPasswordSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Dati non validi', 
          details: result.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { token, password } = result.data;

    // Trova il token di verifica
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token }
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Token non valido' },
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
        { error: 'Token scaduto' },
        { status: 400 }
      );
    }

    // Trova l'utente associato al token
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      );
    }

    // Verifica che l'utente non abbia già una password impostata
    if (user.password !== null) {
      // Elimina il token e restituisci errore
      await prisma.emailVerificationToken.delete({
        where: { token }
      });
      
      return NextResponse.json(
        { error: 'Password già impostata per questo utente' },
        { status: 400 }
      );
    }

    // Hash della nuova password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Aggiorna l'utente con la password e marca come verificato
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        emailVerified: new Date(), // Marca l'email come verificata
      }
    });

    // Elimina il token utilizzato
    await prisma.emailVerificationToken.delete({
      where: { token }
    });

    return NextResponse.json(
      { 
        success: true,
        message: 'Password impostata con successo!'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Errore durante il setup password:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// Endpoint GET per verificare la validità del token (utilizzato dalla pagina setup-password)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    console.log('🔍 Verifica token setup password:', token);

    if (!token) {
      return NextResponse.json(
        { error: 'Token mancante' },
        { status: 400 }
      );
    }

    // Trova il token di verifica
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token }
    });

    console.log('🔑 Token trovato nel database:', verificationToken ? 'SI' : 'NO');
    if (verificationToken) {
      console.log('📅 Token scadenza:', verificationToken.expiresAt);
      console.log('🕐 Data corrente:', new Date());
    }

    if (!verificationToken) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Token non valido' 
        },
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
        { 
          valid: false,
          error: 'Token scaduto' 
        },
        { status: 400 }
      );
    }

    // Trova l'utente associato al token
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.email }
    });

    if (!user) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Utente non trovato' 
        },
        { status: 404 }
      );
    }

    // Verifica che l'utente non abbia già una password impostata
    if (user.password !== null) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Password già impostata per questo utente' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        valid: true,
        message: 'Token valido'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Errore durante la verifica del token:', error);
    return NextResponse.json(
      { 
        valid: false,
        error: 'Errore interno del server' 
      },
      { status: 500 }
    );
  }
}
