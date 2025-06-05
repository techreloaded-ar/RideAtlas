// src/components/maps/index.ts
/**
 * Export centralizzato per tutti i componenti mappa
 * Migliora l'organizzazione e facilita l'import
 */

// Componente base unificato
export { default as UnifiedGPXMapViewer } from '../UnifiedGPXMapViewer'

// Componenti specializzati
export { default as SimpleMapViewer } from './SimpleMapViewer'
export { default as InteractiveMapModal } from './InteractiveMapModal'
export { default as AutoLoadMapViewer } from './AutoLoadMapViewer'

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

/**
 * Componenti legacy per backward compatibility
 * Deprecati - usare i nuovi componenti sopra
 */
export { default as GPXMapViewer } from '../GPXMapViewer'
export { default as GPXAutoMapViewer } from '../GPXAutoMapViewer'
