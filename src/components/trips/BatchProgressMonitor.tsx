// src/components/trips/BatchProgressMonitor.tsx
"use client"

import { useState, useEffect, useCallback } from 'react'
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'
import { BatchProcessingResult } from '@/schemas/batch-trip'
import { BatchErrorDisplay } from './BatchErrorDisplay'

interface BatchProgressMonitorProps {
  jobId: string
  onComplete: (result: BatchProcessingResult) => void
  onError: (error: string) => void
}

interface EnhancedBatchResult extends BatchProcessingResult {
  progress: {
    percentage: number
    completed: number
    total: number
    remaining: number
  }
  hasErrors: boolean
  isComplete: boolean
  duration: number
}


export const BatchProgressMonitor = ({ jobId, onComplete, onError }: BatchProgressMonitorProps) => {
  const [result, setResult] = useState<EnhancedBatchResult | null>(null)
  const [isPolling, setIsPolling] = useState(true)

  const pollStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/trips/batch/status/${jobId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle specific cases
        if (response.status === 404 || errorData.error?.includes('non trovato')) {
          // Job not found - this can happen if server was restarted
          const expiredResult: EnhancedBatchResult = {
            jobId,
            status: 'failed',
            totalTrips: 0,
            processedTrips: 0,
            createdTripIds: [],
            errors: [{ message: 'Job scaduto o server riavviato. Riprovare l\'upload.' }],
            startedAt: new Date(),
            progress: { percentage: 0, completed: 0, total: 0, remaining: 0 },
            hasErrors: true,
            isComplete: true,
            duration: 0
          }
          setResult(expiredResult)
          setIsPolling(false)
          onComplete(expiredResult)
          return
        }
        
        throw new Error(errorData.error || 'Errore nel recupero dello status')
      }
      
      const data = await response.json() as EnhancedBatchResult
      setResult(data)
      
      // Stop polling if job is complete
      if (data.isComplete) {
        setIsPolling(false)
        onComplete(data)
      }
      
      
    } catch (error) {
      console.error('Error polling batch status:', error)
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
      onError(errorMessage)
      setIsPolling(false)
    }
  }, [jobId, onComplete, onError])

  // Polling effect
  useEffect(() => {
    if (!isPolling) return

    // Initial poll
    pollStatus()
    
    // Set up interval for subsequent polls
    const interval = setInterval(pollStatus, 2000) // Poll every 2 seconds
    
    // Stop polling after 5 minutes (150 polls) as safety measure
    const timeout = setTimeout(() => {
      setIsPolling(false)
      onError('Timeout: il processamento sta richiedendo troppo tempo')
    }, 5 * 60 * 1000)
    
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [isPolling, pollStatus, onError])

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }
  

  const getStatusIcon = () => {
    if (!result) return <ClockIcon className="h-5 w-5 text-gray-400 animate-spin" />
    
    switch (result.status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusText = () => {
    if (!result) return 'Connessione in corso...'
    
    switch (result.status) {
      case 'pending':
        return 'In attesa di iniziare il processamento'
      case 'processing':
        return 'Processamento in corso'
      case 'completed':
        return result.hasErrors ? 'Completato con errori' : 'Completato con successo'
      case 'failed':
        return 'Processamento fallito'
      default:
        return 'Status sconosciuto'
    }
  }

  const getStatusColor = () => {
    if (!result) return 'text-gray-600'
    
    switch (result.status) {
      case 'pending':
        return 'text-yellow-600'
      case 'processing':
        return 'text-blue-600'
      case 'completed':
        return result.hasErrors ? 'text-yellow-600' : 'text-green-600'
      case 'failed':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (!result) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <ClockIcon className="h-5 w-5 text-gray-400 animate-spin" />
          <span className="text-gray-600">Connessione al server...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className={`text-lg font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </h3>
            <p className="text-sm text-gray-500">
              Job ID: {jobId}
            </p>
          </div>
        </div>
        
        <div className="text-right text-sm text-gray-500">
          <p>Durata: {formatDuration(result.duration)}</p>
          {result.completedAt && (
            <p>Completato: {result.completedAt.toLocaleTimeString()}</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progresso</span>
          <span className="text-gray-900 font-medium">
            {result.progress.completed} di {result.progress.total} viaggi
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              result.status === 'completed' && !result.hasErrors
                ? 'bg-green-500'
                : result.status === 'failed' || result.hasErrors
                ? 'bg-red-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${result.progress.percentage}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>{result.progress.percentage}% completato</span>
          {result.progress.remaining > 0 && (
            <span>{result.progress.remaining} rimanenti</span>
          )}
        </div>
      </div>

      {/* Created trips */}
      {result.createdTripIds.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">
            Viaggi creati ({result.createdTripIds.length})
          </h4>
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="text-sm text-green-800 space-y-1">
              {result.createdTripIds.map((tripId, index) => (
                <div key={tripId} className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span>Viaggio {index + 1}: {tripId}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Errors */}
      <BatchErrorDisplay 
        errors={result.errors}
        title="Errori da Risolvere"
        showHelpLinks={true}
      />

      {/* Action buttons */}
      {result.isComplete && (
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => window.location.href = '/dashboard/trips'}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
          >
            Vai ai tuoi viaggi
          </button>
        </div>
      )}

      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer">Debug info</summary>
          <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}