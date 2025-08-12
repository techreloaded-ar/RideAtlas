'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import Image from 'next/image';
import { MediaItem } from '@/types/trip';
import { VideoConsentBanner } from './VideoConsentBanner';
import { cookieConsentService, CookieCategory } from '@/lib/cookie-consent';

interface ImageData {
  src: string;
  alt: string;
}

interface UnifiedMediaGalleryProps {
  media: (MediaItem | ImageData)[];
}

const isMediaItem = (item: MediaItem | ImageData): item is MediaItem => {
  return 'type' in item;
};

const extractYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
};

const getYouTubeThumbnail = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

export function UnifiedMediaGallery({ media }: UnifiedMediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [hasExternalVideosConsent, setHasExternalVideosConsent] = useState(false);

  // Check consent status on mount and listen for changes
  useEffect(() => {
    const updateConsentStatus = () => {
      setHasExternalVideosConsent(cookieConsentService.hasConsent(CookieCategory.EXTERNAL_VIDEOS));
    };

    updateConsentStatus();
    const unsubscribe = cookieConsentService.onConsentChange(updateConsentStatus);

    return unsubscribe;
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? media.length - 1 : prevIndex - 1
    );
    setActiveVideoId(null);
  }, [media.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === media.length - 1 ? 0 : prevIndex + 1
    );
    setActiveVideoId(null);
  }, [media.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setActiveVideoId(null);
  }, []);

  const handleVideoPlay = useCallback((videoUrl: string) => {
    const videoId = extractYouTubeId(videoUrl);
    if (videoId && hasExternalVideosConsent) {
      setActiveVideoId(videoId);
    }
  }, [hasExternalVideosConsent]);

  const handleVideoConsent = useCallback((videoUrl: string) => {
    const videoId = extractYouTubeId(videoUrl);
    if (videoId) {
      setActiveVideoId(videoId);
    }
  }, []);

  const handleManagePreferences = useCallback(() => {
    window.open('/cookie-settings', '_blank');
  }, []);

  if (!media || media.length === 0) return null;

  const currentItem = media[currentIndex];

  const renderMainContent = () => {
    if (isMediaItem(currentItem)) {
      // MediaItem (da upload form)
      if (currentItem.type === 'image') {
        return (
          <Image
            src={currentItem.url}
            alt={currentItem.caption || "Immagine del viaggio"}
            fill
            className="object-cover transition-opacity duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={currentIndex === 0}
          />
        );
      } else {
        // Video YouTube
        const videoId = extractYouTubeId(currentItem.url);
        
        if (activeVideoId === videoId) {
          // Mostra iframe YouTube
          return (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
              title={currentItem.caption || "Video del viaggio"}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          );
        } else if (!hasExternalVideosConsent) {
          // Mostra banner consenso GDPR
          const thumbnailUrl = currentItem.thumbnailUrl || (videoId ? getYouTubeThumbnail(videoId) : '');
          
          return (
            <VideoConsentBanner
              thumbnailUrl={thumbnailUrl}
              videoTitle={currentItem.caption}
              onAccept={() => handleVideoConsent(currentItem.url)}
              onManagePreferences={handleManagePreferences}
            />
          );
        } else {
          // Mostra thumbnail con play button (consenso già dato)
          const thumbnailUrl = currentItem.thumbnailUrl || (videoId ? getYouTubeThumbnail(videoId) : '');
          
          return (
            <div 
            className="relative w-full h-full cursor-pointer" 
            onClick={() => handleVideoPlay(currentItem.url)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleVideoPlay(currentItem.url)}
            aria-label="Riproduci video"
          >
              {thumbnailUrl && (
                <Image
                  src={thumbnailUrl}
                  alt={currentItem.caption || "Video del viaggio"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              )}
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center hover:bg-opacity-40 transition-all duration-200">
                <div className="bg-red-600 hover:bg-red-700 rounded-full p-4 shadow-lg transform hover:scale-105 transition-all duration-200">
                  <Play className="w-8 h-8 text-white ml-1" fill="white" />
                </div>
              </div>
            </div>
          );
        }
      }
    } else {
      // ImageData (formato legacy da pagina trip)
      return (
        <Image
          src={currentItem.src}
          alt={currentItem.alt}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={currentIndex === 0}
        />
      );
    }
  };

  const renderThumbnail = (item: MediaItem | ImageData, index: number) => {
    if (isMediaItem(item)) {
      // MediaItem
      if (item.type === 'image') {
        return (
          <Image
            src={item.url}
            alt={item.caption || `Thumbnail ${index + 1}`}
            fill
            className="object-cover"
            sizes="80px"
          />
        );
      } else {
        // Video thumbnail
        const videoId = extractYouTubeId(item.url);
        const thumbnailUrl = item.thumbnailUrl || (videoId ? getYouTubeThumbnail(videoId) : '');
        
        return (
          <div className="relative w-full h-full">
            {thumbnailUrl && (
              <Image
                src={thumbnailUrl}
                alt={`Video thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
              <Play className="w-4 h-4 text-white" fill="white" />
            </div>
          </div>
        );
      }
    } else {
      // ImageData
      return (
        <Image
          src={item.src}
          alt={item.alt}
          fill
          className="object-cover"
          sizes="80px"
        />
      );
    }
  };

  return (
    <div className="mb-8">
      {/* Main Media Container */}
      <div className="relative group">
        <div className="relative w-full aspect-[3/2] rounded overflow-hidden">
          {renderMainContent()}
        </div>
        
        {/* Navigation Arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-md p-2 border border-gray-200 shadow-sm z-10"
              aria-label="Media precedente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-md p-2 border border-gray-200 shadow-sm z-10"
              aria-label="Media successivo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Media Counter */}
        {media.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm z-10">
            {currentIndex + 1} / {media.length}
          </div>
        )}
      </div>

      {/* Caption */}
      {isMediaItem(currentItem) && currentItem.caption && (
        <div className="mt-2 text-center text-sm italic text-gray-600">
          {currentItem.caption}
        </div>
      )}

      {/* Thumbnail Navigation */}
      {media.length > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {media.map((item, index) => (
            <button
              key={isMediaItem(item) ? `media-${item.id}` : `legacy-${index}`}
              onClick={() => goToSlide(index)}
              className={`flex-shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition-all duration-200 relative ${
                index === currentIndex 
                  ? 'border-blue-600 opacity-100' 
                  : 'border-gray-200 opacity-70 hover:opacity-100'
              }`}
              aria-label={`Vai al media ${index + 1}`}
            >
              {renderThumbnail(item, index)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}