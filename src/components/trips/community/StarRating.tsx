'use client'

import { Star } from 'lucide-react'

interface StarDisplayProps {
  value: number
  size?: string
}

/** Stelle in sola lettura; il voto testuale va sempre mostrato accanto. */
export function StarDisplay({ value, size = 'w-4 h-4' }: StarDisplayProps) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map(star => {
        const fill = Math.max(0, Math.min(1, value - (star - 1)))
        return (
          <span key={star} className={`relative inline-block ${size}`}>
            <Star className={`absolute inset-0 ${size} text-gray-300`} />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={`${size} text-amber-500 fill-amber-500`} />
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}

interface StarInputProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

const STAR_LABELS = ['1 stella', '2 stelle', '3 stelle', '4 stelle', '5 stelle']

/** Selettore del voto: gruppo di radio accessibile da tastiera. */
export function StarInput({ value, onChange, disabled }: StarInputProps) {
  return (
    <fieldset className="flex items-center gap-3" disabled={disabled}>
      <legend className="sr-only">Il tuo voto</legend>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <label key={star} className="cursor-pointer rounded focus-within:ring-2 focus-within:ring-blue-500">
            <input
              type="radio"
              name="trip-review-rating"
              value={star}
              checked={value === star}
              onChange={() => onChange(star)}
              className="sr-only"
              aria-label={STAR_LABELS[star - 1]}
            />
            <Star
              aria-hidden="true"
              className={`w-7 h-7 ${star <= value ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`}
            />
          </label>
        ))}
      </div>
      <span className="text-sm text-gray-600" aria-live="polite">
        {value > 0 ? `${value} su 5` : 'Nessun voto selezionato'}
      </span>
    </fieldset>
  )
}
