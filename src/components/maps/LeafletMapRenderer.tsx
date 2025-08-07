'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { GPXTrack, GPXRoute, GPXWaypoint } from '@/types/gpx'

// Componente per gestire i base layers (Street/Satellite)
function BaseLayers() {
  const map = useMap()
  
  useEffect(() => {
    // Definisco i tile layers
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '',
      maxZoom: 19
    })
    
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '',
      maxZoom: 19
    })
    
    // Aggiungo il layer street come default
    streetLayer.addTo(map)
    
    // Creo l'oggetto con i base layers
    const baseMaps = {
      "Street": streetLayer,
      "Satellite": satelliteLayer
    }
    
    // Aggiungo il controllo layer in alto a destra, spostato sotto il pulsante fullscreen
    const layerControl = L.control.layers(baseMaps, {}, {
      position: 'topright'
    }).addTo(map)
    
    // Applico stili personalizzati per uniformare con LayerControl
    const layerControlElement = layerControl.getContainer()
    if (layerControlElement) {
      // Reset degli stili di default di Leaflet e dimensioni identiche a LayerControl
      layerControlElement.style.background = 'white'
      layerControlElement.style.border = '1px solid #d1d5db' // border-gray-300
      layerControlElement.style.borderRadius = '6px' // rounded-md
      layerControlElement.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' // shadow-md
      layerControlElement.style.marginTop = '60px' // Sposta sotto il pulsante fullscreen
      layerControlElement.style.padding = '6px' // Padding per centrare meglio l'icona
      layerControlElement.style.width = '32px' // w-[32px] come LayerControl
      layerControlElement.style.height = '32px' // h-[32px] come LayerControl
      layerControlElement.style.minWidth = '32px'
      layerControlElement.style.overflow = 'visible' // Per permettere espansione del dropdown
      layerControlElement.style.fontSize = '12px' // Aumentato per leggibilità
      layerControlElement.style.display = 'flex'
      layerControlElement.style.alignItems = 'center'
      layerControlElement.style.justifyContent = 'center'
      layerControlElement.style.position = 'relative'
      
      // Aggiungi un'icona personalizzata per il toggle
      const toggleIcon = document.createElement('div')
      // Icona classica dei livelli come Google Maps (SVG)
      toggleIcon.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12,2 22,8.5 12,15 2,8.5 12,2"></polygon>
          <polyline points="2,17 12,23.5 22,17"></polyline>
          <polyline points="2,12 12,18.5 22,12"></polyline>
        </svg>
      `
      toggleIcon.style.fontSize = '14px'
      toggleIcon.style.cursor = 'pointer'
      toggleIcon.style.display = 'flex'
      toggleIcon.style.alignItems = 'center'
      toggleIcon.style.justifyContent = 'center'
      toggleIcon.style.width = '100%'
      toggleIcon.style.height = '100%'
      toggleIcon.style.color = '#374151' // Colore grigio scuro
      
      // Nascondi il contenuto originale e aggiungi la nostra icona
      const originalContent = layerControlElement.querySelector('.leaflet-control-layers-toggle') as HTMLElement | null
      if (originalContent) {
        originalContent.style.display = 'none'
      }
      layerControlElement.appendChild(toggleIcon)
      
      // Stili per il contenuto interno (dropdown)
      const form = layerControlElement.querySelector('.leaflet-control-layers-list') as HTMLElement
      if (form) {
        form.style.position = 'absolute'
        form.style.top = '0'
        form.style.right = '100%' // Apre a sinistra
        form.style.marginRight = '8px' // Spazio dal controllo principale
        form.style.margin = '0'
        form.style.padding = '12px' // Più spazio interno
        form.style.minWidth = '160px' // Più largo
        form.style.background = 'white'
        form.style.border = '1px solid #d1d5db'
        form.style.borderRadius = '6px'
        form.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        form.style.zIndex = '1000'
      }
      
      // Stili per le label dei layer
      const labels = layerControlElement.querySelectorAll('label')
      labels.forEach((label) => {
        const labelElement = label as HTMLLabelElement
        labelElement.style.display = 'flex'
        labelElement.style.alignItems = 'center'
        labelElement.style.gap = '8px' // Più spazio per leggibilità
        labelElement.style.padding = '4px 8px'
        labelElement.style.fontSize = '12px' // Più leggibile
        labelElement.style.fontWeight = '500'
        labelElement.style.color = '#374151' // text-gray-700
        labelElement.style.cursor = 'pointer'
        labelElement.style.borderRadius = '4px'
        labelElement.style.transition = 'background-color 0.15s ease'
        labelElement.style.margin = '2px 0'
        
        // Hover effect
        labelElement.addEventListener('mouseenter', () => {
          labelElement.style.backgroundColor = '#f3f4f6' // hover:bg-gray-100
        })
        labelElement.addEventListener('mouseleave', () => {
          labelElement.style.backgroundColor = 'transparent'
        })
      })
      
      // Stili per gli input radio
      const inputs = layerControlElement.querySelectorAll('input[type="radio"]')
      inputs.forEach((input) => {
        const inputElement = input as HTMLInputElement
        inputElement.style.width = '14px' // Più grande per usabilità
        inputElement.style.height = '14px'
        inputElement.style.accentColor = '#2563eb' // text-blue-600
        inputElement.style.margin = '0'
      })
      
      // Stili per il testo dei layer
      const spans = layerControlElement.querySelectorAll('span')
      spans.forEach((span) => {
        const spanElement = span as HTMLSpanElement
        spanElement.style.fontSize = '12px' // Più leggibile
        spanElement.style.lineHeight = '1.3'
        spanElement.style.fontWeight = '500'
      })
    }
    
    // Cleanup quando il componente viene smontato
    return () => {
      map.removeControl(layerControl)
      map.removeLayer(streetLayer)
      map.removeLayer(satelliteLayer)
    }
  }, [map])
  
  return null
}

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
      attributionControl={false}
    >
      <BaseLayers />
      
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