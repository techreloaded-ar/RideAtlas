// src/components/TripFormContainer.tsx
"use client";

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TripCreationData, MediaItem, GpxFile, RecommendedSeason } from '@/types/trip';
import TripFormFields from './TripFormFields';

interface FormErrors {
  [key: string]: string[] | undefined;
}

interface TripFormContainerProps {
  // Dati e stato
  initialData: TripCreationData;
  mediaItems: MediaItem[];
  gpxFile: GpxFile | null;
  tagInput: string;
  fieldErrors: FormErrors | null;
  isLoading: boolean;
  // Handlers per i campi form
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleTagInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addTag: () => void;
  removeTag: (tag: string) => void;
  handleCharacteristicChange: (characteristic: string, checked: boolean) => void;
  handleSeasonChange: (season: RecommendedSeason, checked: boolean) => void;

  // Handlers per media e GPX
  addMedia: (mediaItem: Omit<MediaItem, 'id'>) => void;
  removeMedia: (mediaId: string) => void;
  updateMediaCaption: (mediaId: string, caption: string) => void;
  setGpxFile: (gpxFile: GpxFile) => void;
  removeGpxFile: () => void;

  // Submit e navigation
  onSubmit: (e: React.FormEvent) => Promise<void>;
  
  // Configurazione
  mode: 'create' | 'edit';
  tripId?: string;
  submitButtonText?: string;
  title?: string;
  showMediaUpload?: boolean;
  showGpxUpload?: boolean;
  showGpxPreview?: boolean;
}

const TripFormContainer: React.FC<TripFormContainerProps> = ({
  initialData,
  mediaItems,
  gpxFile,
  tagInput,
  fieldErrors,
  isLoading,
  handleChange,
  handleTagInputChange,
  addTag,
  removeTag,
  handleCharacteristicChange,
  handleSeasonChange,
  addMedia,
  removeMedia,
  updateMediaCaption,
  setGpxFile,
  removeGpxFile,
  onSubmit,
  mode,
  tripId,
  submitButtonText = mode === 'create' ? 'Crea Viaggio' : 'Aggiorna Viaggio',
  title = mode === 'create' ? 'Crea Nuovo Viaggio' : 'Modifica Viaggio',
  showMediaUpload = true,
  showGpxUpload = true,
  showGpxPreview = true,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enhanced submit handler con error handling e navigation
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isLoading) return;
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(e);
    } catch (error) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} trip:`, error);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, mode, isSubmitting, isLoading]);

  // Cancel handler
  const handleCancel = useCallback(() => {
    if (mode === 'edit' && tripId) {
      router.push(`/trips/${tripId}`);
    } else {
      router.push('/dashboard');
    }
  }, [mode, tripId, router]);

  const combinedIsLoading = isLoading || isSubmitting;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-gray-600">
            {mode === 'create' 
              ? 'Condividi la tua esperienza di viaggio con la community' 
              : 'Modifica i dettagli del tuo viaggio'
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-8 space-y-6">              <TripFormFields
                formData={initialData}
                mediaItems={mediaItems}
                gpxFile={gpxFile}
                tagInput={tagInput}
                fieldErrors={fieldErrors}
                isLoading={combinedIsLoading}
                handleChange={handleChange}
                handleTagInputChange={handleTagInputChange}
                addTag={addTag}
                removeTag={removeTag}
                handleCharacteristicChange={handleCharacteristicChange}
                handleSeasonChange={handleSeasonChange}
                addMedia={addMedia}
                removeMedia={removeMedia}
                updateMediaCaption={updateMediaCaption}
                setGpxFile={setGpxFile}
                removeGpxFile={removeGpxFile}
                showMediaUpload={showMediaUpload}
                showGpxUpload={showGpxUpload}
                showGpxPreview={showGpxPreview}
              />
            </div>

            {/* Footer con bottoni */}
            <div className="bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={combinedIsLoading}
                  className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={combinedIsLoading}
                  className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {combinedIsLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {mode === 'create' ? 'Creazione...' : 'Salvataggio...'}
                    </div>
                  ) : (
                    submitButtonText
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Loading overlay per feedback visivo */}
        {combinedIsLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mr-3"></div>
                <span className="text-gray-700">
                  {mode === 'create' ? 'Creazione viaggio in corso...' : 'Salvataggio modifiche...'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripFormContainer;