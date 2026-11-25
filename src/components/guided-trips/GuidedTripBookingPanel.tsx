'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import type { GuidedTripDetail } from '@/types/guided-trip';
import type { GuidedTripPaymentMode } from '@/lib/guided-trips/guidedTripPaymentGateway';
import { formatEuro, formatLongDate, remainingSeatsLabel } from '@/lib/guided-trips/guidedTripFormat';
import { PARTICIPANT_CANCELLATION_DAYS_BEFORE_START, SEAT_HOLD_MINUTES } from '@/lib/guided-trips/guidedTripPolicy';

// Il modulo carta Stripe si carica solo quando Stripe è configurato.
const StripePaymentForm = dynamic(() => import('@/components/payment/StripePaymentForm'), { ssr: false });

interface GuidedTripBookingPanelProps {
  guidedTrip: GuidedTripDetail;
  isLoggedIn: boolean;
  paymentMode: GuidedTripPaymentMode;
}

interface HeldBooking {
  id: string;
  amount: number;
  seatHeldUntil: string;
}

export default function GuidedTripBookingPanel({ guidedTrip, isLoggedIn, paymentMode }: GuidedTripBookingPanelProps) {
  const router = useRouter();
  const [heldBooking, setHeldBooking] = useState<HeldBooking | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const soldOut = guidedTrip.remainingSeats <= 0;
  const occupiedPercent = Math.round(((guidedTrip.maxParticipants - guidedTrip.remainingSeats) / guidedTrip.maxParticipants) * 100);

  const goToBookings = useCallback((bookingId: string) => {
    router.push(`/dashboard/guided-trips?tab=bookings&booked=${encodeURIComponent(bookingId)}`);
    router.refresh();
  }, [router]);

  const holdSeat = async () => {
    setBusy(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/guided-trips/${guidedTrip.id}/bookings`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Prenotazione non riuscita');
      setHeldBooking(data.booking);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Prenotazione non riuscita');
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const paySimulated = async () => {
    if (!heldBooking) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/guided-trips/bookings/${heldBooking.id}/simulated-payment`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Pagamento non riuscito');
      goToBookings(heldBooking.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Pagamento non riuscito');
      setHeldBooking(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleStripeError = useCallback((message: string) => {
    setErrorMessage(message);
    setHeldBooking(null);
  }, []);

  const cancellationNotice = (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-900 mt-4">
      <strong>Disdetta:</strong> puoi disdire con rimborso totale fino al{' '}
      <strong>{formatLongDate(guidedTrip.participantCancellationDeadline)}</strong> ({PARTICIPANT_CANCELLATION_DAYS_BEFORE_START} giorni prima della partenza).
      Dopo questa data non è più possibile disdire.
    </div>
  );

  let action: React.ReactNode;
  if (guidedTrip.status === 'Annullato') {
    action = <p className="text-sm text-red-700 font-medium">Viaggio annullato: prenotazioni chiuse.</p>;
  } else if (guidedTrip.status === 'Bozza') {
    action = <p className="text-sm text-gray-600">Il viaggio è in bozza: le prenotazioni si aprono quando lo pubblichi.</p>;
  } else if (guidedTrip.viewerIsOrganizer) {
    action = (
      <p className="text-sm text-gray-700">
        Sei l&apos;organizzatore di questo viaggio.{' '}
        <Link href="/dashboard/guided-trips?tab=organized" className="text-primary-700 underline">Vedi i partecipanti</Link>
      </p>
    );
  } else if (guidedTrip.viewerHasConfirmedBooking) {
    action = (
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 text-sm text-primary-800">
        Hai già un posto su questo viaggio.{' '}
        <Link href="/dashboard/guided-trips?tab=bookings" className="font-semibold underline">Le mie prenotazioni</Link>
      </div>
    );
  } else if (!guidedTrip.bookable) {
    action = <p className="text-sm text-gray-600">Prenotazioni chiuse: il viaggio è già partito.</p>;
  } else if (soldOut && !heldBooking) {
    action = <span className="block w-full text-center px-4 py-3 rounded-lg bg-gray-200 text-gray-600 font-semibold">Esaurito</span>;
  } else if (!isLoggedIn) {
    action = (
      <Link href="/auth/signin" className="block w-full text-center px-4 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold">
        Accedi per prenotare
      </Link>
    );
  } else if (!heldBooking) {
    action = (
      <button
        type="button"
        onClick={holdSeat}
        disabled={busy || paymentMode === 'unavailable'}
        className="w-full px-4 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold"
      >
        {busy ? 'Riservo il posto…' : 'Prenota il tuo posto'}
      </button>
    );
  } else if (paymentMode === 'simulated') {
    action = (
      <div className="space-y-3">
        <p className="text-sm text-gray-700">
          Posto riservato per {SEAT_HOLD_MINUTES} minuti. Completa il pagamento di <strong>{formatEuro(heldBooking.amount)}</strong>.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-900">
          Ambiente di prova: il pagamento è simulato e non viene addebitato nulla.
        </div>
        <button
          type="button"
          onClick={paySimulated}
          disabled={busy}
          className="w-full px-4 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold"
        >
          {busy ? 'Pagamento in corso…' : `Paga ${formatEuro(heldBooking.amount)} (simulato)`}
        </button>
      </div>
    );
  } else {
    action = (
      <div className="space-y-3">
        <p className="text-sm text-gray-700">Posto riservato per {SEAT_HOLD_MINUTES} minuti. Completa il pagamento con carta.</p>
        <StripePaymentForm
          purchaseId={heldBooking.id}
          amount={heldBooking.amount}
          createPaymentIntentUrl={`/api/guided-trips/bookings/${heldBooking.id}/payment-intent`}
          confirmPaymentUrl={`/api/guided-trips/bookings/${heldBooking.id}/confirm-payment`}
          paymentDescription={`Prenotazione ${guidedTrip.title}`}
          onSuccess={() => goToBookings(heldBooking.id)}
          onError={handleStripeError}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 lg:sticky lg:top-6">
      <div className="text-3xl font-extrabold text-primary-700">
        {formatEuro(guidedTrip.pricePerPerson)} <span className="text-sm font-normal text-gray-500">a persona</span>
      </div>
      {guidedTrip.status === 'Pubblicato' && (
        <div className="mt-3">
          <div className="text-sm text-gray-800 font-semibold">{remainingSeatsLabel(guidedTrip.remainingSeats, guidedTrip.maxParticipants)}</div>
          <div className="h-1.5 bg-gray-200 rounded mt-1.5" aria-hidden>
            <div className={`h-1.5 rounded ${soldOut ? 'bg-gray-400' : 'bg-primary-600'}`} style={{ width: `${occupiedPercent}%` }} />
          </div>
        </div>
      )}
      <div className="mt-4">{action}</div>
      {errorMessage && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 mt-3">{errorMessage}</div>
      )}
      {guidedTrip.status === 'Pubblicato' && cancellationNotice}
      <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
        <Lock className="w-3 h-3" aria-hidden /> Un posto per prenotazione. Pagamento sulla piattaforma RideAtlas.
      </p>
    </div>
  );
}
