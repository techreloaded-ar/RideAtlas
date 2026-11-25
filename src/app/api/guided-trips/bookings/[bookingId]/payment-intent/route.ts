import { NextRequest, NextResponse } from 'next/server';
import { GuidedTripBookingService, GuidedTripError } from '@/lib/guided-trips/service';
import { currentActor, errorResponse, unauthorized } from '@/lib/guided-trips/http';
import { getPaymentMode } from '@/lib/payment/paymentMode';
import { createBookingPaymentIntent } from '@/lib/guided-trips/stripeBooking';

export const dynamic = 'force-dynamic';

/** Prepara il pagamento Stripe del posto trattenuto. */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  if (getPaymentMode() !== 'stripe') {
    return NextResponse.json({ error: 'Il pagamento con Stripe non è configurato' }, { status: 503 });
  }
  const actor = await currentActor();
  if (!actor) return unauthorized();
  try {
    const { bookingId } = await params;
    const booking = await GuidedTripBookingService.getOwned(bookingId, actor.id);
    if (booking.status === 'CONFIRMED') throw new GuidedTripError('Il posto è già confermato', 409);
    if (booking.status !== 'PENDING' || !booking.holdExpiresAt || booking.holdExpiresAt.getTime() <= Date.now()) {
      throw new GuidedTripError('Il tempo per il pagamento è scaduto: riprova la prenotazione', 409);
    }
    const intent = await createBookingPaymentIntent({
      bookingId: booking.id,
      userId: actor.id,
      guidedTripId: booking.guidedTrip.id,
      title: booking.guidedTrip.title,
      amount: Number(booking.amount),
      existingPaymentIntentId: booking.stripePaymentId,
    });
    if (intent.id !== booking.stripePaymentId) await GuidedTripBookingService.setStripePaymentId(booking.id, intent.id);
    return NextResponse.json({ success: true, clientSecret: intent.client_secret, paymentIntentId: intent.id, amount: Number(booking.amount), currency: 'eur' });
  } catch (error) {
    return errorResponse(error, 'creazione pagamento Stripe');
  }
}
