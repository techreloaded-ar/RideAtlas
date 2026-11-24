import { NextResponse } from 'next/server';
import { cancelBookingByParticipant } from '@/lib/guided-trips/guidedTripService';
import { sendGuidedTripBookingCancelledEmail } from '@/lib/core/email';
import { currentActingUser, guidedTripErrorResponse, loginRequiredResponse } from '@/lib/guided-trips/guidedTripApi';

export const dynamic = 'force-dynamic';

/** Disdetta dell'utente entro la scadenza, con rimborso automatico. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentActingUser();
  if (!user) return loginRequiredResponse();
  try {
    const { id } = await params;
    const result = await cancelBookingByParticipant(user, id);
    try {
      await sendGuidedTripBookingCancelledEmail({
        email: result.participant.email,
        participantName: result.participant.name,
        title: result.title,
        amount: result.amount,
        refunded: result.refunded,
      });
    } catch (emailError) {
      console.error('Email di disdetta non inviata:', emailError);
    }
    return NextResponse.json({
      success: true,
      refunded: result.refunded,
      message: result.refunded
        ? 'Prenotazione disdetta: il rimborso è stato avviato'
        : 'Prenotazione disdetta: il rimborso automatico non è riuscito e verrà verificato dallo staff',
    });
  } catch (error) {
    return guidedTripErrorResponse(error, 'disdetta');
  }
}
