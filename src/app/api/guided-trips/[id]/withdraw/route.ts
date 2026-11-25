import { NextRequest, NextResponse } from 'next/server';
import { GuidedTripService } from '@/lib/guided-trips/service';
import { currentActor, errorResponse, unauthorized } from '@/lib/guided-trips/http';

export const dynamic = 'force-dynamic';

/** Il Sentinel ritira un viaggio guidato. */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await currentActor();
  if (!actor) return unauthorized();
  try {
    const { id } = await params;
    const updated = await GuidedTripService.withdraw(actor, id);
    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (error) {
    return errorResponse(error, 'ritiro viaggio guidato');
  }
}
