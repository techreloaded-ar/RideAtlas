import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guidedTripInputSchema } from '@/lib/guided-trips/rules';
import { GuidedTripService } from '@/lib/guided-trips/service';
import { currentActor, errorResponse, unauthorized } from '@/lib/guided-trips/http';

export const dynamic = 'force-dynamic';

const statusSchema = z.enum(['Bozza', 'Pubblicato']).default('Bozza');

/** Elenco pubblico dei viaggi guidati in programma. */
export async function GET() {
  try {
    return NextResponse.json({ guidedTrips: await GuidedTripService.listUpcoming() });
  } catch (error) {
    return errorResponse(error, 'elenco viaggi guidati');
  }
}

/** Il Ranger crea un viaggio guidato, in bozza o già pubblicato. */
export async function POST(request: NextRequest) {
  const actor = await currentActor();
  if (!actor) return unauthorized();
  try {
    const body = await request.json();
    const input = guidedTripInputSchema.parse(body);
    const status = statusSchema.parse(body.status);
    const created = await GuidedTripService.create(actor, input, status);
    return NextResponse.json({ id: created.id, status: created.status }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'creazione viaggio guidato');
  }
}
