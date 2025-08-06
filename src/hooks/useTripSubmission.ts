// src/hooks/useTripSubmission.ts
import { useState, useCallback } from 'react'
import { UseFormSetError, FieldPath } from 'react-hook-form'
import type { TripWithStagesData } from '@/schemas/trip'
import { serverErrorSchema } from '@/schemas/trip'

interface UseTripSubmissionOptions {
  mode: 'create' | 'edit'
  tripId?: string
  onSuccess?: (trip: unknown) => void
  setError: UseFormSetError<TripWithStagesData>
}

export const useTripSubmission = ({ 
  mode, 
  tripId, 
  onSuccess, 
  setError 
}: UseTripSubmissionOptions) => {
  const [isLoading, setIsLoading] = useState(false)

  const submit = async (data: TripWithStagesData) => {
    setIsLoading(true)

    try {
      const url = mode === 'create' ? '/api/trips' : `/api/trips/${tripId}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      // Prepara i dati per l'invio (formato compatibile con l'API esistente)
      const submitData = {
        ...data,
        // Le stages devono essere nel formato che si aspetta l'API
        stages: data.stages.map((stage) => ({
          id: (stage.id as string) || undefined, // Assicurati che l'ID sia incluso
          title: stage.title,
          description: stage.description || '',
          routeType: stage.routeType || 'road',
          media: stage.media || [],
          gpxFile: stage.gpxFile || null,
          orderIndex: stage.orderIndex, // Mantieni l'orderIndex esistente
        }))
      }
      console.log('Frontend - Dati inviati al server:', submitData);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (!response.ok) {
        // Parse dell'errore del server
        const serverError = serverErrorSchema.safeParse(result)
        
        if (serverError.success && serverError.data.details) {
          // Imposta gli errori specifici dei campi usando RHF
          Object.entries(serverError.data.details).forEach(([fieldName, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              // Converte il nome del campo per RHF (es: "title" -> "title")
              const fieldPath = fieldName as FieldPath<TripWithStagesData>
              setError(fieldPath, {
                type: 'server',
                message: messages[0] // Prende il primo messaggio di errore
              })
            }
          })
        } else {
          // Errore generale se non riusciamo a parsare gli errori specifici
          setError('root.serverError', {
            type: 'server',
            message: result.error || `Errore durante ${mode === 'create' ? 'la creazione' : 'l\'aggiornamento'} del viaggio`
          })
        }
        
        return false
      }

      // Successo - chiama il callback
      onSuccess?.(result.trip || result)
      return true

    } catch (err) {
      console.error('Submit error:', err)
      
      // Errore di rete o parsing
      setError('root.networkError', {
        type: 'network', 
        message: 'Errore di rete. Controlla la connessione e riprova.'
      })
      
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { 
    submit, 
    isLoading 
  }
}

// Hook per il caricamento dei dati esistenti (per edit mode)
interface UseTripDataOptions {
  tripId?: string
  enabled?: boolean
}

export const useTripData = ({ tripId, enabled = true }: UseTripDataOptions) => {
  const [data, setData] = useState<TripWithStagesData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTrip = useCallback(async () => {
    if (!tripId || !enabled) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/trips/${tripId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Viaggio non trovato')
        }
        if (response.status === 403) {
          throw new Error('Non hai i permessi per modificare questo viaggio')
        }
        throw new Error('Errore nel caricamento del viaggio')
      }
      
      const tripData = await response.json()
      
      // Converte i dati dall'API nel formato del form
      const formData: TripWithStagesData = {
        title: tripData.title || '',
        summary: tripData.summary || '',
        destination: tripData.destination || '',
        theme: tripData.theme || '',
        characteristics: tripData.characteristics || [],
        recommended_seasons: tripData.recommended_seasons || [],
        tags: tripData.tags || [],
        insights: tripData.insights || '',
        media: tripData.media || [],
        gpxFile: tripData.gpxFile || null,
        stages: tripData.stages?.map((stage: Record<string, unknown>) => ({
          id: (stage.id as string) || undefined, // Assicurati che l'ID sia incluso
          orderIndex: (stage.orderIndex as number) || 0,
          title: (stage.title as string) || '',
          description: (stage.description as string) || '',
          routeType: (stage.routeType as string) || 'road',
          media: (stage.media as unknown[]) || [],
          gpxFile: stage.gpxFile || null,
        })) || []
      }
      
      setData(formData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [tripId, enabled])

  return {
    data,
    isLoading,
    error,
    fetchTrip,
    refetch: fetchTrip
  }
}