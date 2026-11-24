import { NextRequest, NextResponse } from 'next/server'
import { GuidedTripService } from '@/lib/guided-trips/guided-trip-service'
import { currentActingUser, guidedTripErrorResponse, unauthorizedResponse } from '@/lib/guided-trips/guided-trip-api'
import { resolvePaymentMode } from '@/lib/payment/payment-mode'

export const dynamic = 'force-dynamic'

/** Avvia l'iscrizione: trattiene un posto e restituisce l'iscrizione da pagare. */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentActingUser()
    if (!user) return unauthorizedResponse('Accedi per iscriverti al viaggio guidato')
    const paymentMode = resolvePaymentMode()
    if (paymentMode === 'unavailable') {
      return NextResponse.json({ error: 'I pagamenti non sono al momento disponibili' }, { status: 503 })
    }
    const { id } = await params
    const registration = await GuidedTripService.startRegistration(id, user)
    return NextResponse.json({ ...registration, paymentMode }, { status: 201 })
  } catch (error) {
    return guidedTripErrorResponse(error, 'Avvio iscrizione viaggio guidato')
  }
}
