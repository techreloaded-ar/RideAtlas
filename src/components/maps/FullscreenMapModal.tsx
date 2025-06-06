// src/components/maps/FullscreenMapModal.tsx
'use client'

import { useEffect, useState } from 'react'
import { X, Maximize2 } from 'lucide-react'
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
  tripName?: string
  onDownloadGpx?: () => void
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
  waypoints = [],
  tripName = 'Viaggio',
  onDownloadGpx
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
        
        {/* Header sticky con controlli */}
        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Maximize2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Mappa del tracciato
              </h2>
              <p className="text-sm text-gray-600">{tripName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Pulsante Download se disponibile */}
            {onDownloadGpx && (
              <button
                type="button"
                onClick={onDownloadGpx}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Scarica GPX
              </button>
            )}
            
            {/* Pulsante Chiudi */}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="Chiudi mappa"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
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
          />
        </div>
        
        {/* Footer informazioni con design elegante */}
        {gpxData.length > 0 && (
          <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200/50 px-6 py-3">
            <div className="flex flex-wrap items-center justify-center text-sm text-gray-600 gap-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-0.5 bg-blue-500 rounded"></div>
                <span><span className="font-medium">Punti tracciato:</span> {gpxData.length.toLocaleString()}</span>
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
                  <span><span className="font-medium">Rotte:</span> {routes.length}</span>
                </div>
              )}
              
              <div className="text-gray-500 text-xs">
                📍 Traccia GPS • 🗺️ Rotte pianificate • 📍 Waypoints
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
