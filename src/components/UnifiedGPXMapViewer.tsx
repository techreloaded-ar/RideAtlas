// src/components/UnifiedGPXMapViewer.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import { Download, Route, MapPin, Maximize2 } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapViewerProps } from '@/types/gpx'

// Componente per auto-fit della mappa
function MapAutoFit({ bounds, autoFit = true }: { bounds: L.LatLngBounds | null; autoFit?: boolean }) {
  const map = useMap()
  
  useEffect(() => {
    if (bounds && bounds.isValid() && autoFit) {
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [bounds, map, autoFit])
  
  return null
}

// Configurazione icone Leaflet
function initializeLeafletIcons() {
  if (typeof window !== 'undefined') {
    // Fix per icone default di Leaflet
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    })
  }
}

// Hook per icona waypoint personalizzata
function useWaypointIcon() {
  const [waypointIcon, setWaypointIcon] = useState<L.Icon | null>(null)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const icon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
      setWaypointIcon(icon)
    }
  }, [])
  
  return waypointIcon
}

// Componente principale unificato
export default function UnifiedGPXMapViewer({
  gpxData,
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
  showLayerControls = false,
  defaultShowTrack = true,
  defaultShowRoutes = true,
  defaultShowWaypoints = true
}: MapViewerProps) {
  const mapRef = useRef<L.Map | null>(null)
  const waypointIcon = useWaypointIcon()
  
  // Stati per controllare la visibilità dei layer
  const [showTrack, setShowTrack] = useState(defaultShowTrack)
  const [showRoutesLayer, setShowRoutesLayer] = useState(defaultShowRoutes)
  const [showWaypointsLayer, setShowWaypointsLayer] = useState(defaultShowWaypoints)

  // Inizializza Leaflet solo lato client
  useEffect(() => {
    initializeLeafletIcons()
  }, [])

  // SSR protection
  if (typeof window === 'undefined') {
    return (
      <div className={`w-full ${height} ${className} bg-gray-100 flex items-center justify-center rounded-lg`}>
        <div className="text-gray-500">Caricamento mappa...</div>
      </div>
    )
  }

  // Calcola i bounds includendo tracciato, routes e waypoints
  const allPoints = [
    ...gpxData.map(point => [point.lat, point.lng] as [number, number]),
    ...routes.flatMap(route => route.points.map(point => [point.lat, point.lng] as [number, number])),
    ...waypoints.map(wp => [wp.lat, wp.lng] as [number, number])
  ]

  const bounds = allPoints.length > 0 
    ? L.latLngBounds(allPoints)
    : null

  // Centro della mappa
  const center: [number, number] = bounds 
    ? [bounds.getCenter().lat, bounds.getCenter().lng]
    : defaultCenter

  // Converti i punti GPX in formato per Polyline
  const polylinePositions: [number, number][] = gpxData.map(point => [point.lat, point.lng])

  const handleFullscreen = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onFullscreenClick) {
      onFullscreenClick()
    }
  }

  return (
    <div className={`w-full ${height} ${className} flex flex-col`}>
      {/* Header con controlli opzionali */}
      {(showControls || title || showLayerControls) && (
        <div className="flex items-center justify-between p-3 border-b bg-white flex-shrink-0">
          {title && (
            <h3 className="text-lg font-semibold flex items-center text-gray-900">
              <Route className="w-5 h-5 mr-2 text-blue-600" />
              {title}
            </h3>
          )}
          
          {/* Controlli layer visibilità */}
          {showLayerControls && (gpxData.length > 0 || routes.length > 0 || waypoints.length > 0) && (
            <div className="flex items-center gap-4">
              {/* Toggle Traccia GPS */}
              {gpxData.length > 0 && (
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTrack}
                    onChange={(e) => setShowTrack(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-blue-500 rounded"></div>
                    <span>Traccia GPS</span>
                  </div>
                </label>
              )}
              
              {/* Toggle Rotte */}
              {routes.length > 0 && (
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showRoutesLayer}
                    onChange={(e) => setShowRoutesLayer(e.target.checked)}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-red-600 border-t border-dashed border-red-600"></div>
                    <span>Percorsi</span>
                  </div>
                </label>
              )}
              
              {/* Toggle Waypoints */}
              {waypoints.length > 0 && (
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showWaypointsLayer}
                    onChange={(e) => setShowWaypointsLayer(e.target.checked)}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-orange-600" />
                    <span>Waypoints</span>
                  </div>
                </label>
              )}
            </div>
          )}
          
          {showControls && (
            <div className="flex items-center gap-2">
              {enableDownload && onDownload && (
                <button
                  type="button"
                  onClick={onDownload}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Scarica</span>
                </button>
              )}
              
              {enableFullscreen && onFullscreenClick && (
                <button
                  type="button"
                  onClick={handleFullscreen}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Espandi</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mappa */}
      <div className="flex-1 w-full min-h-0">
        {gpxData.length > 0 ? (
          <MapContainer
            center={center}
            zoom={defaultZoom}
            className="w-full h-full"
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Tracciato principale */}
            {showTrack && polylinePositions.length > 0 && (
              <Polyline
                positions={polylinePositions}
                pathOptions={{
                  color: '#3b82f6', // blue-500 for tracks
                  weight: 4,
                  opacity: 0.8
                }}
              />
            )}

            {/* Routes (tracciate) */}
            {showRoutesLayer && routes.map((route, routeIndex) => {
              const routePositions: [number, number][] = route.points.map(point => [point.lat, point.lng])
              return routePositions.length > 0 ? (
                <Polyline
                  key={`route-${routeIndex}`}
                  positions={routePositions}
                  pathOptions={{
                    color: '#dc2626', // red-600 for routes
                    weight: 4,
                    opacity: 0.8,
                    dashArray: '10, 10' // dashed line to distinguish from tracks
                  }}
                />
              ) : null
            })}

            {/* Waypoints */}
            {showWaypointsLayer && waypoints.map((waypoint, index) => (
              <Marker
                key={`waypoint-${index}`}
                position={[waypoint.lat, waypoint.lng]}
                icon={waypointIcon || undefined}
              >
                {waypoint.name && (
                  <Popup>
                    <div className="text-sm">
                      <div className="font-medium">{waypoint.name}</div>
                      {waypoint.elevation && (
                        <div className="text-gray-600">
                          Altitudine: {Math.round(waypoint.elevation)}m
                        </div>
                      )}
                      <div className="text-gray-500 text-xs mt-1">
                        {waypoint.lat.toFixed(6)}, {waypoint.lng.toFixed(6)}
                      </div>
                    </div>
                  </Popup>
                )}
              </Marker>
            ))}

            <MapAutoFit bounds={bounds} autoFit={autoFit} />
          </MapContainer>
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

      {/* Footer informazioni opzionale */}
      {showInfoFooter && gpxData.length > 0 && (
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center text-xs text-gray-600 gap-4">
              {showTrack && gpxData.length > 0 && (
                <span>
                  <span className="font-medium">Punti:</span> {gpxData.length.toLocaleString()}
                </span>
              )}
              {showWaypointsLayer && waypoints.length > 0 && (
                <span>
                  <span className="font-medium">Waypoints:</span> {waypoints.length}
                </span>
              )}
              {showRoutesLayer && routes.length > 0 && (
                <span>
                  <span className="font-medium">Rotte:</span> {routes.length}
                </span>
              )}
              <span className="text-blue-600">
                {showTrack && "📍 Traccia GPS (blu)"}
                {showTrack && showRoutesLayer && " • "}
                {showRoutesLayer && "🗺️ Rotte pianificate (rosso tratteggiato)"}
                {(showTrack || showRoutesLayer) && showWaypointsLayer && " • "}
                {showWaypointsLayer && "📍 Waypoints (arancione)"}
              </span>
            </div>
            
            {/* Icona fullscreen nel footer */}
            {enableFullscreen && onFullscreenClick && (
              <button
                type="button"
                onClick={handleFullscreen}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Apri in fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Fullscreen</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
