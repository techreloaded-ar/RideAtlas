'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
  }>;
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (images.length === 0) return null;

  return (
    <div className="mb-8">
      {/* Main Image Container */}
      <div className="relative group">
        <div className="relative w-full aspect-[3/2] rounded overflow-hidden">
          <Image
            src={images[currentIndex].src}
            alt={images[currentIndex].alt}
            fill
            className="object-cover transition-opacity duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={currentIndex === 0}
          />
        </div>
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-md p-2 border border-gray-200 shadow-sm"
              aria-label="Immagine precedente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-md p-2 border border-gray-200 shadow-sm"
              aria-label="Immagine successiva"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`flex-shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition-all duration-200 relative ${
                index === currentIndex 
                  ? 'border-blue-600 opacity-100' 
                  : 'border-gray-200 opacity-70 hover:opacity-100'
              }`}
              aria-label={`Vai all'immagine ${index + 1}`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}