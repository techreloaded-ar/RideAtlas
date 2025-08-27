/**
 * Tipi condivisi per le API dei viaggi
 * Contiene solo i tipi effettivamente utilizzati nel codebase
 */

import { ApiResponse } from '@/lib/trips/trip-access';

// ============================================================================
// TRIP REORDER API
// ============================================================================

/**
 * Request payload per il riordinamento dei viaggi
 */
export interface TripReorderRequest {
  tripIds: string[];
}

/**
 * Response per il riordinamento dei viaggi
 * Estende ApiResponse base con campi specifici per compatibilità
 */
export type TripReorderResponse = ApiResponse<{
  message: string;
  updatedCount: number;
}> & {
  // Campi aggiuntivi per compatibilità con implementazione esistente
  message?: string;
  updatedCount?: number;
  details?: unknown;
};
