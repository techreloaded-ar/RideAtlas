import { NextRequest, NextResponse } from 'next/server';
import { GuidedTripService } from '@/lib/guided-trips/guidedTripService';
import { currentGuidedTripActor, guidedTripErrorResponse, unauthenticatedResponse } from '@/lib/guided-trips/guidedTripApi';

export const dynamic = 'force-dynamic';

/** Pagamento simulato: disponibile solo fuori produzione e senza Stripe configurato. */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const actor = await currentGuidedTripActor();
    if (!actor) return unauthenticatedResponse();
    const result = await GuidedTripService.payWithSimulation((await params).bookingId, actor);
    if (!result.confirmed) {
      return NextResponse.json({ ...result, error: `${result.reason ?? 'Prenotazione non confermata'}. ${result.refunded ? 'Il pagamento è stato rimborsato.' : ''}`.trim() }, { status: 409 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return guidedTripErrorResponse(error, 'Pagamento simulato');
  }
}
