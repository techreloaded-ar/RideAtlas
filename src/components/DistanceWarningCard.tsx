// src/components/DistanceWarningCard.tsx
"use client";

import { AlertTriangle, Navigation } from 'lucide-react';

interface DistanceWarning {
  fromTrip: string;
  toTrip: string;
  distance: number;
  message: string;
}

interface DistanceWarningCardProps {
  warning: DistanceWarning;
  className?: string;
}

export default function DistanceWarningCard({ warning, className = '' }: DistanceWarningCardProps) {
  const getWarningLevel = (distance: number) => {
    if (distance > 100) return 'high';
    if (distance > 50) return 'medium';
    return 'low';
  };

  const warningLevel = getWarningLevel(warning.distance);
  
  const warningStyles = {
    high: 'bg-red-50 border-red-200 text-red-800',
    medium: 'bg-orange-50 border-orange-200 text-orange-800',
    low: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  };

  const iconStyles = {
    high: 'text-red-500',
    medium: 'text-orange-500',
    low: 'text-yellow-500'
  };

  return (
    <div className={`rounded-lg p-3 border ${warningStyles[warningLevel]} ${className}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconStyles[warningLevel]}`} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h5 className="font-medium text-sm">Avviso Distanza</h5>
            <span className="inline-flex items-center gap-1 text-xs font-medium">
              <Navigation className="w-3 h-3" />
              {warning.distance}km
            </span>
          </div>
          <p className="text-sm">{warning.message}</p>
          
          {warningLevel === 'high' && (
            <p className="text-xs mt-2 font-medium">
              💡 Considera di pianificare una sosta intermedia o di dividere il viaggio in più giorni.
            </p>
          )}
          
          {warningLevel === 'medium' && (
            <p className="text-xs mt-2">
              💡 Prevedi circa {Math.round(warning.distance / 60)} ore di viaggio aggiuntive.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
