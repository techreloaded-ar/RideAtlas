import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { GuidedTripService } from '@/lib/guided-trips/guided-trip-service'
import { currentActingUser, guidedTripErrorResponse, unauthorizedResponse } from '@/lib/guided-trips/guided-trip-api'
import { guidedTripRegistrationIdFromPaymentIntent } from '@/lib/guided-trips/guided-trip-stripe'
import { StripeService } from '@/lib/payment/stripeService'

export const dynamic = 'force-dynamic'

const confirmSchema = z.object({ paymentIntentId: z.string().min(1, 'Payment Intent mancante') })

/** Conferma l'iscrizione dopo il pagamento con carta riuscito lato browser. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await currentActingUser()
    if (!user) return unauthorizedResponse()
    const { id } = await params
    const { paymentIntentId } = confirmSchema.parse(await request.json())
    await GuidedTripService.getRegistrationForPayment(id, user.id)

    const confirmation = await StripeService.confirmPayment(paymentIntentId)
    const paymentIntent = confirmation.paymentIntent
    if (!paymentIntent || guidedTripRegistrationIdFromPaymentIntent(paymentIntent) !== id) {
      return NextResponse.json({ error: 'Dati del pagamento non corrispondenti' }, { status: 400 })
    }
    if (paymentIntent.status !== 'succeeded') {
      await GuidedTripService.failRegistrationPayment(id, `Pagamento Stripe non riuscito: ${paymentIntent.status}`)
      return NextResponse.json({ error: 'Pagamento non riuscito' }, { status: 400 })
    }
    const result = await GuidedTripService.completeRegistrationPayment(id, { method: 'stripe', stripePaymentId: paymentIntent.id })
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return guidedTripErrorResponse(error, 'Conferma pagamento iscrizione')
  }
}
