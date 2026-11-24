import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { GuidedTripServiceError, type ActingUser } from './guided-trip-service'

/** Utente autenticato della richiesta, oppure null. */
export async function currentActingUser(): Promise<ActingUser | null> {
  const session = await auth()
  if (!session?.user?.id || !session.user.role) return null
  return { id: session.user.id, role: session.user.role }
}

export function unauthorizedResponse(message = 'È necessario effettuare il login') {
  return NextResponse.json({ error: message }, { status: 401 })
}

/** Traduce gli errori noti in risposte JSON coerenti; gli altri diventano 500. */
export function guidedTripErrorResponse(error: unknown, context: string) {
  if (error instanceof GuidedTripServiceError) {
    return NextResponse.json({ error: error.message }, { status: error.httpStatus })
  }
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: error.errors[0]?.message ?? 'Dati non validi',
        fieldErrors: Object.fromEntries(error.errors.map(issue => [issue.path.join('.'), issue.message])),
      },
      { status: 400 },
    )
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 })
  }
  console.error(`❌ [GUIDED TRIPS] ${context}:`, error)
  return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
}
