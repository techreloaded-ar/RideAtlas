// src/components/maps/AutoLoadMapViewer.tsx
'use client'

import { useEffect, useState } from 'react'
import { useGPXMap } from '@/hooks/useGPXMap'
import { AlertCircle } from 'lucide-react'
import SimpleMapViewer from './SimpleMapViewer'

interface AutoLoadMapViewerProps {
  gpxUrl: string
  tripTitle?: string
  className?: string
  height?: string
  showInfoFooter?: boolean
  onDataLoaded?: () => void
  onError?: (error: string) => void
}

/**
 * Componente che carica automaticamente i dati GPX da URL
 * e li visualizza in una mappa semplice
 */
export default function AutoLoadMapViewer({
  gpxUrl,
  tripTitle,
  className = '',
  height = 'h-96',
  showInfoFooter = true,
  onDataLoaded,
  onError
}: AutoLoadMapViewerProps) {
  const [loadAttempted, setLoadAttempted] = useState(false)
  
  const { 
    tracks, // Use tracks for multiple track support
    routes, 
    waypoints, 
    isLoading, 
    error, 
    loadGPXFromUrl,
    retry 
  } = useGPXMap({
    onDataLoaded: () => {
      onDataLoaded?.()
    },
    onError: (err) => {
      onError?.(err)
    }
  })

  useEffect(() => {
    if (gpxUrl && !loadAttempted) {
      setLoadAttempted(true)
      loadGPXFromUrl(gpxUrl).catch(err => {
        console.error('Errore nel caricamento automatico GPX:', err)
      })
    }
  }, [gpxUrl, loadAttempted, loadGPXFromUrl])

  if (isLoading) {
    return (
      <div className={`${className} p-6 bg-gray-50 rounded-lg`}>
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Caricamento mappa del percorso...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className} p-6 bg-red-50 rounded-lg border border-red-200`}>
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Errore nel caricamento della mappa
            </h3>
            <p className="text-sm text-red-700 mt-1">
              {error}
            </p>
            <button
              onClick={retry}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Riprova
            </button>
          </div>
        </div>
      </div>
    )
  }

  const title = tripTitle 
    ? `Mappa del Percorso - ${tripTitle}` 
    : 'Mappa del Percorso'

  return (
    <SimpleMapViewer
      tracks={tracks} // Use tracks instead of gpxData for multiple track support
      routes={routes}
      waypoints={waypoints}
      title={title}
      className={className}
      height={height}
      showInfoFooter={showInfoFooter}
    />
  )
}
