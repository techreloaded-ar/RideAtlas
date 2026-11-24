'use client'

// Sezione della dashboard con i viaggi guidati organizzati dal Ranger.
// Riprende volutamente aspetto e comportamento della sezione «I Tuoi Viaggi» (UserTrips).
import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Calendar, Edit, Eye, Loader2, MapPin, Plus, Send, Users } from 'lucide-react'
import { formatCalendarRange } from '@/lib/guided-trips/guided-trip-rules'
import {
  GUIDED_TRIP_STATUS_BADGE_CLASSES,
  GUIDED_TRIP_STATUS_LABELS,
  formatEuro,
} from './guided-trip-format'
import type { GuidedTripDisplayStatus } from '@/lib/guided-trips/guided-trip-rules'

interface OrganizedGuidedTrip {
  id: string
  slug: string
  title: string
  meetingPoint: string
  departureDate: string
  returnDate: string
  maxParticipants: number
  pricePerParticipant: number
  status: 'Bozza' | 'Pubblicato' | 'Annullato'
  displayStatus: GuidedTripDisplayStatus
  seats: { confirmedParticipants: number }
}

export default function OrganizedGuidedTrips() {
  const { data: session } = useSession()
  const [guidedTrips, setGuidedTrips] = useState<OrganizedGuidedTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [publishingTrip, setPublishingTrip] = useState<string | null>(null)

  const fetchGuidedTrips = useCallback(async () => {
    if (!session?.user?.id) return
    try {
      setLoading(true)
      const response = await fetch('/api/user/guided-trips')
      if (!response.ok) {
        throw new Error('Errore nel caricamento dei viaggi guidati')
      }
      const data: { guidedTrips: OrganizedGuidedTrip[] } = await response.json()
      setGuidedTrips(data.guidedTrips)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (session?.user?.id) {
      fetchGuidedTrips()
    }
  }, [session?.user?.id, fetchGuidedTrips])

  const handlePublish = async (guidedTripId: string) => {
    try {
      setPublishingTrip(guidedTripId)
      setError('')
      const response = await fetch(`/api/guided-trips/${guidedTripId}/publish`, { method: 'POST' })
      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Pubblicazione fallita')
        return
      }
      await fetchGuidedTrips()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la pubblicazione')
    } finally {
      setPublishingTrip(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6" data-testid="organizer-guided-trips-entry">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Caricamento viaggi guidati...</span>
        </div>
      </div>
    )
  }

  if (error && guidedTrips.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6" data-testid="organizer-guided-trips-entry">
        <div className="text-center py-8">
          <div className="text-red-600 mb-2">Errore nel caricamento</div>
          <div className="text-sm text-gray-500">{error}</div>
          <button
            onClick={fetchGuidedTrips}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Riprova
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6" data-testid="organizer-guided-trips-entry">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">I Tuoi Viaggi Guidati</h3>
          <p className="text-sm text-gray-500">
            {guidedTrips.length === 0
              ? 'Nessun viaggio guidato creato'
              : guidedTrips.length === 1
                ? '1 viaggio guidato'
                : `${guidedTrips.length} viaggi guidati`}
          </p>
        </div>
        <div className="flex space-x-2">
          <Link
            href="/dashboard/guided-trips/new"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nuovo Viaggio Guidato
          </Link>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600" role="alert">{error}</p>}

      {guidedTrips.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Nessun viaggio guidato ancora
          </h4>
          <p className="text-gray-500 mb-6">
            Organizza il tuo primo viaggio guidato: date, posti e prezzo li decidi tu.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard/guided-trips/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crea il tuo primo viaggio guidato
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {guidedTrips.map(guidedTrip => (
            <div key={guidedTrip.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {guidedTrip.title}
                    </h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${GUIDED_TRIP_STATUS_BADGE_CLASSES[guidedTrip.displayStatus]}`}>
                      {GUIDED_TRIP_STATUS_LABELS[guidedTrip.displayStatus]}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center text-sm text-gray-500 gap-x-4 gap-y-1 mb-2">
                    <div className="flex items-center min-w-0">
                      <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{guidedTrip.meetingPoint}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatCalendarRange(new Date(guidedTrip.departureDate), new Date(guidedTrip.returnDate))}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {guidedTrip.seats.confirmedParticipants}/{guidedTrip.maxParticipants} iscritti
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 truncate">
                    {formatEuro(guidedTrip.pricePerParticipant)} a partecipante
                  </p>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Link
                    href={`/guided-trips/${guidedTrip.slug}`}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Visualizza viaggio guidato"
                    aria-label={`Visualizza ${guidedTrip.title}`}
                  >
                    <Eye className="w-4 h-4" />
                  </Link>

                  <Link
                    href={`/dashboard/guided-trips/${guidedTrip.id}`}
                    className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                    title="Modifica viaggio guidato e partecipanti"
                    aria-label={`Modifica ${guidedTrip.title}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Link>

                  {guidedTrip.status === 'Bozza' && (
                    <button
                      onClick={() => handlePublish(guidedTrip.id)}
                      disabled={publishingTrip === guidedTrip.id}
                      className="p-2 text-green-600 hover:text-green-900 transition-colors disabled:opacity-50"
                      title="Pubblica viaggio guidato"
                      aria-label={`Pubblica ${guidedTrip.title}`}
                    >
                      {publishingTrip === guidedTrip.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
