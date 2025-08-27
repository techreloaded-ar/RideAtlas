'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trip } from '@/types/trip';
import { GripVertical, ExternalLink, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface SortableTripItemProps {
  trip: Trip;
  index: number;
  originalIndex?: number;
  isDragging?: boolean;
}

export function SortableTripItem({ trip, index, originalIndex, isDragging: externalIsDragging }: SortableTripItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableIsDragging,
  } = useSortable({ id: trip.id });

  const isDragging = externalIsDragging || sortableIsDragging;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform || null),
    transition: transition as string | undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
        isDragging ? 'z-50 shadow-lg' : ''
      }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-3 z-10 p-1.5 cursor-grab active:cursor-grabbing bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        role="button"
        tabIndex={0}
        aria-label={`Riordina viaggio: ${trip.title}`}
        aria-describedby={`trip-${trip.id}-instructions`}
        onKeyDown={(e) => {
          // Basic keyboard navigation support
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            // Focus management during keyboard drag
          }
        }}
      >
        <GripVertical className="w-4 h-4 text-gray-400" aria-hidden="true" />
        <span id={`trip-${trip.id}-instructions`} className="sr-only">
          Usa le frecce per riordinare questo viaggio
        </span>
      </div>
      
      {/* Trip content - simplified */}
      <div className="py-3 px-4 ml-2">
        <div className="flex items-center justify-between">
          {/* Trip title with link */}
          <div className="flex-1 min-w-0">
            <Link 
              href={`/trips/${trip.slug}`}
              className="group flex items-center gap-2 hover:text-blue-600 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <h3 className="text-base font-medium text-gray-900 truncate group-hover:text-blue-600">
                {trip.title}
              </h3>
              <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
            </Link>
          </div>
          
          {/* Position indicators */}
          <div className="ml-3 flex items-center gap-2 flex-shrink-0">
            {/* Previous position indicator */}
            {originalIndex !== undefined && originalIndex !== index && (
              <>
                <div className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">
                  #{originalIndex + 1}
                </div>
                <ArrowRight className="w-3 h-3 text-gray-400" />
              </>
            )}
            
            {/* Current order index indicator */}
            <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
              #{index + 1}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}