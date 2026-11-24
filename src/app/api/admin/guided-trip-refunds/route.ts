import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { listGuidedTripRefundQueue } from '@/lib/guided-trips/guidedTripService';
import { currentActingUser, guidedTripErrorResponse, loginRequiredResponse } from '@/lib/guided-trips/guidedTripApi';

export const dynamic = 'force-dynamic';

/** Prenotazioni di viaggi guidati da rimborsare (o rimborsate) dopo un annullamento. */
export async function GET() {
  const user = await currentActingUser();
  if (!user) return loginRequiredResponse();
  if (user.role !== UserRole.Sentinel) return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 });
  try {
    return NextResponse.json({ refunds: await listGuidedTripRefundQueue() });
  } catch (error) {
    return guidedTripErrorResponse(error, 'elenco rimborsi');
  }
}
