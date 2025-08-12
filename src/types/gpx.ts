// src/types/gpx.ts
/**
 * Tipi condivisi per i componenti GPX/Mappa
 * Centralizza le definizioni per migliorare la coerenza e manutenibilità
 */

export interface GPXPoint {
  lat: number
  lng: number
  elevation?: number
}

export interface GPXWaypoint {
  lat: number
  lng: number
  name?: string
  elevation?: number
}

export interface GPXRoute {
  name?: string
  points: GPXPoint[]
  color?: string
}

export interface GPXTrack {
  name?: string
  points: GPXPoint[]
  color?: string
}

export interface GPXData {
  tracks: GPXTrack[]
  routes: GPXRoute[]
  waypoints: GPXWaypoint[]
}

export interface MapConfig {
  className?: string
  height?: string | number
  showControls?: boolean
  enableFullscreen?: boolean
  enableDownload?: boolean
  autoFit?: boolean
  defaultCenter?: [number, number]
  defaultZoom?: number
  showLayerControls?: boolean
  defaultShowTracks?: boolean
  defaultShowRoutes?: boolean
  defaultShowWaypoints?: boolean
  isFullscreenMode?: boolean
}

export interface GpxFile {
  filename: string
  distance: number
  waypoints: number
  elevationGain?: number
  keyPoints?: GPXPoint[]
  isValid: boolean
}

export interface MapViewerProps extends MapConfig {
  tracks?: GPXTrack[]
  routes?: GPXRoute[]
  waypoints?: GPXWaypoint[]
  title?: string
  onDownload?: () => void
  onFullscreenClick?: () => void
  onFullscreenClose?: () => void
  // Legacy support
  gpxData?: GPXPoint[]
}
