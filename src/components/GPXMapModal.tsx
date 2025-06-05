// src/components/GPXMapModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, Download, Maximize2, Minimize2 } from 'lucide-react'
import dynamic from 'next/dynamic'

// Import dinamico direttamente qui
const GPXMapViewer = dynamic(() => import('./GPXMapViewer'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full bg-gray-100 flex items-center justify-center rounded-lg">
      <div className="text-gray-500">Caricamento mappa...</div>
    </div>
  )
})

interface GPXPoint {
  lat: number
  lng: number
  elevation?: number
}

interface GPXWaypoint {
  lat: number
  lng: number
  name?: string
  elevation?: number
}

interface GPXMapModalProps {
  isOpen: boolean
  onClose: () => void
  gpxData: GPXPoint[]
  waypoints?: GPXWaypoint[]
  tripName?: string
  onDownloadGpx?: () => void
}

export default function GPXMapModal({ 
  isOpen, 
  onClose, 
  gpxData, 
  waypoints = [],
  tripName = 'Viaggio',
  onDownloadGpx 
}: GPXMapModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Reset fullscreen quando il modal si chiude
  useEffect(() => {
    if (!isOpen) {
      setIsFullscreen(false)
    }
  }, [isOpen])
  
  // Gestione escape key
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
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className={`
            relative bg-white rounded-lg shadow-xl transition-all
            ${isFullscreen 
              ? 'w-screen h-screen max-w-none max-h-none m-0 rounded-none' 
              : 'max-w-4xl w-full max-h-[80vh] h-[600px]'
            }
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con controlli */}
          <div className="flex flex-row items-center justify-between p-4 pb-2 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Mappa del tracciato - {tripName}
            </h2>
            
            <div className="flex items-center gap-2">
              {/* Pulsante Download */}
              {onDownloadGpx && (
                <button
                  onClick={onDownloadGpx}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Scarica GPX</span>
                </button>
              )}
              
              {/* Pulsante Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {isFullscreen ? 'Riduci' : 'Espandi'}
                </span>
              </button>
              
              {/* Pulsante Chiudi */}
              <button
                onClick={onClose}
                className="flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Contenuto mappa */}            <div className="flex-1 p-4">
            {gpxData.length > 0 ? (
              <GPXMapViewer 
                gpxData={gpxData}
                waypoints={waypoints}
                className="rounded-lg border h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border">
                <div className="text-center text-gray-500">
                  <div className="text-lg font-medium mb-2">Nessun tracciato disponibile</div>
                  <div className="text-sm">Carica un file GPX per visualizzare il percorso</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer con info tracciato */}
          {gpxData.length > 0 && (
            <div className="border-t p-4 bg-gray-50">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Punti tracciato:</span> {gpxData.length.toLocaleString()}
                {waypoints.length > 0 && (
                  <>
                    <span className="mx-3">•</span>
                    <span className="font-medium">Waypoints:</span> {waypoints.length}
                  </>
                )}
                {gpxData.some(p => p.elevation) && (
                  <>
                    <span className="mx-3">•</span>
                    <span className="font-medium">Con dati altimetrici</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
