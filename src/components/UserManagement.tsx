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
  const [deletingUser, setDeletingUser] = useState<string | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.Explorer,
    sendWelcomeEmail: true,
  })
  const [creatingUser, setCreatingUser] = useState(false)

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

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    try {
      setDeletingUser(userToDelete.id)
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nell\'eliminazione')
      }

      await response.json()
      showSuccess(`Utente ${userToDelete.email} eliminato con successo`)
      
      // Ricarica la lista utenti
      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setDeletingUser(null)
      setShowDeleteModal(false)
      setUserToDelete(null)
    }
  }

  const cancelDeleteUser = () => {
    setShowDeleteModal(false)
    setUserToDelete(null)
  }

  const handleCreateUser = async () => {
    try {
      setCreatingUser(true)
      
      // Validazione
      if (!createFormData.name || !createFormData.email || !createFormData.password) {
        throw new Error('Tutti i campi sono obbligatori')
      }
      
      if (createFormData.password.length < 8) {
        throw new Error('La password deve essere di almeno 8 caratteri')
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createFormData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nella creazione dell\'utente')
      }

      const data = await response.json()
      showSuccess(data.message || 'Utente creato con successo')
      
      // Reset form e chiudi modal
      setCreateFormData({
        name: '',
        email: '',
        password: '',
        role: UserRole.Explorer,
        sendWelcomeEmail: true,
      })
      setShowCreateModal(false)
      
      // Ricarica la lista utenti
      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setCreatingUser(false)
    }
  }

  // Gestione chiusura modale creazione utente
  const closeCreateModal = () => {
    setShowCreateModal(false)
    setCreateFormData({
      name: '',
      email: '',
      password: '',
      role: UserRole.Explorer,
      sendWelcomeEmail: true,
    })
  }

  useEffect(() => {
    if (session?.user?.role === UserRole.Sentinel) {
      fetchUsers()
    }
  }, [fetchUsers, session])

  // Gestione tasto ESC per chiudere il modale
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showDeleteModal) {
          cancelDeleteUser()
        } else if (showCreateModal) {
          closeCreateModal()
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showDeleteModal, showCreateModal])

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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestione Utenti</h1>
            <p className="mt-2 text-gray-600">
              Gestisci i ruoli e i permessi degli utenti del sistema
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Crea Utente
          </button>
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
                        <div className="flex items-center space-x-2">
                          {user.id !== session?.user?.id && (
                            <>
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
                              <button
                                onClick={() => handleDeleteUser(user)}
                                disabled={deletingUser === user.id}
                                className="inline-flex items-center px-2 py-1 border border-red-300 rounded text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50"
                                title="Elimina utente"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                          {user.id === session?.user?.id && (
                            <span className="text-gray-400 text-sm">
                              (Il tuo account)
                            </span>
                          )}
                          {(updatingUser === user.id || deletingUser === user.id) && (
                            <div className="ml-2 inline-block">
                              <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
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

        {/* Modale di conferma eliminazione */}
        {showDeleteModal && userToDelete && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                  Elimina Utente
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Sei sicuro di voler eliminare l&apos;utente <strong>{userToDelete.email}</strong>?
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ Questa azione è irreversibile e eliminerà:
                  </p>
                  <ul className="text-sm text-gray-600 mt-1 text-left">
                    <li>• Account utente</li>
                    <li>• {userToDelete._count.trips} viaggi creati</li>
                    <li>• Tutte le sessioni attive</li>
                    <li>• Dati correlati</li>
                  </ul>
                  {userToDelete.role === UserRole.Sentinel && (
                    <p className="text-sm text-orange-600 mt-2 font-semibold">
                      ⚠️ Stai eliminando un Sentinel!
                    </p>
                  )}
                </div>
                <div className="items-center px-4 py-3">
                  <div className="flex space-x-3">
                    <button
                      onClick={cancelDeleteUser}
                      disabled={deletingUser === userToDelete.id}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={confirmDeleteUser}
                      disabled={deletingUser === userToDelete.id}
                      className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {deletingUser === userToDelete.id ? (
                        <>
                          <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Eliminando...
                        </>
                      ) : (
                        'Elimina'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modale di creazione utente */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                  Crea Nuovo Utente
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Compila i campi sottostanti per creare un nuovo utente.
                  </p>
                </div>

                {/* Form di creazione utente */}
                <div className="px-4 py-3">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="createName" className="block text-sm font-medium text-gray-700">
                        Nome
                      </label>
                      <input
                        type="text"
                        id="createName"
                        value={createFormData.name}
                        onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Nome completo"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="createEmail" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        id="createEmail"
                        value={createFormData.email}
                        onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Email dell'utente"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="createPassword" className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <input
                        type="password"
                        id="createPassword"
                        value={createFormData.password}
                        onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Password temporanea"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="createRole" className="block text-sm font-medium text-gray-700">
                        Ruolo
                      </label>
                      <select
                        id="createRole"
                        value={createFormData.role}
                        onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value as UserRole })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value={UserRole.Explorer}>Explorer</option>
                        <option value={UserRole.Ranger}>Ranger</option>
                        <option value={UserRole.Sentinel}>Sentinel</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="sendWelcomeEmail"
                        checked={createFormData.sendWelcomeEmail}
                        onChange={(e) => setCreateFormData({ ...createFormData, sendWelcomeEmail: e.target.checked })}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label htmlFor="sendWelcomeEmail" className="ml-2 block text-sm text-gray-700">
                        Invia email di benvenuto
                      </label>
                    </div>
                  </div>
                </div>

                <div className="items-center px-4 py-3">
                  <div className="flex space-x-3">
                    <button
                      onClick={closeCreateModal}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={handleCreateUser}
                      disabled={creatingUser}
                      className="flex-1 px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {creatingUser ? (
                        <>
                          <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Creando...
                        </>
                      ) : (
                        'Crea Utente'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
