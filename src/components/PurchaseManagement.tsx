'use client'

import { useState, useEffect, useCallback } from 'react'
import { PurchaseStatus } from '@prisma/client'
import { useToast } from '@/hooks/useToast'
import { Search, RefreshCw, Gift, Undo, CreditCard, User, Navigation } from 'lucide-react'
import SearchableSelect from './SearchableSelect'

// Type for Prisma Decimal values
type DecimalLike = {
  toNumber: () => number;
  toString: () => string;
} | number

// Types for search functionality
interface SearchableUser {
  id: string
  name: string | null
  email: string
  role: string
}

interface SearchableTrip {
  id: string
  title: string
  destination: string
  price: DecimalLike
  status: string
  user: {
    name: string | null
  }
}

interface Purchase {
  id: string
  userId: string
  tripId: string
  amount: DecimalLike
  status: PurchaseStatus
  paymentMethod: string | null
  purchasedAt: Date | null
  createdAt: Date
  user: {
    id: string
    name: string | null
    email: string
  }
  trip: {
    id: string
    title: string
    price: DecimalLike
  }
}

interface PurchasesData {
  purchases: Purchase[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function PurchaseManagement() {
  const { showSuccess, showError } = useToast()
  const [purchasesData, setPurchasesData] = useState<PurchasesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | ''>('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const [showRefundModal, setShowRefundModal] = useState(false)
  const [showGiftModal, setShowGiftModal] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [refundReason, setRefundReason] = useState('')
  const [giftForm, setGiftForm] = useState({
    selectedUser: null as SearchableUser | null,
    selectedTrip: null as SearchableTrip | null,
    reason: ''
  })

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      })

      const response = await fetch(`/api/admin/purchases?${params}`)
      if (!response.ok) {
        throw new Error('Errore nel caricamento acquisti')
      }

      const data = await response.json()
      setPurchasesData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    fetchPurchases()
  }, [fetchPurchases])

  const handleRefund = async () => {
    if (!selectedPurchase) return

    try {
      setProcessingId(selectedPurchase.id)
      const response = await fetch(`/api/admin/purchases/${selectedPurchase.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: refundReason }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nel rimborso')
      }

      showSuccess('Acquisto rimborsato con successo')
      setShowRefundModal(false)
      setSelectedPurchase(null)
      setRefundReason('')
      fetchPurchases()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Errore nel rimborso')
    } finally {
      setProcessingId(null)
    }
  }

  const handleGift = async () => {
    if (!giftForm.selectedUser || !giftForm.selectedTrip) {
      showError('Utente e Viaggio sono richiesti')
      return
    }

    try {
      setProcessingId('gift')
      const response = await fetch('/api/admin/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: giftForm.selectedUser.id,
          tripId: giftForm.selectedTrip.id,
          reason: giftForm.reason
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nel regalo')
      }

      showSuccess('Viaggio regalato con successo')
      setShowGiftModal(false)
      setGiftForm({ selectedUser: null, selectedTrip: null, reason: '' })
      fetchPurchases()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Errore nel regalo')
    } finally {
      setProcessingId(null)
    }
  }

  // Search functions for SearchableSelect
  const searchUsers = async (query: string): Promise<SearchableUser[]> => {
    try {
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&limit=20`)
      if (!response.ok) {
        throw new Error('Errore nella ricerca utenti')
      }
      const data = await response.json()
      return data.users || []
    } catch (error) {
      console.error('Errore ricerca utenti:', error)
      throw error
    }
  }

  const searchTrips = async (query: string): Promise<SearchableTrip[]> => {
    try {
      const response = await fetch(`/api/admin/trips?search=${encodeURIComponent(query)}&limit=20`)
      if (!response.ok) {
        throw new Error('Errore nella ricerca viaggi')
      }
      const data = await response.json()
      return data.trips || []
    } catch (error) {
      console.error('Errore ricerca viaggi:', error)
      throw error
    }
  }

  // Render functions for SearchableSelect options
  const renderUserOption = (user: SearchableUser) => (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium text-gray-900">
          {user.name || 'Nome non disponibile'}
        </div>
        <div className="text-sm text-gray-500">{user.email}</div>
      </div>
      <div className="ml-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          user.role === 'Sentinel' ? 'bg-purple-100 text-purple-800' :
          user.role === 'Ranger' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {user.role}
        </span>
      </div>
    </div>
  )

  const renderUserSelected = (user: SearchableUser) => (
    <div className="flex items-center gap-2">
      <User className="w-4 h-4 text-gray-400" />
      <span className="font-medium">{user.name || 'Nome non disponibile'}</span>
      <span className="text-sm text-gray-500">({user.email})</span>
    </div>
  )

  const renderTripOption = (trip: SearchableTrip) => (
    <div>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-gray-900">{trip.title}</div>
          <div className="text-sm text-gray-500">{trip.destination}</div>
          <div className="text-sm text-gray-400">
            di {trip.user.name || 'Autore sconosciuto'}
          </div>
        </div>
        <div className="ml-2 text-right">
          <div className="font-medium text-gray-900">
            {formatAmount(trip.price)}
          </div>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            trip.status === 'Pubblicato' ? 'bg-green-100 text-green-800' :
            trip.status === 'Bozza' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {trip.status}
          </span>
        </div>
      </div>
    </div>
  )

  const renderTripSelected = (trip: SearchableTrip) => (
    <div className="flex items-center gap-2">
      <Navigation className="w-4 h-4 text-gray-400" />
      <span className="font-medium">{trip.title}</span>
      <span className="text-sm text-gray-500">({trip.destination})</span>
      <span className="font-medium text-gray-900">{formatAmount(trip.price)}</span>
    </div>
  )

  const getStatusBadge = (status: PurchaseStatus) => {
    const configs = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', text: 'In Attesa' },
      COMPLETED: { color: 'bg-green-100 text-green-800', text: 'Completato' },
      FAILED: { color: 'bg-red-100 text-red-800', text: 'Fallito' },
      REFUNDED: { color: 'bg-blue-100 text-blue-800', text: 'Rimborsato' }
    }

    const config = configs[status] || { color: 'bg-gray-100 text-gray-800', text: status }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('it-IT')
  }

  const formatAmount = (amount: DecimalLike) => {
    // Handle Prisma Decimal type - Prisma Decimal objects have toNumber() method
    let numericAmount: number;
    
    if (typeof amount === 'number') {
      numericAmount = amount;
    } else if (amount && typeof amount.toNumber === 'function') {
      numericAmount = amount.toNumber();
    } else {
      // Fallback for edge cases
      numericAmount = parseFloat(String(amount)) || 0;
    }
    
    return `€${numericAmount.toFixed(2)}`
  }

  if (loading && !purchasesData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Caricamento acquisti...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 rounded-lg p-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchPurchases}
              className="mt-2 text-red-600 hover:text-red-800 font-medium"
            >
              Riprova
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header con azioni */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Gestione Acquisti</h2>
              <p className="mt-1 text-sm text-gray-500">
                Gestisci acquisti, rimborsi e regali
              </p>
            </div>
            <button
              onClick={() => setShowGiftModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Gift className="w-4 h-4" />
              Regala Viaggio
            </button>
          </div>
        </div>

        {/* Filtri */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cerca
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Nome utente, email o titolo viaggio..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PurchaseStatus | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Tutti gli status</option>
                <option value="PENDING">In Attesa</option>
                <option value="COMPLETED">Completato</option>
                <option value="FAILED">Fallito</option>
                <option value="REFUNDED">Rimborsato</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchPurchases}
                disabled={loading}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Aggiorna'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tabella acquisti */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Viaggio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Importo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Acquisto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchasesData?.purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {purchase.user.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {purchase.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Navigation className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {purchase.trip.title}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CreditCard className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {formatAmount(purchase.amount)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(purchase.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(purchase.purchasedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {purchase.status === PurchaseStatus.COMPLETED && (
                        <button
                          onClick={() => {
                            setSelectedPurchase(purchase)
                            setShowRefundModal(true)
                          }}
                          disabled={processingId === purchase.id}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50 mr-4"
                        >
                          <Undo className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginazione */}
          {purchasesData && purchasesData.pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostra {((purchasesData.pagination.page - 1) * purchasesData.pagination.limit) + 1} a {' '}
                  {Math.min(purchasesData.pagination.page * purchasesData.pagination.limit, purchasesData.pagination.total)} di {' '}
                  {purchasesData.pagination.total} risultati
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Precedente
                  </button>
                  <span className="px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-md">
                    {page} di {purchasesData.pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(purchasesData.pagination.pages, page + 1))}
                    disabled={page >= purchasesData.pagination.pages}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Successivo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Rimborso */}
        {showRefundModal && selectedPurchase && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Conferma Rimborso
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Stai per rimborsare l&apos;acquisto di &quot;{selectedPurchase.trip.title}&quot; a {selectedPurchase.user.email}
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo del rimborso (opzionale)
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Descrivi il motivo del rimborso..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRefundModal(false)
                    setSelectedPurchase(null)
                    setRefundReason('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleRefund}
                  disabled={processingId === selectedPurchase.id}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {processingId === selectedPurchase.id ? 'Elaborazione...' : 'Rimborsa'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Regalo */}
        {showGiftModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Regala Viaggio
              </h3>
              <div className="space-y-4">
                <SearchableSelect<SearchableUser>
                  label="Utente Destinatario"
                  placeholder="Cerca per nome o email..."
                  searchFn={searchUsers}
                  renderOption={renderUserOption}
                  renderSelected={renderUserSelected}
                  value={giftForm.selectedUser}
                  onSelect={(user) => setGiftForm(prev => ({ ...prev, selectedUser: user }))}
                  required
                />
                
                <SearchableSelect<SearchableTrip>
                  label="Viaggio da Regalare"
                  placeholder="Cerca per titolo o destinazione..."
                  searchFn={searchTrips}
                  renderOption={renderTripOption}
                  renderSelected={renderTripSelected}
                  value={giftForm.selectedTrip}
                  onSelect={(trip) => setGiftForm(prev => ({ ...prev, selectedTrip: trip }))}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo del regalo (opzionale)
                  </label>
                  <textarea
                    value={giftForm.reason}
                    onChange={(e) => setGiftForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Descrivi il motivo del regalo..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowGiftModal(false)
                    setGiftForm({ selectedUser: null, selectedTrip: null, reason: '' })
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleGift}
                  disabled={processingId === 'gift' || !giftForm.selectedUser || !giftForm.selectedTrip}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {processingId === 'gift' ? 'Elaborazione...' : 'Regala'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}