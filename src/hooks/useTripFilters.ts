import { useState, useMemo, useEffect } from 'react';
import useDebounce from './useDebounce';
import { filterTrips, validateSearchTerm, type SearchableTrip } from '@/lib/utils/searchUtils';
import {
  ActiveTripDurationFilters,
  ActiveTripZoneFilters,
  TripDurationFilter,
  TripZone,
  matchesDurationFilter,
  matchesZoneFilter,
} from '@/lib/utils/tripDiscoveryUtils';

/**
 * Interfaccia per il valore di ritorno dell'hook useTripFilters
 */
export interface UseTripFiltersReturn<T extends SearchableTrip> {
  /** Array di viaggi filtrati basato sul termine di ricerca */
  filteredTrips: T[];
  /** Termine di ricerca corrente (non debounced) */
  searchTerm: string;
  /** Termine di ricerca con debouncing applicato */
  debouncedSearchTerm: string;
  /** Funzione per aggiornare il termine di ricerca */
  setSearchTerm: (term: string) => void;
  /** Indica se ci sono risultati dopo il filtro */
  hasResults: boolean;
  /** Indica se è in corso una ricerca (durante il debouncing) */
  isSearching: boolean;
  /** Indica se il termine di ricerca è valido */
  isValidSearch: boolean;
  /** Messaggio di errore se la ricerca non è valida */
  searchError?: string;
  /** Numero totale di risultati trovati */
  resultsCount: number;
  /** Filtro geografico Nord/Centro/Sud */
  zoneFilter: ActiveTripZoneFilters;
  /** Aggiorna il filtro geografico */
  setZoneFilter: (zone: TripZone) => void;
  /** Filtro per durata del viaggio */
  durationFilter: ActiveTripDurationFilters;
  /** Aggiorna il filtro durata */
  setDurationFilter: (duration: Exclude<TripDurationFilter, 'all'>) => void;
  /** Indica se almeno un filtro rapido è attivo */
  hasQuickFilters: boolean;
  /** Resetta solo i filtri rapidi */
  resetQuickFilters: () => void;
  /** Funzione per resettare la ricerca */
  clearSearch: () => void;
}

/**
 * Hook personalizzato per gestire il filtro e la ricerca dei viaggi
 * Integra debouncing, validazione e logica di filtro in un'interfaccia semplice
 * 
 * @param trips - Array di viaggi da filtrare
 * @param debounceDelay - Ritardo per il debouncing in millisecondi (default: 300)
 * @returns Oggetto con stato e funzioni per gestire la ricerca
 */
function useTripFilters<T extends SearchableTrip & { duration_days?: number }>(
  trips: T[], 
  debounceDelay: number = 300
): UseTripFiltersReturn<T> {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [zoneFilter, setZoneFilterState] = useState<ActiveTripZoneFilters>([]);
  const [durationFilter, setDurationFilterState] = useState<ActiveTripDurationFilters>([]);

  const toggleFilterValue = <TValue,>(currentFilters: TValue[], value: TValue): TValue[] => {
    return currentFilters.includes(value)
      ? currentFilters.filter((filterValue) => filterValue !== value)
      : [...currentFilters, value];
  };

  const setZoneFilter = (zone: TripZone) => {
    setZoneFilterState((currentFilters) => toggleFilterValue(currentFilters, zone));
  };

  const setDurationFilter = (duration: Exclude<TripDurationFilter, 'all'>) => {
    setDurationFilterState((currentFilters) => toggleFilterValue(currentFilters, duration));
  };
  
  // Applica debouncing al termine di ricerca per ottimizzare le performance
  const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay);
  
  // Valida il termine di ricerca
  const searchValidation = useMemo(() => {
    return validateSearchTerm(searchTerm);
  }, [searchTerm]);
  
  // Calcola i viaggi filtrati usando memoization per ottimizzare le performance
  const filteredTrips = useMemo(() => {
    // Se la ricerca non è valida, ritorna array vuoto
    if (!searchValidation.isValid) {
      return [];
    }
    
    // Applica il filtro testuale usando il termine con debouncing
    const textFilteredTrips = filterTrips(trips, debouncedSearchTerm);

    // Applica i filtri rapidi per area geografica e durata
    return textFilteredTrips.filter((trip) => {
      const matchesZone = matchesZoneFilter(trip.destination, trip.tags, zoneFilter);
      const matchesDuration = matchesDurationFilter(trip.duration_days, durationFilter);
      return matchesZone && matchesDuration;
    });
  }, [trips, debouncedSearchTerm, searchValidation.isValid, zoneFilter, durationFilter]);
  
  // Calcola gli indicatori di stato
  const hasResults = filteredTrips.length > 0;
  const isSearching = searchTerm !== debouncedSearchTerm;
  const resultsCount = filteredTrips.length;
  const hasQuickFilters = zoneFilter.length > 0 || durationFilter.length > 0;

  const resetQuickFilters = () => {
    setZoneFilterState([]);
    setDurationFilterState([]);
  };
  
  // Funzione per resettare la ricerca
  const clearSearch = () => {
    setSearchTerm('');
    resetQuickFilters();
  };
  
  // Reset automatico quando la lista dei viaggi cambia (es. nuovi dati dal server)
  useEffect(() => {
    // Se non ci sono più viaggi, resetta la ricerca
    if (trips.length === 0 && searchTerm) {
      clearSearch();
    }
  }, [trips.length, searchTerm]);
  
  return {
    filteredTrips,
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    hasResults,
    isSearching,
    isValidSearch: searchValidation.isValid,
    searchError: searchValidation.error,
    resultsCount,
    zoneFilter,
    setZoneFilter,
    durationFilter,
    setDurationFilter,
    hasQuickFilters,
    resetQuickFilters,
    clearSearch,
  };
}

export default useTripFilters;
