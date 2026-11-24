'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

interface GuidedTripBookingPanelProps {
  guidedTripId: string
  slug: string
  isAuthenticated: boolean
  viewerIsOrganizer: boolean
  closedMessage: string | null
  viewerRegistration: { id: string; status: string; canSelfCancel: boolean } | null
}

const primaryButtonClasses =
  'mt-5 block w-full text-center bg-primary-600 hover:bg-primary-700 text-white text-lg font-bold py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'

export default function GuidedTripBookingPanel({
  guidedTripId,
  slug,
  isAuthenticated,
  viewerIsOrganizer,
  closedMessage,
  viewerRegistration,
}: GuidedTripBookingPanelProps) {
  const router = useRouter()
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const registrationUrl = `/guided-trips/${slug}/iscrizione`

  if (viewerIsOrganizer) {
    return (
      <Link href={`/dashboard/guided-trips/${guidedTripId}`} className={primaryButtonClasses}>
        Gestisci il viaggio
      </Link>
    )
  }

  if (viewerRegistration?.status === 'CONFIRMED') {
    const handleCancel = async () => {
      if (!window.confirm('Vuoi davvero disdire la tua iscrizione? Il posto tornerà disponibile per altri.')) return
      setCancelling(true)
      setError(null)
      try {
        const response = await fetch(`/api/guided-trip-registrations/${viewerRegistration.id}/cancel`, { method: 'POST' })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Disdetta non riuscita')
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Disdetta non riuscita')
      } finally {
        setCancelling(false)
      }
    }
    return (
      <div className="mt-5" data-testid="guided-trip-registered">
        <p className="flex items-center justify-center gap-2 bg-primary-50 text-primary-800 font-semibold py-4 rounded-xl">
          <CheckCircle className="w-5 h-5" aria-hidden="true" /> Sei iscritto a questo viaggio
        </p>
        {viewerRegistration.canSelfCancel ? (
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="mt-3 w-full border border-red-600 text-red-700 font-semibold py-3 rounded-xl hover:bg-red-50 disabled:opacity-50"
          >
            {cancelling ? 'Disdetta in corso…' : 'Disdici iscrizione'}
          </button>
        ) : (
          <p className="mt-3 text-sm text-gray-600 text-center">Il termine per la disdetta autonoma è scaduto.</p>
        )}
        {error && <p className="mt-2 text-sm text-red-700" role="alert">{error}</p>}
      </div>
    )
  }

  if (viewerRegistration?.status === 'PENDING_PAYMENT') {
    return (
      <Link href={registrationUrl} className={primaryButtonClasses}>
        Completa il pagamento
      </Link>
    )
  }

  if (closedMessage) {
    return (
      <button type="button" disabled className="mt-5 w-full bg-gray-300 text-gray-700 text-lg font-bold py-4 rounded-xl cursor-not-allowed" data-testid="guided-trip-closed">
        {closedMessage}
      </button>
    )
  }

  if (!isAuthenticated) {
    return (
      <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(registrationUrl)}`} className={primaryButtonClasses}>
        Iscriviti e paga
      </Link>
    )
  }

  return (
    <Link href={registrationUrl} className={primaryButtonClasses} data-testid="guided-trip-register">
      Iscriviti e paga
    </Link>
  )
}
