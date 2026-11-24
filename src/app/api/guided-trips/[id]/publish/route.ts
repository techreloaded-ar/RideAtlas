import { NextResponse } from 'next/server';
import { publishGuidedTrip } from '@/lib/guided-trips/guidedTripService';
import { currentActingUser, guidedTripErrorResponse, loginRequiredResponse } from '@/lib/guided-trips/guidedTripApi';

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentActingUser();
  if (!user) return loginRequiredResponse();
  try {
    const { id } = await params;
    await publishGuidedTrip(user, id);
    return NextResponse.json({ success: true, message: 'Viaggio pubblicato' });
  } catch (error) {
    return guidedTripErrorResponse(error, 'pubblicazione');
  }
}
