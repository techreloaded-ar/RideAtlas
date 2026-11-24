import { NextRequest, NextResponse } from 'next/server'
import { GuidedTripRegistrationStatus, UserRole } from '@prisma/client'
import { GuidedTripService } from '@/lib/guided-trips/guided-trip-service'
import { currentActingUser, guidedTripErrorResponse, unauthorizedResponse } from '@/lib/guided-trips/guided-trip-api'

export const dynamic = 'force-dynamic'

const ADMIN_VISIBLE_STATUSES = new Set<string>([GuidedTripRegistrationStatus.REFUND_DUE, GuidedTripRegistrationStatus.REFUNDED])

/** Iscrizioni ai viaggi guidati da rimborsare (o già rimborsate) per il Sentinel. */
export async function GET(request: NextRequest) {
  try {
    const user = await currentActingUser()
    if (!user) return unauthorizedResponse()
    if (user.role !== UserRole.Sentinel) return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 })
    const requested = request.nextUrl.searchParams.get('status') ?? GuidedTripRegistrationStatus.REFUND_DUE
    if (!ADMIN_VISIBLE_STATUSES.has(requested)) return NextResponse.json({ error: 'Stato non valido' }, { status: 400 })
    const registrations = await GuidedTripService.listRegistrationsForAdmin(requested as GuidedTripRegistrationStatus)
    return NextResponse.json({ registrations })
  } catch (error) {
    return guidedTripErrorResponse(error, 'Elenco rimborsi viaggi guidati')
  }
}
