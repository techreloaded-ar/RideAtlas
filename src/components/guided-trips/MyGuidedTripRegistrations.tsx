'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, MapPin, Users } from 'lucide-react'
import { formatCalendarDay, formatCalendarRange } from '@/lib/guided-trips/guided-trip-rules'
import {
  REGISTRATION_STATUS_BADGE_CLASSES,
  formatEuro,
  registrationStatusLabel,
  type CancellationOriginCode,
  type RegistrationStatusCode,
} from './guided-trip-format'

interface MyRegistration {
  registrationId: string
  status: RegistrationStatusCode
  cancellationOrigin: CancellationOriginCode
  amount: number
  canSelfCancel: boolean
  trip: {
    slug: string
    title: string
    departureDate: string
    returnDate: string
    meetingPoint: string
    status: string
    displayStatus: string
    cancellationNoticeDays: number
    selfCancellationLastDay: string
    organizerName: string | null
  }
}

export default function MyGuidedTripRegistrations() {
  const [registrations, setRegistrations] = useState<MyRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const response = await fetch('/api/user/guided-trip-registrations')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Errore nel caricamento delle iscrizioni')
      setRegistrations(data.registrations ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento delle iscrizioni')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const cancel = async (registration: MyRegistration) => {
    if (!window.confirm(`Vuoi disdire l'iscrizione a «${registration.trip.title}»? Il posto tornerà disponibile e il rimborso sarà eseguito dallo staff RideAtlas.`)) return
    setCancellingId(registration.registrationId)
    setError(null)
    try {
      const response = await fetch(`/api/guided-trip-registrations/${registration.registrationId}/cancel`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Disdetta non riuscita')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disdetta non riuscita')
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6" data-testid="my-guided-trip-registrations">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Users className="w-5 h-5 mr-2" aria-hidden="true" /> I miei viaggi guidati
        </h2>
        <Link href="/guided-trips" className="text-primary-700 hover:underline text-sm font-medium">Scopri i viaggi guidati</Link>
      </div>

      {error && <p className="mb-3 text-red-700" role="alert">{error}</p>}

      {loading ? (
        <p className="text-gray-600">Caricamento…</p>
      ) : registrations.length === 0 ? (
        <p className="text-gray-600">Non sei iscritto a nessun viaggio guidato.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {registrations.map(registration => (
            <li key={registration.registrationId} className="py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <Link href={`/guided-trips/${registration.trip.slug}`} className="font-semibold text-primary-700 hover:underline">
                  {registration.trip.title}
                </Link>
                <p className="mt-1 flex items-center text-sm text-gray-700">
                  <CalendarDays className="w-4 h-4 mr-1" aria-hidden="true" />
                  {formatCalendarRange(new Date(registration.trip.departureDate), new Date(registration.trip.returnDate))}
                </p>
                <p className="mt-1 flex items-center text-sm text-gray-700">
                  <MapPin className="w-4 h-4 mr-1" aria-hidden="true" /> {registration.trip.meetingPoint}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {formatEuro(registration.amount)} · guidato da {registration.trip.organizerName ?? 'un Ranger'}
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${REGISTRATION_STATUS_BADGE_CLASSES[registration.status]}`}>
                  {registrationStatusLabel(registration.status, registration.cancellationOrigin)}
                </span>
                {registration.canSelfCancel && (
                  <button
                    type="button"
                    onClick={() => cancel(registration)}
                    disabled={cancellingId === registration.registrationId}
                    className="text-sm border border-red-600 text-red-700 px-3 py-1 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    {cancellingId === registration.registrationId ? 'Disdetta…' : 'Disdici'}
                  </button>
                )}
                {registration.canSelfCancel && (
                  <span className="text-xs text-gray-500">Disdetta possibile fino al {formatCalendarDay(new Date(registration.trip.selfCancellationLastDay))}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
