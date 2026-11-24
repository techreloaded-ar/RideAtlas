import { NextRequest, NextResponse } from 'next/server'
import { GuidedTripService } from '@/lib/guided-trips/guided-trip-service'
import { currentActingUser, guidedTripErrorResponse, unauthorizedResponse } from '@/lib/guided-trips/guided-trip-api'
import { guidedTripInputSchema } from '@/schemas/guided-trip'

export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

/** Dati di gestione (viaggio + partecipanti) per organizzatore o Sentinel. */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const user = await currentActingUser()
    if (!user) return unauthorizedResponse()
    const { id } = await params
    return NextResponse.json(await GuidedTripService.getForManagement(id, user))
  } catch (error) {
    return guidedTripErrorResponse(error, 'Lettura viaggio guidato')
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await currentActingUser()
    if (!user) return unauthorizedResponse()
    const { id } = await params
    const input = guidedTripInputSchema.parse(await request.json())
    await GuidedTripService.update(id, user, input)
    return NextResponse.json({ success: true })
  } catch (error) {
    return guidedTripErrorResponse(error, 'Modifica viaggio guidato')
  }
}
