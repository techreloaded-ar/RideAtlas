'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, MapPin } from 'lucide-react';
import type { GuidedTripBookingSummary } from '@/types/guided-trip';
import {
  formatDayOfMonth,
  formatEuro,
  formatLongDate,
  formatMonthAbbreviation,
  formatShortDate,
} from '@/lib/guided-trips/guidedTripFormat';

interface MyGuidedTripBookingsProps {
  bookings: GuidedTripBookingSummary[];
  justBookedId: string | null;
}

function statusBadge(booking: GuidedTripBookingSummary) {
  if (booking.status === 'CONFIRMED') return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Confermata</span>;
  const label = booking.refundPending ? 'Rimborso in verifica' : `Rimborsata ${formatEuro(booking.amount)}`;
  const tone = booking.refundPending ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${tone}`}>{label}</span>;
}

export default function MyGuidedTripBookings({ bookings, justBookedId }: MyGuidedTripBookingsProps) {
  const router = useRouter();
  const [bookingToCancel, setBookingToCancel] = useState<GuidedTripBookingSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const justBooked = justBookedId ? bookings.find(b => b.id === justBookedId && b.status === 'CONFIRMED') : undefined;

  const confirmCancellation = async () => {
    if (!bookingToCancel) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/guided-trips/bookings/${bookingToCancel.id}/cancel`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Disdetta non riuscita');
      setMessage({ tone: 'success', text: `Prenotazione disdetta: ti abbiamo rimborsato ${formatEuro(data.refundedAmount)}.` });
      setBookingToCancel(null);
      router.refresh();
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'Disdetta non riuscita' });
      setBookingToCancel(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {justBooked && (
        <div role="status" className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-sm text-primary-800 flex items-start gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" aria-hidden />
          <span>
            <strong>Prenotazione confermata!</strong> Hai pagato {formatEuro(justBooked.amount)} per <strong>{justBooked.title}</strong>.
            Ti aspettiamo il {formatLongDate(justBooked.startDate)} a {justBooked.meetingPoint}.
          </span>
        </div>
      )}
      {message && (
        <div role={message.tone === 'error' ? 'alert' : 'status'} className={`rounded-lg p-3 text-sm border ${message.tone === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-primary-50 border-primary-200 text-primary-800'}`}>
          {message.text}
        </div>
      )}

      {bookings.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="font-semibold text-gray-900">Non hai ancora prenotato viaggi guidati</p>
          <Link href="/guided-trips" className="inline-block mt-3 text-primary-700 underline">Scopri i viaggi guidati in programma</Link>
        </div>
      )}

      <ul className="space-y-3">
        {bookings.map(booking => (
          <li key={booking.id} className={`bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-4 ${booking.status === 'CONFIRMED' ? '' : 'opacity-90'}`}>
            <div className="w-16 shrink-0 text-center md:border-r border-gray-200 md:pr-4">
              <div className="text-2xl font-bold text-primary-700">{formatDayOfMonth(booking.startDate)}</div>
              <div className="text-xs text-gray-500">{formatMonthAbbreviation(booking.startDate)} {new Date(booking.startDate).getUTCFullYear()}</div>
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/guided-trips/${booking.guidedTripId}`} className="font-semibold text-gray-900 hover:text-primary-700">{booking.title}</Link>
              <div className="text-sm text-gray-500 flex flex-wrap items-center gap-x-1">
                <span>con {booking.organizerName} ·</span>
                <span className="inline-flex items-center"><MapPin className="w-3.5 h-3.5 mr-0.5 text-gray-400" aria-hidden />{booking.meetingPoint}</span>
                <span>· pagato {formatEuro(booking.amount)}</span>
              </div>
              <div className="text-sm text-gray-500 mt-0.5">
                {booking.status === 'CONFIRMED' && booking.canCancel && <>Disdetta con rimborso totale possibile fino al {formatShortDate(booking.cancellationDeadline)}</>}
                {booking.status === 'CONFIRMED' && !booking.canCancel && <>Termine per la disdetta scaduto il {formatShortDate(booking.cancellationDeadline)}</>}
                {booking.status === 'CANCELLED_BY_PARTICIPANT' && <>Disdetta da te{booking.cancelledAt ? ` il ${formatShortDate(booking.cancelledAt)}` : ''}</>}
                {booking.status === 'CANCELLED_BY_ORGANIZER' && <>Annullato dal ranger{booking.cancellationReason ? `: «${booking.cancellationReason}»` : ''}</>}
              </div>
            </div>
            <div className="flex items-center gap-3 md:justify-end">
              {statusBadge(booking)}
              {booking.status === 'CONFIRMED' && (booking.canCancel ? (
                <button
                  type="button"
                  onClick={() => { setMessage(null); setBookingToCancel(booking); }}
                  className="px-4 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-sm font-semibold"
                >
                  Disdici e ricevi il rimborso
                </button>
              ) : (
                <span className="px-4 py-2 rounded-lg bg-gray-200 text-gray-600 text-sm font-semibold">Disdetta non più possibile</span>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {bookingToCancel && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="cancel-booking-title">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 id="cancel-booking-title" className="text-lg font-semibold text-gray-900">Disdire la prenotazione?</h2>
            <p className="text-sm text-gray-600 mt-2">
              Liberi il tuo posto su <strong>{bookingToCancel.title}</strong> e ricevi il rimborso totale di {formatEuro(bookingToCancel.amount)}
              con lo stesso metodo di pagamento. L&apos;operazione non si può annullare.
            </p>
            <div className="flex justify-end gap-3 mt-5">
              <button type="button" onClick={() => setBookingToCancel(null)} disabled={busy} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm">
                Mantieni la prenotazione
              </button>
              <button type="button" onClick={confirmCancellation} disabled={busy} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold">
                {busy ? 'Disdetta in corso…' : 'Disdici e rimborsa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
