import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { auth } from '@/auth'
import { UserRole } from '@/types/profile'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// PATCH - Approve a trip (only for Sentinel users)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const tripId = params.id

    // Verify trip exists
    const existingTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { 
        id: true, 
        title: true, 
        status: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!existingTrip) {
      return NextResponse.json(
        { error: 'Viaggio non trovato' },
        { status: 404 }
      )
    }

    // Check if trip is in draft status
    if (existingTrip.status !== 'Bozza') {
      return NextResponse.json(
        { error: 'Solo i viaggi in bozza possono essere approvati' },
        { status: 400 }
      )
    }

    // Update trip status to published
    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: { status: 'Pubblicato' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Viaggio approvato con successo',
      trip: updatedTrip
    })

  } catch (error) {
    console.error('Errore nell\'approvazione del viaggio:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
