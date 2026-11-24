// Pagamenti e rimborsi delle prenotazioni di viaggi guidati.
// Con le chiavi Stripe configurate si usa Stripe; senza chiavi e fuori produzione
// il pagamento è simulato (ambiente locale o di prova); in produzione senza chiavi
// la prenotazione non è disponibile.
import { getStripeInstance, STRIPE_CONFIG } from '@/lib/payment/stripe-server';

export type GuidedTripPaymentMode = 'stripe' | 'simulated' | 'unavailable';

export const SIMULATED_PAYMENT_METHOD = 'simulated';
export const STRIPE_PAYMENT_METHOD = 'stripe';

type EnvironmentVariables = Record<string, string | undefined>;

export function guidedTripPaymentMode(env: EnvironmentVariables = process.env): GuidedTripPaymentMode {
  if (env.STRIPE_SECRET_KEY && env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) return 'stripe';
  if (env.NODE_ENV !== 'production') return 'simulated';
  return 'unavailable';
}

export interface GuidedTripPaymentIntent {
  paymentIntentId: string;
  clientSecret: string;
}

export async function createGuidedTripPaymentIntent(params: {
  bookingId: string;
  guidedTripId: string;
  participantId: string;
  amount: number;
  title: string;
}): Promise<GuidedTripPaymentIntent> {
  const paymentIntent = await getStripeInstance().paymentIntents.create(
    {
      amount: Math.round(params.amount * 100),
      currency: STRIPE_CONFIG.currency,
      automatic_payment_methods: STRIPE_CONFIG.automaticPaymentMethods,
      description: `Prenotazione viaggio guidato: ${params.title}`,
      metadata: {
        guidedTripBookingId: params.bookingId,
        guidedTripId: params.guidedTripId,
        participantId: params.participantId,
        platform: 'RideAtlas',
      },
      statement_descriptor_suffix: 'RIDEATLAS',
    },
    { idempotencyKey: `guided-trip-booking-${params.bookingId}` },
  );
  return { paymentIntentId: paymentIntent.id, clientSecret: paymentIntent.client_secret! };
}

export async function hasStripePaymentSucceeded(paymentIntentId: string): Promise<boolean> {
  const paymentIntent = await getStripeInstance().paymentIntents.retrieve(paymentIntentId);
  return paymentIntent.status === 'succeeded';
}

export type RefundOutcome = { success: true; reference: string } | { success: false; error: string };

export async function refundGuidedTripPayment(booking: {
  id: string;
  paymentMethod: string | null;
  stripePaymentId: string | null;
}): Promise<RefundOutcome> {
  if (booking.paymentMethod === SIMULATED_PAYMENT_METHOD) {
    return { success: true, reference: `simulated_refund_${booking.id}` };
  }
  if (booking.paymentMethod !== STRIPE_PAYMENT_METHOD || !booking.stripePaymentId) {
    return { success: false, error: 'Pagamento originale non trovato: rimborso da gestire manualmente' };
  }
  try {
    // Nessuna chiave di idempotenza: un nuovo tentativo dopo un errore deve davvero ripartire.
    // I doppi rimborsi sono impediti dal servizio, che blocca la prenotazione durante l'operazione.
    const refund = await getStripeInstance().refunds.create({
      payment_intent: booking.stripePaymentId,
      metadata: { guidedTripBookingId: booking.id },
    });
    if (refund.status === 'failed' || refund.status === 'canceled') {
      return { success: false, error: `Rimborso Stripe non riuscito (${refund.status})` };
    }
    return { success: true, reference: refund.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Errore Stripe sconosciuto' };
  }
}
