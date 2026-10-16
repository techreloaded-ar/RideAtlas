import { filterTripsByVehicle, type SearchableTrip } from '@/lib/utils/searchUtils';

describe('filterTripsByVehicle', () => {
  const base = { destination: 'Italia', tags: [] as string[] };
  const trips: SearchableTrip[] = [
    { ...base, title: 'm', vehicle: 'MOTO' },
    { ...base, title: 'b', vehicle: 'BICI' },
    { ...base, title: 'e', vehicle: 'EBIKE' },
    { ...base, title: 's', vehicle: 'MONOPATTINO' },
    { ...base, title: 'legacy' },
  ];

  it('senza filtro ritorna tutti i viaggi', () => {
    expect(filterTripsByVehicle(trips, null)).toHaveLength(5);
  });

  it('MONOPATTINO ritorna solo i viaggi in monopattino', () => {
    expect(filterTripsByVehicle(trips, 'MONOPATTINO').map(t => t.title)).toEqual(['s']);
  });

  it('MOTO include i viaggi senza campo mezzo', () => {
    expect(filterTripsByVehicle(trips, 'MOTO').map(t => t.title)).toEqual(['m', 'legacy']);
  });

  it('ritorna lista vuota senza corrispondenze', () => {
    expect(filterTripsByVehicle([trips[0]], 'BICI')).toEqual([]);
  });
});
