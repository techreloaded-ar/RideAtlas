'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { GuidedTripView } from '@/lib/guided-trips/service';
import { formatPrice, formatShortDate, GUIDED_TRIP_STATUS_LABELS } from '@/lib/guided-trips/rules';

/** Controllo dei Sentinel su tutti i viaggi guidati, con la possibilità di ritirarli. */
export default function GuidedTripManagement() {
  const [trips, setTrips] = useState<GuidedTripView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch('/api/admin/guided-trips')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('Impossibile caricare i viaggi guidati'))))
      .then(d => setTrips(d.guidedTrips))
      .catch(e => setError(e.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  const withdraw = async (trip: GuidedTripView) => {
    const note = trip.seats.taken > 0 ? `\n\nCi sono ${trip.seats.taken} prenotazioni: andranno rimborsate manualmente.` : '';
    if (!window.confirm(`Ritirare «${trip.title}»? Non sarà più visibile né prenotabile.${note}`)) return;
    setBusyId(trip.id);
    setError(null);
    try {
      const r = await fetch(`/api/guided-trips/${trip.id}/withdraw`, { method: 'POST' });
      if (!r.ok) throw new Error((await r.json()).error || 'Ritiro non riuscito');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ritiro non riuscito');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-lg bg-white shadow">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Viaggi guidati</h2>
          <p className="text-sm text-gray-600">I Ranger pubblicano direttamente. Ritira un viaggio per renderlo non visibile e non prenotabile; i rimborsi restano manuali.</p>
        </div>
        {error && <p className="px-6 py-3 text-sm text-red-600" role="alert">{error}</p>}
        {trips === null && !error && <p className="px-6 py-6 text-sm text-gray-500">Caricamento…</p>}
        {trips && trips.length === 0 && <p className="px-6 py-6 text-sm text-gray-600">Nessun viaggio guidato.</p>}
        {trips && trips.length > 0 && (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-6 py-3">Viaggio</th><th className="px-6 py-3">Ranger</th><th className="px-6 py-3">Partenza</th>
                <th className="px-6 py-3">Prezzo</th><th className="px-6 py-3">Posti</th><th className="px-6 py-3">Stato</th><th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {trips.map(t => (
                <tr key={t.id} data-testid="admin-guided-trip">
                  <td className="px-6 py-3 font-medium"><Link href={`/guided-trips/${t.id}`} className="hover:underline">{t.title}</Link></td>
                  <td className="px-6 py-3">{t.organizer.name}</td>
                  <td className="px-6 py-3">{formatShortDate(new Date(t.startDate))}</td>
                  <td className="px-6 py-3">{formatPrice(t.price)}</td>
                  <td className="px-6 py-3"><Link href={`/guided-trips/${t.id}/participants`} className="text-primary-700 hover:underline">{t.seats.taken} / {t.seats.max}</Link></td>
                  <td className="px-6 py-3">{GUIDED_TRIP_STATUS_LABELS[t.status]}</td>
                  <td className="px-6 py-3 text-right">
                    {t.status !== 'Ritirato' && (
                      <button type="button" onClick={() => withdraw(t)} disabled={busyId === t.id}
                        className="rounded-md border border-red-300 px-3 py-1 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
                        Ritira
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
