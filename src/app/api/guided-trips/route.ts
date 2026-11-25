import { NextRequest, NextResponse } from 'next/server';
import { GuidedTripService } from '@/lib/guided-trips/guidedTripService';
import { currentGuidedTripActor, guidedTripErrorResponse, parseGuidedTripPayload, unauthenticatedResponse } from '@/lib/guided-trips/guidedTripApi';

export const dynamic = 'force-dynamic';

/** Elenco pubblico dei viaggi guidati in programma. */
export async function GET() {
  try {
    const guidedTrips = await GuidedTripService.listUpcomingPublished();
    return NextResponse.json({ guidedTrips });
  } catch (error) {
    return guidedTripErrorResponse(error, 'Elenco viaggi guidati');
  }
}

/** Creazione di un viaggio guidato (bozza o pubblicato) da parte di un Ranger. */
export async function POST(request: NextRequest) {
  try {
    const actor = await currentGuidedTripActor();
    if (!actor) return unauthenticatedResponse();
    const { details, publish } = parseGuidedTripPayload(await request.json());
    const guidedTrip = await GuidedTripService.create(actor, details, publish);
    return NextResponse.json({ guidedTrip }, { status: 201 });
  } catch (error) {
    return guidedTripErrorResponse(error, 'Creazione viaggio guidato');
  }
}
