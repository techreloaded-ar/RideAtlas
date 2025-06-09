// src/components/EditTripForm.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TripCreationData, Trip } from '@/types/trip';
import { useTripForm } from '@/hooks/useTripForm';
import { useToast } from '@/hooks/useToast';
import TripFormContainer from './TripFormContainer';

interface EditTripFormProps {
  tripId: string;
}

const EditTripForm = ({ tripId }: EditTripFormProps) => {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  
  const [initialData, setInitialData] = useState<Partial<TripCreationData & Pick<Trip, 'id'>> | null>(null);
  const [loadingTrip, setLoadingTrip] = useState(true);
  const [tripError, setTripError] = useState('');

  const fetchTrip = useCallback(async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}`);
      
      if (response.status === 403) {
        setTripError('Non hai i permessi per modificare questo viaggio');
        return;
      }
      
      if (response.status === 404) {
        setTripError('Viaggio non trovato');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento del viaggio');
      }
      
      const tripData = await response.json();
      setInitialData(tripData);
    } catch (err) {
      setTripError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoadingTrip(false);
    }
  }, [tripId]);

  // Fetch trip data on mount
  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  const {
    formData,
    mediaItems,
    gpxFile,
    tagInput,
    error,
    fieldErrors,
    isLoading,
    handleChange,
    handleTagInputChange,
    addTag,
    removeTag,
    handleCharacteristicChange,
    addMedia,
    removeMedia,
    updateMediaCaption,
    setGpxFile,
    removeGpxFile,
    submitForm,
  } = useTripForm({
    mode: 'edit',
    tripId,
    initialData: initialData || undefined,
    onSuccess: () => {
      showSuccess('Viaggio aggiornato con successo!');
      router.push('/dashboard');
    }
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm();
  }, [submitForm]);

  // Loading state while fetching trip
  if (loadingTrip) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Caricamento viaggio...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (tripError) {
    // Show toast for permission/not found errors and redirect
    if (tripError.includes('permessi')) {
      showError(tripError);
      router.push('/dashboard');
      return null;
    }
    if (tripError.includes('non trovato')) {
      showError(tripError);
      router.push('/dashboard');
      return null;
    }
    
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">Errore nel caricamento</div>
            <div className="text-sm text-gray-500 mb-4">{tripError}</div>
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Torna alla Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render TripFormContainer for edit mode
  return (
    <>
      {error && (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 mb-4">
          <div className="p-3 bg-red-100 text-red-700 border border-red-400 rounded">
            {error}
          </div>
        </div>
      )}
      <TripFormContainer
        initialData={formData}
        mediaItems={mediaItems}
        gpxFile={gpxFile || null}
        tagInput={tagInput}
        fieldErrors={fieldErrors}
        isLoading={isLoading}
        handleChange={handleChange}
        handleTagInputChange={handleTagInputChange}
        addTag={addTag}
        removeTag={removeTag}
        handleCharacteristicChange={handleCharacteristicChange}
        addMedia={addMedia}
        removeMedia={removeMedia}
        updateMediaCaption={updateMediaCaption}
        setGpxFile={setGpxFile}
        removeGpxFile={removeGpxFile}
        onSubmit={handleSubmit}
        mode="edit"
        tripId={tripId}
        title="Modifica Viaggio"
        submitButtonText="Salva Modifiche"
      />
    </>
  );
};

export default EditTripForm;