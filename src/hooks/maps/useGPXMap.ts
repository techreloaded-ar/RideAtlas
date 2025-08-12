// src/hooks/useGPXMap.ts
import { useState, useCallback } from 'react'
import { parseGPXContent } from '@/lib/gpx/gpx-utils'
import { GPXPoint, GPXWaypoint, GPXRoute, GPXData } from '@/types/gpx'
import { GPXParseResult } from '@/lib/gpx/gpx-utils';
import { 
  processGPXData, 
  createGPXMetadata, 
  fetchGPXFromUrl as fetchGPXContent,
  readGPXFromFile 
} from '@/lib/gpx/gpx-processing'


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
  tracks: GPXRoute[] // Multiple tracks support
  routes: GPXRoute[]
  waypoints: GPXWaypoint[]
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
  const [tracks, setTracks] = useState<GPXRoute[]>([]) // Support for multiple tracks
  const [routes, setRoutes] = useState<GPXRoute[]>([])
  const [waypoints, setWaypoints] = useState<GPXWaypoint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUrl, setLastUrl] = useState<string | null>(null)

  // Metadata derivati dai dati usando la funzione pura
  const processedData = { allPoints: gpxData, tracks, routes, waypoints };
  const metadata = createGPXMetadata(processedData);

  const processGPXDataAndUpdateState = useCallback((parsedData: GPXParseResult) => {
    // Usa la funzione pura per processare i dati
    const processed = processGPXData(parsedData);
    
    // Aggiorna lo state con i dati processati
    setGpxData(processed.allPoints);
    setTracks(processed.tracks);
    setRoutes(processed.routes);
    setWaypoints(processed.waypoints);

    // Callback di successo
    if (onDataLoaded) {
      onDataLoaded({
        tracks: processed.tracks,
        routes: processed.routes,
        waypoints: processed.waypoints
      });
    }
  }, [onDataLoaded])

  const loadGPXFromUrl = useCallback(async (blobUrl: string) => {
    setIsLoading(true)
    setError(null)
    setLastUrl(blobUrl)

    try {
      // Usa la funzione pura per fetch
      const gpxContent = await fetchGPXContent(blobUrl);
      
      // Parsa il contenuto GPX
      const parsedData = parseGPXContent(gpxContent, 'preview.gpx');
      
      // Processa i dati usando la funzione refactorizzata
      processGPXDataAndUpdateState(parsedData);
      
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
  }, [processGPXDataAndUpdateState, onError])

  const loadGPXFromFile = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(null)

    try {
      // Usa la funzione pura per leggere il file
      const text = await readGPXFromFile(file);
      const parsedData = parseGPXContent(text, file.name);
      
      // Processa i dati usando la funzione refactorizzata
      processGPXDataAndUpdateState(parsedData);
      
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
  }, [processGPXDataAndUpdateState, onError])

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
