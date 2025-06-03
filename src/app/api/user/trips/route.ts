// src/app/api/user/trips/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET - Fetch trips for the current user
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Fetch user's trips
    const trips = await prisma.trip.findMany({
      where: {
        user_id: userId
      },
      select: {
        id: true,
        slug: true,
        title: true,
        destination: true,
        duration_days: true,
        duration_nights: true,
        theme: true,
        status: true,
        created_at: true,
        updated_at: true
      },
      orderBy: {
        updated_at: 'desc'
      }
    })

    return NextResponse.json({
      trips,
      total: trips.length
    })

  } catch (error) {
    console.error('Errore nel recupero viaggi utente:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
