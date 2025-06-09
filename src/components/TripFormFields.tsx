// src/components/TripFormFields.tsx
"use client";

import React, { useCallback } from 'react';
import { RecommendedSeason, TripCreationData, MediaItem, GpxFile } from '@/types/trip';
import { characteristicOptions, formFieldClasses } from '@/constants/tripForm';
import MultimediaUpload from './MultimediaUpload';
import GPXUpload from './GPXUpload';
import GPXAutoMapViewer from './GPXAutoMapViewer';

interface FormErrors {
  [key: string]: string[] | undefined;
}

interface TripFormFieldsProps {
  formData: TripCreationData;
  mediaItems?: MediaItem[];
  gpxFile?: GpxFile | null;
  tagInput?: string;
  fieldErrors?: FormErrors | null;
  isLoading?: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleTagInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addTag?: () => void;
  removeTag?: (tag: string) => void;
  handleCharacteristicChange?: (characteristic: string, checked: boolean) => void;
  addMedia?: (mediaItem: Omit<MediaItem, 'id'>) => void;
  removeMedia?: (mediaId: string) => void;
  updateMediaCaption?: (mediaId: string, caption: string) => void;
  setGpxFile?: (gpxFile: GpxFile) => void;
  removeGpxFile?: () => void;
  // Props opzionali per maggiore flessibilità
  showMediaUpload?: boolean;
  showGpxUpload?: boolean;
  showGpxPreview?: boolean;
}

const TripFormFields = React.memo(({
  formData,
  mediaItems = [],
  gpxFile = null,
  tagInput = '',
  fieldErrors = null,
  isLoading = false,
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
  showMediaUpload = true,
  showGpxUpload = true,
  showGpxPreview = true
}: TripFormFieldsProps) => {
  // Helper functions per gestire le props opzionali
  const handleTagKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (addTag) addTag();
    }
  }, [addTag]);

  const handleTagAdd = useCallback(() => {
    if (addTag) addTag();
  }, [addTag]);

  const handleTagRemove = useCallback((tag: string) => {
    if (removeTag) removeTag(tag);
  }, [removeTag]);

  const handleCharacteristicToggle = useCallback((characteristic: string, checked: boolean) => {
    if (handleCharacteristicChange) handleCharacteristicChange(characteristic, checked);
  }, [handleCharacteristicChange]);

  // Safe handlers per i componenti figli
  const safeGpxUpload = useCallback((gpxFile: GpxFile) => {
    if (setGpxFile) setGpxFile(gpxFile);
  }, [setGpxFile]);

  const safeGpxRemove = useCallback(() => {
    if (removeGpxFile) removeGpxFile();
  }, [removeGpxFile]);

  const safeAddMedia = useCallback((mediaItem: Omit<MediaItem, 'id'>) => {
    if (addMedia) addMedia(mediaItem);
  }, [addMedia]);

  const safeRemoveMedia = useCallback((mediaId: string) => {
    if (removeMedia) removeMedia(mediaId);
  }, [removeMedia]);

  const safeUpdateMediaCaption = useCallback((mediaId: string, caption: string) => {
    if (updateMediaCaption) updateMediaCaption(mediaId, caption);
  }, [updateMediaCaption]);

  // Memoized error display helper
  const renderFieldError = useCallback((fieldName: string) => {
    const errors = fieldErrors?.[fieldName];
    return errors ? <p className={formFieldClasses.error}>{errors.join(', ')}</p> : null;
  }, [fieldErrors]);

  return (
    <>
      {/* Title */}
      <div>
        <label htmlFor="title" className={formFieldClasses.label}>Titolo</label>
        <input
          type="text"
          name="title"
          id="title"
          value={formData.title}
          onChange={handleChange}
          required
          className={formFieldClasses.input}
        />
        {renderFieldError('title')}
      </div>

      {/* Summary */}
      <div>
        <label htmlFor="summary" className={formFieldClasses.label}>Sommario</label>
        <textarea
          name="summary"
          id="summary"
          value={formData.summary}
          onChange={handleChange}
          rows={3}
          required
          className={formFieldClasses.textarea}
        />
        {renderFieldError('summary')}
      </div>

      {/* Destination */}
      <div>
        <label htmlFor="destination" className={formFieldClasses.label}>Destinazione/Area Geografica</label>
        <input
          type="text"
          name="destination"
          id="destination"
          value={formData.destination}
          onChange={handleChange}
          required
          className={formFieldClasses.input}
        />
        {renderFieldError('destination')}
      </div>

      {/* Duration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="duration_days" className={formFieldClasses.label}>Durata (Giorni)</label>
          <input
            type="number"
            name="duration_days"
            id="duration_days"
            value={formData.duration_days}
            onChange={handleChange}
            min="1"
            required
            className={formFieldClasses.input}
          />
          {renderFieldError('duration_days')}
        </div>
        <div>
          <label htmlFor="duration_nights" className={formFieldClasses.label}>Durata (Notti)</label>
          <input
            type="number"
            name="duration_nights"
            id="duration_nights"
            value={formData.duration_nights}
            onChange={handleChange}
            min="1"
            required
            className={formFieldClasses.input}
          />
          {renderFieldError('duration_nights')}
        </div>
      </div>
      
      {/* Theme */}
      <div>
        <label htmlFor="theme" className={formFieldClasses.label}>Tema</label>
        <input
          type="text"
          name="theme"
          id="theme"
          value={formData.theme}
          onChange={handleChange}
          required
          className={formFieldClasses.input}
        />
        {renderFieldError('theme')}
      </div>

      {/* Characteristics */}
      <div>
        <label className={`${formFieldClasses.label} mb-3`}>Caratteristiche del viaggio</label>
        <div className="space-y-2">
          {characteristicOptions.map((characteristic) => (
            <label key={characteristic} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.characteristics.includes(characteristic)}
                onChange={(e) => handleCharacteristicToggle(characteristic, e.target.checked)}
                className={formFieldClasses.checkbox}
                disabled={!handleCharacteristicChange}
              />
              <span className="ml-2 text-sm text-gray-700">{characteristic}</span>
            </label>
          ))}
        </div>
        {renderFieldError('characteristics')}
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tag-input" className={formFieldClasses.label}>Tag (separati da virgola o premi Invio)</label>
        <div className="flex items-center mt-1">
          <input
            type="text"
            id="tag-input"
            value={tagInput}
            onChange={handleTagInputChange}
            onKeyDown={handleTagKeyDown}
            className={formFieldClasses.tagInput}
            disabled={!addTag}
          />
          <button
            type="button"
            onClick={handleTagAdd}
            className={formFieldClasses.tagButton}
            disabled={!addTag || isLoading}
          >
            Aggiungi Tag
          </button>
        </div>
        {renderFieldError('tags')}
        <div className="mt-2 flex flex-wrap gap-2">
          {formData.tags.map((tag: string) => (
            <span key={tag} className={formFieldClasses.tagSpan}>
              {tag}
              {removeTag && (
                <button
                  type="button"
                  onClick={() => handleTagRemove(tag)}
                  className={formFieldClasses.tagRemoveButton}
                  disabled={isLoading}
                >
                  <span className="sr-only">Rimuovi tag</span>
                  &times;
                </button>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Recommended Season */}
      <div>
        <label htmlFor="recommended_season" className={formFieldClasses.label}>Stagione Consigliata</label>
        <select
          name="recommended_season"
          id="recommended_season"
          value={formData.recommended_season}
          onChange={handleChange}
          required
          className={formFieldClasses.select}
        >
          <option value={RecommendedSeason.Primavera}>Primavera</option>
          <option value={RecommendedSeason.Estate}>Estate</option>
          <option value={RecommendedSeason.Autunno}>Autunno</option>
          <option value={RecommendedSeason.Inverno}>Inverno</option>
          <option value={RecommendedSeason.Tutte}>Tutte</option>
        </select>
        {renderFieldError('recommended_season')}
      </div>

      {/* GPX Upload Section */}
      {showGpxUpload && (
        <GPXUpload
          gpxFile={gpxFile}
          onGpxUpload={safeGpxUpload}
          onGpxRemove={safeGpxRemove}
          isUploading={isLoading}
        />
      )}

      {/* Multimedia Upload Section */}
      {showMediaUpload && (
        <MultimediaUpload
          mediaItems={mediaItems}
          onAddMedia={safeAddMedia}
          onRemoveMedia={safeRemoveMedia}
          onUpdateCaption={safeUpdateMediaCaption}
        />
      )}

      {/* GPX Map Preview */}
      {showGpxPreview && gpxFile && gpxFile.url && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Anteprima Tracciato</h3>
          <GPXAutoMapViewer 
            gpxUrl={gpxFile.url}
            tripTitle={formData.title || 'Nuovo viaggio'}
            className="rounded-lg border"
          />
        </div>
      )}

      {/* Insights */}
      <div>
        <label htmlFor="insights" className={formFieldClasses.label}>Approfondimenti</label>
        <div className="text-xs text-gray-500 mb-1">Aggiungi fatti interessanti, luoghi da visitare e altre informazioni utili</div>
        <textarea
          name="insights"
          id="insights"
          rows={6}
          value={formData.insights || ''}
          onChange={handleChange}
          className={formFieldClasses.textarea}
          placeholder="Racconta curiosità, fatti storici, luoghi d'interesse e altre informazioni utili per i motociclisti..."
        />
        {renderFieldError('insights')}
      </div>
    </>
  );
});

TripFormFields.displayName = 'TripFormFields';

export default TripFormFields;