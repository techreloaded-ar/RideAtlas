// src/lib/constraintValidationService.ts
import { calculateTripDistance, getApproximateCoordinates } from './geoUtils';

export interface UserConstraints {
  maxDays?: number;
  region?: string;
  location?: string;
  maxRadiusKm?: number;
}

export interface TripConstraintValidation {
  isValid: boolean;
  violations: string[];
  warnings: string[];
}

export interface ConstraintValidationResult {
  isValid: boolean;
  validTrips: any[];
  violations: string[];
  warnings: string[];
  totalDuration: number;
  exceedsMaxDays: boolean;
}

/**
 * Italian regions and their major cities/areas for geographic validation
 */
const ITALIAN_REGIONS = {
  'marche': {
    name: 'Marche',
    cities: ['ancona', 'pesaro', 'urbino', 'macerata', 'ascoli piceno', 'fermo', 'senigallia', 'jesi', 'fabriano'],
    coordinates: { lat: 43.6158, lng: 13.5189 } // Central Marche
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
  'campania': {
    name: 'Campania',
    cities: ['napoli', 'salerno', 'caserta', 'benevento', 'avellino', 'amalfi', 'sorrento', 'capri'],
    coordinates: { lat: 40.8518, lng: 14.2681 }
  },
  'sicilia': {
    name: 'Sicilia',
    cities: ['palermo', 'catania', 'messina', 'siracusa', 'trapani', 'agrigento', 'caltanissetta', 'enna', 'ragusa'],
    coordinates: { lat: 37.5999, lng: 14.0153 }
  },
  'sardegna': {
    name: 'Sardegna',
    cities: ['cagliari', 'sassari', 'nuoro', 'oristano', 'olbia', 'alghero', 'carbonia'],
    coordinates: { lat: 40.1209, lng: 9.0129 }
  },
  'calabria': {
    name: 'Calabria',
    cities: ['catanzaro', 'reggio calabria', 'cosenza', 'crotone', 'vibo valentia'],
    coordinates: { lat: 39.3081, lng: 16.5025 }
  },
  'puglia': {
    name: 'Puglia',
    cities: ['bari', 'lecce', 'taranto', 'foggia', 'brindisi', 'andria', 'trani', 'barletta'],
    coordinates: { lat: 41.1171, lng: 16.8719 }
  },
  'basilicata': {
    name: 'Basilicata',
    cities: ['potenza', 'matera'],
    coordinates: { lat: 40.6389, lng: 15.8061 }
  },
  'abruzzo': {
    name: 'Abruzzo',
    cities: ['l\'aquila', 'pescara', 'chieti', 'teramo'],
    coordinates: { lat: 42.3498, lng: 13.3995 }
  },
  'molise': {
    name: 'Molise',
    cities: ['campobasso', 'isernia'],
    coordinates: { lat: 41.5603, lng: 14.6688 }
  },
  'emilia-romagna': {
    name: 'Emilia-Romagna',
    cities: ['bologna', 'modena', 'parma', 'reggio emilia', 'ferrara', 'ravenna', 'forlì', 'cesena', 'rimini', 'piacenza'],
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
    cities: ['trento', 'bolzano', 'merano', 'rovereto'],
    coordinates: { lat: 46.4983, lng: 11.3548 }
  },
  'lombardia': {
    name: 'Lombardia',
    cities: ['milano', 'bergamo', 'brescia', 'como', 'cremona', 'mantova', 'pavia', 'sondrio', 'varese'],
    coordinates: { lat: 45.4642, lng: 9.1900 }
  },
  'piemonte': {
    name: 'Piemonte',
    cities: ['torino', 'alessandria', 'asti', 'biella', 'cuneo', 'novara', 'verbania', 'vercelli'],
    coordinates: { lat: 45.0703, lng: 7.6869 }
  },
  'liguria': {
    name: 'Liguria',
    cities: ['genova', 'la spezia', 'savona', 'imperia', 'cinque terre', 'portofino', 'sanremo'],
    coordinates: { lat: 44.4056, lng: 8.9463 }
  },
  'valle d\'aosta': {
    name: 'Valle d\'Aosta',
    cities: ['aosta', 'courmayeur', 'cervinia'],
    coordinates: { lat: 45.7369, lng: 7.3207 }
  }
};

export class ConstraintValidationService {
  /**
   * Extract user constraints from the message
   */
  static extractConstraints(message: string): UserConstraints {
    const messageLower = message.toLowerCase();
    const constraints: UserConstraints = {
      maxRadiusKm: 30 // Default 30km radius constraint
    };

    // Extract maximum days
    const daysMatch = messageLower.match(/(\d+)\s*(giorni?|giorno|days?|day)/);
    if (daysMatch) {
      constraints.maxDays = parseInt(daysMatch[1]);
    }

    // Extract region
    for (const [regionKey, regionData] of Object.entries(ITALIAN_REGIONS)) {
      if (messageLower.includes(regionKey) || messageLower.includes(regionData.name.toLowerCase())) {
        constraints.region = regionKey;
        break;
      }
    }

    // Extract specific location if no region found
    if (!constraints.region) {
      for (const [regionKey, regionData] of Object.entries(ITALIAN_REGIONS)) {
        for (const city of regionData.cities) {
          if (messageLower.includes(city)) {
            constraints.location = city;
            constraints.region = regionKey; // Also set region for the city
            break;
          }
        }
        if (constraints.location) break;
      }
    }

    return constraints;
  }

  /**
   * Validate if a trip destination is within the specified region
   */
  static isWithinRegion(tripDestination: string, targetRegion: string): boolean {
    const regionData = ITALIAN_REGIONS[targetRegion as keyof typeof ITALIAN_REGIONS];
    if (!regionData) return false;

    const destinationLower = tripDestination.toLowerCase();
    
    // Check if destination contains region name
    if (destinationLower.includes(targetRegion) || destinationLower.includes(regionData.name.toLowerCase())) {
      return true;
    }

    // Check if destination contains any city from the region
    return regionData.cities.some(city => destinationLower.includes(city));
  }

  /**
   * Validate if a trip destination is within the specified radius
   */
  static isWithinRadius(tripDestination: string, centerLocation: string, maxRadiusKm: number): boolean {
    const distance = calculateTripDistance(tripDestination, centerLocation);
    return distance !== null && distance <= maxRadiusKm;
  }

  /**
   * Validate a single trip against constraints
   */
  static validateTrip(trip: any, constraints: UserConstraints): TripConstraintValidation {
    const violations: string[] = [];
    const warnings: string[] = [];

    // Geographic validation
    if (constraints.region) {
      if (!this.isWithinRegion(trip.destination, constraints.region)) {
        violations.push(`Trip "${trip.title}" is outside the ${ITALIAN_REGIONS[constraints.region as keyof typeof ITALIAN_REGIONS]?.name || constraints.region} region`);
      }
    }

    if (constraints.location && constraints.maxRadiusKm) {
      if (!this.isWithinRadius(trip.destination, constraints.location, constraints.maxRadiusKm)) {
        violations.push(`Trip "${trip.title}" is more than ${constraints.maxRadiusKm}km from ${constraints.location}`);
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings
    };
  }

  /**
   * Validate a collection of trips against all constraints
   */
  static validateTripCollection(trips: any[], constraints: UserConstraints): ConstraintValidationResult {
    const validTrips: any[] = [];
    const violations: string[] = [];
    const warnings: string[] = [];

    // Filter trips based on individual constraints
    for (const trip of trips) {
      const tripValidation = this.validateTrip(trip, constraints);
      
      if (tripValidation.isValid) {
        validTrips.push(trip);
      } else {
        violations.push(...tripValidation.violations);
      }
      
      warnings.push(...tripValidation.warnings);
    }

    // Calculate total duration
    const totalDuration = validTrips.reduce((sum, trip) => sum + trip.duration_days, 0);
    
    // Check duration constraint
    const exceedsMaxDays = constraints.maxDays ? totalDuration > constraints.maxDays : false;
    
    if (exceedsMaxDays && constraints.maxDays) {
      violations.push(`Total trip duration (${totalDuration} days) exceeds maximum requested days (${constraints.maxDays})`);
    }

    // If duration exceeds, filter trips to fit within constraint
    let finalValidTrips = validTrips;
    if (exceedsMaxDays && constraints.maxDays) {
      finalValidTrips = this.filterTripsToFitDuration(validTrips, constraints.maxDays);
      warnings.push(`Trip selection was reduced to fit within ${constraints.maxDays} days`);
    }

    return {
      isValid: violations.length === 0,
      validTrips: finalValidTrips,
      violations,
      warnings,
      totalDuration: finalValidTrips.reduce((sum, trip) => sum + trip.duration_days, 0),
      exceedsMaxDays: false // After filtering, this should be false
    };
  }

  /**
   * Filter trips to fit within maximum duration
   */
  static filterTripsToFitDuration(trips: any[], maxDays: number): any[] {
    // Sort trips by relevance score (if available) or duration
    const sortedTrips = [...trips].sort((a, b) => {
      if (a.relevanceScore && b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return a.duration_days - b.duration_days; // Prefer shorter trips
    });

    const selectedTrips: any[] = [];
    let totalDays = 0;

    for (const trip of sortedTrips) {
      if (totalDays + trip.duration_days <= maxDays) {
        selectedTrips.push(trip);
        totalDays += trip.duration_days;
      }
    }

    return selectedTrips;
  }

  /**
   * Generate constraint summary for AI prompt
   */
  static generateConstraintSummary(constraints: UserConstraints): string {
    const parts: string[] = [];

    if (constraints.maxDays) {
      parts.push(`DURATA MASSIMA: ${constraints.maxDays} giorni (VINCOLO ASSOLUTO - NON SUPERARE MAI)`);
    }

    if (constraints.region) {
      const regionName = ITALIAN_REGIONS[constraints.region as keyof typeof ITALIAN_REGIONS]?.name || constraints.region;
      parts.push(`REGIONE: Solo viaggi nella regione ${regionName} (VINCOLO ASSOLUTO)`);
    }

    if (constraints.location && constraints.maxRadiusKm) {
      parts.push(`RAGGIO: Solo viaggi entro ${constraints.maxRadiusKm}km da ${constraints.location} (VINCOLO ASSOLUTO)`);
    }

    return parts.join('\n');
  }
}
