import { NextRequest, NextResponse } from 'next/server';
import { GuidedTripBookingService, GuidedTripError } from '@/lib/guided-trips/service';
import { currentActor, errorResponse, unauthorized } from '@/lib/guided-trips/http';
import { getPaymentMode } from '@/lib/payment/paymentMode';

export const dynamic = 'force-dynamic';

/** Pagamento simulato: disponibile solo fuori produzione e quando Stripe non è configurato. */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  if (getPaymentMode() !== 'simulated') {
    return NextResponse.json({ error: 'Il pagamento simulato non è disponibile' }, { status: 404 });
  }
  const actor = await currentActor();
  if (!actor) return unauthorized();
  try {
    const { bookingId } = await params;
    const booking = await GuidedTripBookingService.getOwned(bookingId, actor.id);
    if (booking.status === 'FAILED') throw new GuidedTripError('Il posto trattenuto non è più valido: riprova la prenotazione', 409);
    const result = await GuidedTripBookingService.confirmPaid(booking.id, 'simulated', null);
    if (!result.confirmed) throw new GuidedTripError('Il tempo per il pagamento è scaduto e i posti sono esauriti', 409);
    return NextResponse.json({ confirmed: true, bookingId: booking.id });
  } catch (error) {
    return errorResponse(error, 'pagamento simulato');
  }
}
