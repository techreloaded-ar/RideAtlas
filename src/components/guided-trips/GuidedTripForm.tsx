'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GuidedTripFormValues, LinkableTripOption } from '@/types/guided-trip';
import { PARTICIPANT_CANCELLATION_DAYS_BEFORE_START } from '@/lib/guided-trips/guidedTripPolicy';

interface GuidedTripFormProps {
  mode: 'create' | 'edit';
  guidedTripId?: string;
  initialValues: GuidedTripFormValues;
  status: 'Bozza' | 'Pubblicato';
  occupiedSeats: number;
  linkableTrips: LinkableTripOption[];
}

const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500';
const labelClass = 'block text-sm font-semibold text-gray-700 mb-1';

export default function GuidedTripForm({ mode, guidedTripId, initialValues, status, occupiedSeats, linkableTrips }: GuidedTripFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<GuidedTripFormValues>(initialValues);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const lockedByBookings = occupiedSeats > 0;
  const isPublished = status === 'Pubblicato';

  const update = <K extends keyof GuidedTripFormValues>(key: K, value: GuidedTripFormValues[K]) => setValues(current => ({ ...current, [key]: value }));

  const submit = async (publish: boolean) => {
    setBusy(true);
    setErrors([]);
    try {
      const response = await fetch(mode === 'create' ? '/api/guided-trips' : `/api/guided-trips/${guidedTripId}`, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, publish }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors(data.problems?.length ? data.problems : [data.error || 'Salvataggio non riuscito']);
        return;
      }
      router.push(`/dashboard/guided-trips?tab=organized&saved=${encodeURIComponent(data.guidedTrip.id)}`);
      router.refresh();
    } catch {
      setErrors(['Salvataggio non riuscito: controlla la connessione e riprova']);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="bg-white rounded-xl shadow-sm p-6 space-y-4"
      onSubmit={event => { event.preventDefault(); submit(!isPublished); }}
    >
      {errors.length > 0 && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          <ul className="list-disc pl-5 space-y-0.5">{errors.map(error => <li key={error}>{error}</li>)}</ul>
        </div>
      )}

      <div>
        <label htmlFor="guided-trip-title" className={labelClass}>Titolo *</label>
        <input id="guided-trip-title" className={inputClass} value={values.title} onChange={e => update('title', e.target.value)} maxLength={150} required />
      </div>

      <div>
        <label htmlFor="guided-trip-description" className={labelClass}>Descrizione *</label>
        <textarea id="guided-trip-description" className={inputClass} rows={5} value={values.description} onChange={e => update('description', e.target.value)} maxLength={10000} required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="guided-trip-start" className={labelClass}>Data di partenza *</label>
          <input id="guided-trip-start" type="date" className={inputClass} value={values.startDate} onChange={e => update('startDate', e.target.value)} disabled={lockedByBookings} required />
        </div>
        <div>
          <label htmlFor="guided-trip-end" className={labelClass}>Data di rientro *</label>
          <input id="guided-trip-end" type="date" className={inputClass} value={values.endDate} min={values.startDate || undefined} onChange={e => update('endDate', e.target.value)} disabled={lockedByBookings} required />
        </div>
        <div>
          <label htmlFor="guided-trip-price" className={labelClass}>Prezzo a persona (€) *</label>
          <input id="guided-trip-price" type="number" min="1" step="0.01" className={inputClass} value={Number.isNaN(values.pricePerPerson) || values.pricePerPerson === 0 ? '' : values.pricePerPerson} onChange={e => update('pricePerPerson', e.target.valueAsNumber)} disabled={lockedByBookings} required />
        </div>
        <div>
          <label htmlFor="guided-trip-seats" className={labelClass}>Numero massimo di partecipanti *</label>
          <input id="guided-trip-seats" type="number" min={Math.max(1, occupiedSeats)} step="1" className={inputClass} value={Number.isNaN(values.maxParticipants) ? '' : values.maxParticipants} onChange={e => update('maxParticipants', e.target.valueAsNumber)} required />
          {lockedByBookings && <p className="text-xs text-gray-500 mt-1">Già prenotati: {occupiedSeats}. Non puoi scendere sotto questo numero.</p>}
        </div>
      </div>

      <div>
        <label htmlFor="guided-trip-meeting" className={labelClass}>Punto di ritrovo *</label>
        <input id="guided-trip-meeting" className={inputClass} value={values.meetingPoint} onChange={e => update('meetingPoint', e.target.value)} maxLength={300} placeholder="Es. Bassano del Grappa, piazza Libertà, ore 8:30" required />
      </div>

      <div>
        <label htmlFor="guided-trip-linked" className={labelClass}>Riprende il percorso di un viaggio pubblicato (facoltativo)</label>
        <select id="guided-trip-linked" className={inputClass} value={values.linkedTripId ?? ''} onChange={e => update('linkedTripId', e.target.value || null)}>
          <option value="">Nessun collegamento</option>
          {linkableTrips.map(trip => (
            <option key={trip.id} value={trip.id}>{trip.title}{trip.authorName ? ` — ${trip.authorName}` : ''}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">Serve solo a indicare che il percorso è lo stesso: non dà accesso all&apos;itinerario digitale.</p>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-900">
        {lockedByBookings
          ? 'Ci sono già prenotazioni: prezzo e date non sono più modificabili.'
          : 'Dopo la prima prenotazione prezzo e date non saranno più modificabili.'}{' '}
        Gli Explorer possono disdire con rimborso fino a {PARTICIPANT_CANCELLATION_DAYS_BEFORE_START} giorni prima della partenza.
      </div>

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <button type="button" onClick={() => router.back()} disabled={busy} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm">Annulla</button>
        {isPublished ? (
          <button type="button" onClick={() => submit(false)} disabled={busy} className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold">
            {busy ? 'Salvataggio…' : 'Salva modifiche'}
          </button>
        ) : (
          <>
            <button type="button" onClick={() => submit(false)} disabled={busy} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold">
              {busy ? 'Salvataggio…' : 'Salva bozza'}
            </button>
            <button type="button" onClick={() => submit(true)} disabled={busy} className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold">
              Pubblica
            </button>
          </>
        )}
      </div>
    </form>
  );
}
