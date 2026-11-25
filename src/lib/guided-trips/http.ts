import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { UserRole } from '@prisma/client';
import { Actor, GuidedTripError } from './service';

export async function currentActor(): Promise<Actor | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, role: session.user.role as UserRole };
}

export function unauthorized(message = 'È necessario effettuare l\'accesso') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function errorResponse(error: unknown, context: string) {
  if (error instanceof GuidedTripError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof z.ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of error.issues) {
      const key = issue.path.join('.') || 'form';
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json({ error: error.issues[0]?.message || 'Dati non validi', fieldErrors }, { status: 400 });
  }
  console.error(`❌ [GUIDED TRIPS] ${context}:`, error);
  return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
}
