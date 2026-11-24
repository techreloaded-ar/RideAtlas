import { NextRequest, NextResponse } from 'next/server'
import { GuidedTripRegistrationStatus } from '@prisma/client'
import { GuidedTripService } from '@/lib/guided-trips/guided-trip-service'
import { currentActingUser, guidedTripErrorResponse, unauthorizedResponse } from '@/lib/guided-trips/guided-trip-api'
import { createGuidedTripRegistrationPaymentIntent } from '@/lib/guided-trips/guided-trip-stripe'
import { resolvePaymentMode } from '@/lib/payment/payment-mode'

export const dynamic = 'force-dynamic'

/** Prepara il pagamento Stripe dell'iscrizione (posto già trattenuto). */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (resolvePaymentMode() !== 'stripe') {
      return NextResponse.json({ error: 'Il pagamento con carta non è configurato in questo ambiente' }, { status: 503 })
    }
    const user = await currentActingUser()
    if (!user) return unauthorizedResponse()
    const { id } = await params
    const registration = await GuidedTripService.getRegistrationForPayment(id, user.id)
    if (registration.status !== GuidedTripRegistrationStatus.PENDING_PAYMENT) {
      return NextResponse.json({ error: 'Questa iscrizione non è in attesa di pagamento' }, { status: 409 })
    }
    const intent = await createGuidedTripRegistrationPaymentIntent({
      registrationId: registration.id,
      participantId: registration.participantId,
      guidedTripId: registration.guidedTrip.id,
      guidedTripTitle: registration.guidedTrip.title,
      amount: registration.amount.toNumber(),
      existingStripePaymentId: registration.stripePaymentId,
    })
    await GuidedTripService.attachStripePaymentIntent(registration.id, intent.paymentIntentId)
    return NextResponse.json({ success: true, ...intent })
  } catch (error) {
    return guidedTripErrorResponse(error, 'Payment Intent iscrizione')
  }
}
