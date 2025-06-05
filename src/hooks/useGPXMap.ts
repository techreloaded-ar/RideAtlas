// src/hooks/useGPXMap.ts
import { useState, useCallback } from 'react'
import { parseGPXContent, GPXParseResult } from '@/lib/gpx-utils'

interface GPXPoint {
  lat: number
  lng: number
  elevation?: number
}

interface GPXWaypointForMap {
  lat: number
  lng: number
  name?: string
  elevation?: number
}

interface GPXRouteForMap {
  name?: string
  points: GPXPoint[]
}

interface UseGPXMapReturn {
  gpxData: GPXPoint[]
  routes: GPXRouteForMap[]
  waypoints: GPXWaypointForMap[]
  isLoading: boolean
  error: string | null
  loadGPXFromUrl: (blobUrl: string) => Promise<void>
  clearData: () => void
}

export function useGPXMap(): UseGPXMapReturn {
  const [gpxData, setGpxData] = useState<GPXPoint[]>([])
  const [routes, setRoutes] = useState<GPXRouteForMap[]>([])
  const [waypoints, setWaypoints] = useState<GPXWaypointForMap[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadGPXFromUrl = useCallback(async (blobUrl: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Usa l'endpoint API per ottenere il contenuto GPX
      const response = await fetch(`/api/gpx/preview?url=${encodeURIComponent(blobUrl)}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nel caricamento del file GPX')
      }
      
      const gpxContent = await response.text()
      
      // Parsa il contenuto GPX con la nuova funzione che supporta le route
      const parsedData: GPXParseResult = parseGPXContent(gpxContent, 'preview.gpx')
      
      if (!parsedData || !parsedData.tracks || parsedData.tracks.length === 0) {
        throw new Error('Il file GPX non contiene tracciati validi')
      }
      
      // Estrai tutti i punti da tutti i tracciati
      const allPoints: GPXPoint[] = []
      
      parsedData.tracks.forEach((track) => {
        track.forEach((point) => {
          allPoints.push({
            lat: point.lat,
            lng: point.lon,
            elevation: point.elevation
          })
        })
      })
      
      if (allPoints.length === 0) {
        throw new Error('Nessun punto trovato nel tracciato GPX')
      }
      
      setGpxData(allPoints)
      
      // Estrai i waypoints e converti al formato per la mappa
      const gpxWaypoints: GPXWaypointForMap[] = parsedData.waypoints.map(wp => ({
        lat: wp.lat,
        lng: wp.lon,
        name: wp.name,
        elevation: wp.elevation
      }))
      
      setWaypoints(gpxWaypoints)
      
      // Estrai le route e converti al formato per la mappa
      const gpxRoutes: GPXRouteForMap[] = parsedData.routes.map(route => ({
        name: route.name,
        points: route.points.map(point => ({
          lat: point.lat,
          lng: point.lon,
          elevation: point.elevation
        }))
      }))
      
      setRoutes(gpxRoutes)
      
    } catch (err) {
      console.error('Errore nel caricamento GPX:', err)
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearData = useCallback(() => {
    setGpxData([])
    setRoutes([])
    setWaypoints([])
    setError(null)
  }, [])

  return {
    gpxData,
    routes,
    waypoints,
    isLoading,
    error,
    loadGPXFromUrl,
    clearData
  }
}
