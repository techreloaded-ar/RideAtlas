// src/components/EditTripForm.tsx
"use client";

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TripCreationData, Trip } from '@/types/trip';
import { useTripForm } from '@/hooks/useTripForm';
import { useToast } from '@/hooks/useToast';
import TripFormFields from './TripFormFields';

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
    submitForm,  } = useTripForm({
    mode: 'edit',
    tripId,
    initialData: initialData || undefined,
    onSuccess: () => {
      showSuccess('Viaggio aggiornato con successo!');
      router.push('/dashboard');
    }  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await submitForm();
  };
  const handleCancel = () => {
    router.push('/dashboard');
  };

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
  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 max-w-2xl mx-auto bg-white shadow-md rounded-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-700">Modifica Viaggio</h2>
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Annulla
        </button>
      </div>

      {error && <div className="p-3 bg-red-100 text-red-700 border border-red-400 rounded">{error}</div>}      <TripFormFields
        formData={formData}
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
      />

      <div className="flex gap-4 pt-5">
        <button
          type="button"
          onClick={handleCancel}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {isLoading ? 'Salvataggio...' : 'Salva Modifiche'}
        </button>
      </div>
    </form>
  );
};

export default EditTripForm;