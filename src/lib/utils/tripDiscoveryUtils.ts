export type TripZone = 'nord' | 'centro' | 'sud';
export type TripZoneFilter = 'all' | TripZone;
export type TripDurationFilter = 'all' | '1' | '2' | '3plus';
export type ActiveTripZoneFilters = TripZone[];
export type ActiveTripDurationFilters = Array<Exclude<TripDurationFilter, 'all'>>;

const ITALY_ZONE_REGIONS: Record<TripZone, string[]> = {
  nord: [
    "valle d'aosta",
    'valle d aosta',
    'piemonte',
    'liguria',
    'lombardia',
    'trentino',
    'alto adige',
    'trentino alto adige',
    'veneto',
    'friuli',
    'friuli venezia giulia',
    'emilia romagna',
  ],
  centro: [
    'toscana',
    'lazio',
    'umbria',
    'marche',
    'abruzzo',
  ],
  sud: [
    'molise',
    'campania',
    'puglia',
    'basilicata',
    'calabria',
    'sicilia',
    'sardegna',
  ],
};

const normalizeText = (value: string): string => {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/[\s-]+/g, ' ')
    .trim();
};

const tokenize = (value: string): string[] => {
  const normalized = normalizeText(value);
  return normalized ? normalized.split(' ') : [];
};

const matchesWholePhrase = (tokens: string[], phrase: string): boolean => {
  const phraseTokens = tokenize(phrase);

  if (phraseTokens.length === 0 || phraseTokens.length > tokens.length) {
    return false;
  }

  for (let index = 0; index <= tokens.length - phraseTokens.length; index += 1) {
    const isFullMatch = phraseTokens.every((token, offset) => tokens[index + offset] === token);
    if (isFullMatch) {
      return true;
    }
  }

  return false;
};

const buildLocationEntries = (destination: string, tags: string[]): string[] => {
  const entries = [destination, ...tags];
  return entries.filter((entry): entry is string => Boolean(entry && entry.trim()));
};

export function detectTripZones(destination: string, tags: string[]): TripZone[] {
  const entries = buildLocationEntries(destination, tags);

  if (entries.length === 0) {
    return [];
  }

  const matchedZones = new Set<TripZone>();

  for (const entry of entries) {
    const tokens = tokenize(entry);

    if (tokens.length === 0) {
      continue;
    }

    for (const zone of Object.keys(ITALY_ZONE_REGIONS) as TripZone[]) {
      if (ITALY_ZONE_REGIONS[zone].some((region) => matchesWholePhrase(tokens, region))) {
        matchedZones.add(zone);
      }
    }
  }

  return Array.from(matchedZones);
}

export function matchesZoneFilter(
  destination: string,
  tags: string[],
  zoneFilters: ActiveTripZoneFilters
): boolean {
  if (zoneFilters.length === 0) {
    return true;
  }

  const matchedZones = detectTripZones(destination, tags);
  if (matchedZones.length === 0) {
    return false;
  }

  return zoneFilters.some((zone) => matchedZones.includes(zone));
}

export function matchesDurationFilter(
  durationDays: number | null | undefined,
  durationFilters: ActiveTripDurationFilters
): boolean {
  if (durationFilters.length === 0) {
    return true;
  }

  if (!durationDays || durationDays < 1) {
    return false;
  }

  return durationFilters.some((durationFilter) => {
    if (durationFilter === '1') {
      return durationDays === 1;
    }

    if (durationFilter === '2') {
      return durationDays === 2;
    }

    return durationDays >= 3;
  });
}
