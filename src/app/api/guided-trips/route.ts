import { NextResponse } from 'next/server';
import { createGuidedTrip } from '@/lib/guided-trips/guidedTripService';
import { currentActingUser, guidedTripErrorResponse, loginRequiredResponse, readJsonBody } from '@/lib/guided-trips/guidedTripApi';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await currentActingUser();
  if (!user) return loginRequiredResponse();
  try {
    const created = await createGuidedTrip(user, await readJsonBody(request));
    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (error) {
    return guidedTripErrorResponse(error, 'creazione');
  }
}
