import { useState, useMemo, useEffect } from 'react';
import useDebounce from './useDebounce';
import { filterTrips, validateSearchTerm, type SearchableTrip } from '@/lib/utils/searchUtils';

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
function useTripFilters<T extends SearchableTrip>(
  trips: T[], 
  debounceDelay: number = 300
): UseTripFiltersReturn<T> {
  const [searchTerm, setSearchTerm] = useState<string>('');
  
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
    
    // Applica il filtro usando il termine con debouncing
    return filterTrips(trips, debouncedSearchTerm);
  }, [trips, debouncedSearchTerm, searchValidation.isValid]);
  
  // Calcola gli indicatori di stato
  const hasResults = filteredTrips.length > 0;
  const isSearching = searchTerm !== debouncedSearchTerm;
  const resultsCount = filteredTrips.length;
  
  // Funzione per resettare la ricerca
  const clearSearch = () => {
    setSearchTerm('');
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
    clearSearch,
  };
}

export default useTripFilters;