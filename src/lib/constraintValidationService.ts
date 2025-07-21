// src/lib/constraintValidationService.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { calculateTripDistance } from './geoUtils';
import { ITALIAN_REGIONS } from './locationData';

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
