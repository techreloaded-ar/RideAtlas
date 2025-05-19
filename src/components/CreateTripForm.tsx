// src/components/CreateTripForm.tsx
"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { TripCreationData } from '@/types/trip';

const CreateTripForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<TripCreationData>({
    title: '',
    summary: '',
    destination: '',
    duration_days: 1,
    duration_nights: 1,

    tags: [],
    theme: '',
    recommended_season: 'Tutte',
  });
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration_days' || name === 'duration_nights' ? 
        Math.max(1, parseInt(value, 10) || 1) : value,
    }));
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  const addTag = () => {
    if (tagInput.trim() !== '' && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setFieldErrors(null);
  
    // Check for empty tags array
    if (formData.tags.length === 0) {
      setError('Devi aggiungere almeno un tag.');
      setIsLoading(false);
      return;
    }
  
    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Errore durante la creazione del viaggio.');
        if (result.details && typeof result.details === 'object') {
          setFieldErrors(result.details);
        }
        return;
      }

      // Redirect to a success page or the newly created trip page (e.g., /trips/[slug])
      // For now, let's redirect to the home page or a generic success message page
      router.push('/'); // O router.push(`/trips/${result.slug}`) se l'API restituisce lo slug
      alert('Viaggio creato con successo!'); // Sostituire con una notifica migliore

    } catch (err) {
      setError('Si è verificato un errore di rete o il server non è raggiungibile.');
      console.error('Submit error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 max-w-2xl mx-auto bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-700">Crea Nuovo Viaggio</h2>

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
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        {fieldErrors?.theme && <p className="text-xs text-red-500 mt-1">{fieldErrors.theme.join(', ')}</p>}
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
            className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Aggiungi Tag
          </button>
        </div>
        {fieldErrors?.tags && <p className="text-xs text-red-500 mt-1">{fieldErrors.tags.join(', ')}</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          {formData.tags.map(tag => (
            <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1.5 flex-shrink-0 inline-flex text-indigo-500 hover:text-indigo-700 focus:outline-none focus:text-indigo-700"
              >
                <span className="sr-only">Rimuovi tag</span>
                &times;
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="recommended_season" className="block text-sm font-medium text-gray-700">Stagione Consigliata</label>
        <select
          name="recommended_season"
          id="recommended_season"
          value={formData.recommended_season}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="Primavera">Primavera</option>
          <option value="Estate">Estate</option>
          <option value="Autunno">Autunno</option>
          <option value="Inverno">Inverno</option>
          <option value="Tutte">Tutte</option>
        </select>
        {fieldErrors?.recommended_season && <p className="text-xs text-red-500 mt-1">{fieldErrors.recommended_season.join(', ')}</p>}
      </div>

      <div className="pt-5">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Creazione in corso...' : 'Crea Viaggio'}
        </button>
      </div>
    </form>
  );
};

export default CreateTripForm;