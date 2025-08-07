// src/components/maps/index.ts
/**
 * Export centralizzato per tutti i componenti mappa
 * Migliora l'organizzazione e facilita l'import
 */

// Componente base principale
export { default as GPXMapViewer } from '../GPXMapViewer'

// Componenti specializzati
export { default as SimpleMapViewer } from './SimpleMapViewer'
export { default as InteractiveMapModal } from './InteractiveMapModal'
export { default as AutoLoadMapViewer } from './AutoLoadMapViewer'
export { default as FullscreenMapModal } from './FullscreenMapModal'
export { default as MapWithFullscreen } from './MapWithFullscreen'

// Tipi condivisi
export type {
  GPXPoint,
  GPXWaypoint,
  GPXRoute,
  GPXData,
  MapConfig,
  MapViewerProps
} from '@/types/gpx'

// Hook migliorato
export { useGPXMap } from '@/hooks/useGPXMap'

// Retrocompatibilità temporanea
export { default as UnifiedGPXMapViewer } from '../GPXMapViewer'
