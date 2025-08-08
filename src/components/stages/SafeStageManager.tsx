// src/components/SafeStageManager.tsx
"use client";

import { useState } from 'react'
import { ErrorBoundary, GenericErrorFallback } from '@/components/ui/ErrorBoundary'
import { StageManager } from '@/components/stages/StageManager'
import { FieldError } from 'react-hook-form'
import { type StageCreationData } from '@/schemas/trip'

interface SafeStageManagerProps {
  stages: StageCreationData[]
  onChange: (stages: StageCreationData[]) => void
  errors?: FieldError | { message?: string }
  isLoading: boolean
}

export default function SafeStageManager(props: SafeStageManagerProps) {
  const [retryKey, setRetryKey] = useState(0)

  const handleRetry = () => {
    setRetryKey(prev => prev + 1)
  }

  return (
    <ErrorBoundary
      key={retryKey}
      fallback={
        <GenericErrorFallback 
          title="Errore nella gestione delle tappe"
          description="Si è verificato un errore durante la gestione delle tappe del viaggio."
          onRetry={handleRetry}
        />
      }
    >
      <StageManager {...props} />
    </ErrorBoundary>
  )
}