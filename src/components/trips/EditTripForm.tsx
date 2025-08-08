// src/components/EditTripForm.tsx
"use client";

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tripWithStagesSchema, type TripWithStagesData } from '@/schemas/trip'
import { useTripSubmission, useTripData } from '@/hooks/useTripSubmission'
import { useToast } from '@/hooks/useToast'
import SafeTripForm from '@/components/trips/SafeTripForm'

interface EditTripFormProps {
  tripId: string
}

const EditTripForm = ({ tripId }: EditTripFormProps) => {
  const router = useRouter()
  const { showSuccess, showError } = useToast()
  
  // Carica i dati esistenti del trip
  const { 
    data: tripData, 
    isLoading: loadingTrip, 
    error: tripError,
    fetchTrip 
  } = useTripData({ tripId, enabled: true })

  // Setup del form con React Hook Form + Zod
  const form = useForm<TripWithStagesData>({
    resolver: zodResolver(tripWithStagesSchema),
    defaultValues: {
      title: '',
      summary: '',
      destination: '',
      theme: '',
      characteristics: [],
      recommended_seasons: [],
      tags: [],
      insights: '',
      media: [],
      gpxFile: null,
      stages: [{
        orderIndex: 0,
        title: 'Tappa 1',
        description: '',
        routeType: '',
        media: [],
        gpxFile: null
      }]
    },
    mode: 'onChange' // Per validazione in tempo reale
  })

  const { setError, reset } = form

  // Hook per il submission
  const { submit, isLoading: submitting } = useTripSubmission({
    mode: 'edit',
    tripId,
    onSuccess: (trip: unknown) => {
      showSuccess('Viaggio aggiornato con successo!')
      
      // Redirect alla pagina del trip usando lo slug
      if (trip && typeof trip === 'object' && 'slug' in trip && trip.slug) {
        router.push(`/trips/${trip.slug}`)
      } else if (tripData && 'slug' in tripData && (tripData as Record<string, unknown>).slug) {
        router.push(`/trips/${(tripData as Record<string, unknown>).slug}`)
      } else {
        console.error('Slug non trovato per il reindirizzamento')
        router.push('/dashboard')
      }
    },
    setError
  })

  // Carica i dati del trip al mount
  useEffect(() => {
    fetchTrip()
  }, [fetchTrip])

  // Reset del form quando arrivano i dati
  useEffect(() => {
    if (tripData) {
      reset(tripData)
    }
  }, [tripData, reset])

  // Gestisce errori di caricamento
  useEffect(() => {
    if (tripError) {
      if (tripError.includes('permessi')) {
        showError(tripError)
        router.push('/dashboard')
        return
      }
      if (tripError.includes('non trovato')) {
        showError(tripError)
        router.push('/dashboard')
        return
      }
      // Altri errori vengono mostrati in UI
    }
  }, [tripError, showError, router])

  // Loading state
  if (loadingTrip) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Caricamento viaggio...</span>
          </div>
        </div>
      </div>
    )
  }

  // Error state per errori non-redirect
  if (tripError && !tripError.includes('permessi') && !tripError.includes('non trovato')) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">Errore nel caricamento</div>
            <div className="text-sm text-gray-500 mb-4">{tripError}</div>
            <button
              onClick={() => fetchTrip()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 mr-2"
            >
              Riprova
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Torna alla Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Form principale
  return (
    <SafeTripForm
      form={form}
      onSubmit={submit}
      isLoading={submitting}
      mode="edit"
      title="Modifica Viaggio"
      submitButtonText="Salva Modifiche"
      onCancel={() => {
        if (tripData && 'slug' in tripData && (tripData as Record<string, unknown>).slug) {
          router.push(`/trips/${(tripData as Record<string, unknown>).slug}`)
        } else {
          router.push('/dashboard')
        }
      }}
    />
  )
}

export default EditTripForm