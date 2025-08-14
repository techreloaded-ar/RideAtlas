// src/components/UserTrips.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  MapPin,
  Calendar,
  Clock,
  Eye,
  Edit,
  Plus,
  Loader2,
  Send,
  AlertTriangle
} from 'lucide-react'
import { TripStatus, TripValidationError } from '@/types/trip'

interface UserTrip {
  id: string
  slug: string
  title: string
  destination: string
  duration_days: number
  theme: string
  status: TripStatus
  created_at: string
  updated_at: string
}

interface UserTripsResponse {
  trips: UserTrip[]
  total: number
}

export default function UserTrips() {
  const { data: session } = useSession()
  const [trips, setTrips] = useState<UserTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, TripValidationError[]>>({})

  const fetchUserTrips = useCallback(async () => {
    if (!session?.user?.id) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/user/trips')
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento viaggi')
      }
      
      const data: UserTripsResponse = await response.json()
      setTrips(data.trips)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserTrips()
    }
  }, [session?.user?.id, fetchUserTrips])

  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case 'Bozza':
        return 'bg-yellow-100 text-yellow-800'
      case 'Pubblicato':
        return 'bg-green-100 text-green-800'
      case 'Archiviato':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Caricamento viaggi...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center py-8">
          <div className="text-red-600 mb-2">Errore nel caricamento</div>
          <div className="text-sm text-gray-500">{error}</div>
          <button
            onClick={fetchUserTrips}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Riprova
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">I Tuoi Viaggi</h3>
          <p className="text-sm text-gray-500">
            {trips.length === 0 ? 'Nessun viaggio creato' : `${trips.length} viaggio${trips.length !== 1 ? 'i' : ''}`}
          </p>
        </div>
        <Link
          href="/create-trip"
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nuovo Viaggio
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Nessun viaggio ancora
          </h4>
          <p className="text-gray-500 mb-6">
            Inizia a creare il tuo primo viaggio e condividilo con la community!
          </p>
          <Link
            href="/create-trip"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crea il tuo primo viaggio
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => (
            <div key={trip.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {trip.title}
                    </h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                      {trip.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500 space-x-4 mb-2">
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {trip.destination}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {trip.duration_days} giorni
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(trip.created_at)}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-400 truncate">
                    {trip.theme}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {/* Visualizza sempre */}
                  <Link
                    href={`/trips/${trip.slug}`}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Visualizza viaggio"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  
                  {/* Modifica per tutti i viaggi */}
                  <Link
                    href={`/edit-trip/${trip.id}`}
                    className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                    title="Modifica viaggio"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>

                  {/* Pubblica solo per viaggi in Bozza */}
                  {trip.status === 'Bozza' && (
                    <button
                      onClick={async () => {
                        try {
                          // Clear previous validation errors for this trip
                          setValidationErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors[trip.id]
                            return newErrors
                          })

                          const res = await fetch(`/api/trips/${trip.id}/publish`, { method: 'PATCH' })
                          
                          if (!res.ok) {
                            const errorData = await res.json()
                            
                            if (errorData.validationErrors && errorData.validationErrors.length > 0) {
                              // Store validation errors for this specific trip
                              setValidationErrors(prev => ({
                                ...prev,
                                [trip.id]: errorData.validationErrors
                              }))
                            } else {
                              setError(errorData.error || 'Pubblicazione fallita')
                            }
                            return
                          }
                          
                          fetchUserTrips()
                        } catch (e) {
                          console.error(e)
                          setError('Errore durante la pubblicazione')
                        }
                      }}
                      className="p-2 text-green-600 hover:text-green-900 transition-colors"
                      title="Pubblica viaggio"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Validation errors */}
              {validationErrors[trip.id] && validationErrors[trip.id].length > 0 && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-amber-800 font-medium text-sm mb-2">
                        Requisiti mancanti per la pubblicazione
                      </h4>
                      <ul className="space-y-1">
                        {validationErrors[trip.id].map((error, index) => (
                          <li key={index} className="flex items-start gap-2 text-amber-700 text-sm">
                            <span className="text-amber-500 font-bold leading-none">•</span>
                            <span>{error.message}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-amber-600 text-xs mt-2 opacity-80">
                        Completa tutti i requisiti sopra elencati per poter pubblicare il viaggio.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
