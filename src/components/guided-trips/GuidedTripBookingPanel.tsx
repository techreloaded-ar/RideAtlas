'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import type { BookingStart, GuidedTripDetail } from '@/lib/guided-trips/guidedTripService';
import { bookingStatusLabel, formatEuro, formatStoredDay, type GuidedTripBookingStatusValue } from '@/lib/guided-trips/guidedTripRules';
import { SeatOccupancyBar } from './SeatAvailabilityBadge';

const GuidedTripStripeCheckout = dynamic(() => import('./GuidedTripStripeCheckout'), {
  ssr: false,
  loading: () => <p className="text-sm text-gray-500">Caricamento del pagamento…</p>,
});

interface GuidedTripBookingPanelProps {
  guidedTrip: GuidedTripDetail;
  isLoggedIn: boolean;
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }).format(new Date(iso));
}

function PanelBox({ children, highlighted = false, testId }: { children: React.ReactNode; highlighted?: boolean; testId?: string }) {
  return (
    <div data-testid={testId} className={`rounded-xl bg-white p-5 shadow-sm ${highlighted ? 'border-2 border-green-300' : 'ring-1 ring-black/5'}`}>
      {children}
    </div>
  );
}

export default function GuidedTripBookingPanel({ guidedTrip, isLoggedIn }: GuidedTripBookingPanelProps) {
  const router = useRouter();
  const [pendingPayment, setPendingPayment] = useState<BookingStart | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [confirmingCancellation, setConfirmingCancellation] = useState(false);

  const viewerBooking = guidedTrip.viewerBooking;
  const freeCancellationDay = formatStoredDay(guidedTrip.freeCancellationUntil);

  async function postJson(url: string, body?: unknown) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, data };
  }

  async function startBooking() {
    setBusy(true);
    setErrorMessage(null);
    setInfoMessage(null);
    const { ok, data } = await postJson(`/api/guided-trips/${guidedTrip.id}/bookings`);
    setBusy(false);
    if (!ok) {
      setErrorMessage(data.error ?? 'Non è stato possibile prenotare');
      router.refresh();
      return;
    }
    setPendingPayment(data as BookingStart);
  }

  async function finishPayment(url: string, body?: unknown) {
    setBusy(true);
    setErrorMessage(null);
    const { ok, data } = await postJson(url, body);
    setBusy(false);
    setPendingPayment(null);
    if (ok) setInfoMessage(data.message ?? 'Posto prenotato');
    else setErrorMessage(data.message ?? data.error ?? 'Pagamento non riuscito');
    router.refresh();
  }

  async function cancelBooking() {
    if (!viewerBooking) return;
    setBusy(true);
    setErrorMessage(null);
    const { ok, data } = await postJson(`/api/guided-trip-bookings/${viewerBooking.id}/cancellation`);
    setBusy(false);
    setConfirmingCancellation(false);
    if (ok) setInfoMessage(data.message);
    else setErrorMessage(data.error ?? 'Non è stato possibile disdire');
    router.refresh();
  }

  const messages = (
    <>
      {errorMessage && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{errorMessage}</p>}
      {infoMessage && <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800" role="status">{infoMessage}</p>}
    </>
  );

  // Pagamento in corso (posto trattenuto)
  if (pendingPayment) {
    return (
      <PanelBox testId="guided-trip-payment">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Completa il pagamento</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{formatEuro(pendingPayment.amount)}</p>
        <p className="mt-1 text-sm text-gray-600">Il tuo posto è trattenuto fino alle {formatTime(pendingPayment.seatHeldUntil)}.</p>
        <div className="mt-4">
          {pendingPayment.paymentMode === 'simulated' ? (
            <div className="space-y-3">
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Pagamento simulato: questo ambiente di prova non ha Stripe configurato, nessun addebito reale.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => finishPayment(`/api/guided-trip-bookings/${pendingPayment.bookingId}/simulated-payment`, { succeeded: true })}
                className="w-full rounded-lg bg-primary-600 px-4 py-2.5 font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
              >
                Simula pagamento riuscito
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => finishPayment(`/api/guided-trip-bookings/${pendingPayment.bookingId}/simulated-payment`, { succeeded: false })}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Simula pagamento fallito
              </button>
            </div>
          ) : (
            <GuidedTripStripeCheckout
              clientSecret={pendingPayment.clientSecret!}
              amount={pendingPayment.amount}
              onPaid={() => finishPayment(`/api/guided-trip-bookings/${pendingPayment.bookingId}/stripe-confirmation`)}
            />
          )}
        </div>
        {messages}
      </PanelBox>
    );
  }

  // Posto prenotato
  if (viewerBooking?.status === 'CONFIRMED' && guidedTrip.status !== 'Annullato') {
    return (
      <PanelBox highlighted testId="guided-trip-booked">
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-sm font-semibold text-green-800">
          <CheckCircle2 className="h-4 w-4" aria-hidden /> Posto prenotato
        </span>
        <p className="mt-3 text-sm text-gray-600">
          Pagato {formatEuro(viewerBooking.amountPaid)}
          {viewerBooking.confirmedAt ? ` il ${new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Rome' }).format(new Date(viewerBooking.confirmedAt))}` : ''}.
        </p>
        {guidedTrip.withinFreeCancellation ? (
          <>
            <p className="mt-1 text-sm text-gray-600">Puoi disdire gratuitamente fino al {freeCancellationDay}.</p>
            {confirmingCancellation ? (
              <div className="mt-4 space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-800">Confermi la disdetta? Il posto tornerà disponibile e riceverai il rimborso di {formatEuro(viewerBooking.amountPaid)}.</p>
                <div className="flex gap-2">
                  <button type="button" disabled={busy} onClick={cancelBooking} className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                    Sì, disdici
                  </button>
                  <button type="button" disabled={busy} onClick={() => setConfirmingCancellation(false)} className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700">
                    No, tengo il posto
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingCancellation(true)}
                className="mt-4 w-full rounded-lg border border-red-300 bg-white px-4 py-2.5 font-semibold text-red-700 hover:bg-red-50"
              >
                Disdici e ricevi il rimborso
              </button>
            )}
          </>
        ) : (
          <p className="mt-1 text-sm text-gray-600">La disdetta gratuita era possibile fino al {freeCancellationDay}: la prenotazione non è più rimborsabile, salvo annullamento del viaggio.</p>
        )}
        {messages}
      </PanelBox>
    );
  }

  const bookingNote =
    viewerBooking && viewerBooking.status !== 'CONFIRMED' && viewerBooking.status !== 'PENDING_PAYMENT' ? (
      <p className="mb-4 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700" data-testid="guided-trip-booking-note">
        La tua prenotazione: <span className="font-semibold">{bookingStatusLabel({ status: viewerBooking.status as GuidedTripBookingStatusValue, cancelledByUserAt: viewerBooking.cancelledByUserAt })}</span>
      </p>
    ) : null;

  if (guidedTrip.status === 'Annullato') {
    return (
      <PanelBox testId="guided-trip-cancelled">
        {bookingNote}
        <p className="font-semibold text-red-700">Questo viaggio è stato annullato dal Ranger.</p>
        <p className="mt-1 text-sm text-gray-600">Chi aveva già pagato riceve il rimborso completo.</p>
        {messages}
      </PanelBox>
    );
  }

  let action: React.ReactNode;
  if (guidedTrip.status === 'Bozza') {
    action = <p className="text-sm text-gray-600">È una bozza: pubblicala dalla pagina di gestione per aprire le prenotazioni.</p>;
  } else if (guidedTrip.viewerIsOrganizer) {
    action = <p className="text-sm text-gray-600">Sei l&apos;organizzatore di questo viaggio.</p>;
  } else if (guidedTrip.departed) {
    action = <p className="text-sm text-gray-600">Le prenotazioni sono chiuse: il viaggio è già partito.</p>;
  } else if (guidedTrip.freeSeats === 0) {
    action = <button type="button" disabled className="w-full rounded-lg bg-gray-200 px-4 py-2.5 font-semibold text-gray-600">Esaurito</button>;
  } else if (guidedTrip.paymentMode === 'unavailable') {
    action = <p className="text-sm text-gray-600">I pagamenti online non sono al momento disponibili.</p>;
  } else if (!isLoggedIn) {
    action = (
      <Link href="/auth/signin" className="block w-full rounded-lg bg-primary-600 px-4 py-2.5 text-center font-semibold text-white hover:bg-primary-700">
        Accedi per prenotare
      </Link>
    );
  } else {
    action = (
      <button
        type="button"
        disabled={busy}
        onClick={startBooking}
        className="w-full rounded-lg bg-primary-600 px-4 py-2.5 font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
      >
        {viewerBooking?.status === 'PENDING_PAYMENT' ? 'Completa il pagamento' : `Prenota e paga ${formatEuro(guidedTrip.pricePerPerson)}`}
      </button>
    );
  }

  return (
    <PanelBox testId="guided-trip-booking">
      {bookingNote}
      <p className="text-3xl font-bold text-gray-900">
        {formatEuro(guidedTrip.pricePerPerson)} <span className="text-sm font-normal text-gray-500">a persona</span>
      </p>
      <div className="mt-3">
        <SeatOccupancyBar maxParticipants={guidedTrip.maxParticipants} occupiedSeats={guidedTrip.occupiedSeats} />
        <p className="mt-1 text-sm">
          <span className="font-semibold">{guidedTrip.freeSeats === 0 ? 'Nessun posto libero' : `${guidedTrip.freeSeats} ${guidedTrip.freeSeats === 1 ? 'posto libero' : 'posti liberi'}`}</span>{' '}
          <span className="text-gray-500">su {guidedTrip.maxParticipants}</span>
        </p>
      </div>
      <div className="mt-3 flex justify-between border-b border-gray-100 pb-2 text-sm">
        <span className="text-gray-500">Disdetta gratuita fino al</span>
        <span className="font-semibold text-gray-900">{freeCancellationDay}</span>
      </div>
      <p className="mb-4 mt-2 text-xs text-gray-500">
        Disdici entro la scadenza e ti rimborsiamo in automatico. Dopo, la prenotazione non è rimborsabile, salvo annullamento del viaggio.
      </p>
      {action}
      {messages}
    </PanelBox>
  );
}
