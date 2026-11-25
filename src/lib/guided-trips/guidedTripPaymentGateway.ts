// Pagamenti e rimborsi delle prenotazioni dei viaggi guidati.
// Con Stripe configurato usa PaymentIntent e Refund reali. Fuori produzione, senza
// chiavi Stripe, usa una modalità simulata esplicita: in produzione non è mai attiva.

import { getStripeInstance, formatAmountForStripe, STRIPE_CONFIG } from '@/lib/payment/stripe-server';

export type GuidedTripPaymentMode = 'stripe' | 'simulated' | 'unavailable';

export function guidedTripPaymentMode(env: NodeJS.ProcessEnv = process.env): GuidedTripPaymentMode {
  if (env.STRIPE_SECRET_KEY && env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) return 'stripe';
  if (env.NODE_ENV === 'production') return 'unavailable';
  return 'simulated';
}

export interface GuidedTripRefundResult {
  success: boolean;
  reference?: string;
  error?: string;
}

export interface BookingPaymentRecord {
  id: string;
  amount: number;
  paymentMethod: string | null;
  stripePaymentIntentId: string | null;
  paymentReference: string | null;
}

export const GuidedTripPaymentGateway = {
  async createStripePaymentIntent(params: { bookingId: string; guidedTripId: string; participantId: string; amount: number; title: string }) {
    const paymentIntent = await getStripeInstance().paymentIntents.create({
      amount: formatAmountForStripe(params.amount, STRIPE_CONFIG.currency),
      currency: STRIPE_CONFIG.currency,
      automatic_payment_methods: STRIPE_CONFIG.automaticPaymentMethods,
      description: `Prenotazione viaggio guidato: ${params.title}`.slice(0, 200),
      metadata: {
        guidedTripBookingId: params.bookingId,
        guidedTripId: params.guidedTripId,
        userId: params.participantId,
        platform: 'RideAtlas',
      },
    }, { idempotencyKey: `guided-trip-booking-${params.bookingId}` });
    return paymentIntent;
  },

  async retrieveStripePaymentIntent(paymentIntentId: string) {
    return getStripeInstance().paymentIntents.retrieve(paymentIntentId);
  },

  /** Rimborso totale della prenotazione con lo stesso metodo con cui è stata pagata. */
  async refundInFull(booking: BookingPaymentRecord): Promise<GuidedTripRefundResult> {
    try {
      if (booking.paymentMethod === 'simulated') {
        if (guidedTripPaymentMode() === 'unavailable') {
          return { success: false, error: 'Rimborso simulato non consentito in produzione' };
        }
        return { success: true, reference: `simulated_refund_${booking.id}` };
      }
      if (booking.paymentMethod === 'stripe' && booking.stripePaymentIntentId) {
        const refund = await getStripeInstance().refunds.create(
          { payment_intent: booking.stripePaymentIntentId, reason: 'requested_by_customer', metadata: { guidedTripBookingId: booking.id } },
          { idempotencyKey: `guided-trip-refund-${booking.id}` },
        );
        if (refund.status === 'failed' || refund.status === 'canceled') {
          return { success: false, error: `Rimborso Stripe ${refund.status}` };
        }
        return { success: true, reference: refund.id };
      }
      return { success: false, error: 'Metodo di pagamento della prenotazione sconosciuto' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Errore nel rimborso' };
    }
  },
};
