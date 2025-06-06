// src/components/maps/FullscreenMapModal.tsx
'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import dynamic from 'next/dynamic'
import { GPXPoint, GPXWaypoint, GPXRoute } from '@/types/gpx'

const UnifiedGPXMapViewer = dynamic(() => import('../UnifiedGPXMapViewer'), {
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
  gpxData: GPXPoint[]
  routes?: GPXRoute[]
  waypoints?: GPXWaypoint[]
}

/**
 * Modal fullscreen per visualizzazione mappa in stile Booking.com
 * Copre tutto lo schermo con animazioni fluide
 */
export default function FullscreenMapModal({
  isOpen,
  onClose,
  gpxData,
  routes = [],
  waypoints = []
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
        
        {/* Pulsante Chiudi sovrapposto alla mappa */}
        <button
          type="button"
          onClick={onClose}
          className="fixed top-4 right-4 z-[10000] inline-flex items-center p-3 text-white bg-black/70 hover:bg-black/90 rounded-full shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/50 backdrop-blur-sm"
          aria-label="Chiudi mappa"
        >
          <X className="w-6 h-6" />
        </button>
        
        {/* Contenuto mappa fullscreen */}
        <div className="flex-1 bg-white">
          <UnifiedGPXMapViewer 
            gpxData={gpxData}
            routes={routes}
            waypoints={waypoints}
            height="h-full"
            showControls={false}
            showInfoFooter={false}
            enableFullscreen={false}
            enableDownload={false}
            autoFit={true}
            className="rounded-none"
            showLayerControls={true}
            defaultShowTracks={true}
            defaultShowRoutes={true}
            defaultShowWaypoints={true}
          />
        </div>
        
        {/* Footer informazioni con design elegante */}
        {gpxData.length > 0 && (
          <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200/50 px-6 py-3">
            <div className="flex flex-wrap items-center justify-center text-sm text-gray-600 gap-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-0.5 bg-blue-500 rounded"></div>
                <span><span className="font-medium">Tracce:</span> 1</span>
              </div>
              
              {waypoints.length > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span><span className="font-medium">Waypoints:</span> {waypoints.length}</span>
                </div>
              )}
              
              {routes.length > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-0.5 bg-red-600 rounded border-dashed border border-red-300"></div>
                  <span><span className="font-medium">Percorsi Consigliati:</span> {routes.length}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
