import { NextRequest, NextResponse } from 'next/server'
import { GuidedTripService } from '@/lib/guided-trips/guided-trip-service'
import { currentActingUser, guidedTripErrorResponse, unauthorizedResponse } from '@/lib/guided-trips/guided-trip-api'

export const dynamic = 'force-dynamic'

/** Pubblicazione diretta da parte del Ranger: le iscrizioni si aprono subito. */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentActingUser()
    if (!user) return unauthorizedResponse()
    const { id } = await params
    await GuidedTripService.publish(id, user)
    return NextResponse.json({ success: true })
  } catch (error) {
    return guidedTripErrorResponse(error, 'Pubblicazione viaggio guidato')
  }
}
