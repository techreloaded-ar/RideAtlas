// src/components/SafeTripForm.tsx
"use client";

import { useState } from 'react'
import { ErrorBoundary, FormErrorFallback } from '@/components/ui/ErrorBoundary'
import { TripForm } from '@/components/trips/TripForm'
import { UseFormReturn } from 'react-hook-form'
import { type TripWithStagesData } from '@/schemas/trip'

interface SafeTripFormProps {
  form: UseFormReturn<TripWithStagesData>
  onSubmit: (data: TripWithStagesData) => Promise<boolean>
  isLoading: boolean
  mode: 'create' | 'edit'
  title: string
  submitButtonText: string
  onCancel: () => void
}

export default function SafeTripForm(props: SafeTripFormProps) {
  const [retryKey, setRetryKey] = useState(0)

  const handleRetry = () => {
    setRetryKey(prev => prev + 1)
    // Reset del form in caso di errore
    props.form.reset()
  }

  return (
    <ErrorBoundary
      key={retryKey}
      fallback={<FormErrorFallback onRetry={handleRetry} />}
    >
      <TripForm {...props} />
    </ErrorBoundary>
  )
}