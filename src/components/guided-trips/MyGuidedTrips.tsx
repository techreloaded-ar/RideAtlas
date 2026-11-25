'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { GuidedTripView } from '@/lib/guided-trips/service';
import { formatShortDate, GUIDED_TRIP_STATUS_LABELS } from '@/lib/guided-trips/rules';

const STATUS_BADGE: Record<string, string> = {
  Bozza: 'bg-gray-100 text-gray-700',
  Pubblicato: 'bg-green-100 text-green-800',
  Ritirato: 'bg-red-100 text-red-800',
};

/** Sezione Dashboard del Ranger: i viaggi guidati che organizza. */
export default function MyGuidedTrips() {
  const [trips, setTrips] = useState<GuidedTripView[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/guided-trips/mine')
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then(d => setTrips(d.guidedTrips))
      .catch(() => setError(true));
  }, []);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6" aria-labelledby="my-guided-trips">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="my-guided-trips" className="text-xl font-semibold text-gray-900">I miei viaggi guidati</h2>
        <Link href="/guided-trips/new" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
          Nuovo viaggio guidato
        </Link>
      </div>
      {error && <p className="text-sm text-red-600">Impossibile caricare i viaggi guidati.</p>}
      {!error && trips === null && <p className="text-sm text-gray-500">Caricamento…</p>}
      {trips && trips.length === 0 && <p className="text-sm text-gray-600">Non hai ancora organizzato viaggi guidati.</p>}
      {trips && trips.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {trips.map(t => (
            <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3" data-testid="my-guided-trip">
              <div className="min-w-0 flex-1">
                <Link href={`/guided-trips/${t.id}`} className="font-semibold text-gray-900 hover:underline">{t.title}</Link>
                <span className="text-sm text-gray-500"> · {formatShortDate(new Date(t.startDate))}</span>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[t.status]}`}>{GUIDED_TRIP_STATUS_LABELS[t.status]}</span>
              <span className="w-28 text-sm text-gray-600">{t.seats.taken} / {t.seats.max} prenotati</span>
              <div className="flex gap-3 text-sm font-semibold">
                <Link href={`/guided-trips/${t.id}/participants`} className="text-primary-700 hover:underline">Partecipanti</Link>
                {t.status !== 'Ritirato' && <Link href={`/guided-trips/${t.id}/edit`} className="text-primary-700 hover:underline">Modifica</Link>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
