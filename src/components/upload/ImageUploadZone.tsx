"use client";

import { PhotoIcon } from '@heroicons/react/24/outline';

interface ImageUploadZoneProps {
  isUploading: boolean;
  isDragOver: boolean;
  maxImageSize: number;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ImageUploadZone = ({
  isUploading,
  isDragOver,
  maxImageSize,
  onDrop,
  onDragOver,
  onDragLeave,
  onFileSelect
}: ImageUploadZoneProps) => {
  const handleClick = () => {
    document.getElementById('unified-images')?.click();
  };

  const getZoneStyles = () => {
    if (isUploading) return 'border-blue-300 bg-blue-50';
    if (isDragOver) return 'border-blue-400 bg-blue-50';
    return 'border-gray-300 hover:border-gray-400';
  };

  const getIconStyles = () => {
    return isDragOver ? 'text-blue-400' : 'text-gray-400';
  };

  const getTextStyles = () => {
    if (isUploading) return 'text-gray-400';
    if (isDragOver) return 'text-blue-600';
    return 'text-gray-900';
  };

  const getDisplayText = () => {
    if (isUploading) return 'Caricamento in corso...';
    if (isDragOver) return 'Rilascia le immagini qui';
    return 'Clicca per selezionare o trascina le immagini qui';
  };

  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Carica Immagini</h4>
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${getZoneStyles()}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Area di caricamento immagini"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <div className="text-center">
          {isUploading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          ) : (
            <PhotoIcon className={`mx-auto h-12 w-12 ${getIconStyles()}`} />
          )}
          <div className="mt-4">
            <span className={`mt-2 block text-sm font-medium ${getTextStyles()}`}>
              {getDisplayText()}
            </span>
            <input
              id="unified-images"
              type="file"
              multiple
              accept="image/*"
              onChange={onFileSelect}
              className="sr-only"
              disabled={isUploading}
            />
            <p className="mt-1 text-sm text-gray-500">
              PNG, JPG, WebP fino a {maxImageSize}MB ciascuna
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};