// src/lib/tripUtils.ts
import { Trip, Stage, isMultiStageTrip, castToGpxFile } from '../types/trip';

/**
 * Verifica se un viaggio è multi-tappa
 * @param trip Il viaggio da verificare
 * @returns true se il viaggio ha tappe, false altrimenti
 */
export const isMultiStageTripUtil = (trip: Trip): boolean => {
  return isMultiStageTrip(trip);
};

/**
 * Calcola la distanza totale di un viaggio
 * Per viaggi multi-tappa: somma le distanze di tutte le tappe
 * Per viaggi legacy: usa la distanza del GPX principale
 * @param trip Il viaggio di cui calcolare la distanza
 * @returns Distanza totale in metri
 */
export const calculateTotalDistance = (trip: Trip): number => {
  if (isMultiStageTrip(trip) && trip.stages) {
    return trip.stages.reduce((total, stage) => {
      return total + (stage.gpxFile?.distance || 0);
    }, 0);
  }
  
  // Fallback per viaggi legacy usando l'helper di casting
  const gpxFile = castToGpxFile(trip.gpxFile);
  if (gpxFile?.distance) {
    return gpxFile.distance;
  }
  
  return 0;
};

/**
 * Calcola la durata di un viaggio in giorni e notti
 * Per viaggi multi-tappa: giorni = numero tappe, notti = tappe - 1
 * Per viaggi legacy: usa il campo duration_days esistente
 * @param trip Il viaggio di cui calcolare la durata
 * @returns Oggetto con giorni e notti
 */
export const calculateTripDuration = (trip: Trip): { days: number, nights: number } => {

  const days = isMultiStageTrip(trip) && trip.stages ? 
                  trip.stages.length : 
                  trip.duration_days || 1;
                  
  const nights = Math.max(0, days - 1);
  return { days, nights };
};

/**
 * Valida che l'ordinamento delle tappe sia sequenziale
 * Verifica che gli orderIndex siano consecutivi a partire da 0
 * @param stages Array di tappe da validare
 * @returns true se l'ordinamento è valido, false altrimenti
 */
export const validateStageOrder = (stages: Stage[]): boolean => {
  if (!stages || stages.length === 0) return true;
  
  // Ordina le tappe per orderIndex per la validazione
  const sortedStages = [...stages].sort((a, b) => a.orderIndex - b.orderIndex);
  
  // Verifica che gli indici siano consecutivi partendo da 0
  for (let i = 0; i < sortedStages.length; i++) {
    if (sortedStages[i].orderIndex !== i) {
      return false;
    }
  }
  
  return true;
};

/**
 * Riordina le tappe secondo un nuovo ordine specificato
 * @param stages Array di tappe da riordinare
 * @param newOrder Array con i nuovi indici di ordinamento
 * @returns Array di tappe riordinate con orderIndex aggiornati
 */
export const reorderStages = (stages: Stage[], newOrder: number[]): Stage[] => {
  if (!stages || !newOrder || stages.length !== newOrder.length) {
    throw new Error('Invalid input: stages and newOrder arrays must have the same length');
  }
  
  // Verifica che newOrder contenga tutti gli indici validi
  const sortedNewOrder = [...newOrder].sort((a, b) => a - b);
  for (let i = 0; i < sortedNewOrder.length; i++) {
    if (sortedNewOrder[i] !== i) {
      throw new Error('Invalid newOrder: must contain consecutive indices starting from 0');
    }
  }
  
  // Crea il nuovo array riordinato
  const reorderedStages: Stage[] = new Array(stages.length);
  
  for (let i = 0; i < stages.length; i++) {
    const newIndex = newOrder[i];
    reorderedStages[newIndex] = {
      ...stages[i],
      orderIndex: newIndex
    };
  }
  
  return reorderedStages;
};

/**
 * Estrae le caratteristiche dai tag di un viaggio
 * Utilizza un prefisso 'char:' per identificare i tag che rappresentano caratteristiche
 * @param tags Array di tag del viaggio
 * @returns Array di caratteristiche estratte dai tag
 */
export function extractCharacteristicsFromTags(tags: string[]): string[] {
  const prefix = 'char:';
  return tags
    .filter(tag => tag.startsWith(prefix))
    .map(tag => tag.substring(prefix.length));
}

/**
 * Filtra i tag di un viaggio rimuovendo quelli che rappresentano caratteristiche
 * @param tags Array di tag del viaggio
 * @returns Array di tag senza le caratteristiche
 */
export function filterOutCharacteristicTags(tags: string[]): string[] {
  const prefix = 'char:';
  return tags.filter(tag => !tag.startsWith(prefix));
}

/**
 * Arricchisce un oggetto viaggio estraendo le caratteristiche dai tag
 * @param trip L'oggetto viaggio da arricchire
 * @returns Lo stesso oggetto arricchito con le caratteristiche estratte
 */
export function enrichTripWithCharacteristics(trip: Record<string, unknown>): Record<string, unknown> {
  if (!trip || !trip.tags || !Array.isArray(trip.tags)) {
    return trip;
  }
  
  const characteristics = extractCharacteristicsFromTags(trip.tags);
  const pureTags = filterOutCharacteristicTags(trip.tags);
  
  return {
    ...trip,
    tags: pureTags,
    characteristics: characteristics
  };
}
