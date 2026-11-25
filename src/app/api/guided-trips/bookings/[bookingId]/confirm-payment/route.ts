import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GuidedTripService } from '@/lib/guided-trips/guidedTripService';
import { currentGuidedTripActor, guidedTripErrorResponse, unauthenticatedResponse } from '@/lib/guided-trips/guidedTripApi';

export const dynamic = 'force-dynamic';

const ConfirmPaymentSchema = z.object({ paymentIntentId: z.string().min(1) });

/** Conferma la prenotazione dopo aver verificato lato server l'esito Stripe. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const actor = await currentGuidedTripActor();
    if (!actor) return unauthenticatedResponse();
    const { paymentIntentId } = ConfirmPaymentSchema.parse(await request.json());
    const result = await GuidedTripService.confirmStripePayment((await params).bookingId, paymentIntentId, actor);
    if (!result.confirmed) {
      return NextResponse.json({ ...result, error: `${result.reason ?? 'Prenotazione non confermata'}. ${result.refunded ? 'Il pagamento è stato rimborsato.' : ''}`.trim() }, { status: 409 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return guidedTripErrorResponse(error, 'Conferma pagamento Stripe');
  }
}
