import { NextRequest, NextResponse } from 'next/server'
import { GuidedTripService } from '@/lib/guided-trips/guided-trip-service'
import { currentActingUser, guidedTripErrorResponse, unauthorizedResponse } from '@/lib/guided-trips/guided-trip-api'
import { resolvePaymentMode } from '@/lib/payment/payment-mode'

export const dynamic = 'force-dynamic'

/**
 * Pagamento simulato, disponibile SOLO quando Stripe non è configurato e l'ambiente
 * non è di produzione (sviluppo e anteprima locale).
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (resolvePaymentMode() !== 'simulated') {
      return NextResponse.json({ error: 'Il pagamento simulato non è disponibile in questo ambiente' }, { status: 403 })
    }
    const user = await currentActingUser()
    if (!user) return unauthorizedResponse()
    const { id } = await params
    await GuidedTripService.getRegistrationForPayment(id, user.id)
    const result = await GuidedTripService.completeRegistrationPayment(id, { method: 'simulated' })
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return guidedTripErrorResponse(error, 'Pagamento simulato iscrizione')
  }
}
