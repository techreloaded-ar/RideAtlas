import { Prisma } from '@prisma/client';
import type { MediaItem } from '@/types/profile';

/**
 * Generate a temporary media ID for client-side usage
 * Format: temp_{timestamp}_{randomString}
 */
export function generateTempMediaId(): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `temp_${timestamp}_${randomStr}`;
}

/**
 * Cast a value to Prisma InputJsonValue type
 * Used for safely inserting JSON data into Prisma Json fields
 */
export function castToJsonValue<T>(value: T): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

/**
 * Safely convert JSON array from database to MediaItem array
 * Returns empty array if input is not a valid array
 */
export function castToMediaItems(jsonArray: unknown): MediaItem[] {
  if (!Array.isArray(jsonArray)) return [];
  return jsonArray as MediaItem[];
}
