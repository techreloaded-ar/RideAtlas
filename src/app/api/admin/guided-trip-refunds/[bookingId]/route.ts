import { NextResponse } from 'next/server';
import { refundBookingBySentinel } from '@/lib/guided-trips/guidedTripService';
import { currentActingUser, guidedTripErrorResponse, loginRequiredResponse } from '@/lib/guided-trips/guidedTripApi';

export const dynamic = 'force-dynamic';

/** Esegue (o ritenta) il rimborso di una prenotazione. */
export async function POST(_request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const user = await currentActingUser();
  if (!user) return loginRequiredResponse();
  try {
    const { bookingId } = await params;
    const result = await refundBookingBySentinel(user, bookingId);
    if (!result.refunded) {
      return NextResponse.json({ success: false, error: `Rimborso non riuscito: ${result.error}` }, { status: 502 });
    }
    return NextResponse.json({ success: true, message: 'Rimborso eseguito' });
  } catch (error) {
    return guidedTripErrorResponse(error, 'rimborso Sentinel');
  }
}
