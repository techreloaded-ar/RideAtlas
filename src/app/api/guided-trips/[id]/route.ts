import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { guidedTripInputSchema } from '@/lib/guided-trips/rules';
import { GuidedTripService } from '@/lib/guided-trips/service';
import { currentActor, errorResponse, unauthorized } from '@/lib/guided-trips/http';

export const dynamic = 'force-dynamic';

const statusSchema = z.enum(['Bozza', 'Pubblicato']);

/** L'organizzatore modifica il viaggio guidato e ne sceglie lo stato (bozza o pubblicato). */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await currentActor();
  if (!actor) return unauthorized();
  try {
    const { id } = await params;
    const body = await request.json();
    const input = guidedTripInputSchema.parse(body);
    const status = statusSchema.parse(body.status);
    const updated = await GuidedTripService.update(actor, id, input, status);
    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (error) {
    return errorResponse(error, 'modifica viaggio guidato');
  }
}
