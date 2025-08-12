export interface LocationCoordinates {
  lat: number;
  lng: number;
}

export interface RegionData {
  name: string;
  cities: string[];
  coordinates: LocationCoordinates;
}

/**
 * Comprehensive Italian regions and cities data
 */
export const ITALIAN_REGIONS: Record<string, RegionData> = {
  'marche': {
    name: 'Marche',
    cities: ['ancona', 'pesaro', 'urbino', 'macerata', 'ascoli piceno', 'fermo', 'senigallia', 'jesi', 'fabriano'],
    coordinates: { lat: 43.6158, lng: 13.5189 }
  },
  'toscana': {
    name: 'Toscana',
    cities: ['firenze', 'siena', 'pisa', 'livorno', 'arezzo', 'grosseto', 'prato', 'pistoia', 'lucca', 'massa'],
    coordinates: { lat: 43.7711, lng: 11.2486 }
  },
  'umbria': {
    name: 'Umbria',
    cities: ['perugia', 'terni', 'assisi', 'foligno', 'città di castello', 'spoleto', 'orvieto'],
    coordinates: { lat: 43.1122, lng: 12.3888 }
  },
  'lazio': {
    name: 'Lazio',
    cities: ['roma', 'latina', 'frosinone', 'rieti', 'viterbo'],
    coordinates: { lat: 41.9028, lng: 12.4964 }
  },
  'abruzzo': {
    name: 'Abruzzo',
    cities: ['l\'aquila', 'chieti', 'pescara', 'teramo'],
    coordinates: { lat: 42.3498, lng: 13.3995 }
  },
  'molise': {
    name: 'Molise',
    cities: ['campobasso', 'isernia'],
    coordinates: { lat: 41.5610, lng: 14.6683 }
  },
  'puglia': {
    name: 'Puglia',
    cities: ['bari', 'brindisi', 'foggia', 'lecce', 'taranto', 'bat'],
    coordinates: { lat: 41.1253, lng: 16.8619 }
  },
  'basilicata': {
    name: 'Basilicata',
    cities: ['potenza', 'matera'],
    coordinates: { lat: 40.6389, lng: 15.8061 }
  },
  'calabria': {
    name: 'Calabria',
    cities: ['catanzaro', 'cosenza', 'crotone', 'reggio calabria', 'vibo valentia'],
    coordinates: { lat: 38.9097, lng: 16.5987 }
  },
  'sicilia': {
    name: 'Sicilia',
    cities: ['palermo', 'catania', 'messina', 'siracusa', 'trapani', 'ragusa', 'agrigento', 'caltanissetta', 'enna'],
    coordinates: { lat: 37.5999, lng: 14.0153 }
  },
  'sardegna': {
    name: 'Sardegna',
    cities: ['cagliari', 'sassari', 'nuoro', 'oristano'],
    coordinates: { lat: 40.1209, lng: 9.0129 }
  },
  'campania': {
    name: 'Campania',
    cities: ['napoli', 'salerno', 'caserta', 'benevento', 'avellino'],
    coordinates: { lat: 40.8359, lng: 14.2488 }
  },
  'emilia-romagna': {
    name: 'Emilia-Romagna',
    cities: ['bologna', 'modena', 'parma', 'reggio emilia', 'ferrara', 'ravenna', 'forlì-cesena', 'rimini', 'piacenza'],
    coordinates: { lat: 44.4949, lng: 11.3426 }
  },
  'veneto': {
    name: 'Veneto',
    cities: ['venezia', 'verona', 'padova', 'vicenza', 'treviso', 'rovigo', 'belluno'],
    coordinates: { lat: 45.4408, lng: 12.3155 }
  },
  'friuli-venezia giulia': {
    name: 'Friuli-Venezia Giulia',
    cities: ['trieste', 'udine', 'pordenone', 'gorizia'],
    coordinates: { lat: 45.6494, lng: 13.7768 }
  },
  'trentino-alto adige': {
    name: 'Trentino-Alto Adige',
    cities: ['trento', 'bolzano'],
    coordinates: { lat: 46.4983, lng: 11.3548 }
  },
  'lombardia': {
    name: 'Lombardia',
    cities: ['milano', 'bergamo', 'brescia', 'como', 'cremona', 'mantova', 'pavia', 'sondrio', 'varese', 'monza'],
    coordinates: { lat: 45.4642, lng: 9.1900 }
  },
  'piemonte': {
    name: 'Piemonte',
    cities: ['torino', 'alessandria', 'asti', 'biella', 'cuneo', 'novara', 'verbano-cusio-ossola', 'vercelli'],
    coordinates: { lat: 45.0732, lng: 7.6868 }
  },
  'valle d\'aosta': {
    name: 'Valle d\'Aosta',
    cities: ['aosta'],
    coordinates: { lat: 45.7369, lng: 7.3208 }
  },
  'liguria': {
    name: 'Liguria',
    cities: ['genova', 'imperia', 'la spezia', 'savona'],
    coordinates: { lat: 44.4056, lng: 8.9463 }
  }
};

/**
 * Location mapping for quick coordinate lookup
 * Combines regions and major cities
 */
export const LOCATION_COORDINATES: Record<string, LocationCoordinates> = {
  // Major cities
  'roma': { lat: 41.9028, lng: 12.4964 },
  'milano': { lat: 45.4642, lng: 9.1900 },
  'napoli': { lat: 40.8518, lng: 14.2681 },
  'torino': { lat: 45.0703, lng: 7.6869 },
  'palermo': { lat: 38.1157, lng: 13.3615 },
  'genova': { lat: 44.4056, lng: 8.9463 },
  'bologna': { lat: 44.4949, lng: 11.3426 },
  'firenze': { lat: 43.7696, lng: 11.2558 },
  'venezia': { lat: 45.4408, lng: 12.3155 },
  'catania': { lat: 37.5079, lng: 15.0830 },
  'verona': { lat: 45.4384, lng: 10.9916 },
  'messina': { lat: 38.1938, lng: 15.5540 },
  'padova': { lat: 45.4064, lng: 11.8768 },
  'trieste': { lat: 45.6495, lng: 13.7768 },
  'brescia': { lat: 45.5416, lng: 10.2118 },
  'taranto': { lat: 40.4668, lng: 17.2725 },
  'prato': { lat: 43.8777, lng: 11.1023 },
  'reggio calabria': { lat: 38.1113, lng: 15.6619 },
  'modena': { lat: 44.6473, lng: 10.9252 },
  'reggio emilia': { lat: 44.6989, lng: 10.6297 },
  'perugia': { lat: 43.1122, lng: 12.3888 },
  'ravenna': { lat: 44.4173, lng: 12.1979 },
  'livorno': { lat: 43.5443, lng: 10.3261 },
  'cagliari': { lat: 39.2238, lng: 9.1217 },
  'foggia': { lat: 41.4621, lng: 15.5447 },
  'rimini': { lat: 44.0678, lng: 12.5695 },
  'salerno': { lat: 40.6824, lng: 14.7681 },
  'ferrara': { lat: 44.8381, lng: 11.6198 },
  'sassuolo': { lat: 44.5458, lng: 10.7831 },
  'monza': { lat: 45.5845, lng: 9.2744 },
  
  // Add region coordinates
  ...Object.fromEntries(
    Object.entries(ITALIAN_REGIONS).map(([key, region]) => [key, region.coordinates])
  )
};

/**
 * Get coordinates for a location string
 */
export function getLocationCoordinates(location: string): LocationCoordinates | null {
  const locationLower = location.toLowerCase().trim();
  return LOCATION_COORDINATES[locationLower] || null;
}

/**
 * Check if a location belongs to a specific region
 */
export function isLocationInRegion(location: string, region: string): boolean {
  const regionLower = region.toLowerCase();
  const locationLower = location.toLowerCase();
  
  const regionData = ITALIAN_REGIONS[regionLower];
  if (!regionData) return false;
  
  // Check if location matches region name or is in region's cities
  return regionLower === locationLower || regionData.cities.includes(locationLower);
}

/**
 * Get region for a given location
 */
export function getRegionForLocation(location: string): string | null {
  const locationLower = location.toLowerCase();
  
  for (const [regionKey, regionData] of Object.entries(ITALIAN_REGIONS)) {
    if (regionKey === locationLower || regionData.cities.includes(locationLower)) {
      return regionData.name;
    }
  }
  
  return null;
}