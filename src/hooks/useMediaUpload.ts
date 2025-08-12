"use client";

import { useState, useCallback } from 'react';
import { MediaItem } from '@/types/trip';
import { generateTempMediaId } from '@/lib/temp-id-service';

export interface UseMediaUploadReturn {
  // State
  isUploading: boolean;
  uploadError: string | null;
  isDragOver: boolean;
  youtubeUrl: string;
  
  // Handlers
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleImageDrop: (files: FileList) => void;
  handleDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  handleYouTubeAdd: () => void;
  setYoutubeUrl: React.Dispatch<React.SetStateAction<string>>;
  removeExistingMedia: (mediaId: string) => void;
  updateMediaCaption: (mediaId: string, caption: string) => void;
}

export interface UseMediaUploadConfig {
  enableYoutube?: boolean;
  maxImageSize?: number; // in MB, default 10
  maxImageCount?: number; // default unlimited
}

export interface UseMediaUploadProps {
  currentMedia?: MediaItem[];
  onMediaUpdate: (newMedia: MediaItem[]) => void;
  config?: UseMediaUploadConfig;
}

export const useMediaUpload = ({
  currentMedia = [],
  onMediaUpdate,
  config = {},
}: UseMediaUploadProps): UseMediaUploadReturn => {
  // Configuration with defaults
  const {
    enableYoutube = true,
    maxImageSize = 10,
    maxImageCount = undefined,
  } = config;
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');

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

        if (file.size > maxImageSize * 1024 * 1024) {
          throw new Error(`${file.name} è troppo grande (max ${maxImageSize}MB)`);
        }

        // Check max image count if specified
        if (maxImageCount && currentArray.length >= maxImageCount) {
          throw new Error(`Puoi caricare massimo ${maxImageCount} immagini`);
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
  }, [currentMedia, onMediaUpdate, maxImageSize, maxImageCount]);

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

  // YouTube URL validation
  const isValidYouTubeUrl = useCallback((url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return youtubeRegex.test(url);
  }, []);

  // Extract YouTube video ID from URL
  const extractYouTubeId = useCallback((url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  }, []);

  // Generate YouTube thumbnail URL
  const getYouTubeThumbnail = useCallback((videoId: string): string => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }, []);

  // Handle YouTube video addition
  const handleYouTubeAdd = useCallback(() => {
    // Check if YouTube is enabled
    if (!enableYoutube) {
      setUploadError('Aggiunta video YouTube non abilitata per questo contesto');
      return;
    }

    if (!youtubeUrl.trim()) {
      setUploadError('Inserisci un URL YouTube valido.');
      return;
    }

    if (!isValidYouTubeUrl(youtubeUrl)) {
      setUploadError('URL YouTube non valido. Assicurati di inserire un link YouTube corretto.');
      return;
    }

    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      setUploadError('Non riesco a estrarre l\'ID del video YouTube.');
      return;
    }

    setUploadError(null);
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    const thumbnailUrl = getYouTubeThumbnail(videoId);

    const newVideoItem: MediaItem = {
      id: generateTempMediaId(),
      type: 'video',
      url: embedUrl,
      thumbnailUrl,
      caption: ''
    };

    const currentArray = Array.isArray(currentMedia) ? currentMedia : [];
    const updatedMedia = [...currentArray, newVideoItem];
    onMediaUpdate(updatedMedia);

    setYoutubeUrl('');
  }, [youtubeUrl, enableYoutube, isValidYouTubeUrl, extractYouTubeId, getYouTubeThumbnail, currentMedia, onMediaUpdate]);

  return {
    isUploading,
    uploadError,
    isDragOver,
    youtubeUrl,
    handleImageUpload,
    handleImageDrop,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleYouTubeAdd,
    setYoutubeUrl,
    removeExistingMedia,
    updateMediaCaption,
  };
};