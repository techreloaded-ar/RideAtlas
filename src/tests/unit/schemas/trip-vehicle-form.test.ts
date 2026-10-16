import {
  tripWithStagesSchema,
  getCharacteristicOptionsForVehicle,
  filterCharacteristicsForVehicle,
} from '@/schemas/trip';

const base = {
  title: 'Viaggio test',
  summary: 'Descrizione del viaggio di test',
  destination: 'Dolomiti',
  theme: 'Montagna',
  characteristics: [],
  recommended_seasons: [],
  tags: [],
  media: [],
  gpxFile: null,
  stages: [{ orderIndex: 0, title: 'Tappa 1', media: [], gpxFile: null }],
};

describe('tripWithStagesSchema - vehicle', () => {
  it.each(['MOTO', 'BICI', 'EBIKE', 'MONOPATTINO'])('accetta il mezzo %s', (vehicle) => {
    expect(tripWithStagesSchema.safeParse({ ...base, vehicle }).success).toBe(true);
  });

  it('rifiuta un mezzo non valido con errore su vehicle', () => {
    const result = tripWithStagesSchema.safeParse({ ...base, vehicle: 'AEREO' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('vehicle');
    }
  });

  it('accetta il viaggio senza mezzo', () => {
    expect(tripWithStagesSchema.safeParse(base).success).toBe(true);
  });
});

describe('getCharacteristicOptionsForVehicle', () => {
  it.each(['MOTO', undefined] as const)('per %s offre tutte le 9 caratteristiche', (vehicle) => {
    const options = getCharacteristicOptionsForVehicle(vehicle);
    expect(options).toHaveLength(9);
    expect(options).toContain('Autostrada');
    expect(options).toContain('Presenza pedaggi');
  });

  it.each(['BICI', 'EBIKE', 'MONOPATTINO'] as const)('per %s esclude Autostrada e Presenza pedaggi', (vehicle) => {
    const options = getCharacteristicOptionsForVehicle(vehicle);
    expect(options).toHaveLength(7);
    expect(options).not.toContain('Autostrada');
    expect(options).not.toContain('Presenza pedaggi');
    expect(options).toContain('Strade sterrate');
    expect(options).toContain('Bel paesaggio');
    expect(options).toContain('Presenza traghetti');
  });
});

describe('filterCharacteristicsForVehicle', () => {
  it('rimuove le caratteristiche non compatibili', () => {
    expect(filterCharacteristicsForVehicle(['Autostrada', 'Bel paesaggio'], 'BICI')).toEqual(['Bel paesaggio']);
  });

  it('lascia invariato per la moto', () => {
    expect(filterCharacteristicsForVehicle(['Autostrada', 'Bel paesaggio'], 'MOTO')).toEqual(['Autostrada', 'Bel paesaggio']);
  });
});
