// src/hooks/useGPXMap.ts
import { useState, useCallback } from 'react'
import { parseGPXContent, GPXParseResult } from '@/lib/gpx-utils'
import { GPXPoint, GPXWaypoint, GPXRoute, GPXData } from '@/types/gpx'

// Backward compatibility types (maintained for existing code)
type GPXWaypointForMap = GPXWaypoint
type GPXRouteForMap = GPXRoute

interface UseGPXMapOptions {
  /** Auto-load GPX from URL on hook initialization */
  autoLoad?: boolean
  /** Callback quando i dati sono caricati con successo */
  onDataLoaded?: (data: GPXData) => void
  /** Callback quando si verifica un errore */
  onError?: (error: string) => void
  /** Cache dei dati per evitare reload non necessari */
  enableCache?: boolean
}

interface UseGPXMapReturn {
  gpxData: GPXPoint[] // Legacy support
  tracks: GPXRouteForMap[] // Multiple tracks support
  routes: GPXRouteForMap[]
  waypoints: GPXWaypointForMap[]
  isLoading: boolean
  error: string | null
  metadata: {
    totalPoints: number
    totalWaypoints: number
    totalRoutes: number
    totalTracks: number
    hasElevation: boolean
  }
  loadGPXFromUrl: (blobUrl: string) => Promise<void>
  loadGPXFromFile: (file: File) => Promise<void>
  clearData: () => void
  retry: () => Promise<void>
}

export function useGPXMap(options: UseGPXMapOptions = {}): UseGPXMapReturn {
  const { onDataLoaded, onError } = options
  
  const [gpxData, setGpxData] = useState<GPXPoint[]>([])
  const [tracks, setTracks] = useState<GPXRouteForMap[]>([]) // Support for multiple tracks
  const [routes, setRoutes] = useState<GPXRouteForMap[]>([])
  const [waypoints, setWaypoints] = useState<GPXWaypointForMap[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUrl, setLastUrl] = useState<string | null>(null)

  // Metadata derivati dai dati
  const metadata = {
    totalPoints: gpxData.length,
    totalWaypoints: waypoints.length,
    totalRoutes: routes.length,
    totalTracks: tracks.length,
    hasElevation: gpxData.some(point => point.elevation !== undefined)
  }

  const processGPXData = useCallback((parsedData: GPXParseResult) => {
    if (!parsedData || !parsedData.tracks || parsedData.tracks.length === 0) {
      throw new Error('Il file GPX non contiene tracciati validi')
    }

    // Estrai tutti i punti da tutti i tracciati
    const allPoints: GPXPoint[] = []
    const gpxTracks: GPXRouteForMap[] = []
    
    parsedData.tracks.forEach((track, index) => {
      const trackPoints: GPXPoint[] = track.map(point => ({
        lat: point.lat,
        lng: point.lon,
        elevation: point.elevation
      }))
      
      // Aggiungi la traccia alla lista delle tracce separate
      gpxTracks.push({
        name: `Traccia ${index + 1}`,
        points: trackPoints,
        color: index === 0 ? '#3b82f6' : `hsl(${(index * 60) % 360}, 70%, 50%)` // Colori diversi per tracce multiple
      })
      
      // Aggiungi i punti alla lista totale per backward compatibility
      allPoints.push(...trackPoints)
    })

    if (allPoints.length === 0) {
      throw new Error('Nessun punto trovato nel tracciato GPX')
    }

    setGpxData(allPoints) // Legacy support
    setTracks(gpxTracks) // Multiple tracks support

    // Estrai i waypoints
    const gpxWaypoints: GPXWaypointForMap[] = parsedData.waypoints.map(wp => ({
      lat: wp.lat,
      lng: wp.lon,
      name: wp.name,
      elevation: wp.elevation
    }))
    
    setWaypoints(gpxWaypoints)

    // Estrai le route
    const gpxRoutes: GPXRouteForMap[] = parsedData.routes.map(route => ({
      name: route.name,
      points: route.points.map(point => ({
        lat: point.lat,
        lng: point.lon,
        elevation: point.elevation
      }))
    }))
    
    setRoutes(gpxRoutes)

    // Callback di successo
    if (onDataLoaded) {
      onDataLoaded({
        tracks: gpxTracks,
        routes: gpxRoutes,
        waypoints: gpxWaypoints
      })
    }
  }, [onDataLoaded])

  const loadGPXFromUrl = useCallback(async (blobUrl: string) => {
    setIsLoading(true)
    setError(null)
    setLastUrl(blobUrl)

    try {
      // Usa l'endpoint API per ottenere il contenuto GPX
      const response = await fetch(`/api/gpx/preview?url=${encodeURIComponent(blobUrl)}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nel caricamento del file GPX')
      }
      
      const gpxContent = await response.text()
      
      // Parsa il contenuto GPX
      const parsedData: GPXParseResult = parseGPXContent(gpxContent, 'preview.gpx')
      
      processGPXData(parsedData)
      
    } catch (err) {
      console.error('Errore nel caricamento GPX:', err)
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto'
      setError(errorMessage)
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }, [processGPXData, onError])

  const loadGPXFromFile = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(null)

    try {
      const text = await file.text()
      const parsedData: GPXParseResult = parseGPXContent(text, file.name)
      
      processGPXData(parsedData)
      
    } catch (err) {
      console.error('Errore nel caricamento GPX da file:', err)
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto'
      setError(errorMessage)
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }, [processGPXData, onError])

  const clearData = useCallback(() => {
    setGpxData([])
    setTracks([])
    setRoutes([])
    setWaypoints([])
    setError(null)
    setLastUrl(null)
  }, [])

  const retry = useCallback(async () => {
    if (lastUrl) {
      await loadGPXFromUrl(lastUrl)
    }
  }, [lastUrl, loadGPXFromUrl])

  return {
    gpxData,
    tracks,
    routes,
    waypoints,
    isLoading,
    error,
    metadata,
    loadGPXFromUrl,
    loadGPXFromFile,
    clearData,
    retry
  }
}
