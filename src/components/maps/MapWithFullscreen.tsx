// src/components/maps/MapWithFullscreen.tsx
'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { GPXPoint, GPXWaypoint, GPXRoute } from '@/types/gpx'
import FullscreenMapModal from './FullscreenMapModal'

// Import dinamico per evitare problemi SSR
const UnifiedGPXMapViewer = dynamic(() => import('../UnifiedGPXMapViewer'), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full bg-gray-100 flex items-center justify-center rounded-lg">
      <div className="text-gray-500">Caricamento mappa...</div>
    </div>
  )
})

interface MapWithFullscreenProps {
  gpxData: GPXPoint[]
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
}

/**
 * Componente che wrappa UnifiedGPXMapViewer aggiungendo la funzionalità fullscreen
 * con il nuovo modal in stile Booking.com
 */
export default function MapWithFullscreen({
  gpxData,
  routes = [],
  waypoints = [],
  title,
  className = '',
  height = 'h-96',
  showInfoFooter = true,
  showControls = false,
  enableDownload = false,
  onDownload,
  showLayerControls = true,
  defaultShowTrack = true,
  defaultShowRoutes = true,
  defaultShowWaypoints = true
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
      <UnifiedGPXMapViewer
        gpxData={gpxData}
        routes={routes}
        waypoints={waypoints}
        title={title}
        className={className}
        height={height}
        showInfoFooter={showInfoFooter}
        showControls={showControls}
        enableFullscreen={true}
        enableDownload={enableDownload}
        onDownload={onDownload}
        onFullscreenClick={openFullscreen}
        autoFit={true}
        showLayerControls={showLayerControls}
        defaultShowTrack={defaultShowTrack}
        defaultShowRoutes={defaultShowRoutes}
        defaultShowWaypoints={defaultShowWaypoints}
      />

      {/* Modal fullscreen */}
      <FullscreenMapModal
        isOpen={isFullscreenOpen}
        onClose={closeFullscreen}
        gpxData={gpxData}
        routes={routes}
        waypoints={waypoints}
        tripName={title}
        onDownloadGpx={onDownload}
      />
    </>
  )
}
