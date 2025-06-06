'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { GPXTrack, GPXRoute, GPXWaypoint } from '@/types/gpx'

// Componente per auto-fit della mappa
function MapAutoFit({ 
  bounds, 
  autoFit = true 
}: {
  bounds: {
    southwest: { lat: number; lng: number }
    northeast: { lat: number; lng: number }
  } | null
  autoFit?: boolean
}) {
  const map = useMap()
  
  useEffect(() => {
    if (bounds && autoFit) {
      const leafletBounds = L.latLngBounds([
        [bounds.southwest.lat, bounds.southwest.lng],
        [bounds.northeast.lat, bounds.northeast.lng]
      ])
      map.fitBounds(leafletBounds, { padding: [20, 20] })
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

interface LeafletMapRendererProps {
  allTracks: GPXTrack[]
  routes: GPXRoute[]
  waypoints: GPXWaypoint[]
  visibleTracks: boolean[]
  visibleRoutes: boolean[]
  visibleWaypoints: boolean
  center: [number, number]
  bounds: {
    southwest: { lat: number; lng: number }
    northeast: { lat: number; lng: number }
  } | null
  defaultZoom: number
  autoFit: boolean
}

export default function LeafletMapRenderer({
  allTracks,
  routes,
  waypoints,
  visibleTracks,
  visibleRoutes,
  visibleWaypoints,
  center,
  bounds,
  defaultZoom,
  autoFit
}: LeafletMapRendererProps) {
  const mapRef = useRef<L.Map | null>(null)
  const waypointIcon = useWaypointIcon()
  
  // Inizializza Leaflet solo lato client
  useEffect(() => {
    initializeLeafletIcons()
  }, [])

  return (
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
      
      {/* Tracce multiple */}
      {allTracks.map((track, trackIndex) => {
        if (!visibleTracks[trackIndex]) return null
        
        const trackPositions: [number, number][] = track.points.map(point => [point.lat, point.lng])
        return trackPositions.length > 0 ? (
          <Polyline
            key={`track-${trackIndex}`}
            positions={trackPositions}
            pathOptions={{
              color: track.color || '#3b82f6',
              weight: 4,
              opacity: 0.8
            }}
          />
        ) : null
      })}
      
      {/* Routes (percorsi consigliati) */}
      {routes.map((route, routeIndex) => {
        if (!visibleRoutes[routeIndex]) return null
        
        const routePositions: [number, number][] = route.points.map(point => [point.lat, point.lng])
        return routePositions.length > 0 ? (
          <Polyline
            key={`route-${routeIndex}`}
            positions={routePositions}
            pathOptions={{
              color: route.color || '#dc2626',
              weight: 4,
              opacity: 0.8,
              dashArray: '10, 10'
            }}
          />
        ) : null
      })}
      
      {/* Waypoints */}
      {visibleWaypoints && waypoints.map((waypoint, index) => (
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
  )
}