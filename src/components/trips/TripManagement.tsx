'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/useToast'
import Image from 'next/image'
import { UserRole } from '@/types/profile'
import { Calendar, MapPin, User, Clock, Navigation, Check, Eye, Edit } from 'lucide-react'

interface Trip {
  id: string
  slug: string
  title: string
  destination: string
  duration_days: number
  duration_nights: number
  theme: string
  status: string
  created_at: Date
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

interface TripsData {
  trips: Trip[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function TripManagement() {
  const { data: session } = useSession()
  const { showSuccess } = useToast()
  const [tripsData, setTripsData] = useState<TripsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [approvingTrip, setApprovingTrip] = useState<string | null>(null)

  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      })

      const response = await fetch(`/api/admin/trips?${params}`)
      if (!response.ok) {
        throw new Error('Errore nel caricamento viaggi')
      }

      const data = await response.json()
      setTripsData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  const handleApproveTrip = async (tripId: string) => {
    try {
      setApprovingTrip(tripId)
      const response = await fetch(`/api/admin/trips/${tripId}/approve`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nell\'approvazione')
      }

      showSuccess('Viaggio approvato con successo')
      // Reload trips list
      await fetchTrips()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setApprovingTrip(null)
    }
  }

  useEffect(() => {
    if (session?.user?.role === UserRole.Sentinel) {
      fetchTrips()
    }
  }, [fetchTrips, session])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1) // Reset to first page when searching
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setPage(1) // Reset to first page when filtering
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Bozza':
        return 'bg-yellow-100 text-yellow-800'
      case 'Pubblicato':
        return 'bg-green-100 text-green-800'
      case 'Pronto_per_revisione':
        return 'bg-blue-100 text-blue-800'
      case 'Archiviato':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Bozza':
        return 'Bozza'
      case 'Pubblicato':
        return 'Pubblicato'
      case 'Pronto_per_revisione':
        return 'Pronto per revisione'
      case 'Archiviato':
        return 'Archiviato'
      default:
        return status
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }

  // Check permissions
  if (session?.user?.role !== UserRole.Sentinel) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">
              Non hai i permessi per accedere a questa pagina.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestione Viaggi</h1>
          <p className="mt-2 text-gray-600">
            Gestisci lo stato e l&apos;approvazione dei viaggi del sistema
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Cerca viaggi
              </label>
              <input
                type="text"
                id="search"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Titolo, destinazione o creatore..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Filtra per stato
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Tutti gli stati</option>
                <option value="Bozza">Bozza</option>
                <option value="Pubblicato">Pubblicato</option>
                <option value="Pronto_per_revisione">Pronto per revisione</option>
                <option value="Archiviato">Archiviato</option>
              </select>
            </div>
          </div>
        </div>

        {/* Errors */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-red-800 text-sm">{error}</div>
            <button
              onClick={() => setError('')}
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
            >
              Chiudi
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-600">Caricamento viaggi...</div>
          </div>
        )}

        {/* Trips table */}
        {!loading && tripsData && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Viaggio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Creatore
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durata
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Creato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tripsData.trips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-lg flex items-center justify-center">
                            <Navigation className="w-6 h-6 text-white" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 line-clamp-1">
                              {trip.title}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {trip.destination}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {trip.theme}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            {trip.user.image ? (
                              <Image
                                className="h-8 w-8 rounded-full"
                                src={trip.user.image}
                                alt=""
                                width={32}
                                height={32}
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {trip.user.name || 'Nome non specificato'}
                            </div>
                            <div className="text-sm text-gray-500">{trip.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(trip.status)}`}>
                          {getStatusLabel(trip.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {trip.duration_days}g, {trip.duration_nights}n
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(trip.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {/* View button */}
                          <a
                            href={`/trips/${trip.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Visualizza viaggio"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          
                          {/* Edit button - for all trips */}
                          <a
                            href={`/edit-trip/${trip.id}`}
                            className="text-orange-600 hover:text-orange-900 p-1 rounded"
                            title="Modifica viaggio"
                          >
                            <Edit className="w-4 h-4" />
                          </a>
                          
                          {/* Approve button - only for draft trips */}
                          {trip.status === 'Bozza' && (
                            <button
                              onClick={() => handleApproveTrip(trip.id)}
                              disabled={approvingTrip === trip.id}
                              className="text-green-600 hover:text-green-900 p-1 rounded disabled:opacity-50"
                              title="Approva viaggio"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          
                          {approvingTrip === trip.id && (
                            <div className="inline-block">
                              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {tripsData.pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Precedente
                  </button>
                  <button
                    onClick={() => setPage(Math.min(tripsData.pagination.pages, page + 1))}
                    disabled={page === tripsData.pagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Successivo
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Visualizzazione{' '}
                      <span className="font-medium">{((page - 1) * 10) + 1}</span>
                      {' '}-{' '}
                      <span className="font-medium">{Math.min(page * 10, tripsData.pagination.total)}</span>
                      {' '}di{' '}
                      <span className="font-medium">{tripsData.pagination.total}</span>
                      {' '}risultati
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Precedente
                      </button>
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, tripsData.pagination.pages) }, (_, i) => {
                        const pageNum = i + 1
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === pageNum
                                ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                      <button
                        onClick={() => setPage(Math.min(tripsData.pagination.pages, page + 1))}
                        disabled={page === tripsData.pagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Successivo
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && tripsData && tripsData.trips.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Navigation className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessun viaggio trovato
            </h3>
            <p className="text-gray-500">
              {search || statusFilter 
                ? 'Prova a modificare i filtri per vedere più risultati.'
                : 'Non ci sono ancora viaggi nel sistema.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
