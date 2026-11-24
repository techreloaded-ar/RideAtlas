import { NextResponse } from 'next/server'
import { GuidedTripService } from '@/lib/guided-trips/guided-trip-service'
import { currentActingUser, guidedTripErrorResponse, unauthorizedResponse } from '@/lib/guided-trips/guided-trip-api'
import { UserPermissions } from '@/types/profile'

export const dynamic = 'force-dynamic'

/** Viaggi guidati organizzati dall'utente (Ranger o Sentinel), per la dashboard. */
export async function GET() {
  try {
    const user = await currentActingUser()
    if (!user) return unauthorizedResponse()
    if (!UserPermissions.canCreateTrips(user.role)) {
      return NextResponse.json({ error: 'Solo i Ranger organizzano viaggi guidati' }, { status: 403 })
    }
    const guidedTrips = await GuidedTripService.listByOrganizer(user.id)
    return NextResponse.json({ guidedTrips })
  } catch (error) {
    return guidedTripErrorResponse(error, 'Viaggi guidati organizzati')
  }
}
