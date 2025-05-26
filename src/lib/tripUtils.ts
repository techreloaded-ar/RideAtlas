// src/lib/tripUtils.ts

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
export function enrichTripWithCharacteristics(trip: any): any {
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
