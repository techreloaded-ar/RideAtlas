// src/hooks/useTripForm.ts
import { useState, useCallback, useEffect } from 'react';
import { 
  TripCreationData, 
  RecommendedSeason, 
  Trip, 
  MediaItem, 
  GpxFile
} from '@/types/trip';

interface UseTripFormProps {
  initialData?: Partial<TripCreationData & Pick<Trip, 'id'>> | (Partial<Omit<Trip, 'media'>> & { media?: MediaItem[] }) | (Partial<Omit<Trip, 'gpxFile'>> & { gpxFile: GpxFile | null }),
  onSuccess?: (trip: unknown) => void
  mode?: 'create' | 'edit'
  tripId?: string
}

interface FormErrors {
  [key: string]: string[] | undefined
}

export const useTripForm = ({ 
  initialData = {}, 
  onSuccess, 
  mode = 'create',
  tripId 
}: UseTripFormProps) => {


  const [formData, setFormData] = useState<TripCreationData>({
    title: '',
    summary: '',
    destination: '',
    duration_days: 1,
    duration_nights: 1,
    tags: [],
    theme: '',
    characteristics: [],
    recommended_season: RecommendedSeason.Tutte,
    insights: '',
    media: [],
    gpxFile: null
  });

  // Stato separato per i media items come MediaItem[]
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  // Funzioni per gestire il file GPX
  const setGpxFile = useCallback((gpxFile: GpxFile) => {
    setFormData(prev => ({
      ...prev,
      gpxFile: gpxFile
    }));
  }, []);
  const removeGpxFile = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      gpxFile: null
    }));
  }, []);

  // Update form data when initialData changes (useful for edit mode)
  // Only update once when data is first loaded
  useEffect(() => {
    if (initialData && 'id' in initialData && initialData.id && !isInitialized) {
      // Estrai media e gpx separatamente per gestirli diversamente
      const { media, gpxFile, ...restData } = initialData;
      
      // Aggiorna il form con i dati base
      setFormData(prev => ({
        ...prev,
        ...restData,
        media: [], // Resetta media nel formData dato che lo gestiamo separatamente
      }));
      
      // Se ci sono media iniziali, convertili in MediaItem[]
      if (media) {
        // Se i media sono già MediaItem[], usali direttamente
        // Altrimenti convertili da JsonValue[]
        const initialMediaItems = Array.isArray(media) && media.length > 0 && typeof media[0] === 'object' && media[0] !== null && 'id' in media[0]
          ? media as MediaItem[]
          : [];
        setMediaItems(initialMediaItems);
      }        // Gestisci il GPX file se presente
        if (gpxFile) {
          // Se è già un GpxFile, usalo direttamente; altrimenti convertilo
          const gpxFileData =  gpxFile as GpxFile;
          setFormData(prev => ({
            ...prev,
            gpxFile: gpxFileData
          }));
        }
      
      setIsInitialized(true);
    }
  }, [initialData, isInitialized]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration_days' || name === 'duration_nights' ? 
        Math.max(1, parseInt(value, 10) || 1) : value,
    }));
  }, []);

  const handleTagInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  }, []);

  const addTag = useCallback(() => {
    if (tagInput.trim() !== '' && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  }, [tagInput, formData.tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  }, []);

  const handleCharacteristicChange = useCallback((characteristic: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      characteristics: checked
        ? [...prev.characteristics, characteristic]
        : prev.characteristics.filter(c => c !== characteristic)
    }));
  }, []);
  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      summary: '',
      destination: '',
      duration_days: 1,
      duration_nights: 1,
      tags: [],
      theme: '',
      characteristics: [],
      recommended_season: RecommendedSeason.Tutte,
      insights: '',
      media: [],
      gpxFile: null
    });
    setMediaItems([]);
    setTagInput('');
    setError(null);
    setFieldErrors(null);
  }, []);

  // Funzioni per gestire i media items
  const addMedia = useCallback((mediaItem: Omit<MediaItem, 'id'>) => {
    const newMedia: MediaItem = {
      id: crypto.randomUUID(),
      ...mediaItem
    };
    setMediaItems(prev => [...prev, newMedia]);
  }, []);

  const removeMedia = useCallback((mediaId: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== mediaId));
  }, []);

  const updateMediaCaption = useCallback((mediaId: string, caption: string) => {
    setMediaItems(prev => prev.map(item => 
      item.id === mediaId ? { ...item, caption } : item
    ));
  }, []);

  const submitForm = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFieldErrors(null);

    // Validazione base
    if (formData.tags.length === 0) {
      setError('Devi aggiungere almeno un tag.');
      setIsLoading(false);
      return false;
    }

    try {
      const url = mode === 'create' ? '/api/trips' : `/api/trips/${tripId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      // Combina i dati del form con i media items
      const submitData = {
        ...formData,
        media: mediaItems
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || `Errore durante ${mode === 'create' ? 'la creazione' : 'l\'aggiornamento'} del viaggio.`)
        if (result.details && typeof result.details === 'object') {
          setFieldErrors(result.details);
        }
        return false;
      }

      onSuccess?.(result.trip || result);
      return true;
    } catch (err) {
      setError('Si è verificato un errore di rete o il server non è raggiungibile.');
      console.error('Submit error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [formData, mediaItems, mode, tripId, onSuccess]);

  return {
    formData,
    setFormData,
    mediaItems,
    gpxFile: formData.gpxFile,
    tagInput,
    error,
    fieldErrors,
    isLoading,
    handleChange,
    handleTagInputChange,
    addTag,
    removeTag,
    setGpxFile,
    removeGpxFile,
    handleCharacteristicChange,
    addMedia,
    removeMedia,
    updateMediaCaption,
    resetForm,
    submitForm,
    setError,
    setFieldErrors,
  };
};
