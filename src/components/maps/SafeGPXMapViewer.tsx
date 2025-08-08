// src/components/SafeGPXMapViewer.tsx
'use client'

import { useState } from 'react'
import { ErrorBoundary, MapErrorFallback } from '@/components/ui/ErrorBoundary'
import GPXMapViewer from '@/components/maps/GPXMapViewer'
import { MapViewerProps } from '@/types/gpx'

export default function SafeGPXMapViewer(props: MapViewerProps) {
  const [retryKey, setRetryKey] = useState(0)

  const handleRetry = () => {
    setRetryKey(prev => prev + 1)
  }

  return (
    <ErrorBoundary
      key={retryKey}
      fallback={<MapErrorFallback onRetry={handleRetry} />}
    >
      <GPXMapViewer {...props} />
    </ErrorBoundary>
  )
}