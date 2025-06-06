// src/components/UnifiedGPXMapViewer.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import { Download, Route, MapPin, Maximize2, X } from 'lucide-react'
import { MapViewerProps, GPXTrack } from '@/types/gpx'
import LayerControl from './maps/LayerControl'
import dynamic from 'next/dynamic'

// Componente mappa con import dinamico per evitare problemi SSR
const DynamicMap = dynamic(() => import('./maps/LeafletMapRenderer').then(mod => ({ default: mod.default })), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg">
      <div className="text-gray-500">Caricamento mappa...</div>
    </div>
  )
})

// Componente per auto-fit della mappa
// NOTA: Spostato in LeafletMapRenderer per evitare problemi SSR

// Configurazione icone Leaflet 
// NOTA: Spostato in LeafletMapRenderer per evitare problemi SSR

// Hook per icona waypoint personalizzata
// NOTA: Spostato in LeafletMapRenderer per evitare problemi SSR

// Componente principale unificato
export default function UnifiedGPXMapViewer({
  tracks = [],
  routes = [],
  waypoints = [],
  className = '',
  height = 'h-96',
  showControls = false,
  showInfoFooter = true,
  enableFullscreen = false,
  enableDownload = false,
  autoFit = true,
  defaultCenter = [45.0, 7.0], // Default su Piemonte
  defaultZoom = 10,
  title,
  onDownload,
  onFullscreenClick,
  onFullscreenClose,
  showLayerControls = false,
  defaultShowTracks = true,
  defaultShowRoutes = true,
  defaultShowWaypoints = true,
  isFullscreenMode = false,
  // Legacy support
  gpxData = []
}: MapViewerProps) {
  // Converti i dati legacy in formato tracks con useMemo stabile
  const allTracks: GPXTrack[] = useMemo(() => {
    return tracks.length > 0 
      ? tracks 
      : gpxData.length > 0 
        ? [{ name: 'Traccia principale', points: gpxData, color: '#3b82f6' }] 
        : []
  }, [tracks.length, gpxData.length])
  
  // Calcola gli stati iniziali per evitare useEffect
  const initialVisibleTracks = useMemo(() => 
    allTracks.map(() => defaultShowTracks), 
    [allTracks.length, defaultShowTracks]
  )
  
  const initialVisibleRoutes = useMemo(() => 
    routes.map(() => defaultShowRoutes), 
    [routes.length, defaultShowRoutes]
  )
  
  // Stati per controllare la visibilità dei layer - inizializzati correttamente
  const [visibleTracks, setVisibleTracks] = useState<boolean[]>(initialVisibleTracks)
  const [visibleRoutes, setVisibleRoutes] = useState<boolean[]>(initialVisibleRoutes)
  const [visibleWaypoints, setVisibleWaypoints] = useState(defaultShowWaypoints)

  // Aggiorna solo quando cambiano effettivamente i dati
  useEffect(() => {
    setVisibleTracks(initialVisibleTracks)
  }, [initialVisibleTracks.length])

  useEffect(() => {
    setVisibleRoutes(initialVisibleRoutes)
  }, [initialVisibleRoutes.length])

  // SSR protection - non renderizzare lato server
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Calcola i bounds includendo tracce, routes e waypoints
  const allPoints = [
    ...allTracks.flatMap(track => track.points.map(point => [point.lat, point.lng] as [number, number])),
    ...routes.flatMap(route => route.points.map(point => [point.lat, point.lng] as [number, number])),
    ...waypoints.map(wp => [wp.lat, wp.lng] as [number, number])
  ]

  // Calcola bounds manualmente per evitare dipendenza da L
  const bounds = allPoints.length > 0 ? {
    southwest: {
      lat: Math.min(...allPoints.map(p => p[0])),
      lng: Math.min(...allPoints.map(p => p[1]))
    },
    northeast: {
      lat: Math.max(...allPoints.map(p => p[0])),
      lng: Math.max(...allPoints.map(p => p[1]))
    }
  } : null

  // Centro della mappa
  const center: [number, number] = bounds 
    ? [(bounds.southwest.lat + bounds.northeast.lat) / 2, (bounds.southwest.lng + bounds.northeast.lng) / 2]
    : defaultCenter

  // Handler per i toggle dei layer
  const handleTrackToggle = (index: number) => {
    setVisibleTracks(prev => {
      const newVisible = [...prev]
      newVisible[index] = !newVisible[index]
      return newVisible
    })
  }

  const handleRouteToggle = (index: number) => {
    setVisibleRoutes(prev => {
      const newVisible = [...prev]
      newVisible[index] = !newVisible[index]
      return newVisible
    })
  }

  const handleWaypointsToggle = () => {
    setVisibleWaypoints(!visibleWaypoints)
  }

  const handleFullscreen = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onFullscreenClick) {
      onFullscreenClick()
    }
  }

  const handleFullscreenClose = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onFullscreenClose) {
      onFullscreenClose()
    }
  }

  return (
    <div className={`w-full ${height} ${className} flex flex-col`}>
      {/* Header con titolo e controlli opzionali */}
      {(showControls || title) && (
        <div className="flex items-center justify-between p-3 border-b bg-white flex-shrink-0">
          {title && (
            <h3 className="text-lg font-semibold flex items-center text-gray-900">
              <Route className="w-5 h-5 mr-2 text-blue-600" />
              {title}
            </h3>
          )}
          
          {showControls && (
            <div className="flex items-center gap-2">
              {enableDownload && onDownload && (
                <button
                  type="button"
                  onClick={onDownload}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Scarica GPX</span>
                </button>
              )}
              
              {enableFullscreen && onFullscreenClick && (
                <button
                  type="button"
                  onClick={handleFullscreen}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 hover:border-indigo-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-sm"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mappa */}
      <div className="flex-1 w-full min-h-0 relative">
        {/* LayerControl avanzato (se abilitato) - Posizionato perfettamente allineato con i controlli zoom */}
        {showLayerControls && (allTracks.length > 0 || routes.length > 0 || waypoints.length > 0) && (
          <div className="absolute top-[80px] left-[10px] z-[1000]">
            <LayerControl
              tracks={allTracks}
              routes={routes}
              waypoints={waypoints}
              visibleTracks={visibleTracks}
              visibleRoutes={visibleRoutes}
              visibleWaypoints={visibleWaypoints}
              onTrackToggle={handleTrackToggle}
              onRouteToggle={handleRouteToggle}
              onWaypointsToggle={handleWaypointsToggle}
              className="compact-style"
            />
          </div>
        )}

        {/* Bottone Fullscreen/Close all'interno della mappa */}
        {(enableFullscreen || isFullscreenMode) && (
          <div className="absolute top-[10px] right-[10px] z-[1000]">
            {isFullscreenMode ? (
              // Bottone chiusura fullscreen (stile identico a FullscreenMapModal)
              <button
                type="button"
                onClick={handleFullscreenClose}
                className="group inline-flex items-center justify-center w-14 h-14 text-white bg-gradient-to-br from-white/15 to-white/5 hover:from-white/25 hover:to-white/10 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl transition-all duration-300 ease-out hover:scale-110 hover:rotate-3 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-transparent active:scale-95"
                aria-label="Chiudi mappa fullscreen"
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300 drop-shadow-lg" />
                <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-black/90 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-md whitespace-nowrap shadow-xl border border-white/10">
                  Chiudi (ESC)
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-black/90"></div>
                </span>
              </button>
            ) : (
              // Bottone apertura fullscreen
              <button
                type="button"
                onClick={handleFullscreen}
                className="group inline-flex items-center justify-center w-14 h-14 text-gray-700 bg-white/90 hover:bg-white backdrop-blur-xl border border-gray-200/80 hover:border-gray-300 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
                aria-label="Apri in fullscreen"
              >
                <Maximize2 className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
                <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-md whitespace-nowrap shadow-xl border border-white/10">
                  Fullscreen
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-gray-900"></div>
                </span>
              </button>
            )}
          </div>
        )}

        {/* Mappa dinamica per evitare problemi SSR */}
        {isClient && (allTracks.length > 0 || routes.length > 0 || waypoints.length > 0) ? (
          <DynamicMap
            allTracks={allTracks}
            routes={routes}
            waypoints={waypoints}
            visibleTracks={visibleTracks}
            visibleRoutes={visibleRoutes}
            visibleWaypoints={visibleWaypoints}
            center={center}
            bounds={bounds}
            defaultZoom={defaultZoom}
            autoFit={autoFit}
          />
        ) : !isClient ? (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg">
            <div className="text-gray-500">Caricamento mappa...</div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <MapPin className="w-8 h-8 mx-auto mb-2" />
              <div className="font-medium">Nessun tracciato disponibile</div>
              <div className="text-sm">Carica un file GPX per visualizzare il percorso</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer informazioni e controlli legacy */}
      {showInfoFooter && (allTracks.length > 0 || routes.length > 0 || waypoints.length > 0) && (
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center text-xs text-gray-600 gap-6">
              {/* Tracce */}
              {allTracks.length > 0 && (
                <div className="flex items-center gap-2">
                  <span>
                    <span className="font-medium">Tracce:</span>
                  </span>
                  <span>{allTracks.length}</span>
                </div>
              )}
              
              {/* Waypoints */}
              {waypoints.length > 0 && (
                <div className="flex items-center gap-2">
                  <span>
                    <span className="font-medium">Waypoints:</span>
                  </span>
                  <span>{waypoints.length}</span>
                </div>
              )}
              
              {/* Routes */}
              {routes.length > 0 && (
                <div className="flex items-center gap-2">
                  <span>
                    <span className="font-medium">Percorsi Consigliati:</span>
                  </span>
                  <span>{routes.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
