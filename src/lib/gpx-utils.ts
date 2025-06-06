// src/lib/gpx-utils.ts - Unified GPX Processing Library
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
 * Interface for GPX structure from XML parser
 */
interface GPXStructure {
  wpt?: GPXPointData | GPXPointData[]
  trk?: GPXTrackData | GPXTrackData[]
  rte?: GPXRouteData | GPXRouteData[]
}

interface GPXPointData {
  '@_lat'?: string
  '@_lon'?: string
  ele?: string | number
  time?: string
  name?: string
}

interface GPXTrackData {
  name?: string
  trkseg?: GPXTrackSegmentData | GPXTrackSegmentData[]
}

interface GPXTrackSegmentData {
  trkpt?: GPXPointData | GPXPointData[]
}

interface GPXRouteData {
  name?: string
  rtept?: GPXPointData | GPXPointData[]
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
 * Shared XML parser configuration
 */
const XML_PARSER_CONFIG = {
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true
}

/**
 * Calcola la distanza tra due punti geografici usando la formula haversine
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
  
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Parse coordinates from GPX point with validation
 */
function parseCoordinates(point: { '@_lat'?: string; '@_lon'?: string }): { lat: number; lon: number; valid: boolean } {
  const lat = parseFloat(point['@_lat'] || '')
  const lon = parseFloat(point['@_lon'] || '')
  return {
    lat,
    lon,
    valid: !isNaN(lat) && !isNaN(lon)
  }
}

/**
 * Parse elevation from GPX point
 */
function parseElevation(point: { ele?: string | number }): number | undefined {
  if (!point.ele) return undefined
  const elevation = typeof point.ele === 'string' ? parseFloat(point.ele) : point.ele
  return isNaN(elevation) ? undefined : elevation
}

/**
 * Parse timestamp from GPX point
 */
function parseTimestamp(point: GPXPointData): { date: Date | undefined; isoString: string | undefined } {
  if (!point.time) return { date: undefined, isoString: undefined }
  
  const date = new Date(point.time)
  if (isNaN(date.getTime())) return { date: undefined, isoString: undefined }
  
  const isoString = date.toISOString().replace(/\.000Z$/, 'Z')
  return { date, isoString }
}

/**
 * Normalize array helper - ensures input is always an array
 */
function normalizeArray<T>(input: T | T[] | undefined): T[] {
  if (!input) return []
  return Array.isArray(input) ? input : [input]
}

/**
 * Count actual waypoint elements from GPX structure (FIX: counts <wpt> elements, not track points)
 */
function countActualWaypoints(gpx: GPXStructure): number {
  const waypoints = normalizeArray(gpx.wpt)
  return waypoints.filter(wpt => {
    const coords = parseCoordinates(wpt)
    return coords.valid
  }).length
}

/**
 * Parse waypoints from GPX structure
 */
function parseWaypoints(gpx: GPXStructure): GPXWaypoint[] {
  const waypoints = normalizeArray(gpx.wpt)
  const result: GPXWaypoint[] = []

  for (const wpt of waypoints) {
    const coords = parseCoordinates(wpt)
    if (!coords.valid) continue

    const waypoint: GPXWaypoint = {
      lat: coords.lat,
      lon: coords.lon
    }

    const elevation = parseElevation(wpt)
    if (elevation !== undefined) {
      waypoint.elevation = elevation
    }

    if (wpt.name) {
      waypoint.name = wpt.name
    }

    result.push(waypoint)
  }

  return result
}

/**
 * Calculate elevation metrics with noise filtering
 */
function calculateElevationMetrics(
  currentElevation: number,
  previousElevation: number,
  elevationGain: number,
  elevationLoss: number,
  maxElevation: number,
  minElevation: number
): {
  elevationGain: number
  elevationLoss: number
  maxElevation: number
  minElevation: number
} {
  const elevationDiff = currentElevation - previousElevation
  const threshold = 3 // 3m threshold to reduce GPS noise
  
  let newElevationGain = elevationGain
  let newElevationLoss = elevationLoss
  
  if (Math.abs(elevationDiff) >= threshold) {
    if (elevationDiff > 0) {
      newElevationGain += elevationDiff
    } else {
      newElevationLoss += Math.abs(elevationDiff)
    }
  }

  return {
    elevationGain: newElevationGain,
    elevationLoss: newElevationLoss,
    maxElevation: Math.max(maxElevation, currentElevation),
    minElevation: Math.min(minElevation, currentElevation)
  }
}

/**
 * Core GPX parsing function - processes tracks and routes with shared logic
 */
function parseTracksAndRoutes(gpx: GPXStructure): {
  tracks: GPXPoint[][]
  routes: GPXRoute[]
  totalDistance: number
  elevationGain: number
  elevationLoss: number
  maxElevation: number
  minElevation: number
  startTime: string | undefined
  endTime: string | undefined
} {
  const tracks: GPXPoint[][] = []
  const routes: GPXRoute[] = []
  
  let totalDistance = 0
  let elevationGain = 0
  let elevationLoss = 0
  let maxElevation = -Infinity
  let minElevation = Infinity
  let startTime: string | undefined
  let endTime: string | undefined

  // Parse tracks (tracciati)
  const gpxTracks = normalizeArray(gpx.trk)
  
  for (const track of gpxTracks) {
    const segments = normalizeArray(track.trkseg)

    for (const segment of segments) {
      const trackPoints = normalizeArray(segment.trkpt)
      const trackPointsArray: GPXPoint[] = []
      let previousPoint: { lat: number; lon: number; ele?: number; time?: Date } | null = null

      for (const point of trackPoints) {
        const coords = parseCoordinates(point)
        if (!coords.valid) continue

        const elevation = parseElevation(point)
        const timestamp = parseTimestamp(point)

        trackPointsArray.push({ 
          lat: coords.lat, 
          lon: coords.lon, 
          elevation 
        })

        // Update elevation bounds
        if (elevation !== undefined) {
          maxElevation = Math.max(maxElevation, elevation)
          minElevation = Math.min(minElevation, elevation)
        }

        // Update time range
        if (timestamp.isoString) {
          if (!startTime) startTime = timestamp.isoString
          endTime = timestamp.isoString
        }

        // Calculate distance and elevation changes
        if (previousPoint) {
          const distance = calculateDistance(previousPoint.lat, previousPoint.lon, coords.lat, coords.lon)
          totalDistance += distance

          if (previousPoint.ele !== undefined && elevation !== undefined) {
            const metrics = calculateElevationMetrics(
              elevation, previousPoint.ele, elevationGain, elevationLoss, maxElevation, minElevation
            )
            elevationGain = metrics.elevationGain
            elevationLoss = metrics.elevationLoss
            maxElevation = metrics.maxElevation
            minElevation = metrics.minElevation
          }
        }

        previousPoint = { 
          lat: coords.lat, 
          lon: coords.lon, 
          ele: elevation, 
          time: timestamp.date 
        }
      }

      if (trackPointsArray.length > 0) {
        tracks.push(trackPointsArray)
      }
    }
  }

  // Parse routes (percorsi pianificati)
  const gpxRoutes = normalizeArray(gpx.rte)

  for (const route of gpxRoutes) {
    const routePoints = normalizeArray(route.rtept)
    const routePointsArray: GPXPoint[] = []
    let previousPoint: { lat: number; lon: number; ele?: number } | null = null

    for (const point of routePoints) {
      const coords = parseCoordinates(point)
      if (!coords.valid) continue

      const elevation = parseElevation(point)
      routePointsArray.push({ 
        lat: coords.lat, 
        lon: coords.lon, 
        elevation 
      })

      // Update distance and elevation bounds
      if (previousPoint) {
        const distance = calculateDistance(previousPoint.lat, previousPoint.lon, coords.lat, coords.lon)
        totalDistance += distance
      }

      if (elevation !== undefined) {
        maxElevation = Math.max(maxElevation, elevation)
        minElevation = Math.min(minElevation, elevation)
      }

      previousPoint = { lat: coords.lat, lon: coords.lon, ele: elevation }
    }

    if (routePointsArray.length > 0) {
      routes.push({
        name: route.name || `Route ${routes.length + 1}`,
        points: routePointsArray
      })
    }
  }

  return {
    tracks,
    routes,
    totalDistance,
    elevationGain,
    elevationLoss,
    maxElevation,
    minElevation,
    startTime,
    endTime
  }
}

/**
 * Create metadata object from parsed data
 */
function createMetadata(
  filename: string,
  waypointCount: number,
  totalDistance: number,
  elevationGain: number,
  elevationLoss: number,
  maxElevation: number,
  minElevation: number,
  startTime: string | undefined,
  endTime: string | undefined
): GpxMetadata {
  const metadata: GpxMetadata = {
    filename,
    distance: parseFloat(totalDistance.toFixed(2)),
    waypoints: waypointCount  // FIX: Now correctly counts <wpt> elements
  }

  // Add optional metadata
  if (elevationGain > 0) metadata.elevationGain = Math.round(elevationGain)
  if (elevationLoss > 0) metadata.elevationLoss = Math.round(elevationLoss)
  if (maxElevation !== -Infinity) metadata.maxElevation = Math.round(maxElevation)
  if (minElevation !== Infinity) metadata.minElevation = Math.round(minElevation)
  if (startTime) metadata.startTime = startTime
  if (endTime) metadata.endTime = endTime

  // Calculate duration if we have start and end time
  if (startTime && endTime) {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationMs = end.getTime() - start.getTime()
    if (durationMs > 0) {
      metadata.duration = Math.round(durationMs / 1000)
    }
  }

  return metadata
}

/**
 * Parse GPX content from string - UNIFIED core parsing function
 */
function parseGPXCore(gpxContent: string, filename: string): GPXParseResult {
  const parser = new XMLParser(XML_PARSER_CONFIG)
  const xmlDoc = parser.parse(gpxContent)
  
  if (!xmlDoc.gpx) {
    throw new Error('File non è un GPX valido')
  }

  const gpx: GPXStructure = xmlDoc.gpx

  // Parse all components using shared logic
  const trackAndRouteData = parseTracksAndRoutes(gpx)
  const waypoints = parseWaypoints(gpx)
  
  // FIX: Count actual waypoints, not track points
  const waypointCount = countActualWaypoints(gpx)

  const metadata = createMetadata(
    filename,
    waypointCount,
    trackAndRouteData.totalDistance,
    trackAndRouteData.elevationGain,
    trackAndRouteData.elevationLoss,
    trackAndRouteData.maxElevation,
    trackAndRouteData.minElevation,
    trackAndRouteData.startTime,
    trackAndRouteData.endTime
  )

  return {
    tracks: trackAndRouteData.tracks,
    routes: trackAndRouteData.routes,
    waypoints,
    metadata
  }
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
      throw new Error('Unable to read file content: ' + (error as Error).message)
    }
  } else {
    throw new Error('Invalid file input: expected File object with .text() method')
  }

  // Use unified core parsing function
  const result = parseGPXCore(content, filename)
  return result.metadata
}

/**
 * Parse completo del contenuto GPX da stringa che estrae tracks, routes e waypoints
 */
export function parseGPXContent(gpxContent: string, filename: string = 'unknown.gpx'): GPXParseResult {
  return parseGPXCore(gpxContent, filename)
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

// NOTE: Removed duplicate and unused functions:
// - parseGPX (unused, now replaced by parseGPXCore)
// - parseGPXFile (unused, functionality merged into parseGpxMetadata)
