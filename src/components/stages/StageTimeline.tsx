'use client';

import { useState, useEffect } from 'react';
import { Stage } from '@/types/trip';
import StageDisplay from './StageDisplay';
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
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface StageTimelineProps {
  stages: Stage[];
  isEditable?: boolean;
  onReorder?: (newOrder: Stage[]) => void;
  onEditStage?: (stageId: string) => void;
  onDeleteStage?: (stageId: string) => void;
}

// Componente wrapper per ogni stage sortable
function SortableStageItem({
  stage,
  index,
  isEditable,
  isDragging,
  onEdit,
  onDelete
}: {
  stage: Stage;
  index: number;
  isEditable: boolean;
  isDragging?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableIsDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: sortableIsDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative ${sortableIsDragging ? 'z-50' : ''}`}
    >
      {/* Drag handle - visibile solo se editabile, accessible */}
      {isEditable && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-4 z-10 p-2 cursor-grab active:cursor-grabbing bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          style={{ marginLeft: '-40px' }}
          role="button"
          tabIndex={0}
          aria-label={`Riordina tappa: ${stage.title}`}
          aria-describedby={`stage-${stage.id}-instructions`}
          onKeyDown={(e) => {
            // Basic keyboard navigation support
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              // Focus management during keyboard drag
            }
          }}
        >
          <GripVertical className="w-4 h-4 text-gray-400" aria-hidden="true" />
          <span id={`stage-${stage.id}-instructions`} className="sr-only">
            Usa le frecce per riordinare questa tappa
          </span>
        </div>
      )}
      
      {/* Stage content */}
      <div className={isEditable ? 'ml-2' : ''}>
        <StageDisplay
          stage={stage}
          index={index}
          isEditable={isEditable}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

export default function StageTimeline({
  stages,
  isEditable = false,
  onReorder,
  onEditStage,
  onDeleteStage
}: StageTimelineProps) {
  // Stato locale per gestire l'ordine delle tappe
  const [orderedStages, setOrderedStages] = useState(() => 
    [...stages].sort((a, b) => a.orderIndex - b.orderIndex)
  );

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
      const oldIndex = orderedStages.findIndex(stage => stage.id === active.id);
      const newIndex = orderedStages.findIndex(stage => stage.id === over?.id);

      const newOrderedStages = arrayMove(orderedStages, oldIndex, newIndex);
      
      // Aggiorna orderIndex per riflettere il nuovo ordine
      const reorderedStages = newOrderedStages.map((stage, index) => ({
        ...stage,
        orderIndex: index
      }));

      setOrderedStages(reorderedStages);

      // Notifica il parent component
      if (onReorder) {
        onReorder(reorderedStages);
      }
    }
  };

  // Handler per modifica tappa
  const handleEditStage = (stageId: string) => {
    if (onEditStage) {
      onEditStage(stageId);
    }
  };

  // Handler per eliminazione tappa
  const handleDeleteStage = (stageId: string) => {
    if (onDeleteStage) {
      onDeleteStage(stageId);
    }
  };

  // Aggiorna stato locale quando cambiano le props
  useEffect(() => {
    const newOrderedStages = [...stages].sort((a, b) => a.orderIndex - b.orderIndex);
    setOrderedStages(newOrderedStages);
  }, [stages]);

  if (!stages || stages.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-lg font-medium text-gray-900 mb-1">Nessuna tappa configurata</p>
          <p className="text-sm text-gray-600">Aggiungi la prima tappa per iniziare a pianificare il viaggio</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-0 ${isEditable ? 'pl-4 sm:pl-12' : ''}`}>
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        accessibility={{
          announcements: {
            onDragStart({ active }) {
              const stage = orderedStages.find(s => s.id === active.id);
              return `Iniziato trascinamento della tappa: ${stage?.title}`;
            },
            onDragOver({ active, over }) {
              const activeStage = orderedStages.find(s => s.id === active.id);
              const overStage = orderedStages.find(s => s.id === over?.id);
              return `Tappa ${activeStage?.title} sopra ${overStage?.title}`;
            },
            onDragEnd({ active, over }) {
              const activeStage = orderedStages.find(s => s.id === active.id);
              const overStage = orderedStages.find(s => s.id === over?.id);
              if (over) {
                return `Tappa ${activeStage?.title} spostata sopra ${overStage?.title}`;
              } else {
                return `Trascinamento della tappa ${activeStage?.title} annullato`;
              }
            },
          },
        }}
      >
        <SortableContext 
          items={orderedStages.map(stage => stage.id)}
          strategy={verticalListSortingStrategy}
        >
          {orderedStages.map((stage, index) => (
            <SortableStageItem
              key={stage.id}
              stage={stage}
              index={index}
              isEditable={isEditable}
              onEdit={() => handleEditStage(stage.id)}
              onDelete={() => handleDeleteStage(stage.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
      
      {/* Indicatore fine viaggio */}
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center text-sm text-gray-500">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="font-medium">Fine del viaggio</span>
        </div>
      </div>
    </div>
  );
}