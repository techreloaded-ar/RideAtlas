"use client";

import { memo } from 'react';
import { MediaItem } from '@/types/trip';
import { useMediaUpload, UseMediaUploadConfig } from '@/hooks/useMediaUpload';
import { MediaItemComponent } from './MediaItem';
import { ImageUploadZone } from './ImageUploadZone';
import { YouTubeUpload } from './YouTubeUpload';
import { ErrorDisplay } from './ErrorDisplay';

// Constants
const MEDIA_UPLOAD_CONSTANTS = {
  DEFAULT_MAX_IMAGE_SIZE: 10,
  ASPECT_RATIO: '[3/2]',
  GRID_COLS: {
    DEFAULT: 'grid-cols-1',
    MD: 'md:grid-cols-2', 
    LG: 'lg:grid-cols-3'
  }
} as const;

interface MediaUploadProps {
  /** Array of current media items to display */
  mediaItems: MediaItem[];
  /** Callback for adding a single media item */
  onAddMedia: (media: Omit<MediaItem, 'id'>) => void;
  /** Optional callback for adding multiple media items efficiently */
  onAddMultipleMedia?: (mediaList: Omit<MediaItem, 'id'>[]) => void;
  /** Callback for removing a media item by ID */
  onRemoveMedia: (mediaId: string) => void;
  /** Callback for updating media item caption */
  onUpdateCaption: (mediaId: string, caption: string) => void;
  /** Upload configuration options */
  config?: UseMediaUploadConfig;
  /** Additional CSS classes */
  className?: string;
}

const MediaUpload = memo(function MediaUpload({
  mediaItems,
  onAddMedia,
  onAddMultipleMedia,
  onRemoveMedia,
  onUpdateCaption,
  config = {},
  className = '',
}: MediaUploadProps) {
  const {
    enableYoutube = true,
    maxImageSize = 10,
  } = config;

  // Initialize media upload hook
  const mediaHook = useMediaUpload({
    currentMedia: Array.isArray(mediaItems) ? mediaItems : [],
    onMediaUpdate: (newMedia) => {
      // Handle media additions by calling the callback for new items
      const currentIds = new Set(mediaItems.map(m => m.id));
      const newItems = newMedia.filter(m => !currentIds.has(m.id));
      
      if (newItems.length > 0) {
        const newMediaItems = newItems.map(item => ({
          type: item.type,
          url: item.url,
          caption: item.caption,
          thumbnailUrl: item.thumbnailUrl,
        }));
        
        // Use batch callback if available and multiple items, otherwise use single callback
        if (onAddMultipleMedia && newItems.length > 1) {
          onAddMultipleMedia(newMediaItems);
        } else {
          // For single items or when batch callback not available, use single callback
          newMediaItems.forEach(item => onAddMedia(item));
        }
      }
    },
    config,
  });

  const {
    isUploading,
    uploadError,
    isDragOver,
    youtubeUrl,
    setYoutubeUrl,
    handleImageUpload,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleYouTubeAdd,
  } = mediaHook;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Error Display */}
      {uploadError && <ErrorDisplay error={uploadError} />}

      {/* Main Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Multimedia</h3>
        
        {/* Image Upload with Drag & Drop */}
        <ImageUploadZone
          isUploading={isUploading}
          isDragOver={isDragOver}
          maxImageSize={maxImageSize}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onFileSelect={handleImageUpload}
        />

        {/* YouTube Upload (if enabled) */}
        {enableYoutube && (
          <YouTubeUpload
            youtubeUrl={youtubeUrl}
            isUploading={isUploading}
            onUrlChange={setYoutubeUrl}
            onAdd={handleYouTubeAdd}
          />
        )}

      </div>

      {/* Media Items Display */}
      {mediaItems.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Media Aggiunti ({mediaItems.length})</h4>
          <div className={`grid ${MEDIA_UPLOAD_CONSTANTS.GRID_COLS.DEFAULT} ${MEDIA_UPLOAD_CONSTANTS.GRID_COLS.MD} ${MEDIA_UPLOAD_CONSTANTS.GRID_COLS.LG} gap-4`}>
            {mediaItems.map((item, index) => (
              <MediaItemComponent
                key={item.id}
                item={item}
                index={index}
                onRemove={onRemoveMedia}
                onUpdateCaption={onUpdateCaption}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default MediaUpload;