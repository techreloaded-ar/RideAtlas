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
}

export interface GPXData {
  points: GPXPoint[]
  routes: GPXRoute[]
  waypoints: GPXWaypoint[]
}

export interface MapConfig {
  className?: string
  height?: string | number
  showControls?: boolean
  showInfoFooter?: boolean
  enableFullscreen?: boolean
  enableDownload?: boolean
  autoFit?: boolean
  defaultCenter?: [number, number]
  defaultZoom?: number
  showLayerControls?: boolean
  defaultShowTrack?: boolean
  defaultShowRoutes?: boolean
  defaultShowWaypoints?: boolean
}

export interface MapViewerProps extends MapConfig {
  gpxData: GPXPoint[]
  routes?: GPXRoute[]
  waypoints?: GPXWaypoint[]
  title?: string
  onDownload?: () => void
  onFullscreenClick?: () => void
}
