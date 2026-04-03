export type TripZoneFilter = 'all' | 'nord' | 'centro' | 'sud';
export type TripDurationFilter = 'all' | '1' | '2' | '3plus';

const ITALY_ZONE_KEYWORDS: Record<Exclude<TripZoneFilter, 'all'>, string[]> = {
  nord: [
    'valle d\'aosta', 'aosta', 'piemonte', 'torino', 'liguria', 'genova', 'lombardia', 'milano',
    'trentino', 'alto adige', 'trentino alto adige', 'bolzano', 'trento', 'veneto', 'venezia',
    'friuli venezia giulia', 'friuli', 'trieste', 'emilia romagna', 'bologna', 'modena', 'parma', 'rimini'
  ],
  centro: [
    'toscana', 'firenze', 'siena', 'lazio', 'roma', 'umbria', 'perugia', 'marche', 'ancona',
    'abruzzo', 'laquila', "l'aquila", 'pescara'
  ],
  sud: [
    'molise', 'campania', 'napoli', 'salerno', 'puglia', 'bari', 'lecce', 'taranto',
    'basilicata', 'potenza', 'matera', 'calabria', 'reggio calabria', 'sicilia', 'palermo',
    'catania', 'sardegna', 'cagliari', 'nuoro'
  ],
};

const normalizeText = (value: string): string => {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export function detectTripZone(input: string): Exclude<TripZoneFilter, 'all'> | null {
  const normalizedInput = normalizeText(input);

  if (!normalizedInput) {
    return null;
  }

  for (const zone of Object.keys(ITALY_ZONE_KEYWORDS) as Array<Exclude<TripZoneFilter, 'all'>>) {
    const keywords = ITALY_ZONE_KEYWORDS[zone];
    if (keywords.some((keyword) => normalizedInput.includes(normalizeText(keyword)))) {
      return zone;
    }
  }

  return null;
}

export function matchesZoneFilter(input: string, zoneFilter: TripZoneFilter): boolean {
  if (zoneFilter === 'all') {
    return true;
  }

  return detectTripZone(input) === zoneFilter;
}

export function matchesDurationFilter(durationDays: number | null | undefined, durationFilter: TripDurationFilter): boolean {
  if (durationFilter === 'all') {
    return true;
  }

  if (!durationDays || durationDays < 1) {
    return false;
  }

  if (durationFilter === '1') {
    return durationDays === 1;
  }

  if (durationFilter === '2') {
    return durationDays === 2;
  }

  return durationDays >= 3;
}
