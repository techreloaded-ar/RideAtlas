'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export interface GuidedTripFormValues {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  meetingPoint: string;
  pricePerPerson: string;
  maxParticipants: string;
  freeCancellationUntil: string;
  linkedTripId: string;
}

export const EMPTY_GUIDED_TRIP_FORM: GuidedTripFormValues = {
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  meetingPoint: '',
  pricePerPerson: '',
  maxParticipants: '',
  freeCancellationUntil: '',
  linkedTripId: '',
};

interface GuidedTripFormProps {
  initialValues: GuidedTripFormValues;
  linkableTrips: { id: string; title: string }[];
  guidedTripId?: string;
  readOnly?: boolean;
}

const inputClassName =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-100';

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700">{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function GuidedTripForm({ initialValues, linkableTrips, guidedTripId, readOnly = false }: GuidedTripFormProps) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formMessage, setFormMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const isEditing = guidedTripId !== undefined;

  const update = (field: keyof GuidedTripFormValues) => (event: { target: { value: string } }) => {
    setValues(current => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setFormMessage(null);
    const response = await fetch(isEditing ? `/api/guided-trips/${guidedTripId}` : '/api/guided-trips', {
      method: isEditing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, linkedTripId: values.linkedTripId || null }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setFieldErrors(data.fieldErrors ?? {});
      setFormMessage({ kind: 'error', text: data.error ?? 'Salvataggio non riuscito' });
      return;
    }
    if (isEditing) {
      setFormMessage({ kind: 'success', text: 'Modifiche salvate' });
      router.refresh();
    } else {
      router.push(`/dashboard/guided-trips/${data.id}?created=1`);
    }
  };

  const errorProps = (field: string) =>
    fieldErrors[field] ? { 'aria-invalid': true, 'aria-describedby': `guided-trip-${field}-error` } : {};

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field id="guided-trip-title" label="Titolo *" error={fieldErrors.title}>
        <input id="guided-trip-title" name="title" className={inputClassName} value={values.title} onChange={update('title')} disabled={readOnly} {...errorProps('title')} />
      </Field>
      <Field id="guided-trip-description" label="Descrizione e programma *" error={fieldErrors.description}>
        <textarea id="guided-trip-description" name="description" rows={5} className={inputClassName} value={values.description} onChange={update('description')} disabled={readOnly} {...errorProps('description')} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="guided-trip-startDate" label="Data di partenza *" error={fieldErrors.startDate}>
          <input id="guided-trip-startDate" name="startDate" type="date" className={inputClassName} value={values.startDate} onChange={update('startDate')} disabled={readOnly} {...errorProps('startDate')} />
        </Field>
        <Field id="guided-trip-endDate" label="Data di rientro *" error={fieldErrors.endDate}>
          <input id="guided-trip-endDate" name="endDate" type="date" className={inputClassName} value={values.endDate} onChange={update('endDate')} disabled={readOnly} {...errorProps('endDate')} />
        </Field>
      </div>
      <Field id="guided-trip-meetingPoint" label="Ritrovo (luogo e orario) *" error={fieldErrors.meetingPoint}>
        <input id="guided-trip-meetingPoint" name="meetingPoint" className={inputClassName} placeholder="Es. Bolzano, piazza Walther · ore 8:30" value={values.meetingPoint} onChange={update('meetingPoint')} disabled={readOnly} {...errorProps('meetingPoint')} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="guided-trip-pricePerPerson" label="Prezzo a persona (€) *" error={fieldErrors.pricePerPerson}>
          <input id="guided-trip-pricePerPerson" name="pricePerPerson" type="number" min="1" step="0.01" inputMode="decimal" className={inputClassName} value={values.pricePerPerson} onChange={update('pricePerPerson')} disabled={readOnly} {...errorProps('pricePerPerson')} />
        </Field>
        <Field id="guided-trip-maxParticipants" label="Numero massimo partecipanti *" error={fieldErrors.maxParticipants}>
          <input id="guided-trip-maxParticipants" name="maxParticipants" type="number" min="1" step="1" inputMode="numeric" className={inputClassName} value={values.maxParticipants} onChange={update('maxParticipants')} disabled={readOnly} {...errorProps('maxParticipants')} />
        </Field>
      </div>
      <Field id="guided-trip-freeCancellationUntil" label="Disdetta gratuita fino al *" error={fieldErrors.freeCancellationUntil}>
        <input id="guided-trip-freeCancellationUntil" name="freeCancellationUntil" type="date" className={inputClassName} value={values.freeCancellationUntil} onChange={update('freeCancellationUntil')} disabled={readOnly} {...errorProps('freeCancellationUntil')} />
        <p className="mt-1 text-xs text-gray-500">Fino a questo giorno incluso l&apos;iscritto può disdire e ricevere il rimborso automatico.</p>
      </Field>
      <Field id="guided-trip-linkedTripId" label="Itinerario collegato (facoltativo)" error={fieldErrors.linkedTripId}>
        <select id="guided-trip-linkedTripId" name="linkedTripId" className={inputClassName} value={values.linkedTripId} onChange={update('linkedTripId')} disabled={readOnly}>
          <option value="">Nessun itinerario</option>
          {linkableTrips.map(trip => (
            <option key={trip.id} value={trip.id}>{trip.title}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">Gli iscritti vedranno tappe e copertina dell&apos;itinerario.</p>
      </Field>

      {formMessage && (
        <p role={formMessage.kind === 'error' ? 'alert' : 'status'} className={`rounded-lg px-3 py-2 text-sm ${formMessage.kind === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>
          {formMessage.text}
        </p>
      )}
      {!readOnly && (
        <button type="submit" disabled={saving} className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
          {saving ? 'Salvataggio…' : isEditing ? 'Salva modifiche' : 'Salva come bozza'}
        </button>
      )}
    </form>
  );
}
