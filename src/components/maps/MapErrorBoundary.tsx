/**
 * Error Boundary specifico per componenti mappa
 * Gestisce errori di inizializzazione e rendering delle mappe
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary per gestire errori nei componenti mappa
 * Fornisce fallback UI e logging degli errori
 */
export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Aggiorna lo state per mostrare la UI di fallback
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log dell'errore per debugging
    console.error('MapErrorBoundary caught an error:', error, errorInfo);
    
    // Chiama callback opzionale per gestione errori personalizzata
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Riprova a renderizzare il componente
   */
  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Usa fallback personalizzato se fornito
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback UI di default
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-center p-6">
            <svg 
              className="mx-auto h-12 w-12 text-gray-400 mb-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" 
              />
            </svg>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Errore nel caricamento della mappa
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Si è verificato un problema durante il caricamento della mappa. 
              Questo può essere dovuto a problemi di connessione o di compatibilità del browser.
            </p>
            
            <div className="space-y-2">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Riprova
              </button>
              
              <div className="text-xs text-gray-500">
                {this.state.error && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-gray-400 hover:text-gray-600">
                      Dettagli tecnici
                    </summary>
                    <pre className="mt-2 text-left text-xs bg-gray-100 p-2 rounded overflow-auto max-w-md">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook version dell'Error Boundary per uso con componenti funzionali
 * Nota: Questo è un wrapper che usa la classe Error Boundary
 */
interface MapErrorBoundaryHookProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export const MapErrorBoundaryWrapper: React.FC<MapErrorBoundaryHookProps> = ({
  children,
  fallback,
  onError
}) => {
  return (
    <MapErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </MapErrorBoundary>
  );
};

/**
 * Componente di fallback semplificato per mappe
 */
export const SimpleMapFallback: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <div className="flex items-center justify-center h-48 bg-gray-100 border border-gray-300 rounded-lg">
    <div className="text-center">
      <div className="text-gray-500 mb-2">
        <svg className="mx-auto h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
          <path 
            fillRule="evenodd" 
            d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm2 2a1 1 0 000 2h.01a1 1 0 100-2H5zm3 0a1 1 0 000 2h3a1 1 0 100-2H8z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>
      <p className="text-sm text-gray-600 mb-2">Mappa non disponibile</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Riprova
        </button>
      )}
    </div>
  </div>
);

export default MapErrorBoundary;