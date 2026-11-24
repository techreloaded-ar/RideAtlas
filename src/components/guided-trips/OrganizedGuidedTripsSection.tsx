'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flag, Plus } from 'lucide-react';
import type { OrganizerGuidedTripRow } from '@/lib/guided-trips/guidedTripService';
import { formatEuro, formatStoredDay } from '@/lib/guided-trips/guidedTripRules';

function statusBadge(row: OrganizerGuidedTripRow): { label: string; className: string } {
  if (row.status === 'Annullato') return { label: 'Annullato', className: 'bg-red-100 text-red-800' };
  if (row.status === 'Bozza') return { label: 'Bozza', className: 'bg-gray-200 text-gray-700' };
  if (row.departed) return { label: 'Concluso', className: 'bg-blue-100 text-blue-800' };
  if (row.confirmedBookings >= row.maxParticipants) return { label: 'Completo', className: 'bg-amber-100 text-amber-800' };
  return { label: 'Pubblicato', className: 'bg-green-100 text-green-800' };
}

function dateRange(row: OrganizerGuidedTripRow): string {
  return `${formatStoredDay(row.startDate, { day: 'numeric', month: 'short' })} – ${formatStoredDay(row.endDate, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

/** Sezione della dashboard per Ranger e Sentinel: i viaggi guidati che organizzano. */
export default function OrganizedGuidedTripsSection() {
  const [rows, setRows] = useState<OrganizerGuidedTripRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/user/guided-trips')
      .then(async response => {
        if (!response.ok) throw new Error('Errore nel caricamento dei viaggi guidati');
        const data = await response.json();
        setRows(data.guidedTrips ?? []);
      })
      .catch(fetchError => setError(fetchError instanceof Error ? fetchError.message : 'Errore sconosciuto'));
  }, []);

  return (
    <section className="rounded-lg border bg-white shadow-sm" aria-labelledby="organized-guided-trips-title">
      <div className="flex items-center justify-between border-b p-6">
        <div className="flex items-center">
          <Flag className="mr-2 h-5 w-5 text-green-600" aria-hidden />
          <h2 id="organized-guided-trips-title" className="text-lg font-semibold text-gray-900">I miei viaggi guidati</h2>
        </div>
        <Link href="/dashboard/guided-trips/new" className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700">
          <Plus className="mr-1 h-4 w-4" aria-hidden /> Nuovo viaggio guidato
        </Link>
      </div>
      <div className="p-6">
        {error && <p className="text-center text-red-600">{error}</p>}
        {!error && rows === null && <p className="text-center text-gray-500">Caricamento...</p>}
        {rows && rows.length === 0 && (
          <p className="text-center text-gray-500">Non hai ancora organizzato viaggi guidati. Crea il primo: indica date, prezzo e posti disponibili.</p>
        )}
        {rows && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
                  <th scope="col" className="px-3 py-2 font-semibold">Viaggio</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Date</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Prezzo</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Iscritti</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Stato</th>
                  <th scope="col" className="px-3 py-2"><span className="sr-only">Azioni</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const badge = statusBadge(row);
                  return (
                    <tr key={row.id} className="border-b border-gray-100">
                      <td className="px-3 py-3 font-semibold text-gray-900">{row.title}</td>
                      <td className="px-3 py-3 text-gray-700">{dateRange(row)}</td>
                      <td className="px-3 py-3 text-gray-700">{formatEuro(row.pricePerPerson)}</td>
                      <td className="px-3 py-3 text-gray-700">{row.confirmedBookings} / {row.maxParticipants}</td>
                      <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span></td>
                      <td className="px-3 py-3 text-right">
                        <Link href={`/dashboard/guided-trips/${row.id}`} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                          Gestisci
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
