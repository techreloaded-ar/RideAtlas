import { NextResponse } from 'next/server';
import { startGuidedTripBooking } from '@/lib/guided-trips/guidedTripService';
import { currentActingUser, guidedTripErrorResponse, loginRequiredResponse } from '@/lib/guided-trips/guidedTripApi';

export const dynamic = 'force-dynamic';

/** Trattiene un posto e prepara il pagamento. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentActingUser();
  if (!user) return loginRequiredResponse();
  try {
    const { id } = await params;
    const booking = await startGuidedTripBooking(user, id);
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    return guidedTripErrorResponse(error, 'prenotazione');
  }
}
