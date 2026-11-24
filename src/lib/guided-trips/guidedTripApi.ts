// Supporto comune alle route API dei viaggi guidati.
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sendGuidedTripBookingConfirmationEmail } from '@/lib/core/email';
import { GuidedTripError, type ActingUser, type PaymentConfirmationOutcome } from './guidedTripService';

export async function currentActingUser(): Promise<ActingUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, role: session.user.role };
}

export function loginRequiredResponse(): NextResponse {
  return NextResponse.json({ error: 'Accedi per continuare' }, { status: 401 });
}

export function guidedTripErrorResponse(error: unknown, context: string): NextResponse {
  if (error instanceof GuidedTripError) {
    return NextResponse.json({ error: error.message, fieldErrors: error.fieldErrors }, { status: error.httpStatus });
  }
  console.error(`Errore viaggi guidati (${context}):`, error);
  return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

/** Invia la conferma senza far fallire la richiesta se l'email non parte. */
export async function notifyBookingConfirmed(outcome: PaymentConfirmationOutcome): Promise<void> {
  if (outcome.outcome !== 'confirmed') return;
  try {
    await sendGuidedTripBookingConfirmationEmail({
      email: outcome.participant.email,
      participantName: outcome.participant.name,
      guidedTripId: outcome.guidedTrip.id,
      title: outcome.guidedTrip.title,
      startDate: outcome.guidedTrip.startDate,
      meetingPoint: outcome.guidedTrip.meetingPoint,
      freeCancellationUntil: outcome.guidedTrip.freeCancellationUntil,
      amountPaid: outcome.guidedTrip.amountPaid,
    });
  } catch (error) {
    console.error('Email di conferma prenotazione non inviata:', error);
  }
}

const OUTCOME_MESSAGES: Record<string, string> = {
  confirmed: 'Posto prenotato',
  already_confirmed: 'Posto già prenotato',
  refunded_no_seats: 'Il tempo per completare il pagamento è scaduto e i posti sono esauriti: il pagamento è stato rimborsato',
  refund_pending_trip_cancelled: 'Il viaggio è stato annullato nel frattempo: riceverai il rimborso',
  payment_failed: 'Pagamento non riuscito: il posto è stato liberato',
};

export function paymentOutcomeResponse(outcome: { outcome: string }): NextResponse {
  const confirmed = outcome.outcome === 'confirmed' || outcome.outcome === 'already_confirmed';
  return NextResponse.json(
    { success: confirmed, outcome: outcome.outcome, message: OUTCOME_MESSAGES[outcome.outcome] },
    { status: confirmed ? 200 : 409 },
  );
}
