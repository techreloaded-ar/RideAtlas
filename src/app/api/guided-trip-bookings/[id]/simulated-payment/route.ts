import { NextResponse } from 'next/server';
import { z } from 'zod';
import { completeSimulatedPayment } from '@/lib/guided-trips/guidedTripService';
import {
  currentActingUser,
  guidedTripErrorResponse,
  loginRequiredResponse,
  notifyBookingConfirmed,
  paymentOutcomeResponse,
  readJsonBody,
} from '@/lib/guided-trips/guidedTripApi';

export const dynamic = 'force-dynamic';

const simulatedPaymentSchema = z.object({ succeeded: z.boolean() });

/** Solo in ambienti senza Stripe e fuori produzione: simula l'esito del pagamento. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentActingUser();
  if (!user) return loginRequiredResponse();
  const parsed = simulatedPaymentSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) return NextResponse.json({ error: 'Esito del pagamento mancante' }, { status: 400 });
  try {
    const { id } = await params;
    const outcome = await completeSimulatedPayment(user, id, parsed.data.succeeded);
    if (outcome.outcome !== 'payment_failed') await notifyBookingConfirmed(outcome);
    return paymentOutcomeResponse(outcome);
  } catch (error) {
    return guidedTripErrorResponse(error, 'pagamento simulato');
  }
}
