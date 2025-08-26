// src/components/maps/DirectLeafletMap.tsx
'use client'

import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { GPXTrack, GPXRoute, GPXWaypoint } from '@/types/gpx'

// Configurazione icone Leaflet
function initializeLeafletIcons() {
  if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    })
  }
}

interface DirectLeafletMapProps {
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
  className?: string
}

let mapIdCounter = 0

export default function DirectLeafletMap({
  allTracks,
  routes,
  waypoints,
  visibleTracks,
  visibleRoutes,
  visibleWaypoints,
  center,
  bounds,
  defaultZoom,
  autoFit,
  className = ''
}: DirectLeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const isMapInitializedRef = useRef<boolean>(false)
  const layersRef = useRef<{
    tracks: L.Polyline[]
    routes: L.Polyline[]
    waypoints: L.Marker[]
    streetLayer?: L.TileLayer
    satelliteLayer?: L.TileLayer
    layerControl?: L.Control.Layers
  }>({
    tracks: [],
    routes: [],
    waypoints: []
  })

  // Helper per verificare se la mappa è pronta per le operazioni
  const isMapReady = useCallback((map: L.Map | null): boolean => {
    if (!map || !isMapInitializedRef.current) return false
    
    try {
      const container = map.getContainer()
      if (!container) return false
      
      // Verifica che il container sia nel DOM
      if (!document.contains(container)) return false
      
      const mapSize = map.getSize()
      const containerRect = container.getBoundingClientRect()
      
      // Controlli più stringenti
      const hasValidSize = mapSize.x > 0 && mapSize.y > 0 && containerRect.width > 0 && containerRect.height > 0
      
      // Verifica che la mappa abbia completato l'inizializzazione interna
      const hasValidCenter = map.getCenter() && !isNaN(map.getCenter().lat) && !isNaN(map.getCenter().lng)
      
      return hasValidSize && hasValidCenter
    } catch {
      return false
    }
  }, [])

  // Helper per eseguire fitBounds in modo sicuro con retry
  const safeFitBounds = useCallback(
    (map: L.Map, bounds: L.LatLngBounds, retries = 3) => {
      if (!isMapReady(map) || retries <= 0) return

      try {
        // Verifica aggiuntiva: controlla che non ci siano operazioni di rendering in corso
        const container = map.getContainer()
        if (!container || container.style.visibility === 'hidden') {
          if (retries > 1) {
            setTimeout(() => safeFitBounds(map, bounds, retries - 1), 200)
          }
          return
        }

        // Forza un refresh completo prima di fitBounds
        map.invalidateSize({ animate: false })
        
        // Aspetta un frame per assicurarsi che invalidateSize sia completato
        requestAnimationFrame(() => {
          try {
            if (isMapReady(map)) {
              map.fitBounds(bounds, { 
                padding: [10, 10],
                animate: false // Disabilita animazione per evitare conflitti
              })
            }
          } catch {
            // Solo log se è l'ultimo tentativo
            if (retries <= 1) {
              console.warn('FitBounds fallito dopo tutti i tentativi, continuando senza fit automatico')
            } else {
              setTimeout(() => safeFitBounds(map, bounds, retries - 1), 300)
            }
          }
        })
      } catch {
        if (retries > 1) {
          setTimeout(() => safeFitBounds(map, bounds, retries - 1), 300)
        }
      }
    },
    [isMapReady]
  )

  // Ref callback per inizializzare la mappa
  const mapContainerRef = useCallback((container: HTMLDivElement | null) => {
    if (!container) return

    // Cleanup mappa precedente se esiste
    if (mapRef.current) {
      isMapInitializedRef.current = false
      try {
        mapRef.current.remove()
      } catch (error) {
        console.warn('Errore durante cleanup mappa:', error)
      }
      mapRef.current = null
      layersRef.current = { tracks: [], routes: [], waypoints: [] }
    }

    try {
      // Pulisci il container
      container.innerHTML = ''
      
      // Genera ID univoco per il container
      const uniqueId = `leaflet-map-${++mapIdCounter}-${Date.now()}`
      container.id = uniqueId

      // Aspetta che il container abbia dimensioni valide
      const checkDimensions = () => {
        const rect = container.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) {
          setTimeout(checkDimensions, 50)
          return
        }

        initializeMap()
      }

      const initializeMap = () => {
        // Inizializza Leaflet
        initializeLeafletIcons()

        // Crea la mappa
        const map = L.map(container, {
          center,
          zoom: defaultZoom,
          attributionControl: false
        })

        mapRef.current = map

        // Forza il resize della mappa dopo l'inizializzazione
        setTimeout(() => {
          if (map && mapRef.current === map) {
            try {
              map.invalidateSize()
              isMapInitializedRef.current = true
            } catch (error) {
              console.warn('Errore durante invalidateSize iniziale:', error)
            }
          }
        }, 100)

        setupMap(map)
      }

      const setupMap = (map: L.Map) => {
        // Aggiungi tile layers
        const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '',
          maxZoom: 19
        })
        
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '',
          maxZoom: 19
        })

        streetLayer.addTo(map)

        const baseMaps = {
          "Street": streetLayer,
          "Satellite": satelliteLayer
        }

        const layerControl = L.control.layers(baseMaps, {}, {
          position: 'topright'
        }).addTo(map)

        // Applica stili personalizzati al layer control
        const layerControlElement = layerControl.getContainer()
        if (layerControlElement) {
          layerControlElement.style.background = 'white'
          layerControlElement.style.border = '1px solid #d1d5db'
          layerControlElement.style.borderRadius = '6px'
          layerControlElement.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          layerControlElement.style.marginTop = '60px'
        }

        layersRef.current = {
          tracks: [],
          routes: [],
          waypoints: [],
          streetLayer,
          satelliteLayer,
          layerControl
        }

      }

      checkDimensions()
    } catch (error) {
      console.error('❌ DirectLeafletMap: Errore nell\'inizializzazione:', error)
    }
  }, [center, defaultZoom])

  // Aggiorna tracce
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.getContainer()) return

    try {
      // Rimuovi tracce esistenti
      layersRef.current.tracks.forEach(track => {
        if (map.hasLayer(track)) {
          map.removeLayer(track)
        }
      })

      // Aggiungi nuove tracce
      const newTracks: L.Polyline[] = []
      allTracks.forEach((track, index) => {
        if (visibleTracks[index] && track.points.length > 0) {
          const positions: [number, number][] = track.points.map(point => [point.lat, point.lng])
          if (positions.length > 0) {
            const polyline = L.polyline(positions, {
              color: track.color || '#3b82f6',
              weight: 4,
              opacity: 0.8
            })
            polyline.addTo(map)
            newTracks.push(polyline)
          }
        }
      })

      layersRef.current.tracks = newTracks

      // Forza il fit bounds se ci sono tracce e auto fit è abilitato
      if (newTracks.length > 0 && bounds && autoFit) {
        // Delay più lungo per dare tempo a Leaflet di processare i layer
        setTimeout(() => {
          if (map && map.getContainer()) {
            const leafletBounds = L.latLngBounds([
              [bounds.southwest.lat, bounds.southwest.lng],
              [bounds.northeast.lat, bounds.northeast.lng]
            ])
            safeFitBounds(map, leafletBounds)
          }
        }, 500) // Aumentato da 200ms a 500ms
      }
    } catch (error) {
      console.warn('Errore nell\'aggiornamento tracce:', error)
    }
  }, [allTracks, visibleTracks, bounds, autoFit, safeFitBounds])

  // Aggiorna routes
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.getContainer()) return

    try {
      // Rimuovi routes esistenti
      layersRef.current.routes.forEach(route => {
        if (map.hasLayer(route)) {
          map.removeLayer(route)
        }
      })

      // Aggiungi nuovi routes
      const newRoutes: L.Polyline[] = []
      routes.forEach((route, index) => {
        if (visibleRoutes[index] && route.points.length > 0) {
          const positions: [number, number][] = route.points.map(point => [point.lat, point.lng])
          if (positions.length > 0) {
            const polyline = L.polyline(positions, {
              color: route.color || '#dc2626',
              weight: 4,
              opacity: 0.8,
              dashArray: '10, 10'
            })
            polyline.addTo(map)
            newRoutes.push(polyline)
          }
        }
      })

      layersRef.current.routes = newRoutes
    } catch (error) {
      console.warn('Errore nell\'aggiornamento routes:', error)
    }
  }, [routes, visibleRoutes])

  // Aggiorna waypoints
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.getContainer()) return

    try {
      // Rimuovi waypoints esistenti
      layersRef.current.waypoints.forEach(waypoint => {
        if (map.hasLayer(waypoint)) {
          map.removeLayer(waypoint)
        }
      })

      // Aggiungi nuovi waypoints
      const newWaypoints: L.Marker[] = []
      if (visibleWaypoints) {
        waypoints.forEach((waypoint) => {
          const marker = L.marker([waypoint.lat, waypoint.lng])
          marker.addTo(map)
          
          if (waypoint.name) {
            marker.bindPopup(`
              <div>
                <div style="font-weight: bold;">${waypoint.name}</div>
                ${waypoint.elevation ? `<div>Altitudine: ${Math.round(waypoint.elevation)}m</div>` : ''}
                <div style="font-size: 12px; color: #666; margin-top: 4px;">
                  ${waypoint.lat.toFixed(6)}, ${waypoint.lng.toFixed(6)}
                </div>
              </div>
            `)
          }
          
          newWaypoints.push(marker)
        })
      }

      layersRef.current.waypoints = newWaypoints
    } catch (error) {
      console.warn('Errore nell\'aggiornamento waypoints:', error)
    }
  }, [waypoints, visibleWaypoints])


  return (
    <div 
      ref={mapContainerRef}
      className={`w-full h-full ${className}`}
      style={{ minHeight: '200px' }}
    />
  )
}
