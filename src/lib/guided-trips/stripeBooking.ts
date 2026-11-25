import { getStripeInstance, formatAmountForStripe, STRIPE_CONFIG } from '@/lib/payment/stripe-server';

/** Crea (o riusa) il Payment Intent Stripe di una prenotazione di viaggio guidato. */
export async function createBookingPaymentIntent(params: {
  bookingId: string;
  userId: string;
  guidedTripId: string;
  title: string;
  amount: number;
  existingPaymentIntentId: string | null;
}) {
  const stripe = getStripeInstance();
  if (params.existingPaymentIntentId) {
    const existing = await stripe.paymentIntents.retrieve(params.existingPaymentIntentId);
    const amount = formatAmountForStripe(params.amount, STRIPE_CONFIG.currency);
    if (existing.amount === amount && ['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(existing.status)) {
      return existing;
    }
  }
  return stripe.paymentIntents.create({
    amount: formatAmountForStripe(params.amount, STRIPE_CONFIG.currency),
    currency: STRIPE_CONFIG.currency,
    automatic_payment_methods: STRIPE_CONFIG.automaticPaymentMethods,
    description: `Viaggio guidato: ${params.title}`,
    metadata: {
      kind: 'guided_trip_booking',
      bookingId: params.bookingId,
      guidedTripId: params.guidedTripId,
      userId: params.userId,
      platform: 'RideAtlas',
    },
    statement_descriptor_suffix: 'RIDEATLAS',
  });
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  return getStripeInstance().paymentIntents.retrieve(paymentIntentId);
}
