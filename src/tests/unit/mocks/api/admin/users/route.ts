// src/tests/unit/mocks/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/profile';
import { auth } from '@/tests/unit/mocks/auth';
import { prisma } from '@/lib/core/prisma';
import { sendVerificationEmail } from '@/lib/core/email';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { passwordSchema } from '@/lib/auth/password-validation';

// Schema di validazione per la creazione di un nuovo utente da parte del Sentinel
const createUserSchema = z.object({
  name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri'),
  email: z.string().email('Inserisci un indirizzo email valido'),
  role: z.nativeEnum(UserRole).optional().default(UserRole.Explorer),
  sendWelcomeEmail: z.boolean().optional().default(true),
  password: passwordSchema.optional(), // Password opzionale che deve seguire gli stessi standard
});

// GET - Lista tutti gli utenti (solo per Sentinel)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    if (session.user.role !== UserRole.Sentinel) {
      return NextResponse.json(
        { error: 'Permessi insufficienti' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role');

    const where: Prisma.UserWhereInput = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
                { email: { contains: search, mode: Prisma.QueryMode.insensitive } }
              ]
            }
          : {},
        roleFilter ? { role: roleFilter as UserRole } : {}
      ]
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          password: true,
          createdAt: true,
          updatedAt: true,
          image: true,
          _count: {
            select: {
              trips: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Errore nel recupero utenti:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// POST - Crea un nuovo utente (solo per Sentinel)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    if (session.user.role !== UserRole.Sentinel) {
      return NextResponse.json(
        { error: 'Permessi insufficienti' },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Formato JSON non valido' },
        { status: 400 }
      );
    }
    
    const result = createUserSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Dati non validi', 
          details: result.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { name, email, role, sendWelcomeEmail } = result.data;

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

    // Genera sempre un token di verifica per il setup password
    const verificationToken = 'test-verification-token';
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ore

    // Crea l'utente senza password (sarà impostata al primo accesso)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: null, // L'utente deve impostare la password al primo accesso
        role,
        emailVerified: null, // Sarà verificata quando imposta la password
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        image: true,
        _count: {
          select: {
            trips: true
          }
        }
      },
    });

    // Salva il token per il setup password
    await prisma.emailVerificationToken.create({
      data: {
        email,
        token: verificationToken,
        expiresAt: tokenExpiry,
      }
    });

    // Invia email con link per setup password
    if (sendWelcomeEmail) {
      await sendVerificationEmail(email, verificationToken, true); // true per setup password
    }

    return NextResponse.json(
      { 
        message: `Utente creato con successo${sendWelcomeEmail ? '. Email per il setup password inviata.' : '. L\'utente deve impostare la password al primo accesso.'}`,
        user,
        requiresPasswordSetup: true,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Errore durante la creazione dell\'utente:', error);
    return NextResponse.json(
      { error: 'Errore durante la creazione dell\'utente' },
      { status: 500 }
    );
  }
}
