import { NextRequest, NextResponse } from 'next/server'
import { GuidedTripService } from '@/lib/guided-trips/guided-trip-service'
import { currentActingUser, guidedTripErrorResponse, unauthorizedResponse } from '@/lib/guided-trips/guided-trip-api'

export const dynamic = 'force-dynamic'

/** Annullamento del viaggio: le iscrizioni confermate diventano da rimborsare. */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentActingUser()
    if (!user) return unauthorizedResponse()
    const { id } = await params
    const result = await GuidedTripService.cancelTrip(id, user)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return guidedTripErrorResponse(error, 'Annullamento viaggio guidato')
  }
}
