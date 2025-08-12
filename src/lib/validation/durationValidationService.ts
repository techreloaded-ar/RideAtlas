// src/lib/durationValidationService.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface DurationConstraint {
  maxDays: number;
  strictMode: boolean; // If true, never exceed maxDays under any circumstances
}

export interface DurationValidationResult {
  isValid: boolean;
  totalDuration: number;
  exceedsLimit: boolean;
  validTrips: any[];
  removedTrips: any[];
  warnings: string[];
  errors: string[];
}

export interface TripDurationInfo {
  id: string;
  title: string;
  duration_days: number;
  relevanceScore?: number;
}

export class DurationValidationService {
  /**
   * Extract duration constraint from user message
   */
  static extractDurationConstraint(message: string): DurationConstraint | null {
    const messageLower = message.toLowerCase();
    
    // Look for patterns like "3 giorni", "5 days", "una settimana", etc.
    const patterns = [
      /(\d+)\s*(giorni?|giorno)/i,
      /(\d+)\s*(days?|day)/i,
      /(una|1)\s*settimana/i, // 1 week = 7 days
      /(due|2)\s*settimane?/i, // 2 weeks = 14 days
      /(tre|3)\s*settimane?/i, // 3 weeks = 21 days
      /weekend/i, // weekend = 2-3 days
      /lungo?\s*weekend/i // long weekend = 3-4 days
    ];
    
    for (const pattern of patterns) {
      const match = messageLower.match(pattern);
      if (match) {
        let days: number;
        
        if (match[0].includes('settimana') || match[0].includes('week')) {
          if (match[1] === 'una' || match[1] === '1') days = 7;
          else if (match[1] === 'due' || match[1] === '2') days = 14;
          else if (match[1] === 'tre' || match[1] === '3') days = 21;
          else days = parseInt(match[1]) * 7;
        } else if (match[0].includes('weekend')) {
          days = match[0].includes('lungo') ? 4 : 3;
        } else {
          days = parseInt(match[1]);
        }
        
        return {
          maxDays: days,
          strictMode: true // Always use strict mode for explicit duration requests
        };
      }
    }
    
    return null;
  }

  /**
   * Validate trip collection against duration constraints
   */
  static validateTripDuration(
    trips: TripDurationInfo[],
    constraint: DurationConstraint
  ): DurationValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    // Calculate total duration
    const totalDuration = trips.reduce((sum, trip) => sum + trip.duration_days, 0);
    const exceedsLimit = totalDuration > constraint.maxDays;
    
    if (!exceedsLimit) {
      return {
        isValid: true,
        totalDuration,
        exceedsLimit: false,
        validTrips: trips,
        removedTrips: [],
        warnings,
        errors
      };
    }
    
    // If exceeds limit and strict mode, filter trips
    if (constraint.strictMode) {
      const filteredResult = this.filterTripsToFitDuration(trips, constraint.maxDays);
      
      warnings.push(
        `La durata totale dei viaggi suggeriti (${totalDuration} giorni) supera il limite richiesto di ${constraint.maxDays} giorni. ` +
        `Ho selezionato solo i viaggi che rientrano nel limite.`
      );
      
      if (filteredResult.removedTrips.length > 0) {
        warnings.push(
          `Viaggi rimossi per rispettare il limite: ${filteredResult.removedTrips.map(t => t.title).join(', ')}`
        );
      }
      
      return {
        isValid: true,
        totalDuration: filteredResult.totalDuration,
        exceedsLimit: false,
        validTrips: filteredResult.validTrips,
        removedTrips: filteredResult.removedTrips,
        warnings,
        errors
      };
    }
    
    // If not strict mode, return error
    errors.push(
      `La durata totale dei viaggi (${totalDuration} giorni) supera il limite massimo di ${constraint.maxDays} giorni.`
    );
    
    return {
      isValid: false,
      totalDuration,
      exceedsLimit: true,
      validTrips: trips,
      removedTrips: [],
      warnings,
      errors
    };
  }

  /**
   * Filter trips to fit within duration constraint using intelligent selection
   */
  static filterTripsToFitDuration(
    trips: TripDurationInfo[],
    maxDays: number
  ): {
    validTrips: TripDurationInfo[];
    removedTrips: TripDurationInfo[];
    totalDuration: number;
  } {
    // Sort trips by relevance score (descending) and then by duration (ascending)
    // This prioritizes high-relevance trips and shorter trips when relevance is equal
    const sortedTrips = [...trips].sort((a, b) => {
      if (a.relevanceScore !== undefined && b.relevanceScore !== undefined) {
        if (a.relevanceScore !== b.relevanceScore) {
          return b.relevanceScore - a.relevanceScore; // Higher relevance first
        }
      }
      return a.duration_days - b.duration_days; // Shorter duration first
    });

    const validTrips: TripDurationInfo[] = [];
    const removedTrips: TripDurationInfo[] = [];
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
      totalDuration
    };
  }

  /**
   * Check if a single trip exceeds the duration limit
   */
  static isTripTooLong(trip: TripDurationInfo, maxDays: number): boolean {
    return trip.duration_days > maxDays;
  }

  /**
   * Get trips that individually exceed the duration limit
   */
  static getTripsExceedingLimit(trips: TripDurationInfo[], maxDays: number): TripDurationInfo[] {
    return trips.filter(trip => this.isTripTooLong(trip, maxDays));
  }

  /**
   * Generate duration summary for AI prompt
   */
  static generateDurationPrompt(constraint: DurationConstraint): string {
    return `
VINCOLO DURATA ASSOLUTO:
- Durata massima richiesta: ${constraint.maxDays} giorni
- NON SUPERARE MAI questo limite
- Se la combinazione di viaggi supera ${constraint.maxDays} giorni, suggerisci solo viaggi che rientrano nel limite
- Preferisci viaggi più brevi se necessario per rispettare il vincolo
- Avvisa sempre l'utente se alcuni viaggi sono stati esclusi per rispettare il limite di durata
`;
  }

  /**
   * Validate and optimize trip selection for duration
   */
  static optimizeTripsForDuration(
    trips: TripDurationInfo[],
    maxDays: number
  ): {
    optimizedTrips: TripDurationInfo[];
    totalDays: number;
    efficiency: number; // Percentage of max days used
    suggestions: string[];
  } {
    const result = this.filterTripsToFitDuration(trips, maxDays);
    const efficiency = (result.totalDuration / maxDays) * 100;
    const suggestions: string[] = [];

    if (efficiency < 80) {
      suggestions.push(
        `Potresti aggiungere un altro viaggio breve per sfruttare meglio i ${maxDays} giorni disponibili.`
      );
    }

    if (result.removedTrips.length > 0) {
      suggestions.push(
        `Considera di dividere il viaggio in più periodi per includere anche: ${result.removedTrips.map(t => t.title).join(', ')}`
      );
    }

    return {
      optimizedTrips: result.validTrips,
      totalDays: result.totalDuration,
      efficiency: Math.round(efficiency),
      suggestions
    };
  }
}
