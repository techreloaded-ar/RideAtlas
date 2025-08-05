import { useState, useCallback } from 'react';
import { Stage, MediaItem, GpxFile } from '@/types/trip';

interface StageFormData {
  title: string;
  description?: string;
  routeType?: string;
  orderIndex: number;
  mainImageFile?: File;
  mediaFiles?: File[];
  gpxFileUpload?: File;
  existingMedia?: MediaItem[];
  existingGpx?: GpxFile | null;
}

interface UseStageEditorReturn {
  isLoading: boolean;
  uploadProgress: { [key: string]: number };
  error: string | null;
  saveStage: (formData: StageFormData) => Promise<void>;
  deleteStage: (stageId: string) => Promise<void>;
  clearError: () => void;
}

export function useStageEditor(tripId: string, stageId?: string): UseStageEditorReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Upload singolo file verso storage
  const uploadFile = async (file: File, type: 'image' | 'gpx'): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('tripId', tripId);

    // Simula upload con progress tracking
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Errore upload ${type}: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      url: result.url,
      filename: file.name
    };
  };

  // Upload multipli file immagini
  const uploadImages = async (files: File[]): Promise<MediaItem[]> => {
    const uploadPromises = files.map(async (file, index) => {
      try {
        setUploadProgress(prev => ({ ...prev, [`image_${index}`]: 0 }));
        
        const result = await uploadFile(file, 'image');
        
        setUploadProgress(prev => ({ ...prev, [`image_${index}`]: 100 }));
        
        return {
          id: `uploaded_${Date.now()}_${index}`,
          type: 'image' as const,
          url: result.url,
          caption: ''
        };
      } catch (error) {
        console.error(`Errore upload immagine ${index}:`, error);
        throw error;
      }
    });

    return Promise.all(uploadPromises);
  };

  // Upload file GPX con parsing
  const uploadGpx = async (file: File): Promise<GpxFile> => {
    try {
      setUploadProgress(prev => ({ ...prev, gpx: 0 }));
      
      const result = await uploadFile(file, 'gpx');
      
      setUploadProgress(prev => ({ ...prev, gpx: 50 }));
      
      // Parse GPX per estrarre metadati
      const parseResponse = await fetch('/api/gpx/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: result.url })
      });

      if (!parseResponse.ok) {
        throw new Error('Errore parsing GPX');
      }

      const gpxData = await parseResponse.json();
      
      setUploadProgress(prev => ({ ...prev, gpx: 100 }));

      return {
        url: result.url,
        filename: result.filename,
        waypoints: gpxData.waypoints || 0,
        distance: gpxData.distance || 0,
        elevationGain: gpxData.elevationGain,
        elevationLoss: gpxData.elevationLoss,
        duration: gpxData.duration,
        maxElevation: gpxData.maxElevation,
        minElevation: gpxData.minElevation,
        isValid: gpxData.isValid || true,
        keyPoints: gpxData.keyPoints || []
      };
    } catch (error) {
      setUploadProgress(prev => ({ ...prev, gpx: 0 }));
      throw error;
    }
  };

  // Converti form data in Stage data
  const convertFormDataToStageData = async (formData: StageFormData) => {
    let uploadedMedia: MediaItem[] = [];
    let uploadedGpx: GpxFile | null = null;

    // Upload nuove immagini se presenti
    if (formData.mediaFiles && formData.mediaFiles.length > 0) {
      uploadedMedia = await uploadImages(formData.mediaFiles);
    }

    // Upload main image se presente (aggiunta come primo elemento media)
    if (formData.mainImageFile) {
      const mainImageMedia = await uploadImages([formData.mainImageFile]);
      uploadedMedia = [...mainImageMedia, ...uploadedMedia];
    }

    // Upload GPX se presente
    if (formData.gpxFileUpload) {
      uploadedGpx = await uploadGpx(formData.gpxFileUpload);
    }

    // Combina media esistenti e nuovi
    const allMedia = [
      ...(formData.existingMedia || []),
      ...uploadedMedia
    ];

    // Usa GPX esistente se non caricato nuovo
    const finalGpx = uploadedGpx || formData.existingGpx || null;

    return {
      title: formData.title,
      description: formData.description || null,
      routeType: formData.routeType || null,
      orderIndex: formData.orderIndex,
      media: allMedia,
      gpxFile: finalGpx
    };
  };

  // Salva/aggiorna stage
  const saveStage = useCallback(async (formData: StageFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      setUploadProgress({ overall: 0 });

      // Converti e upload files
      const stageData = await convertFormDataToStageData(formData);
      
      setUploadProgress({ overall: 80 });

      // API call
      const endpoint = stageId 
        ? `/api/trips/${tripId}/stages/${stageId}`
        : `/api/trips/${tripId}/stages`;
      
      const method = stageId ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stageData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Errore ${stageId ? 'aggiornamento' : 'creazione'} tappa`);
      }

      setUploadProgress({ overall: 100 });
      
      // Clear progress after success
      setTimeout(() => {
        setUploadProgress({});
      }, 1000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(errorMessage);
      setUploadProgress({});
      throw err; // Re-throw per permettere handling nel componente
    } finally {
      setIsLoading(false);
    }
  }, [tripId, stageId]);

  // Elimina stage
  const deleteStage = useCallback(async (stageIdToDelete: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/trips/${tripId}/stages/${stageIdToDelete}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore eliminazione tappa');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  return {
    isLoading,
    uploadProgress,
    error,
    saveStage,
    deleteStage,
    clearError
  };
}