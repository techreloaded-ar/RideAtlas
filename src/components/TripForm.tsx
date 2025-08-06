// src/components/TripForm.tsx
"use client";

import { UseFormReturn } from 'react-hook-form'
import { type TripWithStagesData } from '@/schemas/trip'
import { TripFormFields } from './TripFormFields'
import { StageManager } from './StageManager'

interface TripFormProps {
  form: UseFormReturn<TripWithStagesData>
  onSubmit: (data: TripWithStagesData) => Promise<boolean>
  isLoading: boolean
  mode: 'create' | 'edit'
  title: string
  submitButtonText: string
  onCancel: () => void
}

export const TripForm = ({ 
  form, 
  onSubmit, 
  isLoading, 
  mode, 
  title, 
  submitButtonText, 
  onCancel 
}: TripFormProps) => {
  const { 
    handleSubmit, 
    formState: { errors },
    watch,
    setValue 
  } = form

  const stages = watch('stages')

  const handleFormSubmit = async (data: TripWithStagesData) => {
    await onSubmit(data)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-gray-600">
            {mode === 'create' 
              ? 'Condividi la tua esperienza di viaggio con la community' 
              : 'Modifica i dettagli del tuo viaggio'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
          {/* Sezione dati base viaggio */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-8 space-y-6">
              <TripFormFields form={form} />
            </div>
          </div>

          {/* Sezione gestione tappe */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-8">
              <StageManager
                stages={stages}
                onChange={(newStages) => setValue('stages', newStages)}
                errors={errors.stages}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Submit section */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {mode === 'create' ? 'Creando...' : 'Salvando...'}
                    </div>
                  ) : (
                    submitButtonText
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Errori globali */}
          {errors.root && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              {errors.root.serverError && (
                <p className="text-sm text-red-600">{errors.root.serverError.message}</p>
              )}
              {errors.root.networkError && (
                <p className="text-sm text-red-600">{errors.root.networkError.message}</p>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}