import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { GuidedTripService } from '@/lib/guided-trips/guided-trip-service'
import { currentActingUser, guidedTripErrorResponse, unauthorizedResponse } from '@/lib/guided-trips/guided-trip-api'
import { refundGuidedTripRegistrationSchema } from '@/schemas/guided-trip'

export const dynamic = 'force-dynamic'

/** Il Sentinel registra il rimborso eseguito manualmente. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentActingUser()
    if (!user) return unauthorizedResponse()
    if (user.role !== UserRole.Sentinel) return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 })
    const { id } = await params
    const rawBody = await request.text()
    const { note } = refundGuidedTripRegistrationSchema.parse(rawBody ? JSON.parse(rawBody) : {})
    await GuidedTripService.markRefunded(id, user, note)
    return NextResponse.json({ success: true })
  } catch (error) {
    return guidedTripErrorResponse(error, 'Rimborso iscrizione')
  }
}
