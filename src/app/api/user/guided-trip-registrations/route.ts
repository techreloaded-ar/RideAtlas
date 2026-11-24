import { NextResponse } from 'next/server'
import { GuidedTripService } from '@/lib/guided-trips/guided-trip-service'
import { currentActingUser, guidedTripErrorResponse, unauthorizedResponse } from '@/lib/guided-trips/guided-trip-api'

export const dynamic = 'force-dynamic'

/** Iscrizioni dell'utente ai viaggi guidati (confermate, disdette, rimborsate). */
export async function GET() {
  try {
    const user = await currentActingUser()
    if (!user) return unauthorizedResponse()
    const registrations = await GuidedTripService.listForParticipant(user.id)
    return NextResponse.json({ registrations })
  } catch (error) {
    return guidedTripErrorResponse(error, 'Iscrizioni utente')
  }
}
