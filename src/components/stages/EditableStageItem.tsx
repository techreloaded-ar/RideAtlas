"use client";

import { useState } from 'react';
import { type StageCreationData } from '@/schemas/trip';
import { GripVertical } from 'lucide-react'; // Import GripVertical for drag handle
import { PhotoIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline'; // Import icons
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'; // Import Dnd-kit types
import { Transform } from '@dnd-kit/utilities'; // Import Dnd-kit types

interface EditableStageItemProps {
  stage: StageCreationData;
  index: number;
  onUpdate: (updatedStage: Partial<StageCreationData>) => void;
  onDelete: () => void;
  isLoading: boolean;
  // Props for dnd-kit
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners; // Changed type for listeners
  setNodeRef?: (node: HTMLElement | null) => void;
  transform?: Transform | null;
  transition?: string;
  isDragging?: boolean;
}
export const EditableStageItem = ({
  stage,
  index,
  onUpdate,
  onDelete,
  isLoading,
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
}: EditableStageItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize media upload hook
  const mediaHook = useMediaUpload({
    currentMedia: Array.isArray(stage.media) ? stage.media : [],
    currentGpx: stage.gpxFile || null,
    onMediaUpdate: (newMedia) => onUpdate({ media: newMedia }),
    onGpxUpdate: (newGpx) => onUpdate({ gpxFile: newGpx }),
  });

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform || null),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-gray-200 rounded-lg relative ${isDragging ? 'z-50' : ''}`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-4 z-10 p-2 cursor-grab active:cursor-grabbing bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        style={{ marginLeft: '-40px' }}
        role="button"
        tabIndex={0}
        aria-label={`Riordina tappa: ${stage.title}`}
      >
        <GripVertical className="w-4 h-4 text-gray-400" aria-hidden="true" />
      </div>

      {/* Header della stage */}
      <div
        className="px-4 py-3 cursor-pointer hover:bg-gray-50 pl-12" // Adjusted padding for drag handle
        onClick={toggleExpansion}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-800 rounded-full flex items-center justify-center text-sm font-medium">
              {index + 1}
            </span>
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                {stage.title || `Tappa ${index + 1}`}
              </h4>
              {stage.description && (
                <p className="text-xs text-gray-500 mt-1 truncate max-w-md">
                  {stage.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={isLoading}
              className="text-red-400 hover:text-red-600 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Contenuto espanso della stage */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200">
          <div className="space-y-4 pt-4">
            {/* Titolo della tappa */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Titolo della tappa
              </label>
              <input
                type="text"
                value={stage.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder={`Tappa ${index + 1}`}
                disabled={isLoading}
              />
            </div>

            {/* Descrizione della tappa */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Descrizione
              </label>
              <textarea
                value={stage.description || ''}
                onChange={(e) => onUpdate({ description: e.target.value })}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Descrizione della tappa..."
                disabled={isLoading}
              />
            </div>

            {/* Tipo di percorso */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo di percorso
              </label>
              <select
                value={stage.routeType || 'road'}
                onChange={(e) => onUpdate({ routeType: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                disabled={isLoading}
              >
                <option value="road">Strada</option>
                <option value="highway">Autostrada</option>
                <option value="mountain">Montagna</option>
                <option value="coastal">Costiero</option>
                <option value="urban">Urbano</option>
                <option value="mixed">Misto</option>
              </select>
            </div>

            {/* Media Section */}
            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">Immagini e Media</h5>
                
                {/* Existing Media Display */}
                {stage.media && Array.isArray(stage.media) && stage.media.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Immagini {stage.media.length > 0 && stage.media[0] && (
                        <span className="text-xs text-gray-500">(la prima sarà l&apos;immagine principale)</span>
                      )}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stage.media.map((media, mediaIndex) => (
                        <div key={media.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="relative">
                            <img
                              src={media.url}
                              alt={media.caption || 'Immagine tappa'}
                              className="w-full h-20 object-cover"
                            />
                            {mediaIndex === 0 && (
                              <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                                Principale
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => mediaHook.removeExistingMedia(media.id)}
                              disabled={isLoading}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 disabled:opacity-50"
                            >
                              <XMarkIcon className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="p-2">
                            <input
                              type="text"
                              value={media.caption || ''}
                              onChange={(e) => mediaHook.updateMediaCaption(media.id, e.target.value)}
                              placeholder="Aggiungi una didascalia..."
                              disabled={isLoading}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Error Display */}
                {mediaHook.uploadError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <div className="text-red-600 text-sm">
                        <strong>Errore upload:</strong> {mediaHook.uploadError}
                      </div>
                    </div>
                  </div>
                )}

                {/* Unified Image Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {stage.media && stage.media.length > 0 ? 'Aggiungi altre immagini' : 'Carica immagini'}
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-4 ${
                    mediaHook.isUploading 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  } transition-colors`}>
                    <div className="text-center">
                      {mediaHook.isUploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      ) : (
                        <PhotoIcon className="mx-auto h-8 w-8 text-gray-400" />
                      )}
                      <div className="mt-2">
                        <label htmlFor={`images-${index}`} className={mediaHook.isUploading ? 'cursor-not-allowed' : 'cursor-pointer'}>
                          <span className={`text-sm font-medium ${
                            mediaHook.isUploading ? 'text-gray-400' : 'text-gray-900'
                          }`}>
                            {mediaHook.isUploading ? 'Caricamento in corso...' : 'Seleziona immagini'}
                          </span>
                          <input
                            id={`images-${index}`}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => mediaHook.handleImageUpload(e)}
                            className="sr-only"
                            disabled={isLoading || mediaHook.isUploading}
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP fino a 10MB ciascuna. La prima immagine sarà quella principale.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* GPX Section */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">File GPX</h5>
                
                {/* Current GPX Display */}
                {stage.gpxFile && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <DocumentIcon className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-800">
                          {stage.gpxFile.filename}
                        </span>
                      </div>
                      <span className="text-xs text-green-600">File attuale</span>
                    </div>
                  </div>
                )}

                {/* GPX Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {stage.gpxFile ? 'Sostituisci File GPX' : 'Carica File GPX'}
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <div className="text-center">
                      <DocumentIcon className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="mt-2">
                        <label htmlFor={`gpx-file-${index}`} className="cursor-pointer">
                          <span className="text-sm font-medium text-gray-900">
                            Seleziona file GPX
                          </span>
                          <input
                            id={`gpx-file-${index}`}
                            type="file"
                            accept=".gpx"
                            onChange={mediaHook.handleGpxUpload}
                            className="sr-only"
                            disabled={isLoading}
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">Solo file .gpx fino a 5MB</p>
                      </div>
                    </div>
                  </div>
                  
                  {mediaHook.gpxFileName && (
                    <div className="mt-2 flex items-center text-sm text-gray-600">
                      <DocumentIcon className="w-4 h-4 mr-1" />
                      File selezionato: {mediaHook.gpxFileName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Re-export CSS from dnd-kit/utilities for use in SortableStageItem
import { CSS } from '@dnd-kit/utilities';
