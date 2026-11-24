import { NextResponse } from 'next/server';
import { canOrganizeGuidedTrips, listOrganizerGuidedTrips } from '@/lib/guided-trips/guidedTripService';
import { currentActingUser, guidedTripErrorResponse, loginRequiredResponse } from '@/lib/guided-trips/guidedTripApi';

export const dynamic = 'force-dynamic';

/** Viaggi guidati organizzati dall'utente corrente. */
export async function GET() {
  const user = await currentActingUser();
  if (!user) return loginRequiredResponse();
  if (!canOrganizeGuidedTrips(user)) return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
  try {
    return NextResponse.json({ guidedTrips: await listOrganizerGuidedTrips(user) });
  } catch (error) {
    return guidedTripErrorResponse(error, 'elenco organizzatore');
  }
}
