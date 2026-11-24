'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface GuidedTripLifecycleActionsProps {
  guidedTripId: string
  slug: string
  status: 'Bozza' | 'Pubblicato' | 'Annullato'
  confirmedParticipants: number
}

export default function GuidedTripLifecycleActions({ guidedTripId, slug, status, confirmedParticipants }: GuidedTripLifecycleActionsProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const call = async (action: 'publish' | 'cancel') => {
    if (action === 'cancel') {
      const warning =
        confirmedParticipants > 0
          ? `Annullare il viaggio? Le ${confirmedParticipants} iscrizioni confermate diventeranno da rimborsare.`
          : 'Annullare il viaggio? Le iscrizioni verranno chiuse.'
      if (!window.confirm(warning)) return
    }
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch(`/api/guided-trips/${guidedTripId}/${action}`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Operazione non riuscita')
      setMessage(action === 'publish' ? 'Viaggio pubblicato: le iscrizioni sono aperte' : 'Viaggio annullato')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operazione non riuscita')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link href={`/guided-trips/${slug}`} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800 font-semibold hover:bg-gray-50">
        {status === 'Bozza' ? 'Anteprima scheda pubblica' : 'Vedi scheda pubblica'}
      </Link>
      {status === 'Bozza' && (
        <button
          type="button"
          onClick={() => call('publish')}
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold disabled:opacity-50"
        >
          Pubblica e apri le iscrizioni
        </button>
      )}
      {status !== 'Annullato' && (
        <button
          type="button"
          onClick={() => call('cancel')}
          disabled={busy}
          className="px-4 py-2 rounded-lg border border-red-600 text-red-700 font-semibold hover:bg-red-50 disabled:opacity-50"
        >
          Annulla viaggio
        </button>
      )}
      {message && <p className="text-primary-800" role="status">{message}</p>}
      {error && <p className="text-red-700" role="alert">{error}</p>}
    </div>
  )
}
