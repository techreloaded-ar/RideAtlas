import { NextResponse } from 'next/server';
import { listParticipantBookings } from '@/lib/guided-trips/guidedTripService';
import { currentActingUser, guidedTripErrorResponse, loginRequiredResponse } from '@/lib/guided-trips/guidedTripApi';

export const dynamic = 'force-dynamic';

/** Prenotazioni di viaggi guidati dell'utente corrente. */
export async function GET() {
  const user = await currentActingUser();
  if (!user) return loginRequiredResponse();
  try {
    return NextResponse.json({ bookings: await listParticipantBookings(user) });
  } catch (error) {
    return guidedTripErrorResponse(error, 'elenco prenotazioni');
  }
}
