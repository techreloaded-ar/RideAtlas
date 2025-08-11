"use client";

import { useState, useCallback } from 'react';
import { MediaItem, GpxFile } from '@/types/trip';
import { generateTempMediaId } from '@/lib/temp-id-service';

export interface UseMediaUploadReturn {
  // State
  gpxFileName: string | null;
  isUploading: boolean;
  uploadError: string | null;
  isUploadingGpx: boolean;
  isDragOver: boolean;
  
  // Handlers
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleImageDrop: (files: FileList) => void;
  handleDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  handleGpxUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  removeExistingMedia: (mediaId: string) => void;
  updateMediaCaption: (mediaId: string, caption: string) => void;
  
  // Setters for external control
  setGpxFileName: React.Dispatch<React.SetStateAction<string | null>>;
}

export interface UseMediaUploadProps {
  currentMedia?: MediaItem[];
  currentGpx?: GpxFile | null;
  onMediaUpdate: (newMedia: MediaItem[]) => void;
  onGpxUpdate: (newGpx: GpxFile | null) => void;
}

export const useMediaUpload = ({
  currentMedia = [],
  currentGpx = null,
  onMediaUpdate,
  onGpxUpdate,
}: UseMediaUploadProps): UseMediaUploadReturn => {
  const [gpxFileName, setGpxFileName] = useState<string | null>(
    currentGpx?.filename || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingGpx, setIsUploadingGpx] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Common upload logic for both file input and drag & drop
  const uploadImageFiles = useCallback(async (files: FileList) => {
    if (!files || files.length === 0) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      const currentArray = Array.isArray(currentMedia) ? currentMedia : [];
      const newMediaItems: MediaItem[] = [];

      // Process each file
      for (const file of Array.from(files)) {
        // Basic validation
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} non è un'immagine valida`);
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB
          throw new Error(`${file.name} è troppo grande (max 10MB)`);
        }

        // Create unique filename to avoid conflicts
        const fileExt = file.name.split('.').pop() || '';
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
        
        // Create new File with unique name
        const fileWithUniqueName = new File([file], uniqueFileName, { type: file.type });
        
        // Upload to server
        const formData = new FormData();
        formData.append('file', fileWithUniqueName);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Errore durante l\'upload');
        }

        const { url } = await response.json();

        // Create new MediaItem with real URL
        const newMediaItem: MediaItem = {
          id: generateTempMediaId(),
          type: 'image',
          url,
          caption: ''
        };

        newMediaItems.push(newMediaItem);
      }

      // Update media array once with all new items
      const updatedMedia = [...currentArray, ...newMediaItems];
      onMediaUpdate(updatedMedia);
      
    } catch (error) {
      console.error('Errore upload:', error);
      setUploadError(error instanceof Error ? error.message : 'Errore sconosciuto durante l\'upload');
    } finally {
      setIsUploading(false);
    }
  }, [currentMedia, onMediaUpdate]);

  const handleImageUpload = useCallback(async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    await uploadImageFiles(files);
    
    // Clear the input to allow re-uploading same files
    event.target.value = '';
  }, [uploadImageFiles]);

  // Drag & drop handlers
  const handleImageDrop = useCallback(async (files: FileList) => {
    await uploadImageFiles(files);
  }, [uploadImageFiles]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    // Only set dragOver to false if we're actually leaving the drop zone
    // This prevents flicker when dragging over child elements
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleImageDrop(files);
    }
  }, [handleImageDrop]);

  const handleGpxUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validazioni client-side
    if (!file.name.toLowerCase().endsWith('.gpx')) {
      setUploadError('Seleziona solo file GPX');
      return;
    }

    if (file.size > 20 * 1024 * 1024) { // 20MB (come nell'endpoint)
      setUploadError('Il file deve essere massimo 20MB');
      return;
    }

    setUploadError(null);
    setIsUploadingGpx(true);
    setGpxFileName(file.name);

    try {
      // Prepara FormData per l'upload
      const formData = new FormData();
      formData.append('gpx', file);

      // Chiamata all'endpoint dedicato per GPX
      const response = await fetch('/api/upload/gpx', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore durante l\'upload del GPX');
      }

      // L'endpoint restituisce direttamente un oggetto GpxFile completo
      const gpxFile: GpxFile = await response.json();

      // Aggiorna il state con i dati completi
      onGpxUpdate(gpxFile);
      setGpxFileName(gpxFile.filename);

      // Clear input per permettere ri-upload dello stesso file
      event.target.value = '';
      
    } catch (error) {
      console.error('Errore upload GPX:', error);
      setUploadError(error instanceof Error ? error.message : 'Errore sconosciuto durante l\'upload GPX');
      // Rimuovi GPX in caso di errore
      onGpxUpdate(null);
      setGpxFileName(null);
    } finally {
      setIsUploadingGpx(false);
    }
  }, [onGpxUpdate]);

  const removeExistingMedia = useCallback((mediaId: string) => {
    const mediaArray = Array.isArray(currentMedia) ? currentMedia : [];
    const filteredMedia = mediaArray.filter(media => media.id !== mediaId);
    onMediaUpdate(filteredMedia);
  }, [currentMedia, onMediaUpdate]);

  const updateMediaCaption = useCallback((mediaId: string, caption: string) => {
    const mediaArray = Array.isArray(currentMedia) ? currentMedia : [];
    const updatedMedia = mediaArray.map(media => 
      media.id === mediaId ? { ...media, caption } : media
    );
    onMediaUpdate(updatedMedia);
  }, [currentMedia, onMediaUpdate]);

  return {
    gpxFileName,
    isUploading,
    uploadError,
    isUploadingGpx,
    isDragOver,
    handleImageUpload,
    handleImageDrop,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleGpxUpload,
    removeExistingMedia,
    updateMediaCaption,
    setGpxFileName,
  };
};