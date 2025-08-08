'use client';

import { useState } from 'react';
import { Stage } from '@/types/trip';
import { ChevronDown, ChevronRight, ChevronLeft, MapPin, Clock } from 'lucide-react';
import Image from 'next/image';
import GPXSectionStage from '@/components/stages/GPXSectionStage';

interface StageDisplayProps {
  stage: Stage;
  index: number;
}

export default function StageDisplay({
  stage,
  index
}: StageDisplayProps) {
  const stageNumber = index + 1;
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Filtra solo le immagini (escludendo i video)
  const images = stage.media?.filter(media => media.type === 'image') || [];
  
  const goToPrevious = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
      {/* Header collassabile */}
      <div 
        className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
        onClick={toggleExpanded}
      >
        <div className="flex items-center space-x-3 flex-1">
          <button
            onClick={toggleExpanded}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label={isExpanded ? "Comprimi tappa" : "Espandi tappa"}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </button>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Tappa {stageNumber}: {stage.title}
            </h3>
            
            {/* Info compatte nell'header */}
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
              {stage.gpxFile?.distance && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{(stage.gpxFile.distance / 1000).toFixed(1)} km</span>
                </div>
              )}
              {stage.duration && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{stage.duration}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenuto collassabile */}
      <div className={`transition-all duration-300 ease-in-out ${
        isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
      } overflow-hidden`}>
        <div className="p-4 space-y-6">
          {/* Informazioni dettagliate */}
          <div className="space-y-2">
            {stage.gpxFile?.distance && (
              <div className="text-sm text-gray-700">
                <span className="font-bold">Distanza:</span> {(stage.gpxFile.distance / 1000).toFixed(1)} km
              </div>
            )}
            
            {stage.duration && (
              <div className="text-sm text-gray-700">
                <span className="font-bold">Durata:</span> {stage.duration}
              </div>
            )}
            
            {stage.gpxFile?.elevationGain && (
              <div className="text-sm text-gray-700">
                <span className="font-bold">Dislivello:</span> {stage.gpxFile.elevationGain} m
              </div>
            )}
            
            {stage.routeType && (
              <div className="text-sm text-gray-700">
                <span className="font-bold">Tipo di percorso:</span> {stage.routeType}
              </div>
            )}
          </div>

          {/* Descrizione */}
          {stage.description && (
            <div>
              <h4 className="font-bold text-sm text-gray-700 mb-2">Descrizione:</h4>
              <p className="leading-relaxed text-gray-800">{stage.description}</p>
            </div>
          )}

          {/* Stage Media */}
          {stage.media && stage.media.length > 0 && (
            <div className="space-y-4">
              {/* Video section (se presente) */}
              {stage.media.some(media => media.type === 'video') && (
                <div>
                  {stage.media
                    .filter(media => media.type === 'video')
                    .slice(0, 1) // Mostriamo solo il primo video
                    .map((video, idx) => (
                      <div key={idx} className="relative w-full aspect-[3/2] rounded overflow-hidden">
                        <iframe
                          src={video.url}
                          title={video.caption || stage.title}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ))}
                </div>
              )}
              
              {/* Images Gallery */}
              {images.length > 0 && (
                <div className="relative group">
                  <div className="relative w-full aspect-[3/2] rounded overflow-hidden">
                    <Image
                      src={images[currentImageIndex].url}
                      alt={images[currentImageIndex].caption || stage.title}
                      fill
                      className="object-cover transition-opacity duration-300"
                      loading="lazy"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  )}
                  
                  {/* Image Caption */}
                  {images[currentImageIndex].caption && (
                    <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-md text-sm max-w-xs">
                      {images[currentImageIndex].caption}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sezione GPX */}
          {stage.gpxFile && stage.gpxFile.isValid && (
            <div>
              <GPXSectionStage
                gpxUrl={stage.gpxFile.url}
                filename={stage.gpxFile.filename}
                onDownload={() => {
                  console.log('Download GPX:', stage.gpxFile?.filename);
                  if (stage.gpxFile?.url) {
                    window.open(stage.gpxFile.url, '_blank');
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}