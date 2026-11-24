import { NextResponse } from 'next/server';
import { cancelGuidedTrip } from '@/lib/guided-trips/guidedTripService';
import { sendGuidedTripCancelledByOrganizerEmail } from '@/lib/core/email';
import { currentActingUser, guidedTripErrorResponse, loginRequiredResponse } from '@/lib/guided-trips/guidedTripApi';

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentActingUser();
  if (!user) return loginRequiredResponse();
  try {
    const { id } = await params;
    const { title, participantsToNotify } = await cancelGuidedTrip(user, id);
    await Promise.allSettled(
      participantsToNotify.map(participant =>
        sendGuidedTripCancelledByOrganizerEmail({ email: participant.email, participantName: participant.name, title }),
      ),
    );
    return NextResponse.json({ success: true, message: 'Viaggio annullato', notifiedParticipants: participantsToNotify.length });
  } catch (error) {
    return guidedTripErrorResponse(error, 'annullamento');
  }
}
