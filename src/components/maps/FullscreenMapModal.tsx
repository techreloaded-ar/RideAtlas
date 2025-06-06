// src/components/maps/FullscreenMapModal.tsx
'use client'

import { useEffect, useState } from 'react'
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
            isFullscreenMode={true}
            onFullscreenClose={onClose}
          />
        </div>
        
        {/* Footer informazioni con design ultra-premium */}
        {gpxData.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent backdrop-blur-2xl border-t border-white/20">
            <div className="px-8 py-8">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/95">
                <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-500/20 to-blue-600/20 px-5 py-3 rounded-2xl border border-blue-400/30 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="w-4 h-1 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full shadow-lg animate-pulse"></div>
                  <span><span className="font-bold text-white">Tracce GPS:</span> <span className="text-blue-300 font-semibold">1</span></span>
                </div>
                
                {waypoints.length > 0 && (
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-orange-500/20 to-amber-500/20 px-5 py-3 rounded-2xl border border-orange-400/30 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full shadow-lg animate-pulse"></div>
                    <span><span className="font-bold text-white">Waypoints:</span> <span className="text-orange-300 font-semibold">{waypoints.length}</span></span>
                  </div>
                )}
                
                {routes.length > 0 && (
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 px-5 py-3 rounded-2xl border border-red-400/30 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <div className="w-4 h-1 bg-gradient-to-r from-red-400 to-pink-500 rounded-full shadow-lg animate-pulse"></div>
                    <span><span className="font-bold text-white">Percorsi:</span> <span className="text-red-300 font-semibold">{routes.length}</span></span>
                  </div>
                )}
              </div>
              
              {/* Indicatore di modalità fullscreen migliorato */}
              <div className="flex justify-center mt-6">
                <div className="flex items-center space-x-3 bg-white/10 px-4 py-2 rounded-full border border-white/20 backdrop-blur-md">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                  <span className="text-white/80 text-xs font-medium">Modalità Fullscreen Attiva</span>
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" style={{animationDelay: '0.8s'}}></div>
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
