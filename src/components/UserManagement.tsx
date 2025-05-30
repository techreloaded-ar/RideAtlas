'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserRole, UserRoleLabels, UserRoleDescriptions } from '@/types/profile'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/useToast'
import Image from 'next/image'

interface User {
  id: string
  name: string | null
  email: string
  role: UserRole
  emailVerified: Date | null
  createdAt: Date
  updatedAt: Date
  image: string | null
  _count: {
    trips: number
  }
}

interface UsersData {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function UserManagement() {
  const { data: session } = useSession()
  const { showSuccess } = useToast()
  const [usersData, setUsersData] = useState<UsersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) {
        throw new Error('Errore nel caricamento utenti')
      }

      const data = await response.json()
      setUsersData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter])

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      setUpdatingUser(userId)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nell\'aggiornamento')
      }

      showSuccess('Ruolo utente aggiornato con successo')
      // Ricarica la lista utenti
      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setUpdatingUser(null)
    }
  }

  useEffect(() => {
    if (session?.user?.role === UserRole.Sentinel) {
      fetchUsers()
    }
  }, [fetchUsers, session])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1) // Reset alla prima pagina quando si cerca
  }

  const handleRoleFilterChange = (value: UserRole | '') => {
    setRoleFilter(value)
    setPage(1) // Reset alla prima pagina quando si filtra
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.Explorer:
        return 'bg-green-100 text-green-800'
      case UserRole.Ranger:
        return 'bg-blue-100 text-blue-800'
      case UserRole.Sentinel:
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Verifica permessi
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
          <h1 className="text-3xl font-bold text-gray-900">Gestione Utenti</h1>
          <p className="mt-2 text-gray-600">
            Gestisci i ruoli e i permessi degli utenti del sistema
          </p>
        </div>

        {/* Filtri */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Cerca utenti
              </label>
              <input
                type="text"
                id="search"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Nome o email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Filtra per ruolo
              </label>
              <select
                id="roleFilter"
                value={roleFilter}
                onChange={(e) => handleRoleFilterChange(e.target.value as UserRole | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Tutti i ruoli</option>
                <option value={UserRole.Explorer}>Explorer</option>
                <option value={UserRole.Ranger}>Ranger</option>
                <option value={UserRole.Sentinel}>Sentinel</option>
              </select>
            </div>
          </div>
        </div>

        {/* Errori */}
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
            <div className="text-gray-600">Caricamento utenti...</div>
          </div>
        )}

        {/* Tabella utenti */}
        {!loading && usersData && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ruolo Attuale
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Viaggi Creati
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registrato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usersData.users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.image ? (
                              <Image
                                className="h-10 w-10 rounded-full"
                                src={user.image}
                                alt=""
                                width={40}
                                height={40}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || 'Nome non specificato'}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {!user.emailVerified && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                Non verificato
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          {UserRoleLabels[user.role]}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {UserRoleDescriptions[user.role]}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user._count.trips}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('it-IT')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {user.id !== session?.user?.id && (
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                            disabled={updatingUser === user.id}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                          >
                            <option value={UserRole.Explorer}>Explorer</option>
                            <option value={UserRole.Ranger}>Ranger</option>
                            <option value={UserRole.Sentinel}>Sentinel</option>
                          </select>
                        )}
                        {user.id === session?.user?.id && (
                          <span className="text-gray-400 text-sm">
                            (Il tuo account)
                          </span>
                        )}
                        {updatingUser === user.id && (
                          <div className="ml-2 inline-block">
                            <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginazione */}
            {usersData.pagination.pages > 1 && (
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
                    onClick={() => setPage(Math.min(usersData.pagination.pages, page + 1))}
                    disabled={page === usersData.pagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Successiva
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando{' '}
                      <span className="font-medium">
                        {(page - 1) * 10 + 1}
                      </span>{' '}
                      a{' '}
                      <span className="font-medium">
                        {Math.min(page * 10, usersData.pagination.total)}
                      </span>{' '}
                      di{' '}
                      <span className="font-medium">
                        {usersData.pagination.total}
                      </span>{' '}
                      risultati
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
                      {/* Numeri di pagina */}
                      {Array.from({ length: Math.min(5, usersData.pagination.pages) }, (_, i) => {
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
                        onClick={() => setPage(Math.min(usersData.pagination.pages, page + 1))}
                        disabled={page === usersData.pagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Successiva
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nessun risultato */}
        {!loading && usersData && usersData.users.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-600">Nessun utente trovato con i criteri selezionati.</div>
          </div>
        )}
      </div>
    </div>
  )
}
