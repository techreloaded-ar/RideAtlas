/**
 * Test per l'hook useTripFilters
 * Testa l'integrazione tra debouncing, validazione e logica di filtro
 */

import { renderHook, act } from '@testing-library/react';
import useTripFilters from '@/hooks/useTripFilters';
import type { SearchableTrip } from '@/lib/utils/searchUtils';

// Mock dell'hook useDebounce per controllare il comportamento
jest.mock('@/hooks/useDebounce', () => {
  return jest.fn((value: string, delay: number) => {
    // Per i test, restituiamo il valore immediatamente senza debouncing
    return value;
  });
});

describe('useTripFilters', () => {
  const mockTrips: (SearchableTrip & { id: string })[] = [
    {
      id: '1',
      title: 'Viaggio in Toscana',
      destination: 'Firenze, Italia',
      tags: ['cultura', 'arte', 'vino']
    },
    {
      id: '2',
      title: 'Tour delle Dolomiti',
      destination: 'Alto Adige, Italia',
      tags: ['montagna', 'natura', 'avventura']
    },
    {
      id: '3',
      title: 'Costa Amalfitana',
      destination: 'Campania, Italia',
      tags: ['mare', 'panorama', 'relax']
    }
  ];

  it('dovrebbe inizializzare con tutti i viaggi visibili', () => {
    const { result } = renderHook(() => useTripFilters(mockTrips));

    expect(result.current.filteredTrips).toHaveLength(3);
    expect(result.current.searchTerm).toBe('');
    expect(result.current.hasResults).toBe(true);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.isValidSearch).toBe(true);
    expect(result.current.resultsCount).toBe(3);
  });

  it('dovrebbe filtrare i viaggi quando cambia il termine di ricerca', () => {
    const { result } = renderHook(() => useTripFilters(mockTrips));

    act(() => {
      result.current.setSearchTerm('toscana');
    });

    expect(result.current.filteredTrips).toHaveLength(1);
    expect(result.current.filteredTrips[0].title).toBe('Viaggio in Toscana');
    expect(result.current.searchTerm).toBe('toscana');
    expect(result.current.hasResults).toBe(true);
    expect(result.current.resultsCount).toBe(1);
  });

  it('dovrebbe gestire ricerche senza risultati', () => {
    const { result } = renderHook(() => useTripFilters(mockTrips));

    act(() => {
      result.current.setSearchTerm('nonexistent');
    });

    expect(result.current.filteredTrips).toHaveLength(0);
    expect(result.current.hasResults).toBe(false);
    expect(result.current.resultsCount).toBe(0);
  });

  it('dovrebbe validare i termini di ricerca', () => {
    const { result } = renderHook(() => useTripFilters(mockTrips));

    // Termine valido
    act(() => {
      result.current.setSearchTerm('valid term');
    });
    expect(result.current.isValidSearch).toBe(true);
    expect(result.current.searchError).toBeUndefined();

    // Termine troppo lungo
    act(() => {
      result.current.setSearchTerm('a'.repeat(101));
    });
    expect(result.current.isValidSearch).toBe(false);
    expect(result.current.searchError).toContain('100 caratteri');
    expect(result.current.filteredTrips).toHaveLength(0);
  });

  it('dovrebbe permettere di cancellare la ricerca', () => {
    const { result } = renderHook(() => useTripFilters(mockTrips));

    // Imposta un termine di ricerca
    act(() => {
      result.current.setSearchTerm('toscana');
    });
    expect(result.current.searchTerm).toBe('toscana');
    expect(result.current.filteredTrips).toHaveLength(1);

    // Cancella la ricerca
    act(() => {
      result.current.clearSearch();
    });
    expect(result.current.searchTerm).toBe('');
    expect(result.current.filteredTrips).toHaveLength(3);
  });

  it('dovrebbe gestire array di viaggi vuoto', () => {
    const { result } = renderHook(() => useTripFilters([]));

    expect(result.current.filteredTrips).toHaveLength(0);
    expect(result.current.hasResults).toBe(false);
    expect(result.current.resultsCount).toBe(0);

    // Anche con un termine di ricerca
    act(() => {
      result.current.setSearchTerm('test');
    });
    expect(result.current.filteredTrips).toHaveLength(0);
    expect(result.current.hasResults).toBe(false);
  });

  it('dovrebbe resettare la ricerca quando i viaggi cambiano e diventano vuoti', () => {
    const { result, rerender } = renderHook(
      ({ trips }) => useTripFilters(trips),
      {
        initialProps: { trips: mockTrips }
      }
    );

    // Imposta un termine di ricerca
    act(() => {
      result.current.setSearchTerm('toscana');
    });
    expect(result.current.searchTerm).toBe('toscana');

    // Cambia i viaggi a array vuoto
    rerender({ trips: [] });
    
    expect(result.current.searchTerm).toBe(''); // Dovrebbe essere resettato
    expect(result.current.filteredTrips).toHaveLength(0);
  });

  it('dovrebbe gestire cambiamenti nella lista dei viaggi', () => {
    const { result, rerender } = renderHook(
      ({ trips }) => useTripFilters(trips),
      {
        initialProps: { trips: mockTrips }
      }
    );

    expect(result.current.filteredTrips).toHaveLength(3);

    // Rimuove un viaggio
    const updatedTrips = mockTrips.slice(0, 2);
    rerender({ trips: updatedTrips });
    
    expect(result.current.filteredTrips).toHaveLength(2);
    expect(result.current.resultsCount).toBe(2);
  });

  it('dovrebbe mantenere il filtro quando i viaggi cambiano ma non diventano vuoti', () => {
    const { result, rerender } = renderHook(
      ({ trips }) => useTripFilters(trips),
      {
        initialProps: { trips: mockTrips }
      }
    );

    // Imposta un filtro
    act(() => {
      result.current.setSearchTerm('italia');
    });
    expect(result.current.searchTerm).toBe('italia');
    expect(result.current.filteredTrips).toHaveLength(3);

    // Aggiunge un nuovo viaggio
    const newTrip = {
      id: '4',
      title: 'Viaggio in Francia',
      destination: 'Parigi, Francia',
      tags: ['cultura', 'città']
    };
    rerender({ trips: [...mockTrips, newTrip] });
    
    // Il filtro dovrebbe essere mantenuto
    expect(result.current.searchTerm).toBe('italia');
    // Solo i viaggi italiani dovrebbero essere visibili
    expect(result.current.filteredTrips).toHaveLength(3);
  });

  it('dovrebbe gestire delay personalizzato per il debouncing', () => {
    const { result } = renderHook(() => useTripFilters(mockTrips, 500));

    // Il comportamento di base dovrebbe essere lo stesso
    // (il delay viene testato nell'hook useDebounce)
    expect(result.current.filteredTrips).toHaveLength(3);
    
    act(() => {
      result.current.setSearchTerm('toscana');
    });
    expect(result.current.filteredTrips).toHaveLength(1);
  });

  it('dovrebbe fornire il termine di ricerca con e senza debouncing', () => {
    const { result } = renderHook(() => useTripFilters(mockTrips));

    act(() => {
      result.current.setSearchTerm('test');
    });

    expect(result.current.searchTerm).toBe('test'); // Valore immediato
    expect(result.current.debouncedSearchTerm).toBe('test'); // Valore con debouncing (mockato per essere immediato)
  });
});