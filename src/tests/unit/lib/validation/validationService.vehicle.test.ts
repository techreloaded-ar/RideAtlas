import { ValidationService } from '@/lib/validation/validationService';

const trip = (title: string, distance: number | null, days: number) => ({
  id: title,
  title,
  destination: 'Roma',
  duration_days: days,
  gpxData: distance === null ? { hasGpx: false } : { hasGpx: true, distance },
});
const A = trip('Viaggio A', 400000, 3);
const B = trip('Viaggio B', 100000, 5);
const C = trip('Viaggio C', null, 2);

describe('ValidationService - vincolo mezzo', () => {
  it('monopattino esclude i viaggi oltre 50 km/giorno e tiene quelli senza GPX', () => {
    const r = ValidationService.validateTrips([A, B, C], { vehicle: 'MONOPATTINO', maxKmPerDay: 50 });
    expect(r.validTrips.map((t) => t.title)).toEqual(['Viaggio B', 'Viaggio C']);
    expect(r.warnings.some((w) => w.includes('Viaggio A'))).toBe(true);
  });

  it('moto mantiene tutti i viaggi', () => {
    const r = ValidationService.validateTrips([A, B, C], { vehicle: 'MOTO', maxKmPerDay: 450 });
    expect(r.validTrips).toHaveLength(3);
  });

  it('senza maxKmPerDay il comportamento è invariato', () => {
    const r = ValidationService.validateTrips([A, B, C], {});
    expect(r.validTrips).toHaveLength(3);
    expect(r.warnings).toHaveLength(0);
  });

  it('generateVehiclePrompt riporta mezzo, default e massimo', () => {
    const p = ValidationService.generateVehiclePrompt('MONOPATTINO');
    expect(p).toContain('Monopattino');
    expect(p).toContain('25');
    expect(p).toContain('50');
  });
});
