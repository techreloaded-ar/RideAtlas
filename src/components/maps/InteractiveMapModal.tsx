// src/components/maps/InteractiveMapModal.tsx
'use client'

import { useEffect } from 'react'
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

interface InteractiveMapModalProps {
  isOpen: boolean
  onClose: () => void
  gpxData: GPXPoint[]
  routes?: GPXRoute[]
  waypoints?: GPXWaypoint[]
  tripName?: string
  onDownloadGpx?: () => void
}

/**
 * Modal interattivo per visualizzazione mappe con controlli avanzati
 * Ideale per form di modifica e creazione viaggi
 */
export default function InteractiveMapModal({
  isOpen,
  onClose,
  gpxData,
  routes = [],
  waypoints = [],
  tripName = 'Viaggio',
  onDownloadGpx
}: InteractiveMapModalProps) {
  
  // Reset fullscreen quando il modal si chiude
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop con gradiente elegante */}
      <div 
        className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal con design ultra-premium */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-3xl shadow-2xl transition-all max-w-5xl w-full max-h-[85vh] h-[700px] border border-gray-100 overflow-hidden backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
          }}
        >
          {/* Header ultra-moderno con controlli eleganti */}
          <div className="flex flex-row items-center justify-between p-6 pb-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 left-1/4 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-purple-500 rounded-full blur-3xl"></div>
            </div>
            
            <div className="flex items-center space-x-4 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent">
                  Mappa Interattiva
                </h2>
                <p className="text-sm text-gray-600 font-medium flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span>{tripName}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
              {/* Pulsante Chiudi ultra-moderno */}
              <button
                onClick={onClose}
                className="group flex items-center justify-center w-12 h-12 text-gray-500 hover:text-gray-700 bg-white hover:bg-gradient-to-br hover:from-gray-50 hover:to-white border border-gray-200 hover:border-gray-300 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:scale-110 hover:rotate-6 active:scale-95"
                aria-label="Chiudi mappa"
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                
                {/* Tooltip elegante */}
                <span className="absolute -top-12 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-xl">
                  Chiudi (ESC)
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                </span>
              </button>
            </div>
          </div>
          
          {/* Contenuto mappa con design raffinato */}
          <div className="flex-1 p-6 h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
            <div className="h-full bg-white rounded-2xl shadow-inner border border-gray-100 overflow-hidden relative">
              {/* Decorative corner accents */}
              <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-br-2xl"></div>
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-indigo-500/10 to-transparent rounded-tl-2xl"></div>
              
              <UnifiedGPXMapViewer 
                gpxData={gpxData}
                routes={routes}
                waypoints={waypoints}
                height="h-full"
                showControls={true}
                enableFullscreen={true}
                enableDownload={!!onDownloadGpx}
                onDownload={onDownloadGpx}
                autoFit={true}
                className="rounded-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
