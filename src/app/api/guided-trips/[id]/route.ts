import { NextRequest, NextResponse } from 'next/server';
import { GuidedTripService } from '@/lib/guided-trips/guidedTripService';
import { currentGuidedTripActor, guidedTripErrorResponse, parseGuidedTripPayload, unauthenticatedResponse } from '@/lib/guided-trips/guidedTripApi';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await currentGuidedTripActor();
    const guidedTrip = await GuidedTripService.getDetail((await params).id, actor);
    if (!guidedTrip) return NextResponse.json({ error: 'Viaggio guidato non trovato' }, { status: 404 });
    return NextResponse.json({ guidedTrip });
  } catch (error) {
    return guidedTripErrorResponse(error, 'Dettaglio viaggio guidato');
  }
}

/** Modifica (ed eventuale pubblicazione) da parte dell'organizzatore. */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await currentGuidedTripActor();
    if (!actor) return unauthenticatedResponse();
    const { details, publish } = parseGuidedTripPayload(await request.json());
    const guidedTrip = await GuidedTripService.update((await params).id, actor, details, publish);
    return NextResponse.json({ guidedTrip });
  } catch (error) {
    return guidedTripErrorResponse(error, 'Modifica viaggio guidato');
  }
}
