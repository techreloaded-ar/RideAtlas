import { NextResponse } from 'next/server';
import { updateGuidedTrip } from '@/lib/guided-trips/guidedTripService';
import { currentActingUser, guidedTripErrorResponse, loginRequiredResponse, readJsonBody } from '@/lib/guided-trips/guidedTripApi';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentActingUser();
  if (!user) return loginRequiredResponse();
  try {
    const { id } = await params;
    await updateGuidedTrip(user, id, await readJsonBody(request));
    return NextResponse.json({ success: true, message: 'Modifiche salvate' });
  } catch (error) {
    return guidedTripErrorResponse(error, 'modifica');
  }
}
