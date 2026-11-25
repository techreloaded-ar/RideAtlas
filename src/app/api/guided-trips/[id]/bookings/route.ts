import { NextRequest, NextResponse } from 'next/server';
import { GuidedTripService } from '@/lib/guided-trips/guidedTripService';
import { guidedTripPaymentMode } from '@/lib/guided-trips/guidedTripPaymentGateway';
import { currentGuidedTripActor, guidedTripErrorResponse, unauthenticatedResponse } from '@/lib/guided-trips/guidedTripApi';

export const dynamic = 'force-dynamic';

/** Riserva un posto per il tempo del pagamento. */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await currentGuidedTripActor();
    if (!actor) return unauthenticatedResponse();
    const booking = await GuidedTripService.holdSeat((await params).id, actor);
    return NextResponse.json({ booking, paymentMode: guidedTripPaymentMode() }, { status: 201 });
  } catch (error) {
    return guidedTripErrorResponse(error, 'Prenotazione posto');
  }
}
