// src/components/maps/SimpleMapViewer.tsx
'use client'

import dynamic from 'next/dynamic'
import { GPXPoint, GPXWaypoint, GPXRoute } from '@/types/gpx'
import { MapPin, Route } from 'lucide-react'

// Import dinamico per evitare problemi SSR
const UnifiedGPXMapViewer = dynamic(() => import('../UnifiedGPXMapViewer'), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full bg-gray-100 flex items-center justify-center rounded-lg">
      <div className="text-gray-500">Caricamento mappa...</div>
    </div>
  )
})

interface SimpleMapViewerProps {
  gpxData: GPXPoint[]
  routes?: GPXRoute[]
  waypoints?: GPXWaypoint[]
  title?: string
  className?: string
  height?: string
  showInfoFooter?: boolean
}

/**
 * Componente semplificato per visualizzazione inline delle mappe GPX
 * Ideale per pagine di visualizzazione viaggi
 */
export default function SimpleMapViewer({
  gpxData,
  routes = [],
  waypoints = [],
  title,
  className = '',
  height = 'h-96',
  showInfoFooter = true
}: SimpleMapViewerProps) {
  
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
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center text-gray-900">
            <Route className="w-5 h-5 mr-2 text-blue-600" />
            {title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Visualizzazione interattiva del tracciato GPS con waypoints e rotte
          </p>
        </div>
      )}
      
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <UnifiedGPXMapViewer
          gpxData={gpxData}
          routes={routes}
          waypoints={waypoints}
          height={height}
          showInfoFooter={showInfoFooter}
          autoFit={true}
        />
      </div>
    </div>
  )
}
