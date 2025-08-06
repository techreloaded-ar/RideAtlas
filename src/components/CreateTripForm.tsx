// src/components/CreateTripForm.tsx
"use client";

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tripWithStagesSchema, type TripWithStagesData } from '@/schemas/trip';
import { useToast } from '@/hooks/useToast';
import { TripForm } from './TripForm';

const CreateTripForm = () => {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const form = useForm<TripWithStagesData>({
    resolver: zodResolver(tripWithStagesSchema),
    defaultValues: {
      title: '',
      summary: '',
      destination: '',
      theme: '',
      characteristics: [],
      recommended_seasons: [],
      tags: [],
      insights: '',
      media: [],
      gpxFile: null,
      stages: [{
        id: `temp-${Date.now()}`, // Assign a temporary ID
        orderIndex: 0,
        title: 'Tappa 1',
        description: '',
        routeType: '',
        media: [],
        gpxFile: null
      }]
    },
    mode: 'onChange'
  });

  const { setError } = form;

  const onSubmit = async (data: TripWithStagesData) => {
    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.details) {
          // Mappa gli errori di campo di Zod su react-hook-form
          for (const key in result.details) {
            if (Object.prototype.hasOwnProperty.call(result.details, key)) {
              setError(key as keyof TripWithStagesData, {
                type: 'server',
                message: result.details[key][0],
              });
            }
          }
        }
        showError(result.error || 'Errore durante la creazione del viaggio.');
        return false;
      }

      showSuccess('Viaggio creato con successo!');
      router.push('/dashboard'); // Reindirizza alla dashboard o alla pagina del viaggio creato
      return true;

    } catch (err) {
      showError('Si è verificato un errore di rete o il server non è raggiungibile.');
      console.error('Submit error:', err);
      return false;
    }
  };

  return (
    <TripForm
      form={form}
      onSubmit={onSubmit}
      isLoading={form.formState.isSubmitting}
      mode="create"
      title="Crea Nuovo Viaggio"
      submitButtonText="Crea Viaggio"
      onCancel={() => router.push('/dashboard')}
    />
  );
};

export default CreateTripForm;
