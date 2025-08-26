import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/core/prisma';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio').max(100, 'Il nome è troppo lungo'),
  bio: z.string().max(200, 'La bio deve essere massimo 200 caratteri').optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Dati non validi', 
          details: validation.error.errors 
        }, 
        { status: 400 }
      );
    }

    const { name, bio } = validation.data;
    const userId = session.user.id;

    // Aggiorna le informazioni dell'utente
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        bio: bio || null
      },
      select: {
        id: true,
        name: true,
        bio: true,
        email: true
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento del profilo:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' }, 
      { status: 500 }
    );
  }
}