import { NextRequest, NextResponse } from 'next/server';
import { GuidedTripService } from '@/lib/guided-trips/guidedTripService';
import { currentGuidedTripActor, guidedTripErrorResponse, unauthenticatedResponse } from '@/lib/guided-trips/guidedTripApi';

export const dynamic = 'force-dynamic';

/** Disdetta del partecipante entro la scadenza, con rimborso automatico totale. */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const actor = await currentGuidedTripActor();
    if (!actor) return unauthenticatedResponse();
    const result = await GuidedTripService.cancelByParticipant((await params).bookingId, actor);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return guidedTripErrorResponse(error, 'Disdetta prenotazione');
  }
}
