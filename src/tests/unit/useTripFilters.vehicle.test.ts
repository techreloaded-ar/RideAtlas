import { renderHook, act } from '@testing-library/react';
import useTripFilters from '@/hooks/useTripFilters';
import type { SearchableTrip } from '@/lib/utils/searchUtils';

jest.mock('@/hooks/useDebounce', () => jest.fn((value: string) => value));

describe('useTripFilters - filtro mezzo', () => {
  const trips: SearchableTrip[] = [
    { title: 'Giro alpino', destination: 'Alpi', tags: ['alpi'], vehicle: 'BICI' },
    { title: 'Giro costiero', destination: 'Liguria', tags: ['mare'], vehicle: 'BICI' },
    { title: 'Scooter urbano', destination: 'Roma', tags: ['città'], vehicle: 'MONOPATTINO' },
    { title: 'Passo in moto', destination: 'Alpi', tags: ['alpi'], vehicle: 'MOTO' },
  ];

  it('inizialmente nessun filtro e tutti i viaggi', () => {
    const { result } = renderHook(() => useTripFilters(trips));
    expect(result.current.vehicleFilter).toBeNull();
    expect(result.current.filteredTrips).toHaveLength(4);
  });

  it('filtra per mezzo', () => {
    const { result } = renderHook(() => useTripFilters(trips));
    act(() => result.current.setVehicleFilter('MONOPATTINO'));
    expect(result.current.filteredTrips.map(t => t.title)).toEqual(['Scooter urbano']);
  });

  it('combina ricerca testuale e mezzo', () => {
    const { result } = renderHook(() => useTripFilters(trips));
    act(() => result.current.setVehicleFilter('BICI'));
    act(() => result.current.setSearchTerm('alpi'));
    expect(result.current.filteredTrips.map(t => t.title)).toEqual(['Giro alpino']);
    act(() => result.current.setSearchTerm(''));
    expect(result.current.filteredTrips).toHaveLength(2);
  });

  it('azzerando il filtro tornano tutti i viaggi', () => {
    const { result } = renderHook(() => useTripFilters(trips));
    act(() => result.current.setVehicleFilter('MOTO'));
    act(() => result.current.setVehicleFilter(null));
    expect(result.current.filteredTrips).toHaveLength(4);
  });
});
