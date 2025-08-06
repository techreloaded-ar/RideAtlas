// src/components/StageManager.tsx
"use client";

import { useState } from 'react'
import { FieldError } from 'react-hook-form'
import { type StageCreationData } from '@/schemas/trip'

interface StageManagerProps {
  stages: StageCreationData[]
  onChange: (stages: StageCreationData[]) => void
  errors?: FieldError | { message?: string }
  isLoading: boolean
}

export const StageManager = ({ stages, onChange, errors, isLoading }: StageManagerProps) => {
  const [expandedStage, setExpandedStage] = useState<number | null>(null)

  const addStage = () => {
    const newStage: StageCreationData = {
      orderIndex: stages.length,
      title: `Tappa ${stages.length + 1}`,
      description: '',
      routeType: 'road',
      media: [],
      gpxFile: null,
    }
    onChange([...stages, newStage])
    setExpandedStage(stages.length) // Espandi la nuova stage
  }

  const removeStage = (index: number) => {
    const newStages = stages.filter((_, i) => i !== index)
    // Aggiorna gli orderIndex
    const reorderedStages = newStages.map((stage, i) => ({
      ...stage,
      orderIndex: i
    }))
    onChange(reorderedStages)
    
    // Aggiusta l'expanded stage se necessario
    if (expandedStage === index) {
      setExpandedStage(null)
    } else if (expandedStage !== null && expandedStage > index) {
      setExpandedStage(expandedStage - 1)
    }
  }

  const updateStage = (index: number, updatedStage: Partial<StageCreationData>) => {
    const newStages = [...stages]
    newStages[index] = { ...newStages[index], ...updatedStage }
    onChange(newStages)
  }

  const toggleStageExpansion = (index: number) => {
    setExpandedStage(expandedStage === index ? null : index)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Gestione Tappe</h3>
          <p className="mt-1 text-sm text-gray-600">
            Gestisci le tappe del tuo viaggio. La durata è calcolata automaticamente dal numero di tappe.
          </p>
        </div>
        <button
          type="button"
          onClick={addStage}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          + Aggiungi Tappa
        </button>
      </div>

      {/* Errore generale sulle stages */}
      {errors && typeof errors.message === 'string' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.message}</p>
        </div>
      )}

      {stages.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A9.971 9.971 0 0124 24c4.004 0 7.625 2.371 9.287 6.286"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessuna tappa</h3>
            <p className="mt-2 text-sm text-gray-600">
              Inizia aggiungendo la prima tappa del tuo viaggio
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg">
              {/* Header della stage */}
              <div 
                className="px-4 py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleStageExpansion(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-800 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {stage.title || `Tappa ${index + 1}`}
                      </h4>
                      {stage.description && (
                        <p className="text-xs text-gray-500 mt-1 truncate max-w-md">
                          {stage.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeStage(index)
                      }}
                      disabled={isLoading}
                      className="text-red-400 hover:text-red-600 disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <svg
                      className={`h-5 w-5 text-gray-400 transition-transform ${
                        expandedStage === index ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Contenuto espanso della stage */}
              {expandedStage === index && (
                <div className="px-4 pb-4 border-t border-gray-200">
                  <div className="space-y-4 pt-4">
                    {/* Titolo della tappa */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Titolo della tappa
                      </label>
                      <input
                        type="text"
                        value={stage.title}
                        onChange={(e) => updateStage(index, { title: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder={`Tappa ${index + 1}`}
                        disabled={isLoading}
                      />
                    </div>

                    {/* Descrizione della tappa */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Descrizione
                      </label>
                      <textarea
                        value={stage.description || ''}
                        onChange={(e) => updateStage(index, { description: e.target.value })}
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Descrizione della tappa..."
                        disabled={isLoading}
                      />
                    </div>

                    {/* Tipo di percorso */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tipo di percorso
                      </label>
                      <select
                        value={stage.routeType || 'road'}
                        onChange={(e) => updateStage(index, { routeType: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        disabled={isLoading}
                      >
                        <option value="road">Strada</option>
                        <option value="highway">Autostrada</option>
                        <option value="mountain">Montagna</option>
                        <option value="coastal">Costiero</option>
                        <option value="urban">Urbano</option>
                        <option value="mixed">Misto</option>
                      </select>
                    </div>

                    {/* Placeholder per media e GPX - da implementare later */}
                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                      📸 Media upload e 🗺️ GPX upload saranno disponibili nella prossima versione
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}