import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { UserRole } from '@/types/profile'
import { TripStatus } from '@/types/trip'

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
      select: { id: true, user_id: true }
    })
    if (!existingTrip) {
      return NextResponse.json({ error: 'Viaggio non trovato' }, { status: 404 })
    }

    const isOwner = existingTrip.user_id === session.user.id
    const isSentinel = session.user.role === UserRole.Sentinel
    if (!isOwner && !isSentinel) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 })
    }

    const updated = await prisma.trip.update({
      where: { id: tripId },
      data: { status: TripStatus.Pubblicato, updated_at: new Date() }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Errore nella pubblicazione del viaggio:', error)
    return NextResponse.json({ error: 'Errore interno server' }, { status: 500 })
  }
}
