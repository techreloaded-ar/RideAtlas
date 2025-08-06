// src/components/TripStagesSection.tsx
"use client";

import { useState, useCallback } from 'react';
import { Stage, MediaItem, GpxFile } from '@/types/trip';
import { StageCreationData } from '@/schemas/trip';
import { useStages } from '@/hooks/useStages';
import StageTimeline from '@/components/stages/StageTimeline';
import StageEditor from '@/components/stages/StageEditor';
import { PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface FormErrors {
  [key: string]: string[] | undefined;
}

interface TripStagesSectionProps {
  tripId?: string; // null per creazione, set per edit
  stages: Stage[];
  onStagesChange: (stages: Stage[]) => void;
  isLoading?: boolean;
  fieldErrors?: FormErrors | null;
  mode?: 'create' | 'edit';
}

export default function TripStagesSection({
  tripId,
  stages,
  onStagesChange,
  isLoading = false,
  fieldErrors,
  mode = 'create'
}: TripStagesSectionProps) {
  // State locale per gestione modal StageEditor
  const [isStageEditorOpen, setIsStageEditorOpen] = useState(false);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Hook per gestione stages (solo se abbiamo tripId)
  const stagesHook = useStages({ 
    tripId: tripId || 'temp-trip-id', 
    autoFetch: !!tripId 
  });

  // Determina se usare dati locali o dal server
  const currentStages = tripId ? stagesHook.stages : stages;
  const isStagesLoading = tripId ? stagesHook.isLoading : isLoading;

  // Handler per aprire editor per nuova tappa
  const handleAddStage = useCallback(() => {
    setEditingStageId(null);
    setIsStageEditorOpen(true);
  }, []);

  // Handler per aprire editor per modifica tappa esistente
  const handleEditStage = useCallback((stageId: string) => {
    setEditingStageId(stageId);
    setIsStageEditorOpen(true);
  }, []);

  // Handler per eliminazione tappa
  const handleDeleteStage = useCallback(async (stageId: string) => {
    if (isDeleting) return;

    const confirmed = window.confirm('Sei sicuro di voler eliminare questa tappa?');
    if (!confirmed) return;

    setIsDeleting(true);

    try {
      if (tripId) {
        // Modalità edit: usa hook per eliminazione server-side
        await stagesHook.deleteStage(stageId);
      } else {
        // Modalità create: elimina solo localmente
        const updatedStages = stages.filter(stage => stage.id !== stageId);
        onStagesChange(updatedStages);
      }
    } catch (error) {
      console.error('Errore eliminazione tappa:', error);
      alert('Errore durante l\'eliminazione della tappa');
    } finally {
      setIsDeleting(false);
    }
  }, [tripId, stages, stagesHook, onStagesChange, isDeleting]);

  // Handler per riordinamento tappe
  const handleReorderStages = useCallback(async (newOrder: Stage[] | StageCreationData[]) => {
    if (tripId) {
      // Modalità edit: usa hook per riordinamento server-side
      await stagesHook.reorderStages(newOrder as Stage[]);
    } else {
      // Modalità create: riordina solo localmente
      const reorderedStages = (newOrder as StageCreationData[]).map((stage, index) => ({
        ...stage,
        orderIndex: index
      }));
      onStagesChange(reorderedStages as Stage[]);
    }
  }, [tripId, stagesHook, onStagesChange]);

  // Handler per salvataggio tappa (da StageEditor)
  const handleSaveStage = useCallback(async (stageData: {
    title: string;
    description?: string;
    routeType?: string;
    existingMedia?: MediaItem[];
    existingGpx?: GpxFile | null;
  }) => {
    try {
      // Trasforma i dati nel formato corretto per StageCreationData
      const stageCreationData = {
        orderIndex: stages.length, // Calcola automaticamente l'orderIndex
        title: stageData.title,
        description: stageData.description,
        routeType: stageData.routeType,
        media: stageData.existingMedia || [],
        gpxFile: stageData.existingGpx || null
      };

      if (editingStageId && tripId) {
        // Modalità edit stage esistente
        await stagesHook.updateStage(editingStageId, stageCreationData);
      } else if (tripId) {
        // Modalità create nuova stage in trip esistente
        await stagesHook.createStage(stageCreationData);
      } else {
        // Modalità create locale (nuovo trip)
        const newStage: Stage = {
          id: `temp-stage-${Date.now()}`,
          tripId: 'temp-trip-id',
          ...stageCreationData,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const updatedStages = [...stages, newStage];
        onStagesChange(updatedStages);
      }

      setIsStageEditorOpen(false);
      setEditingStageId(null);
    } catch (error) {
      console.error('Errore salvataggio tappa:', error);
      alert('Errore durante il salvataggio della tappa');
    }
  }, [editingStageId, tripId, stages, stagesHook, onStagesChange]);

  // Handler per chiusura modal
  const handleCloseStageEditor = useCallback(() => {
    setIsStageEditorOpen(false);
    setEditingStageId(null);
  }, []);

  const hasStages = currentStages?.length > 0;
  const hasErrors = fieldErrors?.stages && fieldErrors.stages.length > 0;

  return (
    <div className="space-y-6">
      {/* Header sezione */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Tappe del Viaggio
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {mode === 'create' 
              ? 'Aggiungi almeno una tappa per completare il tuo viaggio. La durata sarà calcolata automaticamente (1 tappa = 1 giorno).'
              : 'Gestisci le tappe del tuo viaggio. La durata è calcolata automaticamente dal numero di tappe.'
            }
          </p>
        </div>
        
        <button
          type="button"
          onClick={handleAddStage}
          disabled={isStagesLoading || isDeleting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Aggiungi Tappa
        </button>
      </div>

      {/* Errori validazione */}
      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Errori nelle tappe
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {fieldErrors?.stages?.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista tappe o messaggio vuoto */}
      {hasStages ? (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-6">
            <StageTimeline
              stages={currentStages}
              isEditable={!isStagesLoading && !isDeleting}
              onReorder={handleReorderStages}
              onUpdateStage={handleEditStage}
              onDeleteStage={handleDeleteStage}
            />
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <div className="space-y-4">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Nessuna tappa aggiunta
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Inizia aggiungendo la prima tappa del tuo viaggio
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddStage}
              disabled={isStagesLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Aggiungi Prima Tappa
            </button>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {(isStagesLoading || isDeleting) && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
            <span className="text-sm text-gray-600">
              {isDeleting ? 'Eliminazione...' : 'Caricamento...'}
            </span>
          </div>
        </div>
      )}

      {/* Modal StageEditor */}
      <Transition appear show={isStageEditorOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCloseStageEditor}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl max-h-[90vh] overflow-y-auto transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-6">
                    {editingStageId ? 'Modifica Tappa' : 'Aggiungi Nuova Tappa'}
                  </Dialog.Title>
                  
                  <StageEditor
                    tripId={tripId || 'temp-trip-id'}
                    stageId={editingStageId || undefined}
                    initialData={editingStageId ? currentStages.find(s => s.id === editingStageId) : undefined}
                    existingStages={currentStages}
                    onSave={handleSaveStage}
                    onCancel={handleCloseStageEditor}
                    onDelete={editingStageId ? () => handleDeleteStage(editingStageId) : undefined}
                  />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}