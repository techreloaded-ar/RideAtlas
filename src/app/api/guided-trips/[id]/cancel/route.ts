import { NextRequest, NextResponse } from 'next/server';
import { GuidedTripService } from '@/lib/guided-trips/guidedTripService';
import { currentGuidedTripActor, guidedTripErrorResponse, unauthenticatedResponse } from '@/lib/guided-trips/guidedTripApi';

export const dynamic = 'force-dynamic';

/** Annullamento del viaggio da parte del ranger: rimborso automatico di tutti i partecipanti. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await currentGuidedTripActor();
    if (!actor) return unauthenticatedResponse();
    const body = await request.json().catch(() => ({}));
    const result = await GuidedTripService.cancelByOrganizer((await params).id, actor, body?.reason);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return guidedTripErrorResponse(error, 'Annullamento viaggio guidato');
  }
}
