import { NextResponse } from 'next/server';
import { canOrganize, GuidedTripService } from '@/lib/guided-trips/service';
import { currentActor, errorResponse, unauthorized } from '@/lib/guided-trips/http';

export const dynamic = 'force-dynamic';

/** Viaggi guidati organizzati dall'utente corrente. */
export async function GET() {
  const actor = await currentActor();
  if (!actor) return unauthorized();
  if (!canOrganize(actor.role)) return NextResponse.json({ guidedTrips: [] });
  try {
    return NextResponse.json({ guidedTrips: await GuidedTripService.listByOrganizer(actor.id) });
  } catch (error) {
    return errorResponse(error, 'miei viaggi guidati');
  }
}
