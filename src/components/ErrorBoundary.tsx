// src/components/ErrorBoundary.tsx
'use client'

import React from 'react'
import { AlertTriangle, MapPin, FileText, Upload, RotateCcw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-medium text-gray-900">Oops! Qualcosa è andato storto</h3>
              <p className="mt-2 text-sm text-gray-500">
                Si è verificato un errore inaspettato. Riprova o contatta il supporto.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Ricarica la pagina
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// ErrorFallback specifici per diversi componenti

export function MapErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="w-full h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-6">
      <MapPin className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Errore nella visualizzazione della mappa</h3>
      <p className="text-sm text-gray-600 text-center mb-4">
        Non è possibile caricare la mappa GPX. Verifica la connessione internet o riprova.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Riprova
        </button>
      )}
    </div>
  )
}

export function FormErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="w-full bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-center">
        <FileText className="w-6 h-6 text-red-600 mr-3" />
        <div>
          <h3 className="text-lg font-medium text-red-800">Errore nel form</h3>
          <p className="text-sm text-red-700 mt-1">
            Si è verificato un errore durante l&apos;elaborazione del form. I tuoi dati potrebbero non essere stati salvati.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Riprova
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function MediaErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div className="flex items-center">
        <Upload className="w-6 h-6 text-yellow-600 mr-3" />
        <div>
          <h3 className="text-lg font-medium text-yellow-800">Errore nell&apos;upload dei file</h3>
          <p className="text-sm text-yellow-700 mt-1">
            Non è possibile caricare i file multimediali. Verifica la dimensione e il formato dei file.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center px-3 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Riprova
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function GenericErrorFallback({ 
  title = "Errore del componente",
  description = "Si è verificato un errore inaspettato in questo componente.",
  onRetry 
}: { 
  title?: string
  description?: string
  onRetry?: () => void 
}) {
  return (
    <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-6">
      <div className="flex items-center">
        <AlertTriangle className="w-6 h-6 text-gray-600 mr-3" />
        <div>
          <h3 className="text-lg font-medium text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Riprova
            </button>
            )}
        </div>
      </div>
    </div>
  )
}
