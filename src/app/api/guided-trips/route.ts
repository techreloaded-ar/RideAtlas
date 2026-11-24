import { NextRequest, NextResponse } from 'next/server'
import { GuidedTripService } from '@/lib/guided-trips/guided-trip-service'
import { currentActingUser, guidedTripErrorResponse, unauthorizedResponse } from '@/lib/guided-trips/guided-trip-api'
import { guidedTripInputSchema } from '@/schemas/guided-trip'

export const dynamic = 'force-dynamic'

/** Elenco pubblico dei viaggi guidati pubblicati con partenza futura. */
export async function GET() {
  try {
    const guidedTrips = await GuidedTripService.listPublishedUpcoming()
    return NextResponse.json({ guidedTrips })
  } catch (error) {
    return guidedTripErrorResponse(error, 'Elenco viaggi guidati')
  }
}

/** Il Ranger crea un viaggio guidato in bozza. */
export async function POST(request: NextRequest) {
  try {
    const user = await currentActingUser()
    if (!user) return unauthorizedResponse()
    const input = guidedTripInputSchema.parse(await request.json())
    const created = await GuidedTripService.create(user, input)
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return guidedTripErrorResponse(error, 'Creazione viaggio guidato')
  }
}
