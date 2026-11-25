import { NextRequest, NextResponse } from 'next/server';
import { GuidedTripBookingService } from '@/lib/guided-trips/service';
import { currentActor, errorResponse, unauthorized } from '@/lib/guided-trips/http';
import { getPaymentMode } from '@/lib/payment/paymentMode';

export const dynamic = 'force-dynamic';

/** Avvia la prenotazione: trattiene un posto e restituisce il canale di pagamento. */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await currentActor();
  if (!actor) return unauthorized('Accedi per prenotare il tuo posto');
  const paymentMode = getPaymentMode();
  if (paymentMode === 'unavailable') {
    return NextResponse.json({ error: 'I pagamenti non sono al momento disponibili' }, { status: 503 });
  }
  try {
    const { id } = await params;
    const booking = await GuidedTripBookingService.startBooking(actor.id, id);
    return NextResponse.json({ bookingId: booking.id, amount: booking.amount, holdExpiresAt: booking.holdExpiresAt, paymentMode }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'avvio prenotazione');
  }
}
