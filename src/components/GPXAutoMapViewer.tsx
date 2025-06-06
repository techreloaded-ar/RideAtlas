'use client'

import { useEffect, useState } from 'react'
import { useGPXMap } from '@/hooks/useGPXMap'
import dynamic from 'next/dynamic'
import { MapPin, Route, AlertCircle } from 'lucide-react'

// Import dinamico del nuovo MapWithFullscreen per evitare problemi SSR
const MapWithFullscreen = dynamic(() => import('./maps/MapWithFullscreen'), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full bg-gray-100 flex items-center justify-center rounded-lg">
      <div className="text-gray-500">Caricamento mappa...</div>
    </div>
  )
})

interface GPXAutoMapViewerProps {
  gpxUrl: string
  tripTitle: string
  className?: string
}

/**
 * Componente per la visualizzazione automatica della mappa GPX
 * utilizzato nelle pagine di visualizzazione dei viaggi
 */
export default function GPXAutoMapViewer({ 
  gpxUrl, 
  className = '' 
}: GPXAutoMapViewerProps) {
  const { gpxData, tracks, routes, waypoints, isLoading, error, loadGPXFromUrl } = useGPXMap()
  const [loadAttempted, setLoadAttempted] = useState(false)

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
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Errore nel caricamento della mappa
            </h3>
            <p className="text-sm text-red-700 mt-1">
              {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!gpxData || gpxData.length === 0) {
    return (
      <div className={`${className} p-6 bg-gray-50 rounded-lg border border-gray-200`}>
        <div className="flex items-center space-x-3">
          <MapPin className="w-6 h-6 text-gray-400 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-gray-700">
              Mappa non disponibile
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Il file GPX non contiene dati di tracciato validi.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center text-gray-900">
          <Route className="w-5 h-5 mr-2 text-blue-600" />
          Mappa del Percorso
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Visualizzazione interattiva del tracciato GPS con waypoints e rotte
        </p>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <MapWithFullscreen
          tracks={tracks}
          routes={routes}
          waypoints={waypoints}
          height="h-96"
          showInfoFooter={true}
          // Legacy support
          gpxData={gpxData}
        />
      </div>
    </div>
  )
}