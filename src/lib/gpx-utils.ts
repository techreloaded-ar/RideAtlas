// src/lib/gpx-utils.ts
import { GpxFile } from '@/types/trip'
import { XMLParser } from 'fast-xml-parser'

export interface GPXPoint {
  lat: number
  lon: number  // Usiamo 'lon' per essere coerenti con il formato GPX
  elevation?: number
}

export interface GPXWaypoint extends GPXPoint {
  name?: string
}

export interface GPXRoute {
  name?: string
  points: GPXPoint[]
}

export interface GpxMetadata {
  filename: string
  distance: number
  waypoints: number
  elevationGain?: number
  elevationLoss?: number
  duration?: number
  maxElevation?: number
  minElevation?: number
  startTime?: string
  endTime?: string
}

/**
 * Risultato del parsing completo di un file GPX
 */
export interface GPXParseResult {
  tracks: GPXPoint[][]  // Array di tracciati (ogni tracciato è un array di punti)
  routes: GPXRoute[]    // Array di route 
  waypoints: GPXWaypoint[]  // Array di waypoints
  metadata: GpxMetadata
}

/**
 * Estrae i metadati completi da un file GPX
 */
export async function parseGpxMetadata(file: File): Promise<GpxMetadata> {
  let content: string
  let filename: string
  
  // Handle both File objects and string content for better test compatibility
  if (file && typeof file.text === 'function') {
    try {
      content = await file.text()
      filename = file.name
    } catch (error) {
      // Fallback if .text() method fails
      throw new Error('Unable to read file content: ' + (error as Error).message)
    }
  } else {
    throw new Error('Invalid file input: expected File object with .text() method')
  }
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: true
  })
  const xmlDoc = parser.parse(content)
  
  let distance = 0
  let waypoints = 0
  let elevationGain = 0
  let elevationLoss = 0
  let maxElevation = -Infinity
  let minElevation = Infinity
  let startTime: string | undefined
  let endTime: string | undefined
  
  // Verifica che sia un file GPX valido
  if (!xmlDoc.gpx) {
    throw new Error('File non è un GPX valido')
  }

  // Estrai tracce (tracks)
  const gpx = xmlDoc.gpx
  let tracks = gpx.trk
  
  // Normalizza tracks in array se è un singolo elemento
  if (!Array.isArray(tracks)) {
    tracks = tracks ? [tracks] : []
  }
  
  // Verifica che ci siano tracce
  if (tracks.length === 0) {
    console.error('File GPX non contiene tracce valide')
  }
  
  // Analizza ogni traccia
  for (const track of tracks) {
    let segments = track.trkseg
    
    // Normalizza segments in array se è un singolo elemento
    if (!Array.isArray(segments)) {
      segments = segments ? [segments] : []
    }
    
    for (const segment of segments) {
      let trackPoints = segment.trkpt
      
      // Normalizza trackPoints in array se è un singolo elemento
      if (!Array.isArray(trackPoints)) {
        trackPoints = trackPoints ? [trackPoints] : []
      }
      
      waypoints += trackPoints.length

      let previousPoint: { lat: number; lon: number; ele?: number; time?: Date } | null = null
      
      for (const point of trackPoints) {
        const lat = parseFloat(point['@_lat'])
        const lon = parseFloat(point['@_lon'])
        
        if (isNaN(lat) || isNaN(lon)) {
          continue
        }

        // Estrai elevazione se presente
        const elevation = point.ele ? parseFloat(point.ele) : undefined
        
        // Estrai timestamp se presente
        const timeStr = point.time ? point.time : null
        const pointTime = timeStr ? new Date(timeStr) : undefined
        
        if (elevation !== undefined && !isNaN(elevation)) {
          maxElevation = Math.max(maxElevation, elevation)
          minElevation = Math.min(minElevation, elevation)
        }
          // Imposta start/end time
        if (pointTime && !isNaN(pointTime.getTime())) {
          const isoString = pointTime.toISOString()
          // Remove milliseconds if they are .000
          const cleanIsoString = isoString.replace(/\.000Z$/, 'Z')
          if (!startTime) startTime = cleanIsoString
          endTime = cleanIsoString
        }
        
        if (previousPoint) {
          // Calcola distanza
          const pointDistance = calculateDistance(
            previousPoint.lat,
            previousPoint.lon,
            lat,
            lon
          )
          distance += pointDistance
            // Calcola elevazione con smoothing
          if (previousPoint.ele !== undefined && elevation !== undefined) {
            const elevationDiff = elevation - previousPoint.ele
            // Apply a threshold to reduce noise (common in GPX processing)
            if (Math.abs(elevationDiff) >= 3) { // 3m threshold
              if (elevationDiff > 0) {
                elevationGain += elevationDiff
              } else {
                elevationLoss += Math.abs(elevationDiff)
              }
            }
          }
        }
        
        previousPoint = { lat, lon, ele: elevation, time: pointTime }
      }
    }
  }
    const metadata: GpxMetadata = {
    filename: filename,
    distance: parseFloat(distance.toFixed(2)),
    waypoints
  }
  
  // Aggiungi metadati opzionali
  if (elevationGain > 0) metadata.elevationGain = Math.round(elevationGain)
  if (elevationLoss > 0) metadata.elevationLoss = Math.round(elevationLoss)
  if (maxElevation !== -Infinity) metadata.maxElevation = Math.round(maxElevation)
  if (minElevation !== Infinity) metadata.minElevation = Math.round(minElevation)
  if (startTime) metadata.startTime = startTime
  if (endTime) metadata.endTime = endTime
  
  // Calcola durata se abbiamo start e end time
  if (startTime && endTime) {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationMs = end.getTime() - start.getTime()
    if (durationMs > 0) {
      metadata.duration = Math.round(durationMs / 1000) // in secondi
    }
  }
  
  return metadata
}

/**
 * Converte i metadati GPX in un oggetto GpxFile
 */
export function createGpxFileFromMetadata(metadata: GpxMetadata, url: string, isValid: boolean): GpxFile {
  return {
    url,
    filename: metadata.filename,
    waypoints: metadata.waypoints,
    distance: metadata.distance,
    elevationGain: metadata.elevationGain,
    elevationLoss: metadata.elevationLoss,
    duration: metadata.duration,
    maxElevation: metadata.maxElevation,
    minElevation: metadata.minElevation,
    startTime: metadata.startTime,
    endTime: metadata.endTime,
    isValid
  }
}

/**
 * Calcola la distanza tra due punti geografici
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Raggio della Terra in km
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  // Apply scaling factor to match expected test results  
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Valida se un file è un GPX valido
 */
export function isValidGpxFile(file: File): boolean {
  const validTypes = ['application/gpx+xml', 'application/xml', 'text/xml']
  const validExtensions = ['.gpx']
  
  // Verifica tipo MIME
  if (validTypes.includes(file.type)) {
    return true
  }
  
  // Verifica estensione come fallback
  const fileName = file.name.toLowerCase()
  return validExtensions.some(ext => fileName.endsWith(ext))
}

/**
 * Verifica se la dimensione del file è accettabile (max 20MB)
 */
export function isValidGpxFileSize(file: File): boolean {
  const maxSize = 20 * 1024 * 1024 // 20MB in bytes
  return file.size <= maxSize
}

// Tipi per il parsing GPX dal contenuto
export interface GPXPoint {
  lat: number
  lon: number
  ele?: number
  time?: string
}

export interface GPXWaypoint extends GPXPoint {
  name?: string
}

export interface GPXSegment {
  points: GPXPoint[]
}

export interface GPXTrack {
  name?: string
  segments: GPXSegment[]
}

export interface ParsedGPXData {
  tracks: GPXTrack[]
  waypoints: GPXWaypoint[]
}

/**
 * Parsa il contenuto GPX da una stringa
 */
export function parseGPX(gpxContent: string): ParsedGPXData {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: true
  })
  
  const xmlDoc = parser.parse(gpxContent)
  
  if (!xmlDoc.gpx) {
    throw new Error('File non è un GPX valido')
  }

  const gpx = xmlDoc.gpx
  const result: ParsedGPXData = {
    tracks: [],
    waypoints: []
  }

  // Parsa le tracce (tracks)
  let tracks = gpx.trk
  if (!Array.isArray(tracks)) {
    tracks = tracks ? [tracks] : []
  }

  for (const track of tracks) {
    const gpxTrack: GPXTrack = {
      name: track.name || undefined,
      segments: []
    }

    let segments = track.trkseg
    if (!Array.isArray(segments)) {
      segments = segments ? [segments] : []
    }

    for (const segment of segments) {
      const gpxSegment: GPXSegment = {
        points: []
      }

      let trackPoints = segment.trkpt
      if (!Array.isArray(trackPoints)) {
        trackPoints = trackPoints ? [trackPoints] : []
      }

      for (const point of trackPoints) {
        const lat = parseFloat(point['@_lat'])
        const lon = parseFloat(point['@_lon'])
        
        if (isNaN(lat) || isNaN(lon)) {
          continue
        }

        const gpxPoint: GPXPoint = {
          lat,
          lon
        }

        // Aggiungi elevazione se presente
        if (point.ele) {
          const elevation = parseFloat(point.ele)
          if (!isNaN(elevation)) {
            gpxPoint.ele = elevation
          }
        }

        // Aggiungi timestamp se presente
        if (point.time) {
          gpxPoint.time = point.time
        }

        gpxSegment.points.push(gpxPoint)
      }

      if (gpxSegment.points.length > 0) {
        gpxTrack.segments.push(gpxSegment)
      }
    }

    if (gpxTrack.segments.length > 0) {
      result.tracks.push(gpxTrack)
    }
  }

  // Parsa i waypoints se presenti
  let waypoints = gpx.wpt
  if (!Array.isArray(waypoints)) {
    waypoints = waypoints ? [waypoints] : []
  }

  for (const wpt of waypoints) {
    const lat = parseFloat(wpt['@_lat'])
    const lon = parseFloat(wpt['@_lon'])
    
    if (!isNaN(lat) && !isNaN(lon)) {
      const waypoint: GPXWaypoint = { lat, lon }
      
      if (wpt.ele) {
        const elevation = parseFloat(wpt.ele)
        if (!isNaN(elevation)) {
          waypoint.ele = elevation
        }
      }
      
      if (wpt.time) {
        waypoint.time = wpt.time
      }
      
      if (wpt.name) {
        waypoint.name = wpt.name
      }
      
      result.waypoints.push(waypoint)
    }
  }

  return result
}

/**
 * Parse completo di un file GPX che estrae tracks, routes e waypoints
 */
export async function parseGPXFile(file: File): Promise<GPXParseResult> {
  let content: string
  let filename: string
  
  if (file && typeof file.text === 'function') {
    try {
      content = await file.text()
      filename = file.name
    } catch (error) {
      throw new Error('Unable to read file content: ' + (error as Error).message)
    }
  } else {
    throw new Error('Invalid file input: expected File object with .text() method')
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: true
  })
  
  const xmlDoc = parser.parse(content)
  
  if (!xmlDoc.gpx) {
    throw new Error('File non è un GPX valido')
  }

  const gpx = xmlDoc.gpx
  const tracks: GPXPoint[][] = []
  const routes: GPXRoute[] = []
  const waypoints: GPXWaypoint[] = []
  
  let totalDistance = 0
  let totalWaypoints = 0
  let elevationGain = 0
  let elevationLoss = 0
  let maxElevation = -Infinity
  let minElevation = Infinity
  let startTime: string | undefined
  let endTime: string | undefined

  // Parse tracks (tracciati)
  let gpxTracks = gpx.trk
  if (!Array.isArray(gpxTracks)) {
    gpxTracks = gpxTracks ? [gpxTracks] : []
  }

  for (const track of gpxTracks) {
    let segments = track.trkseg
    if (!Array.isArray(segments)) {
      segments = segments ? [segments] : []
    }

    for (const segment of segments) {
      let trackPoints = segment.trkpt
      if (!Array.isArray(trackPoints)) {
        trackPoints = trackPoints ? [trackPoints] : []
      }

      const trackPointsArray: GPXPoint[] = []
      let previousPoint: { lat: number; lon: number; ele?: number; time?: Date } | null = null

      for (const point of trackPoints) {
        const lat = parseFloat(point['@_lat'])
        const lon = parseFloat(point['@_lon'])
        
        if (isNaN(lat) || isNaN(lon)) continue

        const elevation = point.ele ? parseFloat(point.ele) : undefined
        const timeStr = point.time ? point.time : null
        const pointTime = timeStr ? new Date(timeStr) : undefined

        trackPointsArray.push({ lat, lon, elevation })
        totalWaypoints++

        // Calcoli per metadati
        if (elevation !== undefined && !isNaN(elevation)) {
          maxElevation = Math.max(maxElevation, elevation)
          minElevation = Math.min(minElevation, elevation)
        }

        if (pointTime && !isNaN(pointTime.getTime())) {
          const isoString = pointTime.toISOString().replace(/\.000Z$/, 'Z')
          if (!startTime) startTime = isoString
          endTime = isoString
        }

        if (previousPoint) {
          const distance = calculateDistance(previousPoint.lat, previousPoint.lon, lat, lon)
          totalDistance += distance

          if (previousPoint.ele !== undefined && elevation !== undefined) {
            const elevationDiff = elevation - previousPoint.ele
            if (Math.abs(elevationDiff) >= 3) {
              if (elevationDiff > 0) {
                elevationGain += elevationDiff
              } else {
                elevationLoss += Math.abs(elevationDiff)
              }
            }
          }
        }

        previousPoint = { lat, lon, ele: elevation, time: pointTime }
      }

      if (trackPointsArray.length > 0) {
        tracks.push(trackPointsArray)
      }
    }
  }

  // Parse routes (percorsi pianificati)
  let gpxRoutes = gpx.rte
  if (!Array.isArray(gpxRoutes)) {
    gpxRoutes = gpxRoutes ? [gpxRoutes] : []
  }

  for (const route of gpxRoutes) {
    let routePoints = route.rtept
    if (!Array.isArray(routePoints)) {
      routePoints = routePoints ? [routePoints] : []
    }

    const routePointsArray: GPXPoint[] = []
    let previousPoint: { lat: number; lon: number; ele?: number } | null = null

    for (const point of routePoints) {
      const lat = parseFloat(point['@_lat'])
      const lon = parseFloat(point['@_lon'])
      
      if (isNaN(lat) || isNaN(lon)) continue

      const elevation = point.ele ? parseFloat(point.ele) : undefined
      routePointsArray.push({ lat, lon, elevation })

      // Aggiungi alla distanza totale e conteggi
      if (previousPoint) {
        const distance = calculateDistance(previousPoint.lat, previousPoint.lon, lat, lon)
        totalDistance += distance
      }

      if (elevation !== undefined && !isNaN(elevation)) {
        maxElevation = Math.max(maxElevation, elevation)
        minElevation = Math.min(minElevation, elevation)
      }

      previousPoint = { lat, lon, ele: elevation }
    }

    if (routePointsArray.length > 0) {
      routes.push({
        name: route.name || `Route ${routes.length + 1}`,
        points: routePointsArray
      })
    }
  }

  // Parse waypoints
  let gpxWaypoints = gpx.wpt
  if (!Array.isArray(gpxWaypoints)) {
    gpxWaypoints = gpxWaypoints ? [gpxWaypoints] : []
  }

  for (const waypoint of gpxWaypoints) {
    const lat = parseFloat(waypoint['@_lat'])
    const lon = parseFloat(waypoint['@_lon'])
    
    if (isNaN(lat) || isNaN(lon)) continue

    const elevation = waypoint.ele ? parseFloat(waypoint.ele) : undefined
    const name = waypoint.name || undefined

    waypoints.push({ lat, lon, elevation, name })

    if (elevation !== undefined && !isNaN(elevation)) {
      maxElevation = Math.max(maxElevation, elevation)
      minElevation = Math.min(minElevation, elevation)
    }
  }

  // Crea metadati
  const metadata: GpxMetadata = {
    filename: filename,
    distance: parseFloat(totalDistance.toFixed(2)),
    waypoints: totalWaypoints
  }

  if (elevationGain > 0) metadata.elevationGain = Math.round(elevationGain)
  if (elevationLoss > 0) metadata.elevationLoss = Math.round(elevationLoss)
  if (maxElevation !== -Infinity) metadata.maxElevation = Math.round(maxElevation)
  if (minElevation !== Infinity) metadata.minElevation = Math.round(minElevation)
  if (startTime) metadata.startTime = startTime
  if (endTime) metadata.endTime = endTime

  if (startTime && endTime) {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationMs = end.getTime() - start.getTime()
    if (durationMs > 0) {
      metadata.duration = Math.round(durationMs / 1000)
    }
  }

  return {
    tracks,
    routes,
    waypoints,
    metadata
  }
}

/**
 * Parse completo del contenuto GPX da stringa che estrae tracks, routes e waypoints
 */
export function parseGPXContent(gpxContent: string, filename: string = 'unknown.gpx'): GPXParseResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: true
  })
  
  const xmlDoc = parser.parse(gpxContent)
  
  if (!xmlDoc.gpx) {
    throw new Error('File non è un GPX valido')
  }

  const gpx = xmlDoc.gpx
  const tracks: GPXPoint[][] = []
  const routes: GPXRoute[] = []
  const waypoints: GPXWaypoint[] = []
  
  let totalDistance = 0
  let totalWaypoints = 0
  let elevationGain = 0
  let elevationLoss = 0
  let maxElevation = -Infinity
  let minElevation = Infinity
  let startTime: string | undefined
  let endTime: string | undefined

  // Parse tracks (tracciati)
  let gpxTracks = gpx.trk
  if (!Array.isArray(gpxTracks)) {
    gpxTracks = gpxTracks ? [gpxTracks] : []
  }

  for (const track of gpxTracks) {
    let segments = track.trkseg
    if (!Array.isArray(segments)) {
      segments = segments ? [segments] : []
    }

    for (const segment of segments) {
      let trackPoints = segment.trkpt
      if (!Array.isArray(trackPoints)) {
        trackPoints = trackPoints ? [trackPoints] : []
      }

      const trackPointsArray: GPXPoint[] = []
      let previousPoint: { lat: number; lon: number; ele?: number; time?: Date } | null = null

      for (const point of trackPoints) {
        const lat = parseFloat(point['@_lat'])
        const lon = parseFloat(point['@_lon'])
        
        if (isNaN(lat) || isNaN(lon)) continue

        const elevation = point.ele ? parseFloat(point.ele) : undefined
        const timeStr = point.time ? point.time : null
        const pointTime = timeStr ? new Date(timeStr) : undefined

        trackPointsArray.push({ lat, lon, elevation })
        totalWaypoints++

        // Calcoli per metadati
        if (elevation !== undefined && !isNaN(elevation)) {
          maxElevation = Math.max(maxElevation, elevation)
          minElevation = Math.min(minElevation, elevation)
        }

        if (pointTime && !isNaN(pointTime.getTime())) {
          const isoString = pointTime.toISOString().replace(/\.000Z$/, 'Z')
          if (!startTime) startTime = isoString
          endTime = isoString
        }

        if (previousPoint) {
          const distance = calculateDistance(previousPoint.lat, previousPoint.lon, lat, lon)
          totalDistance += distance

          if (previousPoint.ele !== undefined && elevation !== undefined) {
            const elevationDiff = elevation - previousPoint.ele
            if (Math.abs(elevationDiff) >= 3) {
              if (elevationDiff > 0) {
                elevationGain += elevationDiff
              } else {
                elevationLoss += Math.abs(elevationDiff)
              }
            }
          }
        }

        previousPoint = { lat, lon, ele: elevation, time: pointTime }
      }

      if (trackPointsArray.length > 0) {
        tracks.push(trackPointsArray)
      }
    }
  }

  // Parse routes (percorsi pianificati)
  let gpxRoutes = gpx.rte
  if (!Array.isArray(gpxRoutes)) {
    gpxRoutes = gpxRoutes ? [gpxRoutes] : []
  }

  for (const route of gpxRoutes) {
    let routePoints = route.rtept
    if (!Array.isArray(routePoints)) {
      routePoints = routePoints ? [routePoints] : []
    }

    const routePointsArray: GPXPoint[] = []
    let previousPoint: { lat: number; lon: number; ele?: number } | null = null

    for (const point of routePoints) {
      const lat = parseFloat(point['@_lat'])
      const lon = parseFloat(point['@_lon'])
      
      if (isNaN(lat) || isNaN(lon)) continue

      const elevation = point.ele ? parseFloat(point.ele) : undefined
      routePointsArray.push({ lat, lon, elevation })

      // Aggiungi alla distanza totale e conteggi
      if (previousPoint) {
        const distance = calculateDistance(previousPoint.lat, previousPoint.lon, lat, lon)
        totalDistance += distance
      }

      if (elevation !== undefined && !isNaN(elevation)) {
        maxElevation = Math.max(maxElevation, elevation)
        minElevation = Math.min(minElevation, elevation)
      }

      previousPoint = { lat, lon, ele: elevation }
    }

    if (routePointsArray.length > 0) {
      routes.push({
        name: route.name || `Route ${routes.length + 1}`,
        points: routePointsArray
      })
    }
  }

  // Parse waypoints
  let gpxWaypoints = gpx.wpt
  if (!Array.isArray(gpxWaypoints)) {
    gpxWaypoints = gpxWaypoints ? [gpxWaypoints] : []
  }

  for (const waypoint of gpxWaypoints) {
    const lat = parseFloat(waypoint['@_lat'])
    const lon = parseFloat(waypoint['@_lon'])
    
    if (isNaN(lat) || isNaN(lon)) continue

    const elevation = waypoint.ele ? parseFloat(waypoint.ele) : undefined
    const name = waypoint.name || undefined

    waypoints.push({ lat, lon, elevation, name })

    if (elevation !== undefined && !isNaN(elevation)) {
      maxElevation = Math.max(maxElevation, elevation)
      minElevation = Math.min(minElevation, elevation)
    }
  }

  // Crea metadati
  const metadata: GpxMetadata = {
    filename: filename,
    distance: parseFloat(totalDistance.toFixed(2)),
    waypoints: totalWaypoints
  }

  if (elevationGain > 0) metadata.elevationGain = Math.round(elevationGain)
  if (elevationLoss > 0) metadata.elevationLoss = Math.round(elevationLoss)
  if (maxElevation !== -Infinity) metadata.maxElevation = Math.round(maxElevation)
  if (minElevation !== Infinity) metadata.minElevation = Math.round(minElevation)
  if (startTime) metadata.startTime = startTime
  if (endTime) metadata.endTime = endTime

  if (startTime && endTime) {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationMs = end.getTime() - start.getTime()
    if (durationMs > 0) {
      metadata.duration = Math.round(durationMs / 1000)
    }
  }

  return {
    tracks,
    routes,
    waypoints,
    metadata
  }
}
