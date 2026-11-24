import type Stripe from 'stripe'
import { getStripeInstance, formatAmountForStripe, STRIPE_CONFIG } from '@/lib/payment/stripe-server'
import { GuidedTripService, GuidedTripServiceError } from './guided-trip-service'

/** Chiave dei metadata Stripe che identifica un pagamento di iscrizione a un viaggio guidato. */
export const GUIDED_TRIP_REGISTRATION_METADATA_KEY = 'guidedTripRegistrationId'

export function guidedTripRegistrationIdFromPaymentIntent(paymentIntent: Stripe.PaymentIntent): string | null {
  return paymentIntent.metadata?.[GUIDED_TRIP_REGISTRATION_METADATA_KEY] || null
}

/** Crea (o riusa, se ancora da pagare) il Payment Intent dell'iscrizione. */
export async function createGuidedTripRegistrationPaymentIntent(params: {
  registrationId: string
  participantId: string
  guidedTripId: string
  guidedTripTitle: string
  amount: number
  existingStripePaymentId: string | null
}): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const stripe = getStripeInstance()
  if (params.existingStripePaymentId) {
    const existing = await stripe.paymentIntents.retrieve(params.existingStripePaymentId)
    if (existing.status === 'requires_payment_method' || existing.status === 'requires_confirmation') {
      return { clientSecret: existing.client_secret!, paymentIntentId: existing.id }
    }
  }
  const paymentIntent = await stripe.paymentIntents.create({
    amount: formatAmountForStripe(params.amount, STRIPE_CONFIG.currency),
    currency: STRIPE_CONFIG.currency,
    automatic_payment_methods: STRIPE_CONFIG.automaticPaymentMethods,
    description: `Iscrizione viaggio guidato: ${params.guidedTripTitle}`,
    metadata: {
      [GUIDED_TRIP_REGISTRATION_METADATA_KEY]: params.registrationId,
      guidedTripId: params.guidedTripId,
      userId: params.participantId,
      originalAmount: params.amount.toString(),
      platform: 'RideAtlas',
    },
    statement_descriptor_suffix: 'RIDEATLAS',
  })
  return { clientSecret: paymentIntent.client_secret!, paymentIntentId: paymentIntent.id }
}

/** Gestione degli eventi webhook Stripe relativi alle iscrizioni ai viaggi guidati. */
export async function handleGuidedTripPaymentIntentEvent(
  paymentIntent: Stripe.PaymentIntent,
  outcome: 'succeeded' | 'failed' | 'canceled',
): Promise<{ success: boolean; error?: string }> {
  const registrationId = guidedTripRegistrationIdFromPaymentIntent(paymentIntent)
  if (!registrationId) return { success: false, error: 'Iscrizione mancante nei metadata' }
  try {
    if (outcome === 'succeeded') {
      await GuidedTripService.completeRegistrationPayment(registrationId, { method: 'stripe', stripePaymentId: paymentIntent.id })
    } else {
      await GuidedTripService.failRegistrationPayment(
        registrationId,
        outcome === 'failed'
          ? paymentIntent.last_payment_error?.message || 'Pagamento Stripe fallito'
          : 'Pagamento Stripe annullato',
      )
    }
    return { success: true }
  } catch (error) {
    // Un pagamento arrivato a posti esauriti è già registrato come da rimborsare: evento elaborato.
    if (error instanceof GuidedTripServiceError && error.httpStatus === 409) return { success: true }
    return { success: false, error: error instanceof Error ? error.message : 'Errore sconosciuto' }
  }
}
