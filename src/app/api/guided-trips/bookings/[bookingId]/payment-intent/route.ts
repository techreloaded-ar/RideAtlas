import { NextRequest, NextResponse } from 'next/server';
import { GuidedTripService } from '@/lib/guided-trips/guidedTripService';
import { currentGuidedTripActor, guidedTripErrorResponse, unauthenticatedResponse } from '@/lib/guided-trips/guidedTripApi';

export const dynamic = 'force-dynamic';

/** Crea il PaymentIntent Stripe della prenotazione (usato dal modulo carta). */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const actor = await currentGuidedTripActor();
    if (!actor) return unauthenticatedResponse();
    const payment = await GuidedTripService.createStripePayment((await params).bookingId, actor);
    return NextResponse.json({ success: true, ...payment });
  } catch (error) {
    return guidedTripErrorResponse(error, 'Creazione pagamento Stripe');
  }
}
