// src/components/CreateTripForm.tsx
"use client";

import { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTripForm } from '@/hooks/useTripForm';
import TripFormFields from './TripFormFields';

const CreateTripForm = () => {
  const router = useRouter();
  
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
    mode: 'create',
    onSuccess: () => {
      router.push('/');
      alert('Viaggio creato con successo!'); // TODO: Sostituire con toast
    }
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await submitForm();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 max-w-2xl mx-auto bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-700">Crea Nuovo Viaggio</h2>

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

      <div className="pt-5">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {isLoading ? 'Creazione in corso...' : 'Crea Viaggio'}
        </button>
      </div>
    </form>
  );
};

export default CreateTripForm;