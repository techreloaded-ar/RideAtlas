// src/components/MediaGallery.tsx
"use client";

import { useState } from 'react';
import { MediaItem } from '@/types/trip';

interface MediaGalleryProps {
  media: MediaItem[];
}

const MediaGallery: React.FC<MediaGalleryProps> = ({ media }) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  
  if (!media || media.length === 0) {
    return null;
  }

  const activeItem = media[activeIndex];
  
  const handlePrevious = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
  };
  
  const handleNext = () => {
    setActiveIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-gray-100">
        {activeItem.type === 'image' ? (
          <img 
            src={activeItem.url}
            alt={activeItem.caption || "Immagine del viaggio"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full">
            <iframe
              src={activeItem.url}
              title={activeItem.caption || "Video del viaggio"}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        )}
        
        {media.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-opacity"
              aria-label="Precedente"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-opacity"
              aria-label="Successivo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>
      
      {activeItem.caption && (
        <div className="text-center text-sm italic text-gray-600">
          {activeItem.caption}
        </div>
      )}
      
      {media.length > 1 && (
        <div className="flex overflow-x-auto gap-2 py-2">
          {media.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setActiveIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${index === activeIndex ? 'border-blue-500' : 'border-transparent'}`}
            >
              {item.type === 'image' ? (
                <img
                  src={item.url}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaGallery;
