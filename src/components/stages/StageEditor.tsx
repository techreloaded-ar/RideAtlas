'use client';

import { useState } from 'react';
import { Stage, MediaItem, StageCreationData } from '@/types/trip';
import { useStageEditor } from '@/hooks/useStageEditor';
import { PlusIcon, XMarkIcon, PhotoIcon, DocumentIcon, ChevronDownIcon, ChevronUpIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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

  // File upload states
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [gpxFileName, setGpxFileName] = useState<string>(initialData?.gpxFile?.filename || '');

  // Toggle section visibility
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle file uploads
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, isMainImage?: boolean) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Basic validation
    if (!file.type.startsWith('image/')) {
      alert('Seleziona solo file immagine');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      alert('Il file deve essere massimo 10MB');
      return;
    }

    // Set form value - aggiungi al campo media esistente
    const currentMedia = watch('media') || [];
    // Per ora creiamo un placeholder MediaItem - dovremmo fare l'upload del file
    const newMediaItem: MediaItem = {
      id: `temp-${Date.now()}`, // ID temporaneo
      type: file.type.startsWith('image/') ? 'image' : 'video',
      url: URL.createObjectURL(file), // URL temporaneo per preview
      caption: isMainImage ? 'Immagine principale' : ''
    };
    setValue('media', [...currentMedia, newMediaItem]);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreviewImages(prev => [...prev, e.target!.result as string]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGpxUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.gpx')) {
      alert('Seleziona solo file GPX');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('Il file GPX deve essere massimo 5MB');
      return;
    }

    // TODO: Implementare upload GPX e creazione oggetto GpxFile
    // Per ora salviamo solo il nome file
    setGpxFileName(file.name);
  };

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

  // Remove existing media - utilizza la funzione dell'hook
  const removeExistingMedia = (mediaId: string) => {
    // Utilizza il metodo dell'hook useStageEditor
    // removeMedia(mediaId); // Questo potrebbe non funzionare per media esistenti
    // Per ora manteniamo la logica esistente
    const currentMedia = watch('media') || [];
    setValue('media', currentMedia.filter(m => m.id !== mediaId));
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
            disabled={isSubmitting || isLoading || isSaving}
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
            {/* Main Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Immagine Principale
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="main-image" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Carica immagine principale
                      </span>
                      <input
                        id="main-image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, true)}
                        className="sr-only"
                      />
                    </label>
                    <p className="mt-1 text-sm text-gray-500">PNG, JPG, WebP fino a 10MB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Existing Media (Edit Mode) */}
            {isEditMode && watch('media')?.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Immagini Esistenti
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {watch('media')?.map((media) => (
                    <div key={media.id} className="relative">
                      <img
                        src={media.url}
                        alt={media.caption || 'Immagine tappa'}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingMedia(media.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Images Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Galleria Immagini Aggiuntive
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <PlusIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="gallery-images" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Aggiungi più immagini
                      </span>
                      <input
                        id="gallery-images"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e)}
                        className="sr-only"
                      />
                    </label>
                    <p className="mt-1 text-sm text-gray-500">Seleziona più file (max 20 immagini totali)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview of new images */}
            {previewImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anteprima Nuove Immagini
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {previewImages.map((preview, index) => (
                    <img
                      key={index}
                      src={preview}
                      alt={`Anteprima ${index + 1}`}
                      className="w-full h-24 object-cover rounded border"
                    />
                  ))}
                </div>
              </div>
            )}
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
              
              {gpxFileName && (
                <div className="mt-3 flex items-center text-sm text-gray-600">
                  <DocumentIcon className="w-4 h-4 mr-1" />
                  File selezionato: {gpxFileName}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </form>
  );
}