// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema di validazione per la registrazione
const registerSchema = z.object({
  name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri'),
  email: z.string().email('Inserisci un indirizzo email valido'),
  password: z.string().min(8, 'La password deve contenere almeno 8 caratteri'),
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

    // Crea l'utente
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: new Date(), // Considera l'email verificata per semplicità
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { 
        message: 'Utente registrato con successo',
        user 
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
