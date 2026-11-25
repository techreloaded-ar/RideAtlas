import { NextResponse } from 'next/server';
import { GuidedTripBookingService } from '@/lib/guided-trips/service';
import { currentActor, errorResponse, unauthorized } from '@/lib/guided-trips/http';

export const dynamic = 'force-dynamic';

/** Prenotazioni confermate dell'utente corrente. */
export async function GET() {
  const actor = await currentActor();
  if (!actor) return unauthorized();
  try {
    return NextResponse.json({ bookings: await GuidedTripBookingService.listForUser(actor.id) });
  } catch (error) {
    return errorResponse(error, 'mie prenotazioni');
  }
}
