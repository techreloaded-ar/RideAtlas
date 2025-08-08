// src/components/maps/MapWithFullscreen.tsx
'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { GPXPoint, GPXWaypoint, GPXRoute } from '@/types/gpx'
import FullscreenMapModal from './FullscreenMapModal'

// Import dinamico per evitare problemi SSR
const GPXMapViewer = dynamic(() => import('@/components/maps/GPXMapViewer'), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full bg-gray-100 flex items-center justify-center rounded-lg">
      <div className="text-gray-500">Caricamento mappa...</div>
    </div>
  )
})

interface MapWithFullscreenProps {
  tracks?: GPXRoute[] // Support for multiple tracks
  routes?: GPXRoute[]
  waypoints?: GPXWaypoint[]
  title?: string
  className?: string
  height?: string
  showInfoFooter?: boolean
  showControls?: boolean
  enableDownload?: boolean
  onDownload?: () => void
  showLayerControls?: boolean
  defaultShowTrack?: boolean
  defaultShowRoutes?: boolean
  defaultShowWaypoints?: boolean
  // Legacy support
  gpxData?: GPXPoint[]
}

/**
 * Componente che wrappa GPXMapViewer aggiungendo la funzionalità fullscreen
 * con il nuovo modal in stile Booking.com
 */
export default function MapWithFullscreen({
  tracks = [],
  routes = [],
  waypoints = [],
  title,
  className = '',
  height = 'h-96',
  showControls = false,
  enableDownload = false,
  onDownload,
  showLayerControls = true,
  defaultShowTrack = true,
  defaultShowRoutes = true,
  defaultShowWaypoints = true,
  // Legacy support
  gpxData = []
}: MapWithFullscreenProps) {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)

  const openFullscreen = () => {
    setIsFullscreenOpen(true)
  }

  const closeFullscreen = () => {
    setIsFullscreenOpen(false)
  }

  return (
    <>
      {/* Mappa normale */}
      <GPXMapViewer
        tracks={tracks}
        routes={routes}
        waypoints={waypoints}
        title={title}
        className={className}
        height={height}
        showControls={showControls}
        enableFullscreen={true}
        enableDownload={enableDownload}
        onDownload={onDownload}
        onFullscreenClick={openFullscreen}
        autoFit={true}
        showLayerControls={showLayerControls}
        defaultShowTracks={defaultShowTrack}
        defaultShowRoutes={defaultShowRoutes}
        defaultShowWaypoints={defaultShowWaypoints}
        // Legacy support
        gpxData={gpxData}
      />

      {/* Modal fullscreen */}
      <FullscreenMapModal
        isOpen={isFullscreenOpen}
        onClose={closeFullscreen}
        tracks={tracks}
        routes={routes}
        waypoints={waypoints}
        // Legacy support
        gpxData={gpxData}
      />
    </>
  )
}
