// src/components/EditTripForm.tsx
"use client";

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RecommendedSeason, TripCreationData, Trip } from '@/types/trip';
import { useTripForm } from '@/hooks/useTripForm';
import { useToast } from '@/hooks/useToast';
import MultimediaUpload from './MultimediaUpload';
import GPXUpload from './GPXUpload';

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
  }, [fetchTrip]);  const {
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

  const characteristicOptions = [
    'Strade sterrate',
    'Curve strette',
    'No pedaggi',
    'No Autostrada',
    'Bel paesaggio'
  ];

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

      {error && <div className="p-3 bg-red-100 text-red-700 border border-red-400 rounded">{error}</div>}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titolo</label>
        <input
          type="text"
          name="title"
          id="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        />
        {fieldErrors?.title && <p className="text-xs text-red-500 mt-1">{fieldErrors.title.join(', ')}</p>}
      </div>

      <div>
        <label htmlFor="summary" className="block text-sm font-medium text-gray-700">Sommario</label>
        <textarea
          name="summary"
          id="summary"
          value={formData.summary}
          onChange={handleChange}
          rows={3}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        />
        {fieldErrors?.summary && <p className="text-xs text-red-500 mt-1">{fieldErrors.summary.join(', ')}</p>}
      </div>

      <div>
        <label htmlFor="destination" className="block text-sm font-medium text-gray-700">Destinazione/Area Geografica</label>
        <input
          type="text"
          name="destination"
          id="destination"
          value={formData.destination}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        />
        {fieldErrors?.destination && <p className="text-xs text-red-500 mt-1">{fieldErrors.destination.join(', ')}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="duration_days" className="block text-sm font-medium text-gray-700">Durata (Giorni)</label>
          <input
            type="number"
            name="duration_days"
            id="duration_days"
            value={formData.duration_days}
            onChange={handleChange}
            min="1"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
          {fieldErrors?.duration_days && <p className="text-xs text-red-500 mt-1">{fieldErrors.duration_days.join(', ')}</p>}
        </div>
        <div>
          <label htmlFor="duration_nights" className="block text-sm font-medium text-gray-700">Durata (Notti)</label>
          <input
            type="number"
            name="duration_nights"
            id="duration_nights"
            value={formData.duration_nights}
            onChange={handleChange}
            min="1"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
          {fieldErrors?.duration_nights && <p className="text-xs text-red-500 mt-1">{fieldErrors.duration_nights.join(', ')}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="theme" className="block text-sm font-medium text-gray-700">Tema</label>
        <input
          type="text"
          name="theme"
          id="theme"
          value={formData.theme}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        />
        {fieldErrors?.theme && <p className="text-xs text-red-500 mt-1">{fieldErrors.theme.join(', ')}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Caratteristiche del viaggio</label>
        <div className="space-y-2">
          {characteristicOptions.map((characteristic) => (
            <label key={characteristic} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.characteristics.includes(characteristic)}
                onChange={(e) => handleCharacteristicChange(characteristic, e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{characteristic}</span>
            </label>
          ))}
        </div>
        {fieldErrors?.characteristics && <p className="text-xs text-red-500 mt-1">{fieldErrors.characteristics.join(', ')}</p>}
      </div>

      <div>
        <label htmlFor="tag-input" className="block text-sm font-medium text-gray-700">Tag (separati da virgola o premi Invio)</label>
        <div className="flex items-center mt-1">
          <input
            type="text"
            id="tag-input"
            value={tagInput}
            onChange={handleTagInputChange}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-primary-600 text-white font-medium rounded-r-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Aggiungi Tag
          </button>
        </div>
        {fieldErrors?.tags && <p className="text-xs text-red-500 mt-1">{fieldErrors.tags.join(', ')}</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          {formData.tags.map((tag: string) => (
            <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1.5 flex-shrink-0 inline-flex text-primary-500 hover:text-primary-700 focus:outline-none focus:text-primary-700"
              >
                <span className="sr-only">Rimuovi tag</span>
                &times;
              </button>
            </span>
          ))}
        </div>
      </div>      <div>
        <label htmlFor="recommended_season" className="block text-sm font-medium text-gray-700">Stagione Consigliata</label>
        <select
          name="recommended_season"
          id="recommended_season"
          value={formData.recommended_season}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        >
          <option value={RecommendedSeason.Primavera}>Primavera</option>
          <option value={RecommendedSeason.Estate}>Estate</option>
          <option value={RecommendedSeason.Autunno}>Autunno</option>
          <option value={RecommendedSeason.Inverno}>Inverno</option>
          <option value={RecommendedSeason.Tutte}>Tutte</option>
        </select>
        {fieldErrors?.recommended_season && <p className="text-xs text-red-500 mt-1">{fieldErrors.recommended_season.join(', ')}</p>}
      </div>

      {/* GPX Upload Section */}
      <GPXUpload
        gpxFile={gpxFile}
        onGpxUpload={setGpxFile}
        onGpxRemove={removeGpxFile}
        isUploading={isLoading}
      />

      {/* Multimedia Upload Section */}
      <MultimediaUpload
        mediaItems={mediaItems}
        onAddMedia={addMedia}
        onRemoveMedia={removeMedia}
        onUpdateCaption={updateMediaCaption}
      />

      <div>
        <label htmlFor="insights" className="block text-sm font-medium text-gray-700">Approfondimenti</label>
        <div className="text-xs text-gray-500 mb-1">Aggiungi fatti interessanti, luoghi da visitare e altre informazioni utili</div>
        <textarea
          name="insights"
          id="insights"
          rows={6}
          value={formData.insights || ''}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          placeholder="Racconta curiosità, fatti storici, luoghi d'interesse e altre informazioni utili per i motociclisti..."
        />
        {fieldErrors?.insights && <p className="text-xs text-red-500 mt-1">{fieldErrors.insights.join(', ')}</p>}
      </div>

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