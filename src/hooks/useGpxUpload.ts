import { useState } from 'react';
import { GpxFile } from '@/schemas/trip';

// Costanti per evitare magic numbers
const GPX_FILE_EXTENSION = '.gpx';
const MAX_FILE_SIZE_MB = 20;

interface UseGpxUploadProps {
  onGpxUpdate: (gpxFile: GpxFile) => void;
  maxFileSizeMB?: number;
}

export const useGpxUpload = ({ onGpxUpdate, maxFileSizeMB = MAX_FILE_SIZE_MB }: UseGpxUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Funzione di validazione separata per migliorare la leggibilità
  const validateFile = (file: File): string | null => {
    if (!file.name.toLowerCase().endsWith(GPX_FILE_EXTENSION)) {
      return 'Seleziona solo file GPX';
    }

    const maxSizeBytes = maxFileSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `Il file deve essere massimo ${maxFileSizeMB}MB`;
    }

    return null;
  };

  const handleGpxUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validations
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('gpx', file);

      const response = await fetch('/api/upload/gpx', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore durante l\'upload del GPX');
      }

      const gpxFile = await response.json() as GpxFile;
      onGpxUpdate(gpxFile);

      // Clear input to allow re-upload of same file
      event.target.value = '';
      
    } catch (error) {
      console.error('Errore upload GPX:', error);
      setUploadError(error instanceof Error ? error.message : 'Errore sconosciuto durante l\'upload GPX');
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    uploadError,
    handleGpxUpload,
    clearError: () => setUploadError(null)
  };
};