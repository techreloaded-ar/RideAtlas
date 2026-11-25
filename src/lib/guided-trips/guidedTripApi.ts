// Supporto comune alle route API dei viaggi guidati: identità, validazione e risposte d'errore.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { UserRole } from '@prisma/client';
import { GuidedTripActor, GuidedTripDetailsPayload, GuidedTripError } from './guidedTripService';
import { parseCalendarDate } from './guidedTripRules';

export async function currentGuidedTripActor(): Promise<GuidedTripActor | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) return null;
  return { id: session.user.id, role: session.user.role as UserRole };
}

export function unauthenticatedResponse() {
  return NextResponse.json({ error: 'Devi accedere per continuare' }, { status: 401 });
}

export function guidedTripErrorResponse(error: unknown, context: string) {
  if (error instanceof GuidedTripError) {
    return NextResponse.json({ error: error.message, problems: error.problems }, { status: error.httpStatus });
  }
  if (error instanceof z.ZodError) {
    return NextResponse.json({ error: 'Dati non validi', problems: error.errors.map(e => e.message) }, { status: 400 });
  }
  console.error(`❌ [GUIDED TRIPS] ${context}:`, error);
  return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
}

const calendarDate = (label: string) =>
  z.string().refine(value => parseCalendarDate(value) !== null, `${label}: data non valida`).transform(value => parseCalendarDate(value) as Date);

export const guidedTripPayloadSchema = z.object({
  title: z.string().trim().min(3, 'Il titolo deve avere almeno 3 caratteri').max(150, 'Titolo troppo lungo'),
  description: z.string().trim().min(10, 'La descrizione deve avere almeno 10 caratteri').max(10000, 'Descrizione troppo lunga'),
  startDate: calendarDate('Data di partenza'),
  endDate: calendarDate('Data di rientro'),
  meetingPoint: z.string().trim().min(3, 'Indica il punto di ritrovo').max(300, 'Punto di ritrovo troppo lungo'),
  pricePerPerson: z.coerce.number().positive('Il prezzo deve essere maggiore di zero').max(100000, 'Prezzo troppo alto')
    .refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, 'Il prezzo può avere al massimo due decimali'),
  maxParticipants: z.coerce.number().int('I posti devono essere un numero intero').min(1, 'Serve almeno un posto').max(500, 'Troppi posti'),
  linkedTripId: z.string().min(1).nullable().optional().transform(value => value ?? null),
  publish: z.boolean().optional().default(false),
});

export function parseGuidedTripPayload(body: unknown): { details: GuidedTripDetailsPayload; publish: boolean } {
  const { publish, ...details } = guidedTripPayloadSchema.parse(body);
  return { details, publish };
}
