'use client';

import { useState } from 'react';
import { Stage, StageCreationData } from '@/types/trip';
import { useStageEditor } from '@/hooks/useStageEditor';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { XMarkIcon, PhotoIcon, DocumentIcon, ChevronDownIcon, ChevronUpIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface StageEditorProps {
  tripId: string;
  stageId?: string;
  initialData?: Stage;
  existingStages?: Stage[]; // Per calcolare automaticamente orderIndex
  onSave: (stageData: StageCreationData) => void;
  onCancel: () => void;
  onDelete?: () => void;
}


export default function StageEditor({
  tripId,
  stageId,
  initialData,
  existingStages = [],
  onSave,
  onCancel,
  onDelete
}: StageEditorProps) {
  const isEditMode = !!stageId && !!initialData;
  
  // Hook per gestione business logic
  const { 
    form,
    isLoading, 
    isSaving,
    isUploading,
    saveStage,
    errors,
    clearErrors
  } = useStageEditor({ 
    tripId, 
    stageId, 
    existingStages,
    autoFetch: !!stageId 
  });
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    description: true,
    media: false,
    gpx: false
  });

  // Destructure form methods from hook
  const {
    register,
    handleSubmit,
    formState: { errors: formErrors, isSubmitting },
    setValue,
    watch
  } = form;

  // Initialize media upload hook
  const mediaHook = useMediaUpload({
    currentMedia: Array.isArray(watch('media')) ? watch('media') : [],
    currentGpx: watch('gpxFile') || null,
    onMediaUpdate: (newMedia) => setValue('media', newMedia),
    onGpxUpdate: (newGpx) => setValue('gpxFile', newGpx),
  });

  // Toggle section visibility
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // File upload handlers from hook
  const { handleImageUpload, handleGpxUpload, removeExistingMedia, updateMediaCaption } = mediaHook;

  // Submit handler
  const onSubmit = async (data: Omit<Stage, 'id' | 'tripId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const savedStage = await saveStage();
      if (savedStage) {
        onSave(data); // Callback per parent component
      }
    } catch (error) {
      // Error già gestito dal hook
      console.error('Errore salvataggio tappa:', error);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!stageId || !onDelete) return;
    
    if (confirm('Sei sicuro di voler eliminare questa tappa? L\'operazione non può essere annullata.')) {
      onDelete(); // La logica di eliminazione è gestita dal parent
    }
  };


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          {isEditMode ? 'Modifica Tappa' : 'Nuova Tappa'}
        </h3>
        <div className="flex gap-2">
          {isEditMode && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading || isSaving}
              className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Elimina
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded border border-gray-300"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoading || isSaving || mediaHook.isUploading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || isLoading || isSaving ? 'Salvataggio...' : 'Salva Tappa'}
          </button>
        </div>
      </div>

      {/* Error message */}
      {(errors.form || errors.save || errors.upload) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-sm text-red-700">
                {errors.form || errors.save || errors.upload}
              </span>
            </div>
            <button
              onClick={clearErrors}
              className="text-red-600 hover:text-red-700"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Progress bar during upload */}
      {(isUploading || isSaving) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-blue-700">
              {isSaving ? 'Salvataggio in corso...' : 'Upload in corso...'}
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse w-full" />
          </div>
        </div>
      )}

      {/* Basic Information Section */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <button
          type="button"
          onClick={() => toggleSection('basic')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
        >
          <h4 className="font-medium text-gray-900">Informazioni Base</h4>
          {expandedSections.basic ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
        </button>
        
        {expandedSections.basic && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titolo Tappa *
              </label>
              <input
                type="text"
                {...register('title', { 
                  required: 'Titolo richiesto',
                  maxLength: { value: 200, message: 'Titolo troppo lungo (max 200 caratteri)' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Es: Da Cortina d'Ampezzo al Passo Giau"
              />
              {formErrors.title && (
                <p className="mt-1 text-sm text-red-600">{formErrors.title.message}</p>
              )}
            </div>


            {/* Route Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo di Percorso
              </label>
              <textarea
                {...register('routeType', {
                  maxLength: { value: 500, message: 'Descrizione troppo lunga (max 500 caratteri)' }
                })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Es: Percorso misto: 60% strade di montagna, 30% statali..."
              />
              {formErrors.routeType && (
                <p className="mt-1 text-sm text-red-600">{formErrors.routeType.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Description Section */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <button
          type="button"
          onClick={() => toggleSection('description')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
        >
          <h4 className="font-medium text-gray-900">Descrizione</h4>
          {expandedSections.description ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
        </button>
        
        {expandedSections.description && (
          <div className="p-4 border-t border-gray-200">
            <textarea
              {...register('description', {
                maxLength: { value: 5000, message: 'Descrizione troppo lunga (max 5000 caratteri)' }
              })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descrivi il percorso, i punti di interesse, consigli utili..."
            />
            {formErrors.description && (
              <p className="mt-1 text-sm text-red-600">{formErrors.description.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Media Section */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <button
          type="button"
          onClick={() => toggleSection('media')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
        >
          <h4 className="font-medium text-gray-900">Immagini e Media</h4>
          {expandedSections.media ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
        </button>
        
        {expandedSections.media && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            {/* Existing Media Display */}
            {isEditMode && Array.isArray(watch('media')) && watch('media').length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Immagini {watch('media')?.length > 0 && watch('media')[0] && (
                    <span className="text-sm text-gray-500">(la prima sarà l&apos;immagine principale)</span>
                  )}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {watch('media')?.map((media, mediaIndex) => (
                    <div key={media.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="relative">
                        <img
                          src={media.url}
                          alt={media.caption || 'Immagine tappa'}
                          className="w-full h-24 object-cover"
                        />
                        {mediaIndex === 0 && (
                          <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                            Principale
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeExistingMedia(media.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-3">
                        <input
                          type="text"
                          value={media.caption || ''}
                          onChange={(e) => updateMediaCaption(media.id, e.target.value)}
                          placeholder="Aggiungi una didascalia..."
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Error Display */}
            {mediaHook.uploadError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="text-red-600 text-sm">
                    <strong>Errore upload:</strong> {mediaHook.uploadError}
                  </div>
                </div>
              </div>
            )}

            {/* Unified Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isEditMode && watch('media')?.length > 0 ? 'Aggiungi altre immagini' : 'Carica immagini'}
              </label>
              <div className={`border-2 border-dashed rounded-lg p-6 ${
                mediaHook.isUploading 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              } transition-colors`}>
                <div className="text-center">
                  {mediaHook.isUploading ? (
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  ) : (
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                  )}
                  <div className="mt-4">
                    <label htmlFor="images" className={mediaHook.isUploading ? 'cursor-not-allowed' : 'cursor-pointer'}>
                      <span className={`mt-2 block text-sm font-medium ${
                        mediaHook.isUploading ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        {mediaHook.isUploading ? 'Caricamento in corso...' : 'Seleziona immagini'}
                      </span>
                      <input
                        id="images"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e)}
                        className="sr-only"
                        disabled={mediaHook.isUploading}
                      />
                    </label>
                    <p className="mt-1 text-sm text-gray-500">PNG, JPG, WebP fino a 10MB ciascuna. La prima immagine sarà quella principale.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* GPX Section */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <button
          type="button"
          onClick={() => toggleSection('gpx')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
        >
          <h4 className="font-medium text-gray-900">File GPX</h4>
          {expandedSections.gpx ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
        </button>
        
        {expandedSections.gpx && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            {/* Current GPX (Edit Mode) */}
            {isEditMode && watch('gpxFile') && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DocumentIcon className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">
                      {watch('gpxFile')?.filename}
                    </span>
                  </div>
                  <span className="text-sm text-green-600">File attuale</span>
                </div>
              </div>
            )}

            {/* GPX Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isEditMode ? 'Sostituisci File GPX' : 'Carica File GPX'}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="gpx-file" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Seleziona file GPX
                      </span>
                      <input
                        id="gpx-file"
                        type="file"
                        accept=".gpx"
                        onChange={handleGpxUpload}
                        className="sr-only"
                      />
                    </label>
                    <p className="mt-1 text-sm text-gray-500">Solo file .gpx fino a 5MB</p>
                  </div>
                </div>
              </div>
              
              {mediaHook.gpxFileName && (
                <div className="mt-3 flex items-center text-sm text-gray-600">
                  <DocumentIcon className="w-4 h-4 mr-1" />
                  File selezionato: {mediaHook.gpxFileName}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </form>
  );
}