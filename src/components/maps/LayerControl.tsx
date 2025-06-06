// src/components/maps/LayerControl.tsx
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, MapPin, Route, Navigation } from 'lucide-react'
import { GPXTrack, GPXRoute, GPXWaypoint } from '@/types/gpx'

interface LayerControlProps {
  tracks?: GPXTrack[]
  routes?: GPXRoute[]
  waypoints?: GPXWaypoint[]
  visibleTracks: boolean[]
  visibleRoutes: boolean[]
  visibleWaypoints: boolean
  onTrackToggle: (index: number) => void
  onRouteToggle: (index: number) => void
  onWaypointsToggle: () => void
  className?: string
}

/**
 * Componente per controllo avanzato dei layer della mappa
 * Stile compatto simile ai controlli zoom, posizionato a sinistra
 */
export default function LayerControl({
  tracks = [],
  routes = [],
  waypoints = [],
  visibleTracks,
  visibleRoutes,
  visibleWaypoints,
  onTrackToggle,
  onRouteToggle,
  onWaypointsToggle,
  className = ''
}: LayerControlProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const hasLayers = tracks.length > 0 || routes.length > 0 || waypoints.length > 0

  if (!hasLayers) {
    return null
  }

  // Stile compatto simile ai controlli zoom di Leaflet
  const isCompact = className.includes('compact-style')

  return (
    <div className={`bg-white border border-gray-300 shadow-md ${isCompact ? 'rounded-md w-[32px]' : 'rounded-lg shadow-sm'} ${className}`}>
      {/* Header del controllo - stile identico ai bottoni zoom */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`${isCompact ? 'w-[32px] h-[32px] flex items-center justify-center p-0 hover:bg-gray-100 relative' : 'w-full flex items-center justify-between p-3 text-sm hover:bg-gray-50'} font-medium text-gray-700 ${isCompact ? 'rounded-md' : 'border-b border-gray-200 rounded-t-lg'} transition-colors duration-200`}
        title="Controlli Layer"
      >
        {isCompact ? (
          // Modalità compatta: icona Navigation blu centrata come bottoni zoom
          <Navigation className="w-4 h-4 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        ) : (
          // Modalità normale: layout con testo
          <>
            <span className="flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Layers</span>
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </>
        )}
      </button>

      {/* Contenuto espandibile - stile compatto */}
      {isExpanded && (
        <div className={`${isCompact ? 'absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-md min-w-[240px] z-[1001]' : 'border-t border-gray-200'}`}>
          {/* Tracce GPS */}
          {tracks.length > 0 && (
            <div className={`${isCompact ? 'p-2 border-b border-gray-200' : 'p-3 border-b border-gray-100'} last:border-b-0`}>
              <div className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-medium text-gray-500 uppercase tracking-wide mb-1.5`}>
                Tracce GPS
              </div>
              <div className={`${isCompact ? 'space-y-1' : 'space-y-2'}`}>
                {tracks.map((track, index) => (
                  <label
                    key={`track-${index}`}
                    className={`flex items-center gap-1.5 ${isCompact ? 'text-xs' : 'text-sm'} cursor-pointer hover:bg-gray-100 ${isCompact ? 'p-0.5' : 'p-1'} rounded transition-colors duration-150`}
                  >
                    <input
                      type="checkbox"
                      checked={visibleTracks[index] || false}
                      onChange={() => onTrackToggle(index)}
                      className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-1`}
                    />
                    <div 
                      className={`${isCompact ? 'w-3 h-0.5' : 'w-4 h-1'} rounded`}
                      style={{ backgroundColor: track.color || '#3b82f6' }}
                    />
                    <span className="text-gray-700 truncate flex-1 min-w-0">
                      {track.name || `Traccia ${index + 1}`}
                    </span>
                    <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-gray-500`}>
                      {track.points.length}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Routes/Percorsi */}
          {routes.length > 0 && (
            <div className={`${isCompact ? 'p-2 border-b border-gray-200' : 'p-3 border-b border-gray-100'} last:border-b-0`}>
              <div className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-medium text-gray-500 uppercase tracking-wide mb-1.5`}>
                Percorsi
              </div>
              <div className={`${isCompact ? 'space-y-1' : 'space-y-2'}`}>
                {routes.map((route, index) => (
                  <label
                    key={`route-${index}`}
                    className={`flex items-center gap-1.5 ${isCompact ? 'text-xs' : 'text-sm'} cursor-pointer hover:bg-gray-100 ${isCompact ? 'p-0.5' : 'p-1'} rounded transition-colors duration-150`}
                  >
                    <input
                      type="checkbox"
                      checked={visibleRoutes[index] || false}
                      onChange={() => onRouteToggle(index)}
                      className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} text-red-600 border-gray-300 rounded focus:ring-red-500 focus:ring-1`}
                    />
                    <div 
                      className={`${isCompact ? 'w-3 h-0.5' : 'w-4 h-1'} rounded border-t border-dashed`}
                      style={{ 
                        backgroundColor: route.color || '#dc2626',
                        borderColor: route.color || '#dc2626'
                      }}
                    />
                    <Route className={`${isCompact ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-red-600`} />
                    <span className="text-gray-700 truncate flex-1 min-w-0">
                      {route.name || `Percorso ${index + 1}`}
                    </span>
                    <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-gray-500`}>
                      {route.points.length}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Waypoints */}
          {waypoints.length > 0 && (
            <div className={`${isCompact ? 'p-2' : 'p-3'}`}>
              <div className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-medium text-gray-500 uppercase tracking-wide mb-1.5`}>
                Waypoints
              </div>
              <label className={`flex items-center gap-1.5 ${isCompact ? 'text-xs' : 'text-sm'} cursor-pointer hover:bg-gray-100 ${isCompact ? 'p-0.5' : 'p-1'} rounded transition-colors duration-150`}>
                <input
                  type="checkbox"
                  checked={visibleWaypoints}
                  onChange={onWaypointsToggle}
                  className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} text-orange-600 border-gray-300 rounded focus:ring-orange-500 focus:ring-1`}
                />
                <div className={`${isCompact ? 'w-2.5 h-2.5' : 'w-3 h-3'} bg-orange-600 rounded-full`} />
                <MapPin className={`${isCompact ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-orange-600`} />
                <span className="text-gray-700 flex-1">
                  Waypoints
                </span>
                <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} text-gray-500`}>
                  {waypoints.length}
                </span>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
