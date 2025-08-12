'use client';

import { memo } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorDisplayProps {
  error: string;
  className?: string;
  onDismiss?: () => void;
  title?: string;
}

const ErrorDisplayComponent = ({
  error,
  className = '',
  onDismiss,
  title = 'Errore:'
}: ErrorDisplayProps) => {
  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          <ExclamationTriangleIcon className='w-5 h-5 text-red-600 mr-2 flex-shrink-0' />
          <div className='text-red-600 text-sm'>
            <strong>{title}</strong> {error}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className='text-red-400 hover:text-red-600 ml-2'
            aria-label='Chiudi errore'
          >
            <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

ErrorDisplayComponent.displayName = 'ErrorDisplay';

export const ErrorDisplay = memo(ErrorDisplayComponent);
