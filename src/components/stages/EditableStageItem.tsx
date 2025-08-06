"use client";

import { useState } from 'react';
import { type StageCreationData } from '@/schemas/trip';
import { GripVertical } from 'lucide-react'; // Import GripVertical for drag handle
import { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'; // Import Dnd-kit types
import { Transform } from '@dnd-kit/utilities'; // Import Dnd-kit types

interface EditableStageItemProps {
  stage: StageCreationData;
  index: number;
  onUpdate: (updatedStage: Partial<StageCreationData>) => void;
  onDelete: () => void;
  isLoading: boolean;
  // Props for dnd-kit
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners; // Changed type for listeners
  setNodeRef?: (node: HTMLElement | null) => void;
  transform?: Transform | null;
  transition?: string;
  isDragging?: boolean;
}
export const EditableStageItem = ({
  stage,
  index,
  onUpdate,
  onDelete,
  isLoading,
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
}: EditableStageItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform || null),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-gray-200 rounded-lg relative ${isDragging ? 'z-50' : ''}`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-4 z-10 p-2 cursor-grab active:cursor-grabbing bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        style={{ marginLeft: '-40px' }}
        role="button"
        tabIndex={0}
        aria-label={`Riordina tappa: ${stage.title}`}
      >
        <GripVertical className="w-4 h-4 text-gray-400" aria-hidden="true" />
      </div>

      {/* Header della stage */}
      <div
        className="px-4 py-3 cursor-pointer hover:bg-gray-50 pl-12" // Adjusted padding for drag handle
        onClick={toggleExpansion}
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
                e.stopPropagation();
                onDelete();
              }}
              disabled={isLoading}
              className="text-red-400 hover:text-red-600 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <svg
              className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
      {isExpanded && (
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
                onChange={(e) => onUpdate({ title: e.target.value })}
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
                onChange={(e) => onUpdate({ description: e.target.value })}
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
                onChange={(e) => onUpdate({ routeType: e.target.value })}
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
  );
};

// Re-export CSS from dnd-kit/utilities for use in SortableStageItem
import { CSS } from '@dnd-kit/utilities';
