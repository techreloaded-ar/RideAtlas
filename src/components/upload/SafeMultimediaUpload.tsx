// src/components/SafeMultimediaUpload.tsx
"use client";

import { useState } from 'react'
import { ErrorBoundary, MediaErrorFallback } from '@/components/ui/ErrorBoundary'
import MultimediaUpload from '@/components/upload/MultimediaUpload'
import { MediaItem } from '@/types/trip'

interface SafeMultimediaUploadProps {
  mediaItems: MediaItem[];
  onAddMedia: (media: Omit<MediaItem, 'id'>) => void;
  onRemoveMedia: (mediaId: string) => void;
  onUpdateCaption: (mediaId: string, caption: string) => void;
}

export default function SafeMultimediaUpload(props: SafeMultimediaUploadProps) {
  const [retryKey, setRetryKey] = useState(0)

  const handleRetry = () => {
    setRetryKey(prev => prev + 1)
  }

  return (
    <ErrorBoundary
      key={retryKey}
      fallback={<MediaErrorFallback onRetry={handleRetry} />}
    >
      <MultimediaUpload {...props} />
    </ErrorBoundary>
  )
}