import { NextRequest, NextResponse } from 'next/server';
import { GuidedTripService } from '@/lib/guided-trips/service';
import { currentActor, errorResponse, unauthorized } from '@/lib/guided-trips/http';

export const dynamic = 'force-dynamic';

/** Partecipanti confermati, visibili all'organizzatore e ai Sentinel. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await currentActor();
  if (!actor) return unauthorized();
  try {
    const { id } = await params;
    const rows = await GuidedTripService.participants(actor, id);
    return NextResponse.json({
      participants: rows.map(r => ({ id: r.id, name: r.user.name, email: r.user.email, confirmedAt: r.confirmedAt?.toISOString() ?? null })),
    });
  } catch (error) {
    return errorResponse(error, 'partecipanti viaggio guidato');
  }
}
