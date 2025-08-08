'use client'

// DEPRECATO: Usa AutoLoadMapViewer dal nuovo sistema
// Questo componente è mantenuto per backward compatibility

import { AutoLoadMapViewer } from '@/components/maps'

interface GPXAutoMapViewerProps {
  gpxUrl: string
  tripTitle: string
  className?: string
}

/**
 * @deprecated Usa AutoLoadMapViewer invece
 * Componente per la visualizzazione automatica della mappa GPX
 * utilizzato nelle pagine di visualizzazione dei viaggi
 */
export default function GPXAutoMapViewer({ 
  gpxUrl, 
  tripTitle, 
  className = '' 
}: GPXAutoMapViewerProps) {
  return (
    <AutoLoadMapViewer
      gpxUrl={gpxUrl}
      tripTitle={tripTitle}
      className={className}
      height="h-96"
      showInfoFooter={true}
    />
  )
}
