'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { GuidedTripOrganizerView } from '@/types/guided-trip';
import { formatDateRange, formatEuro, formatShortDate } from '@/lib/guided-trips/guidedTripFormat';

interface OrganizedGuidedTripsProps {
  guidedTrips: GuidedTripOrganizerView[];
  savedGuidedTripId: string | null;
}

const statusStyles: Record<GuidedTripOrganizerView['status'], { label: string; tone: string }> = {
  Bozza: { label: 'Bozza', tone: 'bg-gray-100 text-gray-700' },
  Pubblicato: { label: 'Pubblicato', tone: 'bg-green-100 text-green-800' },
  Annullato: { label: 'Annullato', tone: 'bg-red-100 text-red-800' },
};

export default function OrganizedGuidedTrips({ guidedTrips, savedGuidedTripId }: OrganizedGuidedTripsProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(savedGuidedTripId ?? guidedTrips.find(t => t.status === 'Pubblicato')?.id ?? guidedTrips[0]?.id ?? null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(savedGuidedTripId ? { tone: 'success', text: 'Viaggio guidato salvato.' } : null);

  const selected = guidedTrips.find(t => t.id === selectedId) ?? null;

  const cancelGuidedTrip = async () => {
    if (!selected) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/guided-trips/${selected.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancellationReason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Annullamento non riuscito');
      const failed = data.failedRefunds?.length ?? 0;
      setMessage({
        tone: failed ? 'error' : 'success',
        text: failed
          ? `Viaggio annullato. ${data.refunded} partecipanti rimborsati; ${failed} rimborsi non riusciti sono da verificare.`
          : `Viaggio annullato: ${data.refunded} partecipanti rimborsati e avvisati via email.`,
      });
      setCancelDialogOpen(false);
      setCancellationReason('');
      router.refresh();
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'Annullamento non riuscito' });
    } finally {
      setBusy(false);
    }
  };

  if (guidedTrips.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="font-semibold text-gray-900">Non hai ancora organizzato viaggi guidati</p>
        <p className="text-sm text-gray-600 mt-1">Crea il primo: indica date, prezzo e numero massimo di partecipanti.</p>
        <Link href="/dashboard/guided-trips/new" className="inline-block mt-4 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm">
          Nuovo viaggio guidato
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <div role={message.tone === 'error' ? 'alert' : 'status'} className={`rounded-lg p-3 text-sm border ${message.tone === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-primary-50 border-primary-200 text-primary-800'}`}>
          {message.text}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-2">Viaggio</th>
                <th className="py-2 pr-2">Date</th>
                <th className="py-2 pr-2">Posti</th>
                <th className="py-2 pr-2">Incasso</th>
                <th className="py-2">Stato</th>
              </tr>
            </thead>
            <tbody>
              {guidedTrips.map(trip => (
                <tr
                  key={trip.id}
                  onClick={() => setSelectedId(trip.id)}
                  className={`border-b border-gray-100 cursor-pointer ${trip.id === selectedId ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                >
                  <td className="py-2.5 pr-2">
                    <button type="button" onClick={() => setSelectedId(trip.id)} className="font-semibold text-gray-900 text-left hover:text-primary-700" aria-pressed={trip.id === selectedId}>
                      {trip.title}
                    </button>
                  </td>
                  <td className="py-2.5 pr-2 whitespace-nowrap">{formatDateRange(trip.startDate, trip.endDate)}</td>
                  <td className="py-2.5 pr-2">{trip.status === 'Annullato' ? '—' : `${trip.occupiedSeats}/${trip.maxParticipants}`}</td>
                  <td className="py-2.5 pr-2 whitespace-nowrap">{trip.confirmedRevenue > 0 ? formatEuro(trip.confirmedRevenue) : '—'}</td>
                  <td className="py-2.5"><span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyles[trip.status].tone}`}>{statusStyles[trip.status].label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">{selected.title} · partecipanti</h2>
              {selected.status !== 'Annullato' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 whitespace-nowrap">
                  {selected.participants.length} su {selected.maxParticipants}
                </span>
              )}
            </div>
            {selected.status === 'Annullato' && (
              <p className="text-sm text-red-700 mt-2">Annullato{selected.cancellationReason ? `: «${selected.cancellationReason}»` : ''}. I partecipanti sono stati rimborsati.</p>
            )}
            {selected.status !== 'Annullato' && selected.participants.length === 0 && (
              <p className="text-sm text-gray-600 mt-3">Ancora nessun partecipante.</p>
            )}
            {selected.participants.length > 0 && (
              <table className="w-full text-sm mt-3">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200">
                    <th className="py-2 pr-2">Nome</th>
                    <th className="py-2 pr-2">Email</th>
                    <th className="py-2">Prenotato il</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.participants.map(participant => (
                    <tr key={participant.bookingId} className="border-b border-gray-100">
                      <td className="py-2 pr-2">{participant.name || '—'}</td>
                      <td className="py-2 pr-2 break-all">{participant.email}</td>
                      <td className="py-2">{formatShortDate(participant.confirmedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="flex flex-wrap justify-end gap-3 mt-5">
              <Link href={`/guided-trips/${selected.id}`} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm">Vedi scheda</Link>
              {selected.status !== 'Annullato' && (
                <Link href={`/dashboard/guided-trips/${selected.id}/edit`} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm">Modifica</Link>
              )}
              {selected.canBeCancelled && (
                <button type="button" onClick={() => { setMessage(null); setCancelDialogOpen(true); }} className="px-4 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-sm font-semibold">
                  Annulla viaggio e rimborsa tutti
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {cancelDialogOpen && selected && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="cancel-trip-title">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 id="cancel-trip-title" className="text-lg font-semibold text-gray-900">Annullare «{selected.title}»?</h2>
            <p className="text-sm text-gray-600 mt-2">
              Tutti i {selected.participants.length} partecipanti riceveranno il rimborso totale e un&apos;email con il motivo.
              Il viaggio sparirà dall&apos;elenco pubblico. L&apos;operazione non si può annullare.
            </p>
            <label htmlFor="cancellation-reason" className="block text-sm font-semibold text-gray-700 mt-4">Motivo dell&apos;annullamento *</label>
            <textarea
              id="cancellation-reason"
              value={cancellationReason}
              onChange={event => setCancellationReason(event.target.value)}
              rows={3}
              maxLength={1000}
              className="w-full mt-1 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Es. allerta meteo sui passi"
            />
            <div className="flex justify-end gap-3 mt-5">
              <button type="button" onClick={() => setCancelDialogOpen(false)} disabled={busy} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm">
                Non annullare
              </button>
              <button
                type="button"
                onClick={cancelGuidedTrip}
                disabled={busy || cancellationReason.trim().length < 3}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold"
              >
                {busy ? 'Annullamento in corso…' : 'Annulla e rimborsa tutti'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
