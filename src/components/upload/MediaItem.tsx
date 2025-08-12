"use client";

import { memo } from 'react';
import { MediaItem as MediaItemType } from '@/types/trip';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface MediaItemProps {
  item: MediaItemType;
  index: number;
  onRemove: (mediaId: string) => void;
  onUpdateCaption: (mediaId: string, caption: string) => void;
}

export const MediaItemComponent = memo(({ 
  item, 
  index, 
  onRemove, 
  onUpdateCaption 
}: MediaItemProps) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Media Preview */}
      <div className="relative aspect-[3/2] bg-gray-100">
        {item.type === 'image' ? (
          <img
            src={item.url}
            alt={item.caption || 'Immagine'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt={item.caption || 'Video thumbnail'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-white text-center">
                <svg className="mx-auto h-8 w-8 mb-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <p className="text-xs">Video YouTube</p>
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <svg className="h-12 w-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
        
        {/* Main image indicator */}
        {index === 0 && (
          <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
            Principale
          </div>
        )}
        
        {/* Remove button */}
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
          aria-label={`Rimuovi ${item.type === 'image' ? 'immagine' : 'video'}`}
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Caption */}
      <div className="p-3 space-y-2">
        <input
          type="text"
          value={item.caption || ''}
          onChange={(e) => onUpdateCaption(item.id, e.target.value)}
          placeholder="Aggiungi una didascalia..."
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Didascalia media"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 capitalize">
            {item.type === 'image' ? 'Immagine' : 'Video YouTube'}
          </span>
        </div>
      </div>
    </div>
  );
});

MediaItemComponent.displayName = 'MediaItemComponent';