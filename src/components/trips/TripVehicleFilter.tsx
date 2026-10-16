'use client';

import React from 'react';
import { VehicleOptions, VehicleLabels, type VehicleValue } from '@/schemas/trip';

interface TripVehicleFilterProps {
  value: VehicleValue | null;
  onChange: (vehicle: VehicleValue | null) => void;
}

const baseClass = 'px-4 py-2 rounded-full text-sm font-medium border transition-colors';
const activeClass = 'bg-primary-600 text-white border-primary-600';
const inactiveClass = 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50';

/**
 * Filtro per mezzo di trasporto: "Tutti" + un pulsante per ciascun mezzo.
 * Il click su un mezzo già attivo lo deseleziona.
 */
const TripVehicleFilter: React.FC<TripVehicleFilterProps> = ({ value, onChange }) => {
  return (
    <div role="group" aria-label="Filtra per mezzo" className="flex flex-wrap gap-2 justify-center">
      <button
        type="button"
        data-testid="vehicle-filter-all"
        aria-pressed={value === null}
        onClick={() => onChange(null)}
        className={`${baseClass} ${value === null ? activeClass : inactiveClass}`}
      >
        Tutti
      </button>
      {VehicleOptions.map((vehicle) => (
        <button
          key={vehicle}
          type="button"
          data-testid={`vehicle-filter-${vehicle}`}
          aria-pressed={value === vehicle}
          onClick={() => onChange(value === vehicle ? null : vehicle)}
          className={`${baseClass} ${value === vehicle ? activeClass : inactiveClass}`}
        >
          {VehicleLabels[vehicle]}
        </button>
      ))}
    </div>
  );
};

export default TripVehicleFilter;
