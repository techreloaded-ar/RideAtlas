// src/components/TripFormFields.tsx
"use client";

import { UseFormReturn } from 'react-hook-form'
import { type TripWithStagesData, CharacteristicOptions, RecommendedSeasons } from '@/schemas/trip'
import { formFieldClasses } from '@/constants/tripForm'

interface TripFormFieldsProps {
  form: UseFormReturn<TripWithStagesData>
}

export const TripFormFields = ({ form }: TripFormFieldsProps) => {
  const { 
    register, 
    formState: { errors },
    watch,
    setValue
  } = form

  const characteristics = watch('characteristics')
  const recommendedSeasons = watch('recommended_seasons')
  const tags = watch('tags')

  const handleCharacteristicChange = (characteristic: string, checked: boolean) => {
    const current = characteristics || []
    if (checked) {
      setValue('characteristics', [...current, characteristic])
    } else {
      setValue('characteristics', current.filter(c => c !== characteristic))
    }
  }

  const handleSeasonChange = (season: string, checked: boolean) => {
    const current = recommendedSeasons || []
    if (checked) {
      setValue('recommended_seasons', [...current, season as (typeof RecommendedSeasons)[number]])
    } else {
      setValue('recommended_seasons', current.filter(s => s !== season))
    }
  }

  const addTag = (tag: string) => {
    const current = tags || []
    const trimmedTag = tag.trim()
    if (trimmedTag && !current.includes(trimmedTag)) {
      setValue('tags', [...current, trimmedTag])
    }
  }

  const removeTag = (tagToRemove: string) => {
    const current = tags || []
    setValue('tags', current.filter(tag => tag !== tagToRemove))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const target = e.currentTarget
      addTag(target.value)
      target.value = ''
    }
  }

  const handleAddTagClick = (e: React.MouseEvent) => {
    e.preventDefault()
    const input = document.getElementById('tag-input') as HTMLInputElement
    if (input) {
      addTag(input.value)
      input.value = ''
    }
  }

  return (
    <>
      {/* Title */}
      <div>
        <label htmlFor="title" className={formFieldClasses.label}>
          Titolo
        </label>
        <input
          {...register('title')}
          type="text"
          id="title"
          className={formFieldClasses.input}
        />
        {errors.title && (
          <p className={formFieldClasses.error}>{errors.title.message}</p>
        )}
      </div>

      {/* Summary */}
      <div>
        <label htmlFor="summary" className={formFieldClasses.label}>
          Sommario
        </label>
        <textarea
          {...register('summary')}
          id="summary"
          rows={3}
          className={formFieldClasses.textarea}
        />
        {errors.summary && (
          <p className={formFieldClasses.error}>{errors.summary.message}</p>
        )}
      </div>

      {/* Destination */}
      <div>
        <label htmlFor="destination" className={formFieldClasses.label}>
          Destinazione/Area Geografica
        </label>
        <input
          {...register('destination')}
          type="text"
          id="destination"
          className={formFieldClasses.input}
        />
        {errors.destination && (
          <p className={formFieldClasses.error}>{errors.destination.message}</p>
        )}
      </div>

      {/* Theme */}
      <div>
        <label htmlFor="theme" className={formFieldClasses.label}>
          Tema
        </label>
        <input
          {...register('theme')}
          type="text"
          id="theme"
          className={formFieldClasses.input}
        />
        {errors.theme && (
          <p className={formFieldClasses.error}>{errors.theme.message}</p>
        )}
      </div>

      {/* Characteristics */}
      <div>
        <label className={`${formFieldClasses.label} mb-3`}>
          Caratteristiche del viaggio
        </label>
        <div className="space-y-2">
          {CharacteristicOptions.map((characteristic) => (
            <label key={characteristic} className="flex items-center">
              <input
                type="checkbox"
                checked={characteristics?.includes(characteristic) || false}
                onChange={(e) => handleCharacteristicChange(characteristic, e.target.checked)}
                className={formFieldClasses.checkbox}
              />
              <span className="ml-2 text-sm text-gray-700">{characteristic}</span>
            </label>
          ))}
        </div>
        {errors.characteristics && (
          <p className={formFieldClasses.error}>{errors.characteristics.message}</p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tag-input" className={formFieldClasses.label}>
          Tag (separati da virgola o premi Invio)
        </label>
        <div className="flex items-center mt-1">
          <input
            type="text"
            id="tag-input"
            onKeyDown={handleTagKeyDown}
            className={formFieldClasses.tagInput}
            placeholder="Aggiungi un tag..."
          />
          <button
            type="button"
            onClick={handleAddTagClick}
            className={formFieldClasses.tagButton}
          >
            Aggiungi Tag
          </button>
        </div>
        {errors.tags && (
          <p className={formFieldClasses.error}>{errors.tags.message}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {(tags || []).map((tag: string) => (
            <span key={tag} className={formFieldClasses.tagSpan}>
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className={formFieldClasses.tagRemoveButton}
              >
                <span className="sr-only">Rimuovi tag</span>
                &times;
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Recommended Seasons */}
      <div>
        <label className={`${formFieldClasses.label} mb-3`}>
          Stagioni Consigliate
        </label>
        <div className="space-y-2">
          {RecommendedSeasons.map((season) => (
            <label key={season} className="flex items-center">
              <input
                type="checkbox"
                checked={recommendedSeasons?.includes(season) || false}
                onChange={(e) => handleSeasonChange(season, e.target.checked)}
                className={formFieldClasses.checkbox}
              />
              <span className="ml-2 text-sm text-gray-700">{season}</span>
            </label>
          ))}
        </div>
        {errors.recommended_seasons && (
          <p className={formFieldClasses.error}>{errors.recommended_seasons.message}</p>
        )}
      </div>

      {/* Insights */}
      <div>
        <label htmlFor="insights" className={formFieldClasses.label}>
          Approfondimenti
        </label>
        <div className="text-xs text-gray-500 mb-1">
          Aggiungi fatti interessanti, luoghi da visitare e altre informazioni utili
        </div>
        <textarea
          {...register('insights')}
          id="insights"
          rows={6}
          className={formFieldClasses.textarea}
          placeholder="Racconta curiosità, fatti storici, luoghi d'interesse e altre informazioni utili per i motociclisti..."
        />
        {errors.insights && (
          <p className={formFieldClasses.error}>{errors.insights.message}</p>
        )}
      </div>
    </>
  )
}