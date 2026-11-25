import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GuidedTripBookingService, GuidedTripError } from '@/lib/guided-trips/service';
import { currentActor, errorResponse, unauthorized } from '@/lib/guided-trips/http';
import { getPaymentMode } from '@/lib/payment/paymentMode';
import { retrievePaymentIntent } from '@/lib/guided-trips/stripeBooking';
import { formatAmountForStripe, STRIPE_CONFIG } from '@/lib/payment/stripe-server';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({ paymentIntentId: z.string().min(1) });

/** Conferma il posto dopo un pagamento Stripe riuscito, verificandolo lato server. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  if (getPaymentMode() !== 'stripe') {
    return NextResponse.json({ error: 'Il pagamento con Stripe non è configurato' }, { status: 503 });
  }
  const actor = await currentActor();
  if (!actor) return unauthorized();
  try {
    const { bookingId } = await params;
    const { paymentIntentId } = bodySchema.parse(await request.json());
    const booking = await GuidedTripBookingService.getOwned(bookingId, actor.id);
    const intent = await retrievePaymentIntent(paymentIntentId);
    if (intent.metadata?.bookingId !== booking.id) throw new GuidedTripError('Il pagamento non corrisponde a questa prenotazione', 400);
    if (intent.status !== 'succeeded') throw new GuidedTripError(`Pagamento non completato (${intent.status})`, 400);
    if (intent.amount !== formatAmountForStripe(Number(booking.amount), STRIPE_CONFIG.currency)) {
      throw new GuidedTripError('L\'importo pagato non corrisponde al prezzo del posto', 400);
    }
    const result = await GuidedTripBookingService.confirmPaid(booking.id, 'stripe', intent.id);
    if (!result.confirmed) {
      throw new GuidedTripError('Il pagamento è arrivato dopo la scadenza del posto e i posti sono esauriti: verrai contattato per il rimborso', 409);
    }
    return NextResponse.json({ confirmed: true, bookingId: booking.id });
  } catch (error) {
    return errorResponse(error, 'conferma pagamento Stripe');
  }
}
