'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Ticket } from 'lucide-react';
import type { UserBookingRow } from '@/lib/guided-trips/guidedTripService';
import { bookingStatusLabel, formatEuro, formatStoredDay, type GuidedTripBookingStatusValue } from '@/lib/guided-trips/guidedTripRules';

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-800',
  PENDING_PAYMENT: 'bg-blue-100 text-blue-800',
  REFUND_PENDING: 'bg-amber-100 text-amber-800',
  REFUND_FAILED: 'bg-amber-100 text-amber-800',
  REFUNDED: 'bg-gray-200 text-gray-700',
};

/** Sezione della dashboard per tutti gli utenti: le prenotazioni di viaggi guidati. */
export default function GuidedTripBookingsSection() {
  const [rows, setRows] = useState<UserBookingRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/user/guided-trip-bookings')
      .then(async response => {
        if (!response.ok) throw new Error('Errore nel caricamento delle prenotazioni');
        const data = await response.json();
        setRows(data.bookings ?? []);
      })
      .catch(fetchError => setError(fetchError instanceof Error ? fetchError.message : 'Errore sconosciuto'));
  }, []);

  return (
    <section className="rounded-lg border bg-white shadow-sm" aria-labelledby="guided-trip-bookings-title">
      <div className="flex items-center border-b p-6">
        <Ticket className="mr-2 h-5 w-5 text-green-600" aria-hidden />
        <h2 id="guided-trip-bookings-title" className="text-lg font-semibold text-gray-900">Le mie prenotazioni</h2>
      </div>
      <div className="p-6">
        {error && <p className="text-center text-red-600">{error}</p>}
        {!error && rows === null && <p className="text-center text-gray-500">Caricamento...</p>}
        {rows && rows.length === 0 && (
          <div className="text-center">
            <p className="text-gray-500">Non hai prenotazioni di viaggi guidati.</p>
            <Link href="/guided-trips" className="mt-3 inline-flex rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
              Scopri i viaggi guidati
            </Link>
          </div>
        )}
        {rows && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
                  <th scope="col" className="px-3 py-2 font-semibold">Viaggio guidato</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Date</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Pagato</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Disdetta gratuita fino al</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Stato</th>
                  <th scope="col" className="px-3 py-2"><span className="sr-only">Azioni</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id} className="border-b border-gray-100">
                    <td className="px-3 py-3">
                      <p className="font-semibold text-gray-900">{row.guidedTrip.title}</p>
                      <p className="text-xs text-gray-500">con {row.guidedTrip.organizerName}</p>
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      {formatStoredDay(row.guidedTrip.startDate, { day: 'numeric', month: 'short' })} – {formatStoredDay(row.guidedTrip.endDate, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-3 py-3 text-gray-700">{formatEuro(row.amountPaid)}</td>
                    <td className="px-3 py-3 text-gray-700">{row.canCancel ? formatStoredDay(row.guidedTrip.freeCancellationUntil) : '—'}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[row.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {bookingStatusLabel({ status: row.status as GuidedTripBookingStatusValue, cancelledByUserAt: row.cancelledByUserAt })}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link href={`/guided-trips/${row.guidedTrip.id}`} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        {row.canCancel ? 'Dettagli e disdetta' : 'Dettagli'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
