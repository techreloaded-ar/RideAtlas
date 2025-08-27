'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Trip } from '@/types/trip';
import { SortableTripItem } from './SortableTripItem';
import { useTripReorder } from '@/hooks/admin/useTripReorder';
import { useToast } from '@/hooks/ui/useToast';
import { Save, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';

interface TripReorderSectionProps {
  trips: Trip[];
  onReorderComplete: () => void;
}

export function TripReorderSection({ trips, onReorderComplete }: TripReorderSectionProps) {
  const { showSuccess, showError } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const {
    reorderedTrips,
    hasChanges,
    isLoading,
    error,
    handleReorder,
    saveOrder,
    resetOrder,
  } = useTripReorder(trips);

  // Sensori per drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Richiede un minimo di movimento per iniziare il drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handler per la fine del drag
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = reorderedTrips.findIndex(trip => trip.id === active.id);
      const newIndex = reorderedTrips.findIndex(trip => trip.id === over?.id);

      const newOrderedTrips = arrayMove(reorderedTrips, oldIndex, newIndex);
      handleReorder(newOrderedTrips);
    }
  };

  // Handler per salvare l'ordinamento
  const handleSaveOrder = async () => {
    if (!hasChanges) {
      showSuccess('Nessuna modifica da salvare');
      return;
    }

    setIsSaving(true);
    try {
      await saveOrder();
      showSuccess('Ordinamento viaggi salvato con successo!');
      onReorderComplete(); // Notifica il parent component
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore durante il salvataggio';
      showError(`Errore nel salvataggio: ${errorMessage}`);
      console.error('Errore salvataggio ordinamento:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler per reset
  const handleReset = () => {
    if (!hasChanges) {
      showSuccess('Nessuna modifica da ripristinare');
      return;
    }
    resetOrder();
    showSuccess('Ordinamento ripristinato all\'ordine originale');
  };

  if (!trips || trips.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-lg font-medium text-gray-900 mb-1">Nessun viaggio disponibile</p>
          <p className="text-sm text-gray-600">Non ci sono viaggi da riordinare al momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controlli */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Riordina Viaggi
            </h3>
            {hasChanges && (
              <div className="flex items-center gap-1 text-amber-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Modifiche non salvate</span>
              </div>
            )}
            {!hasChanges && trips.length > 0 && (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Ordinamento salvato</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Reset button */}
            <button
              onClick={handleReset}
              disabled={!hasChanges || isLoading || isSaving}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              Ripristina
            </button>
            
            {/* Save button */}
            <button
              onClick={handleSaveOrder}
              disabled={!hasChanges || isLoading || isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(isLoading || isSaving) ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {(isLoading || isSaving) ? 'Salvando...' : 'Salva Ordinamento'}
            </button>
          </div>
        </div>
        
        {/* Istruzioni */}
        <p className="text-sm text-gray-600 mt-2">
          Trascina i viaggi per riordinarli. L&apos;ordine qui definito sarà quello mostrato nella pagina pubblica dei viaggi.
        </p>
        
        {/* Error display */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2 text-red-800 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Lista viaggi riordinabile */}
      <div className="space-y-4 pl-8">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          accessibility={{
            announcements: {
              onDragStart({ active }) {
                const trip = reorderedTrips.find(t => t.id === active.id);
                return `Iniziato trascinamento del viaggio: ${trip?.title}`;
              },
              onDragOver({ active, over }) {
                const activeTrip = reorderedTrips.find(t => t.id === active.id);
                const overTrip = reorderedTrips.find(t => t.id === over?.id);
                return `Viaggio ${activeTrip?.title} sopra ${overTrip?.title}`;
              },
              onDragEnd({ active, over }) {
                const activeTrip = reorderedTrips.find(t => t.id === active.id);
                const overTrip = reorderedTrips.find(t => t.id === over?.id);
                if (over) {
                  return `Viaggio ${activeTrip?.title} spostato sopra ${overTrip?.title}`;
                } else {
                  return `Trascinamento del viaggio ${activeTrip?.title} annullato`;
                }
              },
              onDragCancel({ active }) {
                const trip = reorderedTrips.find(t => t.id === active.id);
                return `Trascinamento del viaggio ${trip?.title} annullato`;
              },
            },
          }}
        >
          <SortableContext 
            items={reorderedTrips.map(trip => trip.id)}
            strategy={verticalListSortingStrategy}
          >
            {reorderedTrips.map((trip, index) => {
              // Trova la posizione originale del viaggio
              const originalIndex = trips.findIndex(originalTrip => originalTrip.id === trip.id);
              
              return (
                <SortableTripItem
                  key={trip.id}
                  trip={trip}
                  index={index}
                  originalIndex={originalIndex}
                />
              );
            })}
          </SortableContext>
        </DndContext>
      </div>
      
      {/* Footer info */}
      <div className="text-center text-sm text-gray-500">
        {reorderedTrips.length} {reorderedTrips.length === 1 ? 'viaggio' : 'viaggi'} in totale
      </div>
    </div>
  );
}