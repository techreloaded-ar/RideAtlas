'use client';

import { useState, useCallback, useEffect } from 'react';
import type { MediaItem as ProfileMediaItem } from '@/types/profile';
import type { MediaItem as TripMediaItem } from '@/types/trip';
import MediaUpload from '@/components/upload/MediaUpload';

interface Props {
  photos: ProfileMediaItem[];
  onPhotosChange: (photos: ProfileMediaItem[]) => void;
}

export default function BikePhotosUpload({ photos, onPhotosChange }: Props) {
  const [localPhotos, setLocalPhotos] = useState<TripMediaItem[]>([]);

  // Sincronizza localPhotos con photos prop
  useEffect(() => {
    setLocalPhotos(photos.map(p => ({ ...p, type: 'image' as const })));
  }, [photos]);

  // Wrapper per gestire l'aggiunta di media tramite l'hook bike photos
  const handleAddMedia = useCallback(async (media: Omit<TripMediaItem, 'id'>) => {
    try {
      // Upload del file tramite /api/upload è già stato fatto da useMediaUpload
      // Ora salviamo i metadati nel database
      const response = await fetch('/api/user/bike-photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: media.url,
          type: media.type,
          caption: media.caption,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore durante il salvataggio');
      }

      const { media: savedMedia } = await response.json();

      // Aggiorna lo stato parent
      const updatedPhotos = [...photos, savedMedia];
      onPhotosChange(updatedPhotos);
    } catch (error) {
      console.error('Error saving bike photo:', error);
      throw error; // Rilancia l'errore per gestirlo nel componente MediaUpload
    }
  }, [photos, onPhotosChange]);

  const handleRemoveMedia = useCallback(async (mediaId: string) => {
    try {
      const response = await fetch(`/api/user/bike-photos?photoId=${mediaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore durante l\'eliminazione');
      }

      // Aggiorna lo stato parent
      const updatedPhotos = photos.filter(p => p.id !== mediaId);
      onPhotosChange(updatedPhotos);
    } catch (error) {
      console.error('Error deleting bike photo:', error);
      throw error;
    }
  }, [photos, onPhotosChange]);

  const handleUpdateCaption = useCallback((mediaId: string, caption: string) => {
    // Per ora aggiorna solo localmente (l'API non supporta ancora l'update delle caption)
    const updatedPhotos = photos.map(p =>
      p.id === mediaId ? { ...p, caption } : p
    );
    onPhotosChange(updatedPhotos);
  }, [photos, onPhotosChange]);

  return (
    <div className="space-y-4">
      {/* Header con contatore */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Foto alla guida ({photos.length}/10)
        </h3>
        <p className="text-xs text-gray-500">
          Carica foto di te alla guida della tua moto
        </p>
      </div>

      {/* Usa MediaUpload senza YouTube */}
      <MediaUpload
        mediaItems={localPhotos}
        onAddMedia={handleAddMedia}
        onRemoveMedia={handleRemoveMedia}
        onUpdateCaption={handleUpdateCaption}
        config={{
          enableYoutube: false, // Disabilita YouTube
          maxImageSize: 5, // 5MB
          maxImageCount: 10,
        }}
      />

      {/* Helper text */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
        <div className="flex">
          <svg className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Suggerimenti per le foto:</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>Usa foto di alta qualità (max 5MB ciascuna)</li>
              <li>La prima foto sarà quella principale nel tuo profilo</li>
              <li>Puoi caricare più foto contemporaneamente tramite drag & drop</li>
              <li>Formati supportati: JPG, PNG, WebP</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
