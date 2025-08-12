// src/components/maps/index.ts
/**
 * Export centralizzato per tutti i componenti mappa
 * Migliora l'organizzazione e facilita l'import
 */

// Componenti base
export { default as GPXMapViewer } from '@/components/maps/GPXMapViewer'
export { default as SafeGPXMapViewer } from '@/components/maps/SafeGPXMapViewer'

// Componenti specializzati rimossi - utilizzavano sistema deprecato

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
export { useGPXMap } from '@/hooks/maps/useGPXMap'

// Retrocompatibilità temporanea
export { default as UnifiedGPXMapViewer } from '@/components/maps/GPXMapViewer'

// NOTA: Componenti rimossi (non utilizzati):
// - SimpleMapViewer, InteractiveMapModal, AutoLoadMapViewer
// - FullscreenMapModal, MapWithFullscreen, GPXMapViewer.client
// Utilizzare GPXMapViewer e SafeGPXMapViewer per tutte le esigenze di visualizzazione mappe
