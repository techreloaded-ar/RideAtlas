import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { auth } from '@/auth'
import { UserRole } from '@/types/profile'
import { z } from 'zod'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const assegnamentoRangerSchema = z.object({
  rangerId: z.string().cuid()
})

// PATCH - Assegna un viaggio a un ranger (solo per utenti Sentinel)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const tripId = params.id

    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    if (session.user.role !== UserRole.Sentinel) {
      return NextResponse.json(
        { error: 'Permessi insufficienti' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validazione = assegnamentoRangerSchema.safeParse(body)

    if (!validazione.success) {
      return NextResponse.json(
        { error: 'Dati non validi: rangerId è obbligatorio' },
        { status: 400 }
      )
    }

    const { rangerId } = validazione.data

    // Verifica che il viaggio esista
    const viaggio = await prisma.trip.findUnique({
      where: { id: tripId }
    })

    if (!viaggio) {
      return NextResponse.json(
        { error: 'Viaggio non trovato' },
        { status: 404 }
      )
    }

    // Verifica che il ranger esista e abbia il ruolo corretto
    const rangerDestinatario = await prisma.user.findUnique({
      where: { id: rangerId },
      select: { id: true, role: true }
    })

    if (!rangerDestinatario) {
      return NextResponse.json(
        { error: 'Ranger non trovato' },
        { status: 404 }
      )
    }

    if (rangerDestinatario.role !== UserRole.Ranger && rangerDestinatario.role !== UserRole.Sentinel) {
      return NextResponse.json(
        { error: 'L\'utente selezionato non ha il ruolo di Ranger o Sentinel' },
        { status: 400 }
      )
    }

    // Se il viaggio è già assegnato allo stesso utente, restituisci 200 senza modifiche
    if (viaggio.user_id === rangerId) {
      return NextResponse.json(
        { message: 'Viaggio già assegnato a questo ranger' },
        { status: 200 }
      )
    }

    const vecchioOwnerId = viaggio.user_id

    // Aggiorna l'assegnazione del viaggio
    const viaggioAggiornato = await prisma.trip.update({
      where: { id: tripId },
      data: { user_id: rangerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        }
      }
    })

    console.info(
      `Assegnazione viaggio: ${session.user.email} ha assegnato il viaggio ${tripId} ` +
      `da owner ${vecchioOwnerId} a nuovo owner ${rangerId} - ${new Date().toISOString()}`
    )

    return NextResponse.json(viaggioAggiornato)

  } catch (error) {
    console.error('Errore nell\'assegnazione del viaggio:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
