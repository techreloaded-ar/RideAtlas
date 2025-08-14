'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { TripValidationError } from '@/types/trip'

interface TripValidationWarningProps {
  tripId: string
  isOwner: boolean
  isSentinel: boolean
  tripStatus: string
  onValidationChange?: (hasErrors: boolean) => void
}

export function TripValidationWarning({ 
  tripId, 
  isOwner, 
  isSentinel, 
  tripStatus,
  onValidationChange
}: TripValidationWarningProps) {
  const [validationErrors, setValidationErrors] = useState<TripValidationError[]>([])
  const [loading, setLoading] = useState(false)

  // Mostra la sezione solo se:
  // - L'utente è il proprietario o un Sentinel
  // - Il viaggio è in stato "Bozza"
  const shouldShow = (isOwner || isSentinel) && tripStatus === 'Bozza'

  useEffect(() => {
    if (!shouldShow) return

    const checkValidation = async () => {
      try {
        setLoading(true)
        
        const response = await fetch(`/api/trips/${tripId}/validate`, {
          method: 'GET'
        })

        const data = await response.json()

        if (data.validationErrors && data.validationErrors.length > 0) {
          setValidationErrors(data.validationErrors)
          onValidationChange?.(true) // Ha errori
        } else {
          setValidationErrors([])
          onValidationChange?.(false) // Nessun errore
        }
      } catch (error) {
        console.error('Errore nel controllo validazione:', error)
        setValidationErrors([])
        onValidationChange?.(false) // In caso di errore, non blocchiamo il pulsante
      } finally {
        setLoading(false)
      }
    }

    checkValidation()
  }, [tripId, shouldShow, onValidationChange])

  // Non mostrare nulla se non ci sono errori o se non dovrebbe essere visibile
  if (!shouldShow || validationErrors.length === 0 || loading) {
    return null
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-amber-800 font-medium text-sm mb-3">
            Requisiti mancanti per la pubblicazione
          </h3>
          <ul className="space-y-2">
            {validationErrors.map((error, index) => (
              <li key={index} className="flex items-start gap-2 text-amber-700 text-sm">
                <span className="text-amber-500 font-bold leading-none">•</span>
                <span>{error.message}</span>
              </li>
            ))}
          </ul>
          <p className="text-amber-600 text-xs mt-3 opacity-80">
            Completa tutti i requisiti sopra elencati per poter pubblicare il viaggio.
          </p>
        </div>
      </div>
    </div>
  )
}