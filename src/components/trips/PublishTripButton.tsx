'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/ui/useToast'
import { Send, Loader2 } from 'lucide-react'
import { TripValidationError } from '@/types/trip'

interface PublishTripButtonProps {
  tripId: string
  isOwner: boolean
  isSentinel: boolean
  tripStatus: string
  isDisabled?: boolean
  className?: string
}

interface PublishResponse {
  success?: boolean
  trip?: {
    id: string
    status: string
    updated_at: Date
  }
  error?: string
  validationErrors?: TripValidationError[]
}

export function PublishTripButton({ 
  tripId, 
  isOwner, 
  isSentinel, 
  tripStatus,
  isDisabled = false,
  className = '' 
}: PublishTripButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false)
  const { showSuccess, showError } = useToast()
  const router = useRouter()

  // Mostra il pulsante solo se:
  // - L'utente è il proprietario o un Sentinel
  // - Il viaggio è in stato "Bozza"
  const canPublish = (isOwner || isSentinel) && tripStatus === 'Bozza'

  if (!canPublish) {
    return null
  }

  const handlePublish = async () => {
    try {
      setIsPublishing(true)

      const response = await fetch(`/api/trips/${tripId}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data: PublishResponse = await response.json()

      if (!response.ok) {
        if (data.validationErrors && data.validationErrors.length > 0) {
          showError('Il viaggio non può essere pubblicato. Controlla i requisiti mancanti.')
        } else {
          showError(data.error || 'Errore durante la pubblicazione')
        }
        return
      }

      showSuccess('Viaggio pubblicato con successo!')
      router.refresh() // Ricarica la pagina per mostrare il nuovo stato
    } catch (error) {
      console.error('Errore nella pubblicazione:', error)
      showError('Errore interno durante la pubblicazione')
    } finally {
      setIsPublishing(false)
    }
  }

  const buttonDisabled = isPublishing || isDisabled

  return (
    <button
      onClick={handlePublish}
      disabled={buttonDisabled}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      title={isDisabled ? 'Completa i requisiti mancanti per pubblicare' : undefined}
    >
      {isPublishing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Send className="w-4 h-4" />
      )}
      {isPublishing ? 'Pubblicazione...' : 'Pubblica'}
    </button>
  )
}