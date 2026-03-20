'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/ui/useToast'
import Image from 'next/image'
import { UserRole } from '@/types/profile'
import { TripValidationError, Trip } from '@/types/trip'
import { User as UserType } from '@/types/profile';
import { TripReorderSection } from '@/components/admin/TripReorderSection'
import { Calendar, MapPin, User, Clock, Navigation, Eye, Edit, AlertTriangle, Send, Trash2, RotateCcw, ArrowUpDown, List, UserPlus, Euro } from 'lucide-react'
import { getTripStatusColor, getTripStatusLabel } from '@/lib/utils/tripStatusUtils'
import AssegnaRangerDialog from '@/components/admin/AssegnaRangerDialog'

interface TripWithUser extends Trip {
  user: UserType
}

interface TripsData {
  trips: TripWithUser[]
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
  const [revertingTrip, setRevertingTrip] = useState<string | null>(null)
  const [deletingTrip, setDeletingTrip] = useState<string | null>(null)
  const [tripToDelete, setTripToDelete] = useState<TripWithUser | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [tripToEditPrice, setTripToEditPrice] = useState<TripWithUser | null>(null)
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [priceValue, setPriceValue] = useState('')
  const [updatingPriceTripId, setUpdatingPriceTripId] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, TripValidationError[]>>({})
  const [showReorderMode, setShowReorderMode] = useState(false)
  const [allTripsForReorder, setAllTripsForReorder] = useState<TripWithUser[]>([])
  const [loadingAllTrips, setLoadingAllTrips] = useState(false)
  const [viaggioPerAssegnazione, setViaggioPerAssegnazione] = useState<TripWithUser | null>(null)

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

  const fetchAllTripsForReorder = useCallback(async () => {
    try {
      setLoadingAllTrips(true)
      setError('')

      // Fetch tutti i viaggi senza paginazione (limit alto)
      const params = new URLSearchParams({
        page: '1',
        limit: '1000', // Limite alto per ottenere tutti i viaggi
      })

      const response = await fetch(`/api/admin/trips?${params}`)
      if (!response.ok) {
        throw new Error('Errore nel caricamento di tutti i viaggi')
      }

      const data = await response.json()
      setAllTripsForReorder(data.trips)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoadingAllTrips(false)
    }
  }, [])

  const handleApproveTrip = async (tripId: string) => {
    try {
      setApprovingTrip(tripId)
      // Clear any previous validation errors for this trip
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[tripId]
        return newErrors
      })

      const response = await fetch(`/api/admin/trips/${tripId}/approve`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        if (errorData.validationErrors && errorData.validationErrors.length > 0) {
          // Store validation errors for this specific trip
          setValidationErrors(prev => ({
            ...prev,
            [tripId]: errorData.validationErrors
          }))
        } else {
          setError(errorData.error || 'Errore nell\'approvazione')
        }
        return
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

  const handleRevertToDraft = async (tripId: string) => {
    try {
      setRevertingTrip(tripId)

      const response = await fetch(`/api/trips/${tripId}/revert-to-draft`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Errore nel riportare il viaggio in bozza')
        return
      }

      showSuccess('Viaggio riportato in bozza con successo')
      // Reload trips list
      await fetchTrips()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setRevertingTrip(null)
    }
  }

  const handleDeleteTrip = async (trip: TripWithUser) => {
    setTripToDelete(trip)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteTrip = async () => {
    if (!tripToDelete) return

    try {
      setDeletingTrip(tripToDelete.id)
      setShowDeleteConfirm(false)

      const response = await fetch(`/api/admin/trips/${tripToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nell\'eliminazione del viaggio')
      }

      showSuccess(`Viaggio "${tripToDelete.title}" eliminato con successo`)
      // Reload trips list
      await fetchTrips()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setDeletingTrip(null)
      setTripToDelete(null)
    }
  }

  const cancelDeleteTrip = () => {
    setShowDeleteConfirm(false)
    setTripToDelete(null)
  }

  const openPriceModal = (trip: TripWithUser) => {
    setTripToEditPrice(trip)
    setPriceValue(Number(trip.price).toFixed(2))
    setShowPriceModal(true)
  }

  const closePriceModal = () => {
    if (updatingPriceTripId) return
    setShowPriceModal(false)
    setTripToEditPrice(null)
    setPriceValue('')
  }

  const handleUpdatePrice = async () => {
    if (!tripToEditPrice) return

    const parsedPrice = Number.parseFloat(priceValue.replace(',', '.'))
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError('Inserisci un prezzo valido maggiore o uguale a 0')
      return
    }

    try {
      setUpdatingPriceTripId(tripToEditPrice.id)
      setError('')

      const response = await fetch(`/api/admin/trips/${tripToEditPrice.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price: Number(parsedPrice.toFixed(2))
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore nell\'aggiornamento del prezzo')
      }

      showSuccess(`Prezzo di "${tripToEditPrice.title}" aggiornato`)
      closePriceModal()
      await fetchTrips()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setUpdatingPriceTripId(null)
    }
  }

  useEffect(() => {
    if (session?.user?.role === UserRole.Sentinel) {
      fetchTrips()
    }
  }, [fetchTrips, session])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPriceModal) {
        closePriceModal()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showPriceModal])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1) // Reset to first page when searching
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setPage(1) // Reset to first page when filtering
  }


  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }

  const formatPrice = (value: number | string) => {
    const parsedValue = typeof value === 'number' ? value : Number(value)
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(parsedValue)
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

        {/* Filters and Controls */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Controlli e Filtri</h2>
            
            {/* Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  setShowReorderMode(false)
                  // Ricarica i dati paginati quando si torna alla visualizzazione lista
                  await fetchTrips()
                }}
                className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  !showReorderMode
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <List className="w-4 h-4" />
                Visualizza Lista
              </button>
              <button
                onClick={async () => {
                  setShowReorderMode(true)
                  // Carica tutti i viaggi quando si entra in modalità riordinamento
                  await fetchAllTripsForReorder()
                }}
                disabled={loadingAllTrips}
                className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  showReorderMode
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loadingAllTrips ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowUpDown className="w-4 h-4" />
                )}
                Riordina Viaggi
              </button>
            </div>
          </div>
          
          {/* Filters - only show in list mode */}
          {!showReorderMode && (
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
          )}
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

        {/* Trip Reorder Mode */}
        {showReorderMode && (
          <>
            {/* Loading state per il caricamento di tutti i viaggi */}
            {loadingAllTrips && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="flex items-center justify-center gap-3 text-gray-600">
                  <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Caricamento di tutti i viaggi...</span>
                </div>
              </div>
            )}

            {/* Sezione riordinamento - mostra solo se i viaggi sono stati caricati */}
            {!loadingAllTrips && allTripsForReorder.length > 0 && (
              <TripReorderSection
                trips={allTripsForReorder as Trip[]} // Type conversion needed due to interface differences
                onReorderComplete={async () => {
                  // Ricarica tutti i viaggi per il reorder e i dati paginati
                  await Promise.all([
                    fetchAllTripsForReorder(),
                    fetchTrips()
                  ]);
                }}
              />
            )}

            {/* Empty state se non ci sono viaggi */}
            {!loadingAllTrips && allTripsForReorder.length === 0 && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <Navigation className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nessun viaggio disponibile
                </h3>
                <p className="text-gray-500">
                  Non ci sono viaggi da riordinare al momento.
                </p>
              </div>
            )}
          </>
        )}

        {/* Trips table */}
        {!loading && tripsData && !showReorderMode && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-hidden">
              <table className="w-full table-fixed divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-[19%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Viaggio
                    </th>
                    <th className="w-[23%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Creatore
                    </th>
                    <th className="w-[9%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stato
                    </th>
                    <th className="w-[8%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durata
                    </th>
                    <th className="w-[8%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prezzo
                    </th>
                    <th className="w-[11%] px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Creato
                    </th>
                    <th className="w-[22%] px-2 pr-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tripsData.trips.map((trip) => (
                    <Fragment key={trip.id}>
                      <tr className="hover:bg-gray-50">
                      <td className="px-3 py-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-lg flex items-center justify-center">
                            <Navigation className="w-6 h-6 text-white" />
                          </div>
                          <div className="ml-2 min-w-0">
                            <div className="text-sm font-medium text-gray-900 line-clamp-1">
                              {trip.title}
                            </div>
                            <div className="text-sm text-gray-500 flex items-start gap-1">
                              <MapPin className="w-3 h-3" />
                              <span className="line-clamp-2">{trip.destination}</span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {trip.theme}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-4">
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
                          <div className="ml-2 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {trip.user.name || 'Nome non specificato'}
                            </div>
                            <div className="text-sm text-gray-500 truncate">{trip.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTripStatusColor(trip.status)}`}>
                          {getTripStatusLabel(trip.status)}
                        </span>
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {trip.duration_days} giorni
                        </div>
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{formatPrice(Number(trip.price))}</div>
                        {Number(trip.price) === 0 && (
                          <div className="text-xs text-green-600">Gratuito</div>
                        )}
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(trip.created_at)}
                        </div>
                      </td>
                      <td className="px-2 pr-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-0.5">
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

                          <button
                            onClick={() => openPriceModal(trip)}
                            disabled={updatingPriceTripId === trip.id}
                            className="text-emerald-600 hover:text-emerald-900 p-1 rounded disabled:opacity-50"
                            title="Modifica prezzo"
                          >
                            <Euro className="w-4 h-4" />
                          </button>

                          {/* Assign Ranger button */}
                          <button
                            onClick={() => setViaggioPerAssegnazione(trip)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                            title="Assegna Ranger"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>

                          {/* Approve button - only for draft trips */}
                          {trip.status === 'Bozza' && (
                            <button
                              onClick={() => handleApproveTrip(trip.id)}
                              disabled={approvingTrip === trip.id}
                              className="text-green-600 hover:text-green-900 p-1 rounded disabled:opacity-50"
                              title="Approva viaggio"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}

                          {/* Revert to draft button - for non-draft trips */}
                          {trip.status !== 'Bozza' && (
                            <button
                              onClick={() => handleRevertToDraft(trip.id)}
                              disabled={revertingTrip === trip.id}
                              className="text-orange-600 hover:text-orange-900 p-1 rounded disabled:opacity-50"
                              title="Riporta in bozza"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          
                          {/* Delete button - only for draft trips */}
                          <button
                            onClick={() => handleDeleteTrip(trip)}
                            disabled={deletingTrip === trip.id || trip.status !== 'Bozza'}
                            className="text-red-600 hover:text-red-900 p-1 rounded disabled:opacity-50"
                            title={trip.status !== 'Bozza' ? 'Puoi eliminare solo viaggi in bozza' : 'Elimina viaggio'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          {approvingTrip === trip.id && (
                            <div className="inline-block">
                              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}

                          {revertingTrip === trip.id && (
                            <div className="inline-block">
                              <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                          
                          {deletingTrip === trip.id && (
                            <div className="inline-block">
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Validation errors row */}
                    {validationErrors[trip.id] && validationErrors[trip.id].length > 0 && (
                      <tr className="bg-amber-50">
                        <td colSpan={7} className="px-6 py-4">
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
                                Risolvi tutti i problemi sopra elencati per poter pubblicare il viaggio.
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
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
        {!loading && tripsData && tripsData.trips.length === 0 && !showReorderMode && (
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && tripToDelete && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={cancelDeleteTrip}>
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
              <div className="mt-3">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="mt-5 text-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Elimina viaggio
                  </h3>
                  <div className="mt-2 px-7 py-3">
                    <p className="text-sm text-gray-500 mb-4">
                      Sei sicuro di voler eliminare definitivamente il viaggio <strong>&ldquo;{tripToDelete.title}&rdquo;</strong>?
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
                      <div className="flex">
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-amber-800">
                            Attenzione: Questa azione è irreversibile!
                          </h4>
                          <div className="mt-2 text-sm text-amber-700">
                            <ul className="list-disc list-inside space-y-1">
                              <li>Il viaggio verrà eliminato dal database</li>
                              <li>Tutte le tappe associate verranno eliminate</li>
                              <li>Tutte le immagini, video e file GPX verranno eliminati dallo storage</li>
                              <li>Non sarà possibile recuperare questi dati</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      Destinazione: {tripToDelete.destination} • Creato da: {tripToDelete.user.name || tripToDelete.user.email}
                    </p>
                  </div>
                  <div className="items-center px-4 py-3">
                    <div className="flex space-x-3">
                      <button
                        onClick={cancelDeleteTrip}
                        className="w-full px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                      >
                        Annulla
                      </button>
                      <button
                        onClick={confirmDeleteTrip}
                        disabled={deletingTrip === tripToDelete.id}
                        className="w-full px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingTrip === tripToDelete.id ? (
                          <div className="flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Eliminando...
                          </div>
                        ) : (
                          'Elimina definitivamente'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPriceModal && tripToEditPrice && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={closePriceModal}>
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-emerald-100 rounded-full">
                <Euro className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-medium text-gray-900">Modifica prezzo</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Aggiorna il prezzo del viaggio <strong>&ldquo;{tripToEditPrice.title}&rdquo;</strong>.
                </p>
              </div>

              <div className="mt-6">
                <label htmlFor="trip-price" className="block text-sm font-medium text-gray-700 mb-2">
                  Nuovo prezzo
                </label>
                <input
                  id="trip-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Gli acquisti gi&agrave; creati mantengono il loro importo originario.
                </p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={closePriceModal}
                  disabled={updatingPriceTripId === tripToEditPrice.id}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleUpdatePrice}
                  disabled={updatingPriceTripId === tripToEditPrice.id}
                  className="w-full px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingPriceTripId === tripToEditPrice.id ? 'Salvataggio...' : 'Salva prezzo'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assegna Ranger Dialog */}
        <AssegnaRangerDialog
          viaggio={viaggioPerAssegnazione}
          isOpen={viaggioPerAssegnazione !== null}
          onClose={() => setViaggioPerAssegnazione(null)}
          onAssegnato={() => {
            showSuccess('Ranger assegnato con successo')
            fetchTrips()
            setViaggioPerAssegnazione(null)
          }}
        />
      </div>
    </div>
  )
}
