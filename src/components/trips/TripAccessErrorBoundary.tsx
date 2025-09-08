/**
 * Error Boundary for Trip Access Control
 * 
 * Catches and handles errors that occur during trip access control
 * and provides a fallback UI.
 */

'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class TripAccessErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error for monitoring
    console.error('TripAccessErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendErrorToService(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="max-w-4xl mx-auto p-6 bg-white">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-red-100 rounded-full p-4">
                <AlertTriangle className="w-12 h-12 text-red-600" />
              </div>
            </div>

            <h1 className="text-2xl font-semibold text-red-900 mb-4">
              Errore di accesso
            </h1>

            <p className="text-red-800 mb-2 text-lg">
              Si è verificato un problema
            </p>
            <p className="text-red-700 text-sm mb-8 max-w-md mx-auto">
              Non è stato possibile verificare i permessi di accesso a questo viaggio. 
              Riprova o torna alla pagina principale.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center px-6 py-3 border border-red-300 text-red-700 bg-white rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Riprova
              </button>
              
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Vai alla home
              </Link>
            </div>
          </div>

          {/* Error details in development */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-8 bg-gray-100 rounded-lg p-6 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                🔧 Dettagli errore (solo in sviluppo)
              </h3>
              <div className="text-xs text-gray-600 space-y-2">
                <p><strong>Errore:</strong> {this.state.error.message}</p>
                <p><strong>Stack:</strong></p>
                <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
                {this.state.errorInfo && (
                  <>
                    <p><strong>Component Stack:</strong></p>
                    <pre className="whitespace-pre-wrap bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}