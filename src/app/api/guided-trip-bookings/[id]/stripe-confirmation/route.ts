import { confirmStripeBookingPayment } from '@/lib/guided-trips/guidedTripService';
import {
  currentActingUser,
  guidedTripErrorResponse,
  loginRequiredResponse,
  notifyBookingConfirmed,
  paymentOutcomeResponse,
} from '@/lib/guided-trips/guidedTripApi';

export const dynamic = 'force-dynamic';

/** Verifica su Stripe che il pagamento sia riuscito e conferma il posto. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentActingUser();
  if (!user) return loginRequiredResponse();
  try {
    const { id } = await params;
    const outcome = await confirmStripeBookingPayment(user, id);
    await notifyBookingConfirmed(outcome);
    return paymentOutcomeResponse(outcome);
  } catch (error) {
    return guidedTripErrorResponse(error, 'conferma pagamento Stripe');
  }
}
