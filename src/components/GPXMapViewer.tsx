// src/components/GPXMapViewer.tsx
'use client'

// TODO:
// - Fixare pulsante espandi
// - Metterlo a disposizione in tutte le pagine di visualizzazione GPX

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix per icone default di Leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Icona personalizzata per i waypoints (arancione)
const waypointIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
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

interface GPXMapViewerProps {
  gpxData: GPXPoint[]
  waypoints?: GPXWaypoint[]
  className?: string
}

// Componente per auto-fit della mappa
function MapAutoFit({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap()
  
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [bounds, map])
  
  return null
}

export default function GPXMapViewer({ gpxData, waypoints = [], className = '' }: GPXMapViewerProps) {
  const mapRef = useRef<L.Map | null>(null)
  
  // Calcola i bounds includendo sia tracciato che waypoints
  const allPoints = [
    ...gpxData.map(point => [point.lat, point.lng] as [number, number]),
    ...waypoints.map(wp => [wp.lat, wp.lng] as [number, number])
  ]
  
  const bounds = allPoints.length > 0 
    ? L.latLngBounds(allPoints)
    : null
  
  // Centro della mappa
  const center: [number, number] = bounds 
    ? [bounds.getCenter().lat, bounds.getCenter().lng]
    : [45.0, 7.0] // Default su Piemonte se non ci sono dati
  
  // Converti i punti GPX in formato per Polyline
  const polylinePositions: [number, number][] = gpxData.map(point => [point.lat, point.lng])

  return (
    <div className={`w-full h-full ${className}`}>
      <MapContainer
        center={center}
        zoom={10}
        className="w-full h-full min-h-[400px]"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {polylinePositions.length > 0 && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: '#3b82f6', // blue-500
              weight: 4,
              opacity: 0.8
            }}
          />
        )}
        
        {waypoints.map((waypoint, index) => (
          <Marker
            key={`waypoint-${index}`}
            position={[waypoint.lat, waypoint.lng]}
            icon={waypointIcon}
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
        
        <MapAutoFit bounds={bounds} />
      </MapContainer>
    </div>
  )
}
