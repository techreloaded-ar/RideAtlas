import { useState, useCallback, useEffect } from 'react'
import { TripCreationData, RecommendedSeason, Trip } from '@/types/trip'

interface UseTripFormProps {
  initialData?: Partial<TripCreationData & Pick<Trip, 'id'>>
  onSuccess?: (trip: unknown) => void
  mode?: 'create' | 'edit'
  tripId?: string
}

interface FormErrors {
  [key: string]: string[] | undefined
}

export const useTripForm = ({ 
  initialData = {}, 
  onSuccess, 
  mode = 'create',
  tripId 
}: UseTripFormProps) => {
  const [formData, setFormData] = useState<TripCreationData>({
    title: '',
    summary: '',
    destination: '',
    duration_days: 1,
    duration_nights: 1,
    tags: [],
    theme: '',
    characteristics: [],
    recommended_season: RecommendedSeason.Tutte,
    ...initialData,
  })

  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FormErrors | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Update form data when initialData changes (useful for edit mode)
  // Only update once when data is first loaded
  useEffect(() => {
    if (initialData && initialData.id && !isInitialized) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
      }))
      setIsInitialized(true)
    }
  }, [initialData?.id, initialData, isInitialized])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration_days' || name === 'duration_nights' ? 
        Math.max(1, parseInt(value, 10) || 1) : value,
    }))
  }, [])

  const handleTagInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value)
  }, [])

  const addTag = useCallback(() => {
    if (tagInput.trim() !== '' && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }))
      setTagInput('')
    }
  }, [tagInput, formData.tags])

  const removeTag = useCallback((tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }))
  }, [])

  const handleCharacteristicChange = useCallback((characteristic: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      characteristics: checked
        ? [...prev.characteristics, characteristic]
        : prev.characteristics.filter(c => c !== characteristic)
    }))
  }, [])

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      summary: '',
      destination: '',
      duration_days: 1,
      duration_nights: 1,
      tags: [],
      theme: '',
      characteristics: [],
      recommended_season: RecommendedSeason.Tutte,
      ...initialData,
    })
    setTagInput('')
    setError(null)
    setFieldErrors(null)
  }, [initialData])

  const submitForm = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setFieldErrors(null)

    // Validazione base
    if (formData.tags.length === 0) {
      setError('Devi aggiungere almeno un tag.')
      setIsLoading(false)
      return
    }

    try {
      const url = mode === 'create' ? '/api/trips' : `/api/trips/${tripId}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || `Errore durante ${mode === 'create' ? 'la creazione' : 'l\'aggiornamento'} del viaggio.`)
        if (result.details && typeof result.details === 'object') {
          setFieldErrors(result.details)
        }
        return false
      }

      onSuccess?.(result.trip || result)
      return true
    } catch (err) {
      setError('Si è verificato un errore di rete o il server non è raggiungibile.')
      console.error('Submit error:', err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [formData, mode, tripId, onSuccess])

  return {
    formData,
    setFormData,
    tagInput,
    error,
    fieldErrors,
    isLoading,
    handleChange,
    handleTagInputChange,
    addTag,
    removeTag,
    handleCharacteristicChange,
    resetForm,
    submitForm,
    setError,
    setFieldErrors,
  }
}
