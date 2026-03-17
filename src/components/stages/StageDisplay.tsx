'use client';

import { useState } from 'react';
import { Stage } from '@/types/trip';
import { ChevronDown, MapPin, Clock } from 'lucide-react';
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
  const contentId = `stage-content-${stage.id}`;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`mb-4 overflow-hidden rounded-xl border transition-all duration-200 ${
      isExpanded
        ? 'border-emerald-300 bg-white shadow-md shadow-emerald-100/60'
        : 'border-gray-200 bg-white hover:border-emerald-200 hover:shadow-sm'
    }`}>
      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        className={`w-full text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
          isExpanded ? 'bg-emerald-50/80' : 'bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center gap-4 p-4">
          <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border text-sm font-semibold transition-colors ${
            isExpanded
              ? 'border-emerald-300 bg-white text-emerald-700'
              : 'border-gray-200 bg-white text-gray-600'
          }`}>
            {stageNumber}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-lg font-semibold text-gray-900">
                {stage.title}
              </h3>
              <span className={`hidden rounded-full px-2.5 py-1 text-[11px] font-medium sm:inline-flex ${
                isExpanded
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {isExpanded ? 'Dettagli aperti' : 'Dettagli disponibili'}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
              {stage.gpxFile?.distance != 0 && stage.gpxFile?.distance && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{(stage.gpxFile.distance / 1000).toFixed(1)} km</span>
                </div>
              )}
              {stage.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{stage.duration}</span>
                </div>
              )}
            </div>
          </div>

          <div className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
            isExpanded
              ? 'border-emerald-200 bg-white text-emerald-700'
              : 'border-gray-200 bg-white text-gray-600'
          }`}>
            <span className="hidden sm:inline">{isExpanded ? 'Chiudi' : 'Apri'}</span>
            <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : 'rotate-0'
            }`} />
          </div>
        </div>
      </button>

      <div
        id={contentId}
        className={`overflow-hidden border-t border-transparent transition-all duration-300 ease-in-out ${
        isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
      } ${isExpanded ? 'border-emerald-100' : ''}`}>
        <div className="p-4 space-y-6">
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

          {stage.description && (
            <div>
              <h4 className="font-bold text-sm text-gray-700 mb-2">Descrizione:</h4>
              <p className="leading-relaxed text-gray-800">{stage.description}</p>
            </div>
          )}

          {stage.media && stage.media.length > 0 && (
            <div>
              <UnifiedMediaGallery media={stage.media} />
            </div>
          )}

          {stage.gpxFile && stage.gpxFile.isValid && (
            <div>
              <GPXSectionStage
                gpxUrl={stage.gpxFile.url}
                filename={stage.gpxFile.filename}
                onDownload={() => {
                  
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
