'use client';

import { useState } from 'react';
import { Stage } from '@/types/trip';
import { ChevronDown, ChevronRight, MapPin } from 'lucide-react';
import { UnifiedMediaGallery } from '@/components/ui/UnifiedMediaGallery';
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

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
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
              {stage.gpxFile?.distance != 0 && stage.gpxFile?.distance && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{(stage.gpxFile.distance / 1000).toFixed(1)} km</span>
                </div>
              )}
              {stage.description && (
              <p className="text-sm text-gray-600 truncate max-w-md">
                {stage.description}
              </p>
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
            {stage.gpxFile?.distance != 0 && stage.gpxFile?.distance && (
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
            <div>
              <UnifiedMediaGallery media={stage.media} />
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