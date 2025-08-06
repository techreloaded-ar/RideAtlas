// src/components/StageManager.tsx
"use client";

import { FieldError } from 'react-hook-form'
import { type StageCreationData } from '@/schemas/trip'
import StageTimeline from './stages/StageTimeline' // Import StageTimeline

interface StageManagerProps {
  stages: StageCreationData[]
  onChange: (stages: StageCreationData[]) => void
  errors?: FieldError | { message?: string }
  isLoading: boolean
}

export const StageManager = ({ stages, onChange, errors, isLoading }: StageManagerProps) => {

  const addStage = () => {
    const newStage: StageCreationData = {
      id: `temp-${Date.now()}`, // Add a temporary ID for new stages
      orderIndex: stages.length,
      title: `Tappa ${stages.length + 1}`,
      description: '',
      routeType: 'road',
      media: [],
      gpxFile: null,
    }
    onChange([...stages, newStage])
  }

  const removeStage = (stageId: string) => {
    const newStages = stages.filter(stage => stage.id !== stageId)
    // Aggiorna gli orderIndex
    const reorderedStages = newStages.map((stage, i) => ({
      ...stage,
      orderIndex: i
    }))
    onChange(reorderedStages)
  }

  const updateStage = (stageId: string, updatedStage: Partial<StageCreationData>) => {
    const newStages = stages.map(stage => 
      stage.id === stageId ? { ...stage, ...updatedStage } : stage
    )
    onChange(newStages)
  }

  const handleReorder = (newOrderedStages: StageCreationData[]) => {
    onChange(newOrderedStages)
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
        <StageTimeline
          stages={stages}
          isEditable={true}
          onReorder={handleReorder}
          onUpdateStage={updateStage}
          onDeleteStage={removeStage}
        />
      )}
    </div>
  )
}