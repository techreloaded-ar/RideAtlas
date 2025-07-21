// src/lib/validationService.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { calculateTripDistance } from './geoUtils';
import { ITALIAN_REGIONS, isLocationInRegion } from './locationData';

export interface UserConstraints {
  maxDays?: number;
  region?: string;
  location?: string;
  maxRadiusKm?: number;
}

export interface ValidationResult {
  isValid: boolean;
  validTrips: any[];
  violations: string[];
  warnings: string[];
  totalDuration: number;
  exceedsMaxDays: boolean;
  removedTrips?: any[];
}

export class ValidationService {
  /**
   * Extract all user constraints from the message
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

    // Check for week patterns
    if (messageLower.includes('settimana') || messageLower.includes('week')) {
      if (messageLower.includes('una') || messageLower.includes('1')) {
        constraints.maxDays = 7;
      } else if (messageLower.includes('due') || messageLower.includes('2')) {
        constraints.maxDays = 14;
      }
    }

    // Check for weekend patterns
    if (messageLower.includes('weekend')) {
      constraints.maxDays = messageLower.includes('lungo') ? 4 : 3;
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
            constraints.region = regionKey;
            break;
          }
        }
        if (constraints.location) break;
      }
    }

    return constraints;
  }

  /**
   * Validate trips against all constraints
   */
  static validateTrips(trips: any[], constraints: UserConstraints): ValidationResult {
    let validTrips = [...trips];
    const violations: string[] = [];
    const warnings: string[] = [];
    let removedTrips: any[] = [];

    // Apply geographic constraints
    if (constraints.region || constraints.location) {
      const geoResult = this.validateGeographicConstraints(validTrips, constraints);
      validTrips = geoResult.validTrips;
      violations.push(...geoResult.violations);
      warnings.push(...geoResult.warnings);
    }

    // Apply duration constraints
    if (constraints.maxDays) {
      const durationResult = this.validateDurationConstraints(validTrips, constraints.maxDays);
      validTrips = durationResult.validTrips;
      removedTrips = durationResult.removedTrips;
      if (durationResult.exceedsLimit) {
        warnings.push(`Alcuni viaggi sono stati rimossi per rispettare il limite di ${constraints.maxDays} giorni`);
      }
    }

    const totalDuration = validTrips.reduce((sum, trip) => sum + trip.duration_days, 0);
    const exceedsMaxDays = constraints.maxDays ? totalDuration > constraints.maxDays : false;

    return {
      isValid: violations.length === 0,
      validTrips,
      violations,
      warnings,
      totalDuration,
      exceedsMaxDays,
      removedTrips
    };
  }

  /**
   * Validate geographic constraints
   */
  private static validateGeographicConstraints(trips: any[], constraints: UserConstraints) {
    const validTrips: any[] = [];
    const violations: string[] = [];
    const warnings: string[] = [];

    for (const trip of trips) {
      let isValid = true;
      const tripDestination = trip.destination.toLowerCase();

      // Check region constraint
      if (constraints.region) {
        if (!isLocationInRegion(tripDestination, constraints.region)) {
          isValid = false;
          violations.push(`${trip.title}: destinazione non nella regione ${constraints.region}`);
        }
      }

      // Check location constraint with radius
      if (constraints.location && constraints.maxRadiusKm) {
        const distance = calculateTripDistance(constraints.location, trip.destination);
        if (distance && distance > constraints.maxRadiusKm) {
          isValid = false;
          violations.push(`${trip.title}: troppo distante da ${constraints.location} (${distance}km > ${constraints.maxRadiusKm}km)`);
        }
      }

      if (isValid) {
        validTrips.push(trip);
      }
    }

    return { validTrips, violations, warnings };
  }

  /**
   * Validate duration constraints
   */
  private static validateDurationConstraints(trips: any[], maxDays: number) {
    const sortedTrips = [...trips].sort((a, b) => {
      // Sort by relevance score if available, otherwise by duration (shorter first)
      if (a.relevanceScore && b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return a.duration_days - b.duration_days;
    });

    const validTrips: any[] = [];
    const removedTrips: any[] = [];
    let totalDuration = 0;

    for (const trip of sortedTrips) {
      if (totalDuration + trip.duration_days <= maxDays) {
        validTrips.push(trip);
        totalDuration += trip.duration_days;
      } else {
        removedTrips.push(trip);
      }
    }

    return {
      validTrips,
      removedTrips,
      totalDuration,
      exceedsLimit: removedTrips.length > 0
    };
  }

  /**
   * Generate constraint summary for prompts
   */
  static generateConstraintSummary(constraints: UserConstraints): string {
    const parts: string[] = [];

    if (constraints.maxDays) {
      parts.push(`DURATA MASSIMA: ${constraints.maxDays} giorni (VINCOLO ASSOLUTO)`);
    }

    if (constraints.region) {
      const regionData = ITALIAN_REGIONS[constraints.region];
      if (regionData) {
        parts.push(`REGIONE: ${regionData.name} (VINCOLO GEOGRAFICO ASSOLUTO)`);
      }
    }

    if (constraints.location) {
      parts.push(`LOCALITÀ: ${constraints.location} (raggio ${constraints.maxRadiusKm || 30}km)`);
    }

    return parts.join('\n');
  }

  /**
   * Generate duration-specific prompt information
   */
  static generateDurationPrompt(maxDays: number): string {
    return `DURATA MASSIMA: ${maxDays} giorni
- NON SUPERARE MAI questo limite
- Se necessario, rimuovi viaggi per rispettare il vincolo
- Calcola sempre la durata totale prima di suggerire
- Prioritizza viaggi più brevi se necessario per restare nel limite`;
  }
}