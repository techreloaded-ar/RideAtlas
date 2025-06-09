// src/components/CreateTripForm.tsx
"use client";

import { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTripForm } from '@/hooks/useTripForm';
import { useToast } from '@/hooks/useToast';
import TripFormContainer from './TripFormContainer';

const CreateTripForm = () => {
  const router = useRouter();
  const { showSuccess } = useToast();
  
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
    mode: 'create',
    onSuccess: () => {
      showSuccess('Viaggio creato con successo!');
      router.push('/dashboard');
    }
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await submitForm();
  };

  // Show error message if there's a general error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Errore</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
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
      mode="create"
    />
  );
};

export default CreateTripForm;