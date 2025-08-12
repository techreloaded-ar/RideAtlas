// src/components/SafeMultimediaUpload.tsx
"use client";

import { useState } from 'react'
import { ErrorBoundary, MediaErrorFallback } from '@/components/ui/ErrorBoundary'
import MediaUpload from '@/components/upload/MediaUpload'
import { MediaItem } from '@/types/trip'
import { UseMediaUploadConfig } from '@/hooks/useMediaUpload'

interface SafeMultimediaUploadProps {
  mediaItems: MediaItem[];
  onAddMedia: (media: Omit<MediaItem, 'id'>) => void;
  onRemoveMedia: (mediaId: string) => void;
  onUpdateCaption: (mediaId: string, caption: string) => void;
  config?: UseMediaUploadConfig;
  className?: string;
}

export default function SafeMediaUpload(props: SafeMultimediaUploadProps) {
  const [retryKey, setRetryKey] = useState(0)

  const handleRetry = () => {
    setRetryKey(prev => prev + 1)
  }

  return (
    <ErrorBoundary
      key={retryKey}
      fallback={<MediaErrorFallback onRetry={handleRetry} />}
    >
      <MediaUpload {...props} />
    </ErrorBoundary>
  )
}