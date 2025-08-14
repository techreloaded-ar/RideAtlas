import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { auth } from '@/auth'
import { UserRole } from '@/types/profile'
import { TripStatus } from '@/types/trip'
import { TripValidationService } from '@/lib/trips/tripValidationService'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const tripId = params.id
    
    // Fetch existing trip
    const existingTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, user_id: true, status: true }
    })
    if (!existingTrip) {
      return NextResponse.json({ error: 'Viaggio non trovato' }, { status: 404 })
    }

    // Controllo permessi
    const isOwner = existingTrip.user_id === session.user.id
    const isSentinel = session.user.role === UserRole.Sentinel
    if (!isOwner && !isSentinel) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 })
    }

    // Controllo stato: solo viaggi in "Bozza" possono essere pubblicati
    if (existingTrip.status !== TripStatus.Bozza) {
      return NextResponse.json({ 
        error: 'Solo i viaggi in stato "Bozza" possono essere pubblicati' 
      }, { status: 400 })
    }

    // Validazione business logic
    const validationResult = await TripValidationService.validateForPublication(tripId)
    if (!validationResult.isValid) {
      return NextResponse.json({ 
        error: 'Il viaggio non può essere pubblicato',
        validationErrors: validationResult.errors
      }, { status: 400 })
    }

    // Pubblicazione
    const updated = await prisma.trip.update({
      where: { id: tripId },
      data: { status: TripStatus.Pubblicato, updated_at: new Date() }
    })

    return NextResponse.json({ 
      success: true,
      trip: updated 
    })
  } catch (error) {
    console.error('Errore nella pubblicazione del viaggio:', error)
    return NextResponse.json({ error: 'Errore interno server' }, { status: 500 })
  }
}
