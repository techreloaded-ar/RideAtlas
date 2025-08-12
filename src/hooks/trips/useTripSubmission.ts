// src/hooks/useTripSubmission.ts
import { useState, useCallback } from 'react'
import { UseFormSetError } from 'react-hook-form'
import type { TripWithStagesData } from '@/schemas/trip'
import {
  transformTripDataForSubmission,
  buildApiUrl,
  getHttpMethod,
  parseServerErrors,
  createFieldErrorSetter,
  submitTripToApi,
  transformApiDataToFormData,
  fetchTripFromApi
} from '@/lib/trips/trip-submission'

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
      // Use pure functions for business logic
      const url = buildApiUrl({ mode, tripId })
      const method = getHttpMethod(mode)
      const submitData = transformTripDataForSubmission(data)
      
      console.log('Frontend - Dati inviati al server:', submitData);

      const apiResult = await submitTripToApi(url, method, submitData)

      if (!apiResult.success) {
        // Parse server errors and apply to form
        const parsedErrors = parseServerErrors(apiResult.result, mode)
        
        if (Object.keys(parsedErrors.fieldErrors).length > 0) {
          // Set field-specific errors using pure function
          const setFieldErrors = createFieldErrorSetter(setError)
          setFieldErrors(parsedErrors.fieldErrors)
        } else if (parsedErrors.generalError) {
          // Set general error
          setError('root.serverError', {
            type: 'server',
            message: parsedErrors.generalError
          })
        }
        
        return false
      }

      // Success - call callback
      onSuccess?.(apiResult.result.trip || apiResult.result)
      return true

    } catch (err) {
      console.error('Submit error:', err)
      
      // Network error
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

// Hook for loading existing trip data (for edit mode)
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
      const result = await fetchTripFromApi(tripId)
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      // Convert API data to form format using pure function
      const formData = transformApiDataToFormData(result.data!)
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