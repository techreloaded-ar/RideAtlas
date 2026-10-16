import {
  VEHICLE_DAILY_KM,
  getVehicleLimits,
  parseVehicle,
} from '@/lib/trip-builder/vehicleLimits';

describe('vehicleLimits', () => {
  it.each(['BICI', 'EBIKE', 'MONOPATTINO'] as const)(
    'per %s default e max sono inferiori a quelli della moto',
    (v) => {
      expect(VEHICLE_DAILY_KM[v].default).toBeLessThan(VEHICLE_DAILY_KM.MOTO.default);
      expect(VEHICLE_DAILY_KM[v].max).toBeLessThan(VEHICLE_DAILY_KM.MOTO.max);
    }
  );

  it('default <= max per ogni mezzo', () => {
    Object.values(VEHICLE_DAILY_KM).forEach((l) =>
      expect(l.default).toBeLessThanOrEqual(l.max)
    );
  });

  it('i valori sono distinti tra i mezzi', () => {
    const all = Object.values(VEHICLE_DAILY_KM);
    expect(new Set(all.map((l) => l.max)).size).toBe(4);
    expect(new Set(all.map((l) => l.default)).size).toBe(4);
  });

  it('parseVehicle accetta solo mezzi validi', () => {
    expect(parseVehicle('BICI')).toBe('BICI');
    expect(parseVehicle('AEREO')).toBeNull();
    expect(parseVehicle(undefined)).toBeNull();
  });

  it('getVehicleLimits restituisce la tabella', () => {
    expect(getVehicleLimits('MONOPATTINO')).toEqual({ default: 25, max: 50 });
  });
});
