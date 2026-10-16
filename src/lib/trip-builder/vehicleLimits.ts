import { VehicleOptions, type VehicleValue } from '@/schemas/trip';

export interface VehicleDailyKm {
  default: number;
  max: number;
}

/** Km/giorno predefiniti e massimi per mezzo (unica fonte di verità). */
export const VEHICLE_DAILY_KM: Record<VehicleValue, VehicleDailyKm> = {
  MOTO: { default: 250, max: 450 },
  BICI: { default: 60, max: 120 },
  EBIKE: { default: 80, max: 150 },
  MONOPATTINO: { default: 25, max: 50 },
};

export function parseVehicle(value: unknown): VehicleValue | null {
  return typeof value === 'string' &&
    (VehicleOptions as readonly string[]).includes(value)
    ? (value as VehicleValue)
    : null;
}

export function getVehicleLimits(vehicle: VehicleValue): VehicleDailyKm {
  return VEHICLE_DAILY_KM[vehicle];
}
