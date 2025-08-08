// src/components/StageManager.tsx
"use client";

import { FieldError } from 'react-hook-form'
import { type StageCreationData } from '@/schemas/trip'
import StageTimeline from '@/components/stages/StageTimeline' // Import StageTimeline
import { generateTempStageId } from '@/lib/temp-id-service';

interface StageManagerProps {
  stages: StageCreationData[]
  onChange: (stages: StageCreationData[]) => void
  errors?: FieldError | { message?: string }
  isLoading: boolean
}

export const StageManager = ({ stages, onChange, errors, isLoading }: StageManagerProps) => {

  const addStage = () => {
    const newStage: StageCreationData = {
      id: generateTempStageId(), // Add a temporary ID for new stages
      orderIndex: stages.length,
      title: `Tappa ${stages.length + 1}`,
      description: '',
      routeType: '',
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
      <div className="mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Gestione Tappe</h3>
          <p className="mt-1 text-sm text-gray-600">
            Gestisci le tappe del tuo viaggio. La durata è calcolata automaticamente dal numero di tappe.
          </p>
        </div>
      </div>

      {/* Errore generale sulle stages */}
      {errors && typeof errors.message === 'string' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.message}</p>
        </div>
      )}

      <StageTimeline
        stages={stages}
        isEditable={true}
        onReorder={handleReorder}
        onUpdateStage={updateStage}
        onDeleteStage={removeStage}
      />

      {/* Pulsante aggiungi tappa spostato in fondo */}
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={addStage}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          + Aggiungi Tappa
        </button>
      </div>
    </div>
  )
}