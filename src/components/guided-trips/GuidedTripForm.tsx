'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface GuidedTripFormValues {
  title: string
  description: string
  program: string
  includedServices: string
  coverImageUrl: string
  departureDate: string
  returnDate: string
  meetingPoint: string
  maxParticipants: string
  pricePerParticipant: string
  registrationDeadline: string
  cancellationNoticeDays: string
}

interface GuidedTripFormProps {
  mode: 'create' | 'edit'
  guidedTripId?: string
  initialValues: GuidedTripFormValues
  /** Prezzo bloccato perché esistono già iscrizioni. */
  priceLocked?: boolean
  /** Viaggio annullato: il form è in sola lettura. */
  readOnly?: boolean
}

const inputClasses =
  'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-600'

export default function GuidedTripForm({ mode, guidedTripId, initialValues, priceLocked = false, readOnly = false }: GuidedTripFormProps) {
  const router = useRouter()
  const [values, setValues] = useState<GuidedTripFormValues>(initialValues)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const update = (field: keyof GuidedTripFormValues) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues(current => ({ ...current, [field]: event.target.value }))
    setSaved(false)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setFieldErrors({})
    setSaved(false)
    try {
      const response = await fetch(mode === 'create' ? '/api/guided-trips' : `/api/guided-trips/${guidedTripId}`, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await response.json()
      if (!response.ok) {
        setFieldErrors(data.fieldErrors ?? {})
        throw new Error(data.error || 'Salvataggio non riuscito')
      }
      if (mode === 'create') {
        router.push(`/dashboard/guided-trips/${data.id}`)
      } else {
        setSaved(true)
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Salvataggio non riuscito')
    } finally {
      setSaving(false)
    }
  }

  const field = (
    name: keyof GuidedTripFormValues,
    label: string,
    options: { type?: string; textarea?: boolean; rows?: number; hint?: string; disabled?: boolean; min?: string; step?: string; placeholder?: string } = {},
  ) => {
    const id = `guided-trip-${name}`
    const errorText = fieldErrors[name]
    const common = {
      id,
      name,
      value: values[name],
      onChange: update(name),
      disabled: readOnly || options.disabled,
      className: inputClasses,
      'aria-invalid': errorText ? true : undefined,
      'aria-describedby': errorText ? `${id}-error` : options.hint ? `${id}-hint` : undefined,
      placeholder: options.placeholder,
    }
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        {options.textarea ? (
          <textarea {...common} rows={options.rows ?? 4} />
        ) : (
          <input {...common} type={options.type ?? 'text'} min={options.min} step={options.step} />
        )}
        {options.hint && !errorText && <p id={`${id}-hint`} className="mt-1 text-xs text-gray-500">{options.hint}</p>}
        {errorText && <p id={`${id}-error`} className="mt-1 text-sm text-red-700">{errorText}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {field('title', 'Titolo', { placeholder: 'Es. Dolomiti, passi e rifugi' })}
      {field('description', 'Descrizione', { textarea: true, rows: 4 })}
      {field('program', 'Programma', { textarea: true, rows: 5, hint: 'Una riga per giorno, es. «Bassano → Passo Rolle → San Martino (180 km)»' })}
      {field('includedServices', 'Cosa è incluso (facoltativo)', { textarea: true, rows: 2, placeholder: 'Es. Guida del Ranger · 2 notti in mezza pensione' })}
      {field('coverImageUrl', 'Foto di copertina (facoltativa, indirizzo dell\'immagine)', { type: 'url', placeholder: 'https://…' })}
      <div className="grid gap-4 sm:grid-cols-2">
        {field('departureDate', 'Data di partenza', { type: 'date' })}
        {field('returnDate', 'Data di rientro', { type: 'date' })}
        {field('maxParticipants', 'Posti massimi', { type: 'number', min: '1', step: '1' })}
        {field('pricePerParticipant', 'Prezzo a persona (€)', {
          type: 'number',
          min: '1',
          step: '0.01',
          disabled: priceLocked,
          hint: priceLocked ? 'Non modificabile: ci sono già iscrizioni' : undefined,
        })}
        {field('registrationDeadline', 'Iscrizioni entro', { type: 'date' })}
        {field('cancellationNoticeDays', 'Disdetta autonoma fino a (giorni prima della partenza)', { type: 'number', min: '0', step: '1' })}
      </div>
      {field('meetingPoint', 'Punto e ora di ritrovo', { placeholder: 'Es. Bassano del Grappa, piazza Libertà, ore 8:30' })}

      {error && <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-3" role="alert">{error}</p>}
      {saved && <p className="text-primary-800 bg-primary-50 border border-primary-200 rounded-lg p-3" role="status">Modifiche salvate</p>}

      {!readOnly && (
        <button
          type="submit"
          disabled={saving}
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-3 rounded-lg disabled:opacity-50"
        >
          {saving ? 'Salvataggio…' : mode === 'create' ? 'Salva bozza' : 'Salva modifiche'}
        </button>
      )}
    </form>
  )
}
