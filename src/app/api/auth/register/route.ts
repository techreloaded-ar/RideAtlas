// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/core/prisma';
import { z } from 'zod';
import { sendVerificationEmail } from '@/lib/core/email';
import { randomBytes } from 'crypto';
import { passwordSchema } from '@/lib/auth/password-validation';

// Schema di validazione per la registrazione
const registerSchema = z.object({
  name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri'),
  email: z.string().email('Inserisci un indirizzo email valido'),
  password: passwordSchema,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validazione dei dati
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Dati non validi', 
          details: result.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    // Controlla se l'utente esiste già
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utente con questa email esiste già' },
        { status: 409 }
      );
    }

    // Hash della password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Genera token di verifica
    const verificationToken = randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ore

    // Crea l'utente (non verificato inizialmente)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: null, // Non verificato inizialmente
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Salva il token di verifica
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
      // Se l'invio dell'email fallisce, elimina l'utente e il token creati
      await prisma.user.delete({ where: { id: user.id } });
      await prisma.emailVerificationToken.deleteMany({ where: { email } });
      
      return NextResponse.json(
        { error: 'Errore nell\'invio dell\'email di verifica. Riprova più tardi.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Registrazione completata! Controlla la tua email per verificare l\'account.',
        requiresVerification: true,
        email: email 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Errore durante la registrazione:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
