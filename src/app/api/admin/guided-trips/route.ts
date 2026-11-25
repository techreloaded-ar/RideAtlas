import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { GuidedTripService } from '@/lib/guided-trips/service';
import { currentActor, errorResponse, unauthorized } from '@/lib/guided-trips/http';

export const dynamic = 'force-dynamic';

/** Tutti i viaggi guidati, per il controllo dei Sentinel. */
export async function GET() {
  const actor = await currentActor();
  if (!actor) return unauthorized();
  if (actor.role !== UserRole.Sentinel) return NextResponse.json({ error: 'Accesso riservato ai Sentinel' }, { status: 403 });
  try {
    return NextResponse.json({ guidedTrips: await GuidedTripService.listAll() });
  } catch (error) {
    return errorResponse(error, 'elenco admin viaggi guidati');
  }
}
