'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatLongDate, formatPrice } from '@/lib/guided-trips/rules';

interface BookingRow {
  id: string;
  amount: number;
  guidedTrip: { id: string; title: string; startDate: string; meetingPoint: string; status: string };
}

/** Sezione Dashboard: posti confermati nei viaggi guidati. Nascosta se non ce ne sono. */
export default function MyGuidedBookings() {
  const [bookings, setBookings] = useState<BookingRow[] | null>(null);

  useEffect(() => {
    fetch('/api/guided-trips/bookings/mine')
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then(d => setBookings(d.bookings))
      .catch(() => setBookings([]));
  }, []);

  if (!bookings || bookings.length === 0) return null;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6" aria-labelledby="my-guided-bookings">
      <h2 id="my-guided-bookings" className="mb-4 text-xl font-semibold text-gray-900">Le mie prenotazioni</h2>
      <ul className="divide-y divide-gray-100">
        {bookings.map(b => (
          <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3" data-testid="my-guided-booking">
            <div className="min-w-0 flex-1">
              <Link href={`/guided-trips/${b.guidedTrip.id}`} className="font-semibold text-gray-900 hover:underline">{b.guidedTrip.title}</Link>
              <p className="text-sm text-gray-500">{formatLongDate(new Date(b.guidedTrip.startDate))} · Ritrovo {b.guidedTrip.meetingPoint}</p>
            </div>
            {b.guidedTrip.status === 'Ritirato' ? (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">Viaggio ritirato: verrai contattato per il rimborso</span>
            ) : (
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">Posto confermato</span>
            )}
            <span className="text-sm font-semibold text-gray-700">{formatPrice(b.amount)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
