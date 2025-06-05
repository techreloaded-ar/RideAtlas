// src/components/GPXMapViewer.tsx
'use client'

// TODO:
// - Fixare pulsante espandi
// - Gestire i waypoint, non solo i tracciati
// - Metterlo a disposizione in tutte le pagine di visualizzazione GPX

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix per icone default di Leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface GPXPoint {
  lat: number
  lng: number
  elevation?: number
}

interface GPXMapViewerProps {
  gpxData: GPXPoint[]
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

export default function GPXMapViewer({ gpxData, className = '' }: GPXMapViewerProps) {
  const mapRef = useRef<L.Map | null>(null)
  
  // Calcola i bounds del tracciato
  const bounds = gpxData.length > 0 
    ? L.latLngBounds(gpxData.map(point => [point.lat, point.lng]))
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
        
        <MapAutoFit bounds={bounds} />
      </MapContainer>
    </div>
  )
}
