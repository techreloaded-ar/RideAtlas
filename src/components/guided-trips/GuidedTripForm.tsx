'use client';

import { useState, type ChangeEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { MAX_PARTICIPANTS_LIMIT } from '@/lib/guided-trips/rules';

export interface GuidedTripFormValues {
  title: string;
  description: string;
  included: string;
  startDate: string;
  endDate: string;
  meetingPoint: string;
  price: string;
  maxParticipants: string;
  linkedTripId: string;
}

interface GuidedTripFormProps {
  guidedTripId?: string;
  initial?: GuidedTripFormValues;
  currentStatus?: 'Bozza' | 'Pubblicato';
  linkableTrips: { id: string; title: string }[];
  bookedSeats?: number;
}

const EMPTY: GuidedTripFormValues = {
  title: '', description: '', included: '', startDate: '', endDate: '', meetingPoint: '', price: '', maxParticipants: '', linkedTripId: '',
};

const inputClass = 'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500';

export default function GuidedTripForm({ guidedTripId, initial, currentStatus, linkableTrips, bookedSeats = 0 }: GuidedTripFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<GuidedTripFormValues>(initial ?? EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<'Bozza' | 'Pubblicato' | null>(null);
  const published = currentStatus === 'Pubblicato';

  const set = (key: keyof GuidedTripFormValues) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setValues(v => ({ ...v, [key]: e.target.value }));

  const submit = async (status: 'Bozza' | 'Pubblicato') => {
    setSaving(status);
    setError(null);
    setFieldErrors({});
    try {
      const response = await fetch(guidedTripId ? `/api/guided-trips/${guidedTripId}` : '/api/guided-trips', {
        method: guidedTripId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, linkedTripId: values.linkedTripId || null, status }),
      });
      const data = await response.json();
      if (!response.ok) {
        setFieldErrors(data.fieldErrors || {});
        throw new Error(data.error || 'Salvataggio non riuscito');
      }
      router.push(status === 'Pubblicato' ? `/guided-trips/${data.id}` : '/dashboard?guided=saved');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      setSaving(null);
    }
  };

  const field = (key: keyof GuidedTripFormValues, label: string, input: ReactNode, hint?: string) => (
    <div>
      <label htmlFor={`gt-${key}`} className="block text-sm font-semibold text-gray-800">{label}</label>
      {input}
      {hint && !fieldErrors[key] && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {fieldErrors[key] && <p className="mt-1 text-sm text-red-600" role="alert">{fieldErrors[key]}</p>}
    </div>
  );

  return (
    <form className="space-y-5 rounded-xl bg-white p-6 shadow-sm" onSubmit={e => { e.preventDefault(); submit(published ? 'Pubblicato' : 'Bozza'); }} noValidate>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div>}
      {field('title', 'Titolo', <input id="gt-title" className={inputClass} value={values.title} onChange={set('title')} maxLength={120} />)}
      {field('description', 'Descrizione', <textarea id="gt-description" className={inputClass} rows={4} value={values.description} onChange={set('description')} />)}
      {field('included', 'Cosa è compreso', <textarea id="gt-included" className={inputClass} rows={3} value={values.included} onChange={set('included')} />, 'Una voce per riga: verranno mostrate come elenco.')}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field('startDate', 'Data di partenza', <input id="gt-startDate" type="date" className={inputClass} value={values.startDate} onChange={set('startDate')} />)}
        {field('endDate', 'Data di rientro', <input id="gt-endDate" type="date" className={inputClass} value={values.endDate} onChange={set('endDate')} />)}
      </div>
      {field('meetingPoint', 'Ritrovo (luogo e ora)', <input id="gt-meetingPoint" className={inputClass} value={values.meetingPoint} onChange={set('meetingPoint')} placeholder="Es. Bolzano, piazza Walther, 8:30" maxLength={200} />)}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {field('price', 'Prezzo a persona (€)', <input id="gt-price" type="number" min="0.01" step="0.01" inputMode="decimal" className={inputClass} value={values.price} onChange={set('price')} />,
          published ? 'Un nuovo prezzo vale solo per le prossime prenotazioni.' : undefined)}
        {field('maxParticipants', 'Posti massimi', <input id="gt-maxParticipants" type="number" min={Math.max(1, bookedSeats)} max={MAX_PARTICIPANTS_LIMIT} step="1" className={inputClass} value={values.maxParticipants} onChange={set('maxParticipants')} />,
          bookedSeats > 0 ? `Già prenotati: ${bookedSeats}` : `Da 1 a ${MAX_PARTICIPANTS_LIMIT}`)}
        {field('linkedTripId', 'Itinerario collegato (facoltativo)', (
          <select id="gt-linkedTripId" className={inputClass} value={values.linkedTripId} onChange={set('linkedTripId')}>
            <option value="">Nessuno</option>
            {linkableTrips.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        ), linkableTrips.length === 0 ? 'Non hai itinerari pubblicati da collegare.' : undefined)}
      </div>
      <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
        {published ? (
          <>
            <button type="button" onClick={() => submit('Bozza')} disabled={!!saving || bookedSeats > 0}
              title={bookedSeats > 0 ? 'Non disponibile: ci sono già prenotazioni' : undefined}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              Riporta in bozza
            </button>
            <button type="button" onClick={() => submit('Pubblicato')} disabled={!!saving}
              className="rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
              {saving === 'Pubblicato' ? 'Salvataggio…' : 'Salva modifiche'}
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => submit('Bozza')} disabled={!!saving}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              {saving === 'Bozza' ? 'Salvataggio…' : 'Salva bozza'}
            </button>
            <button type="button" onClick={() => submit('Pubblicato')} disabled={!!saving}
              className="rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
              {saving === 'Pubblicato' ? 'Pubblicazione…' : 'Pubblica'}
            </button>
          </>
        )}
      </div>
    </form>
  );
}
