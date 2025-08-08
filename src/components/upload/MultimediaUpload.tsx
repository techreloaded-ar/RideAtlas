// src/components/MultimediaUpload.tsx
"use client";

import { useState, useRef, useCallback } from 'react';
import { MediaItem } from '@/types/trip';
import { generateTempMediaId } from '@/lib/temp-id-service';

interface MultimediaUploadProps {
  mediaItems: MediaItem[];
  onAddMedia: (media: Omit<MediaItem, 'id'>) => void;
  onRemoveMedia: (mediaId: string) => void;
  onUpdateCaption: (mediaId: string, caption: string) => void;
}

const MultimediaUpload: React.FC<MultimediaUploadProps> = ({
  mediaItems,
  onAddMedia,
  onRemoveMedia,
  onUpdateCaption,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validazione URL YouTube
  const isValidYouTubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return youtubeRegex.test(url);
  };

  // Estrae l'ID del video YouTube dall'URL
  const extractYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  // Genera thumbnail URL per video YouTube
  const getYouTubeThumbnail = (videoId: string): string => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  // Gestione upload immagini
  const handleImageUpload = useCallback(async (files: FileList) => {
    setIsUploading(true);
    
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        alert(`Il file ${file.name} non è un'immagine valida.`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        alert(`Il file ${file.name} è troppo grande. Massimo 5MB.`);
        continue;
      }

      const tempId = generateTempMediaId();
      setUploadProgress(prev => ({ ...prev, [tempId]: 0 }));

      try {
        // Crea un nome file unico per evitare conflitti
        const fileExt = file.name.split('.').pop() || '';
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
        
        // Crea un nuovo oggetto File con il nome modificato ma stesso contenuto e tipo
        const fileWithUniqueName = new File([file], uniqueFileName, { type: file.type });
        
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
        
        // Simula progresso di upload
        for (let i = 0; i <= 100; i += 10) {
          setUploadProgress(prev => ({ ...prev, [tempId]: i }));
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        onAddMedia({
          type: 'image',
          url,
          caption: '',
        });

        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[tempId];
          return newProgress;
        });

      } catch (error) {
        console.error('Errore upload:', error);
        alert(`Errore durante l'upload di ${file.name}: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[tempId];
          return newProgress;
        });
      }
    }

    setIsUploading(false);
  }, [onAddMedia]);

  // Gestione aggiunta video YouTube
  const handleYouTubeAdd = useCallback(() => {
    if (!youtubeUrl.trim()) {
      alert('Inserisci un URL YouTube valido.');
      return;
    }

    if (!isValidYouTubeUrl(youtubeUrl)) {
      alert('URL YouTube non valido. Assicurati di inserire un link YouTube corretto.');
      return;
    }

    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      alert('Non riesco a estrarre l\'ID del video YouTube.');
      return;
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    const thumbnailUrl = getYouTubeThumbnail(videoId);

    onAddMedia({
      type: 'video',
      url: embedUrl,
      thumbnailUrl,
      caption: '',
    });

    setYoutubeUrl('');
  }, [youtubeUrl, onAddMedia]);

  // Gestione drop di file
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files);
    }
  }, [handleImageUpload]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Multimedia</h3>
        
        {/* Upload Immagini */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Carica Immagini</h4>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">Clicca per caricare</span> o trascina le immagini qui
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, WebP fino a 5MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
          />
        </div>

        {/* Progresso Upload */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mb-4 space-y-2">
            {Object.entries(uploadProgress).map(([id, progress]) => (
              <div key={id} className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Aggiungi Video YouTube */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Aggiungi Video YouTube</h4>
          <div className="flex gap-2">
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <button
              type="button"
              onClick={handleYouTubeAdd}
              disabled={isUploading}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              Aggiungi
            </button>
          </div>
        </div>
      </div>

      {/* Lista Media Items */}
      {mediaItems.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Media Aggiunti ({mediaItems.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediaItems.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Anteprima Media */}
                <div className="aspect-[3/2] bg-gray-100">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={item.caption || 'Immagine'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.caption || 'Video thumbnail'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-white text-center">
                          <svg className="mx-auto h-8 w-8 mb-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                          <p className="text-xs">Video YouTube</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                        <svg className="h-12 w-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* Controlli */}
                <div className="p-3 space-y-2">
                  <input
                    type="text"
                    value={item.caption || ''}
                    onChange={(e) => onUpdateCaption(item.id, e.target.value)}
                    placeholder="Aggiungi una didascalia..."
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 capitalize">
                      {item.type === 'image' ? 'Immagine' : 'Video YouTube'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveMedia(item.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Rimuovi
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultimediaUpload;
