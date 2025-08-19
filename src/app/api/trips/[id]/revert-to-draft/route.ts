import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { auth } from '@/auth'
import { UserRole } from '@/types/profile'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// PATCH - Revert trip to draft status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    // Only Rangers and Sentinels can use this endpoint
    if (session.user.role !== UserRole.Ranger && session.user.role !== UserRole.Sentinel) {
      return NextResponse.json(
        { error: 'Permessi insufficienti' },
        { status: 403 }
      )
    }

    const { id: tripId } = await params

    // Verify trip exists and get ownership info
    const existingTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { 
        id: true, 
        title: true, 
        status: true,
        user_id: true,
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

    // Check permissions: Rangers can only revert their own trips, Sentinels can revert any trip
    if (session.user.role === UserRole.Ranger && existingTrip.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Non hai i permessi per modificare questo viaggio' },
        { status: 403 }
      )
    }

    // Check if trip is already in draft status
    if (existingTrip.status === 'Bozza') {
      return NextResponse.json(
        { error: 'Il viaggio è già in stato bozza' },
        { status: 400 }
      )
    }

    // Update trip status to draft
    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: { 
        status: 'Bozza',
        updated_at: new Date()
      },
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
      message: 'Viaggio riportato in bozza con successo',
      trip: updatedTrip
    })

  } catch (error) {
    console.error('Errore nel riportare il viaggio in bozza:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}