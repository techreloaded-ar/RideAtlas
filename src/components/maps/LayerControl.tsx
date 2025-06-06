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
 * Simile al controllo di GPS Visualizer con toggle individuali per ogni elemento
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
  const [isExpanded, setIsExpanded] = useState(true)

  const hasLayers = tracks.length > 0 || routes.length > 0 || waypoints.length > 0

  if (!hasLayers) {
    return null
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header del controllo */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-t-lg"
      >
        <span className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-blue-600" />
          Layer Mappa
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Contenuto espandibile */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {/* Tracce GPS */}
          {tracks.length > 0 && (
            <div className="p-3 border-b border-gray-100 last:border-b-0">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Tracce GPS
              </div>
              <div className="space-y-2">
                {tracks.map((track, index) => (
                  <label
                    key={`track-${index}`}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={visibleTracks[index] || false}
                      onChange={() => onTrackToggle(index)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div 
                      className="w-4 h-1 rounded"
                      style={{ backgroundColor: track.color || '#3b82f6' }}
                    />
                    <span className="text-gray-700 truncate">
                      {track.name || `Traccia ${index + 1}`}
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {track.points.length} punti
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Routes/Percorsi */}
          {routes.length > 0 && (
            <div className="p-3 border-b border-gray-100 last:border-b-0">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Percorsi Consigliati
              </div>
              <div className="space-y-2">
                {routes.map((route, index) => (
                  <label
                    key={`route-${index}`}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={visibleRoutes[index] || false}
                      onChange={() => onRouteToggle(index)}
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <div 
                      className="w-4 h-1 rounded border-t border-dashed"
                      style={{ 
                        backgroundColor: route.color || '#dc2626',
                        borderColor: route.color || '#dc2626'
                      }}
                    />
                    <Route className="w-3 h-3 text-red-600" />
                    <span className="text-gray-700 truncate">
                      {route.name || `Percorso ${index + 1}`}
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {route.points.length} punti
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Waypoints */}
          {waypoints.length > 0 && (
            <div className="p-3">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Punti di Interesse
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={visibleWaypoints}
                  onChange={onWaypointsToggle}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <div className="w-3 h-3 bg-orange-600 rounded-full" />
                <MapPin className="w-3 h-3 text-orange-600" />
                <span className="text-gray-700">
                  Waypoints
                </span>
                <span className="text-xs text-gray-500 ml-auto">
                  {waypoints.length} punti
                </span>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
