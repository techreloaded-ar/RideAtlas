// src/components/maps/FullscreenMapModal.tsx
'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { GPXPoint, GPXWaypoint, GPXRoute } from '@/types/gpx'

const GPXMapViewer = dynamic(() => import('@/components/maps/GPXMapViewer'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full bg-gray-100 flex items-center justify-center rounded-lg">
      <div className="text-gray-500">Caricamento mappa...</div>
    </div>
  )
})

interface FullscreenMapModalProps {
  isOpen: boolean
  onClose: () => void
  tracks?: GPXRoute[] // Support for multiple tracks
  routes?: GPXRoute[]
  waypoints?: GPXWaypoint[]
  // Legacy support
  gpxData?: GPXPoint[]
}

/**
 * Modal fullscreen per visualizzazione mappa in stile Booking.com
 * Copre tutto lo schermo con animazioni fluide
 */
export default function FullscreenMapModal({
  isOpen,
  onClose,
  tracks = [],
  routes = [],
  waypoints = [],
  // Legacy support
  gpxData = []
}: FullscreenMapModalProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  // Gestisci animazioni di apertura/chiusura
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      // Disabilita scroll del body quando modal è aperto
      document.body.style.overflow = 'hidden'
    } else {
      // Riabilita scroll del body quando modal è chiuso
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Gestisci tasto ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Gestisci fine animazione di chiusura
  const handleTransitionEnd = () => {
    if (!isOpen) {
      setIsAnimating(false)
    }
  }

  if (!isOpen && !isAnimating) return null

  return (
    <div 
      className={`fixed inset-0 z-[9999] transition-all duration-300 ease-in-out ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* Backdrop con gradiente scuro */}
      <div 
        className={`absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Container principale del modal */}
      <div className={`relative h-full flex flex-col transition-transform duration-300 ease-out ${
        isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        
        {/* Contenuto mappa fullscreen */}
        <div className="flex-1 bg-white">
          <GPXMapViewer 
            tracks={tracks}
            routes={routes}
            waypoints={waypoints}
            height="h-full"
            showControls={false}
            enableFullscreen={false}
            enableDownload={false}
            autoFit={true}
            className="rounded-none"
            showLayerControls={true}
            defaultShowTracks={true}
            defaultShowRoutes={true}
            defaultShowWaypoints={true}
            isFullscreenMode={true}
            onFullscreenClose={onClose}
            // Legacy support
            gpxData={gpxData}
          />
        </div>
      </div>
    </div>
  )
}
