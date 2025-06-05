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
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-lg shadow-xl transition-all max-w-4xl w-full max-h-[80vh] h-[600px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con controlli */}
          <div className="flex flex-row items-center justify-between p-4 pb-2 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Mappa del tracciato - {tripName}
            </h2>
            
            <div className="flex items-center gap-2">
              {/* Pulsante Chiudi */}
              <button
                onClick={onClose}
                className="flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Contenuto mappa */}
          <div className="flex-1 p-4 h-full">
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
            />
          </div>
        </div>
      </div>
    </div>
  )
}
