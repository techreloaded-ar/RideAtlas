'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { formatCalendarDay } from '@/lib/guided-trips/guided-trip-rules'
import {
  REGISTRATION_STATUS_BADGE_CLASSES,
  formatEuro,
  registrationStatusLabel,
  type CancellationOriginCode,
  type RegistrationStatusCode,
} from '@/components/guided-trips/guided-trip-format'

interface AdminRegistration {
  registrationId: string
  status: RegistrationStatusCode
  amount: number
  paymentMethod: string | null
  cancellationOrigin: CancellationOriginCode
  cancelledAt: string | null
  refundedAt: string | null
  refundNote: string | null
  refundedBy: string | null
  participant: { id: string; name: string | null; email: string }
  trip: { slug: string; title: string; departureDate: string; organizerName: string | null }
}

type Filter = 'REFUND_DUE' | 'REFUNDED'

/** Sezione del pannello acquisti: iscrizioni ai viaggi guidati da rimborsare a mano. */
export default function GuidedTripRefunds() {
  const [filter, setFilter] = useState<Filter>('REFUND_DUE')
  const [registrations, setRegistrations] = useState<AdminRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refundingId, setRefundingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/guided-trip-registrations?status=${filter}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Errore nel caricamento')
      setRegistrations(data.registrations ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  const markRefunded = async (registration: AdminRegistration) => {
    const note = window.prompt(
      `Confermi di aver rimborsato ${formatEuro(registration.amount)} a ${registration.participant.name ?? registration.participant.email}? Nota facoltativa:`,
      '',
    )
    if (note === null) return
    setRefundingId(registration.registrationId)
    setError(null)
    try {
      const response = await fetch(`/api/admin/guided-trip-registrations/${registration.registrationId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note.trim() || undefined }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Operazione non riuscita')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operazione non riuscita')
    } finally {
      setRefundingId(null)
    }
  }

  return (
    <section className="bg-white shadow rounded-lg p-6 mb-6" data-testid="guided-trip-refunds">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Viaggi guidati · rimborsi</h3>
          <p className="text-sm text-gray-600">Disdette dei partecipanti e viaggi annullati dai Ranger: esegui il rimborso e segnalo qui.</p>
        </div>
        <div className="flex gap-2" role="group" aria-label="Filtro rimborsi">
          {(['REFUND_DUE', 'REFUNDED'] as Filter[]).map(option => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              aria-pressed={filter === option}
              className={`px-3 py-1 rounded-lg text-sm font-medium border ${filter === option ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              {option === 'REFUND_DUE' ? 'Da rimborsare' : 'Rimborsati'}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mb-3 text-red-700" role="alert">{error}</p>}

      {loading ? (
        <p className="text-gray-600">Caricamento…</p>
      ) : registrations.length === 0 ? (
        <p className="text-gray-600">{filter === 'REFUND_DUE' ? 'Nessun rimborso in sospeso.' : 'Nessun rimborso registrato.'}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-gray-600 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-2 py-2 font-medium">Tipo</th>
                <th scope="col" className="px-2 py-2 font-medium">Partecipante</th>
                <th scope="col" className="px-2 py-2 font-medium">Viaggio guidato</th>
                <th scope="col" className="px-2 py-2 font-medium">Importo</th>
                <th scope="col" className="px-2 py-2 font-medium">Motivo</th>
                <th scope="col" className="px-2 py-2 font-medium">{filter === 'REFUND_DUE' ? 'Azione' : 'Rimborsato'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {registrations.map(registration => (
                <tr key={registration.registrationId}>
                  <td className="px-2 py-3"><span className="text-xs font-semibold px-2 py-1 rounded-full bg-purple-100 text-purple-800">Viaggio guidato</span></td>
                  <td className="px-2 py-3">
                    <div className="font-medium text-gray-900">{registration.participant.name ?? '—'}</div>
                    <div className="text-gray-500">{registration.participant.email}</div>
                  </td>
                  <td className="px-2 py-3">
                    <Link href={`/guided-trips/${registration.trip.slug}`} className="text-primary-700 hover:underline">{registration.trip.title}</Link>
                    <div className="text-gray-500">Partenza {formatCalendarDay(new Date(registration.trip.departureDate))}</div>
                  </td>
                  <td className="px-2 py-3 font-semibold">
                    {formatEuro(registration.amount)}
                    {registration.paymentMethod === 'simulated' && <div className="text-xs font-normal text-gray-500">pagamento simulato</div>}
                  </td>
                  <td className="px-2 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${REGISTRATION_STATUS_BADGE_CLASSES[registration.status]}`}>
                      {registrationStatusLabel(registration.status, registration.cancellationOrigin)}
                    </span>
                    {registration.refundNote && <div className="mt-1 text-xs text-gray-500">{registration.refundNote}</div>}
                  </td>
                  <td className="px-2 py-3">
                    {filter === 'REFUND_DUE' ? (
                      <button
                        type="button"
                        onClick={() => markRefunded(registration)}
                        disabled={refundingId === registration.registrationId}
                        className="px-3 py-1 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium disabled:opacity-50"
                      >
                        Segna come rimborsato
                      </button>
                    ) : (
                      <span className="text-gray-600">
                        {registration.refundedAt ? formatCalendarDay(new Date(registration.refundedAt)) : '—'}
                        {registration.refundedBy ? ` · ${registration.refundedBy}` : ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
