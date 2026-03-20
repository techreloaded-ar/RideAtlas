'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Mail, User, Bike, Shield, MapPinned, Save } from 'lucide-react'
import UserAvatar from '@/components/ui/UserAvatar'
import { useToast } from '@/hooks/ui/useToast'
import { UserRole, UserRoleLabels, UserRoleDescriptions } from '@/types/profile'

interface AdminUserTrip {
  id: string
  title: string
  slug: string
  destination: string
  status: string
  created_at: string | Date
}

interface AdminUserDetailData {
  id: string
  name: string | null
  email: string
  role: UserRole
  emailVerified: string | Date | null
  createdAt: string | Date
  updatedAt: string | Date
  image: string | null
  bio: string | null
  bikeDescription: string | null
  _count: {
    trips: number
  }
  trips: AdminUserTrip[]
}

interface AdminUserDetailProps {
  userId: string
}

export default function AdminUserDetail({ userId }: AdminUserDetailProps) {
  const router = useRouter()
  const { showSuccess, showError } = useToast()
  const [user, setUser] = useState<AdminUserDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<{
    name: string;
    role: UserRole;
    bio: string;
    bikeDescription: string;
  }>({
    name: '',
    role: UserRole.Explorer,
    bio: '',
    bikeDescription: '',
  })

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(`/api/admin/users/${userId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Errore nel caricamento utente')
        }

        setUser(data.user)
        setFormData({
          name: data.user.name || '',
          role: data.user.role,
          bio: data.user.bio || '',
          bikeDescription: data.user.bikeDescription || '',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore sconosciuto')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [userId])

  const handleSave = async () => {
    if (!user) return

    try {
      setSaving(true)
      setError('')

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore nel salvataggio utente')
      }

      setUser((prev) => prev ? {
        ...prev,
        ...data.user,
      } : data.user)
      showSuccess('Utente aggiornato con successo')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore sconosciuto'
      setError(message)
      showError(message)
    } finally {
      setSaving(false)
    }
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

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'Non disponibile'
    return new Date(date).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-10 flex items-center justify-center gap-3 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Caricamento utente...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-red-700 font-medium">{error}</div>
            <button
              onClick={() => router.push('/admin')}
              className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Torna al pannello admin
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  const avatarUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla gestione utenti
          </Link>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salva modifiche
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start gap-5">
            <UserAvatar
              user={avatarUser}
              size="lg"
              className="w-20 h-20"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {user.name || 'Utente senza nome'}
                </h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
                  <Shield className="w-3 h-3 mr-1" />
                  {UserRoleLabels[user.role]}
                </span>
              </div>

              <p className="text-gray-600 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
              <p className="text-sm text-gray-500 mt-2">{UserRoleDescriptions[user.role]}</p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-500">Membro dal</div>
                  <div className="font-medium text-gray-900">{formatDate(user.createdAt)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-500">Email verificata</div>
                  <div className="font-medium text-gray-900">{user.emailVerified ? formatDate(user.emailVerified) : 'No'}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-500">Viaggi creati</div>
                  <div className="font-medium text-gray-900">{user._count.trips}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Dati profilo</h2>
              <p className="text-sm text-gray-600 mt-1">
                Modifica le informazioni principali dell&apos;utente.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ruolo</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value={UserRole.Explorer}>Explorer</option>
                  <option value={UserRole.Ranger}>Ranger</option>
                  <option value={UserRole.Sentinel}>Sentinel</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrizione moto</label>
                <textarea
                  value={formData.bikeDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, bikeDescription: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">Stato account</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-gray-500">Ultimo aggiornamento</span>
                  <span className="text-gray-900 font-medium">{formatDate(user.updatedAt)}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-gray-500">Ruolo corrente</span>
                  <span className="text-gray-900 font-medium">{UserRoleLabels[formData.role]}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <Bike className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">Ultimi viaggi</h2>
              </div>

              {user.trips.length === 0 ? (
                <p className="text-sm text-gray-500">Questo utente non ha ancora creato viaggi.</p>
              ) : (
                <div className="space-y-3">
                  {user.trips.map((trip) => (
                    <Link
                      key={trip.id}
                      href={`/trips/${trip.slug}`}
                      className="block rounded-lg border border-gray-200 p-3 hover:border-primary-300 hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{trip.title}</div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                        <MapPinned className="w-4 h-4" />
                        <span>{trip.destination}</span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {trip.status} · {formatDate(trip.created_at)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
