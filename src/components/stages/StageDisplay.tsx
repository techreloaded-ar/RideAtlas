'use client';

import { Stage } from '@/types/trip';
import { Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';
import GPXSectionStage from './GPXSectionStage';

interface StageDisplayProps {
  stage: Stage;
  index: number;
  isEditable?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function StageDisplay({
  stage,
  index,
  isEditable = false,
  onEdit,
  onDelete
}: StageDisplayProps) {
  const stageNumber = index + 1;

  return (
    <div className="pb-8 mb-8 border-b border-gray-200 last:border-b-0 last:pb-0 last:mb-0">
      {/* Titolo con numerazione */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">
          Tappa {stageNumber}: {stage.title}
        </h3>
        
        {isEditable && (
          <div className="flex space-x-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 text-gray-500 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md"
                title="Modifica tappa"
                aria-label={`Modifica tappa ${stageNumber}: ${stage.title}`}
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 text-gray-500 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md"
                title="Elimina tappa"
                aria-label={`Elimina tappa ${stageNumber}: ${stage.title}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Metadati strutturati - Design responsive */}
      <div className="space-y-1 mb-6">
        {stage.gpxFile?.distance && (
          <div className="flex flex-col sm:flex-row sm:items-center text-sm">
            <span className="font-medium text-gray-700 sm:w-32 flex-shrink-0">Distanza:</span>
            <span className="text-gray-900 mt-1 sm:mt-0">{stage.gpxFile.distance} m</span>
          </div>
        )}
        
        {stage.gpxFile?.duration && (
          <div className="flex flex-col sm:flex-row sm:items-center text-sm">
            <span className="font-medium text-gray-700 sm:w-32 flex-shrink-0">Durata stimata:</span>
            <span className="text-gray-900 mt-1 sm:mt-0">{Math.round(stage.gpxFile.duration / 60)} min</span>
          </div>
        )}
        
        {stage.gpxFile?.elevationGain && (
          <div className="flex flex-col sm:flex-row sm:items-center text-sm">
            <span className="font-medium text-gray-700 sm:w-32 flex-shrink-0">Dislivello:</span>
            <span className="text-gray-900 mt-1 sm:mt-0">{stage.gpxFile.elevationGain} m</span>
          </div>
        )}
        
        {stage.routeType && (
          <div className="flex flex-col sm:flex-row sm:items-start text-sm">
            <span className="font-medium text-gray-700 sm:w-32 flex-shrink-0">Tipo di percorso:</span>
            <span className="text-gray-900 mt-1 sm:mt-0">{stage.routeType}</span>
          </div>
        )}
      </div>

      {/* Descrizione */}
      {stage.description && (
        <div className="mb-6">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {stage.description}
          </p>
        </div>
      )}

      {/* Immagine principale - Performance optimized */}
      {stage.media && stage.media.length > 0 && (
        <div className="mb-6">
          <div className="relative w-full h-64 rounded-lg overflow-hidden">
            <Image
              src={stage.media[0].url}
              alt={stage.media[0].caption || `Immagine tappa ${stageNumber}`}
              fill
              className="object-cover"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          {stage.media[0].caption && (
            <p className="text-sm text-gray-600 mt-2 text-center italic">
              {stage.media[0].caption}
            </p>
          )}
        </div>
      )}

      {/* Sezione GPX con nuovo componente */}
      {stage.gpxFile && stage.gpxFile.isValid && (
        <GPXSectionStage
          gpxUrl={stage.gpxFile.url}
          filename={stage.gpxFile.filename}
          onDownload={() => {
            // TODO: Implementare logica di download
            console.log('Download GPX:', stage.gpxFile?.filename);
            // Per ora apre il link in una nuova finestra
            if (stage.gpxFile?.url) {
              window.open(stage.gpxFile.url, '_blank');
            }
          }}
        />
      )}

      {/* Galleria immagini aggiuntive - Performance optimized */}
      {stage.media && stage.media.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-3">Galleria</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stage.media.map((media, mediaIndex) => (
              <div key={media.id} className="relative aspect-square rounded-lg overflow-hidden">
                <Image
                  src={media.url}
                  alt={media.caption || `Immagine ${mediaIndex + 1} della tappa ${stageNumber}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}