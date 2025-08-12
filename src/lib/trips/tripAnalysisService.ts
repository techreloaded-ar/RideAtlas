// src/lib/tripAnalysisService.ts
import { calculateTripDistance, shouldWarnAboutDistance, formatDistance } from '../geo/geoUtils';

interface TripForAI {
  id: string;
  title: string;
  summary: string;
  destination: string;
  duration_days: number;
  tags: string[];
  theme: string;
  characteristics: string[];
  recommended_seasons: string[];
  insights?: string;
  slug: string;
  gpxData?: {
    hasGpx: boolean;
    distance?: number;
    elevationGain?: number;
    waypoints?: number;
    startPoint?: { lat: number; lng: number };
    endPoint?: { lat: number; lng: number };
  };
}

interface TripRecommendation {
  id: string;
  title: string;
  destination: string;
  duration_days: number;
  summary: string;
  slug: string;
  relevanceScore: number;
  matchedCriteria: string[];
}

interface SimpleTripForOptimization {
  id: string;
  title: string;
  destination: string;
  duration_days: number;
  summary: string;
  slug: string;
}

interface DistanceWarning {
  fromTrip: string;
  toTrip: string;
  distance: number;
  message: string;
}

interface TripAnalysisResult {
  recommendations: TripRecommendation[];
  distanceWarnings: DistanceWarning[];
  totalDuration: number;
  totalDistance: number;
  suggestedOrder: string[];
}

export class TripAnalysisService {
  /**
   * Analyze user message and extract trip preferences
   */
  static extractPreferences(message: string): {
    destinations: string[];
    duration?: number;
    themes: string[];
    characteristics: string[];
    seasons: string[];
  } {
    const messageLower = message.toLowerCase();
    
    // Extract destinations
    const destinations: string[] = [];
    const destinationKeywords = [
      'toscana', 'umbria', 'lazio', 'campania', 'sicilia', 'sardegna',
      'calabria', 'puglia', 'basilicata', 'abruzzo', 'molise', 'marche',
      'emilia-romagna', 'veneto', 'friuli', 'trentino', 'lombardia',
      'piemonte', 'liguria', 'valle d\'aosta', 'roma', 'milano', 'napoli',
      'firenze', 'bologna', 'venezia', 'torino', 'genova', 'palermo',
      'dolomiti', 'alpi', 'appennini', 'garda', 'amalfi', 'cinque terre'
    ];
    
    destinationKeywords.forEach(dest => {
      if (messageLower.includes(dest)) {
        destinations.push(dest);
      }
    });
    
    // Extract duration
    let duration: number | undefined;
    const durationMatch = messageLower.match(/(\d+)\s*(giorni?|giorno)/);
    if (durationMatch) {
      duration = parseInt(durationMatch[1]);
    }
    
    // Extract themes
    const themes: string[] = [];
    const themeKeywords = {
      'avventura': ['avventura', 'adventure', 'adrenalina'],
      'relax': ['relax', 'tranquillo', 'pace', 'calmo'],
      'cultura': ['cultura', 'culturale', 'storico', 'arte', 'borghi'],
      'natura': ['natura', 'naturale', 'paesaggio', 'panorama'],
      'gastronomia': ['gastronomia', 'cibo', 'enogastronomia', 'vino']
    };
    
    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => messageLower.includes(keyword))) {
        themes.push(theme);
      }
    });
    
    // Extract characteristics
    const characteristics: string[] = [];
    const characteristicKeywords = {
      'curve': ['curve', 'tornanti', 'serpentine'],
      'sterrato': ['sterrato', 'off-road', 'dirt', 'gravel'],
      'panorama': ['panorama', 'vista', 'paesaggio', 'scenic'],
      'montagna': ['montagna', 'monte', 'alpi', 'dolomiti'],
      'mare': ['mare', 'costa', 'costiera', 'litorale'],
      'autostrada': ['autostrada', 'veloce', 'highway']
    };
    
    Object.entries(characteristicKeywords).forEach(([char, keywords]) => {
      if (keywords.some(keyword => messageLower.includes(keyword))) {
        characteristics.push(char);
      }
    });
    
    // Extract seasons
    const seasons: string[] = [];
    const seasonKeywords = {
      'primavera': ['primavera', 'spring', 'marzo', 'aprile', 'maggio'],
      'estate': ['estate', 'summer', 'giugno', 'luglio', 'agosto'],
      'autunno': ['autunno', 'autumn', 'settembre', 'ottobre', 'novembre'],
      'inverno': ['inverno', 'winter', 'dicembre', 'gennaio', 'febbraio']
    };
    
    Object.entries(seasonKeywords).forEach(([season, keywords]) => {
      if (keywords.some(keyword => messageLower.includes(keyword))) {
        seasons.push(season);
      }
    });
    
    return { destinations, duration, themes, characteristics, seasons };
  }
  
  /**
   * Score trips based on user preferences
   */
  static scoreTrip(trip: TripForAI, preferences: ReturnType<typeof TripAnalysisService.extractPreferences>): {
    score: number;
    matchedCriteria: string[];
  } {
    let score = 0;
    const matchedCriteria: string[] = [];
    
    // Destination matching (high weight)
    if (preferences.destinations.length > 0) {
      const destinationMatch = preferences.destinations.some(dest => 
        trip.destination.toLowerCase().includes(dest) || 
        trip.title.toLowerCase().includes(dest)
      );
      if (destinationMatch) {
        score += 30;
        matchedCriteria.push('Destinazione');
      }
    }
    
    // Duration matching
    if (preferences.duration) {
      const durationDiff = Math.abs(trip.duration_days - preferences.duration);
      if (durationDiff === 0) {
        score += 20;
        matchedCriteria.push('Durata perfetta');
      } else if (durationDiff <= 1) {
        score += 15;
        matchedCriteria.push('Durata simile');
      } else if (durationDiff <= 2) {
        score += 10;
        matchedCriteria.push('Durata compatibile');
      }
    }
    
    // Theme matching
    preferences.themes.forEach(theme => {
      if (trip.theme.toLowerCase().includes(theme) || 
          trip.summary.toLowerCase().includes(theme)) {
        score += 15;
        matchedCriteria.push(`Tema: ${theme}`);
      }
    });
    
    // Characteristics matching
    preferences.characteristics.forEach(char => {
      if (trip.characteristics.some(tc => tc.toLowerCase().includes(char))) {
        score += 10;
        matchedCriteria.push(`Caratteristica: ${char}`);
      }
    });
    
    // Season matching
    preferences.seasons.forEach(season => {
      if (trip.recommended_seasons.some(ts => ts.toLowerCase().includes(season))) {
        score += 8;
        matchedCriteria.push(`Stagione: ${season}`);
      }
    });
    
    // GPX bonus
    if (trip.gpxData?.hasGpx) {
      score += 5;
      matchedCriteria.push('Traccia GPX disponibile');
    }
    
    return { score, matchedCriteria };
  }
  
  /**
   * Analyze trips and provide recommendations with distance warnings
   */
  static analyzeTrips(
    trips: TripForAI[], 
    userMessage: string,
    maxRecommendations: number = 5
  ): TripAnalysisResult {
    const preferences = this.extractPreferences(userMessage);
    
    // Score and rank trips
    const scoredTrips = trips.map(trip => {
      const { score, matchedCriteria } = this.scoreTrip(trip, preferences);
      return {
        ...trip,
        relevanceScore: score,
        matchedCriteria
      };
    }).filter(trip => trip.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxRecommendations);
    
    // Create recommendations
    const recommendations: TripRecommendation[] = scoredTrips.map(trip => ({
      id: trip.id,
      title: trip.title,
      destination: trip.destination,
      duration_days: trip.duration_days,
      summary: trip.summary,
      slug: trip.slug,
      relevanceScore: trip.relevanceScore,
      matchedCriteria: trip.matchedCriteria
    }));
    
    // Calculate distance warnings
    const distanceWarnings: DistanceWarning[] = [];
    for (let i = 0; i < recommendations.length - 1; i++) {
      for (let j = i + 1; j < recommendations.length; j++) {
        const trip1 = recommendations[i];
        const trip2 = recommendations[j];
        
        const distance = calculateTripDistance(trip1.destination, trip2.destination);
        
        if (shouldWarnAboutDistance(distance)) {
          distanceWarnings.push({
            fromTrip: trip1.title,
            toTrip: trip2.title,
            distance: distance!,
            message: `Attenzione: La distanza tra "${trip1.title}" e "${trip2.title}" è di circa ${formatDistance(distance!)}. Considera il tempo di trasferimento.`
          });
        }
      }
    }
    
    // Calculate totals
    const totalDuration = recommendations.reduce((sum, trip) => sum + trip.duration_days, 0);
    const totalDistance = recommendations.reduce((sum, trip) => {
      const tripData = trips.find(t => t.id === trip.id);
      return sum + (tripData?.gpxData?.distance || 0);
    }, 0);
    
    // Suggest optimal order using a simplified nearest neighbor approach
    const suggestedOrder = this.optimizeTripOrder(recommendations);
    
    return {
      recommendations,
      distanceWarnings,
      totalDuration,
      totalDistance,
      suggestedOrder
    };
  }

  /**
   * Optimize trip order to minimize travel distances
   * Uses a simplified nearest neighbor algorithm
   */
  static optimizeTripOrder(trips: TripRecommendation[] | SimpleTripForOptimization[]): string[] {
    if (trips.length <= 1) return trips.map(t => t.id);

    const unvisited = [...trips];
    const ordered: (TripRecommendation | SimpleTripForOptimization)[] = [];

    // Start with the first trip (could be enhanced to find best starting point)
    let current = unvisited.shift()!;
    ordered.push(current);

    while (unvisited.length > 0) {
      let nearestTrip = unvisited[0];
      let shortestDistance = calculateTripDistance(current.destination, nearestTrip.destination) || Infinity;
      let nearestIndex = 0;

      // Find the nearest unvisited trip
      for (let i = 1; i < unvisited.length; i++) {
        const distance = calculateTripDistance(current.destination, unvisited[i].destination);
        if (distance !== null && distance < shortestDistance) {
          shortestDistance = distance;
          nearestTrip = unvisited[i];
          nearestIndex = i;
        }
      }

      // Move to the nearest trip
      current = nearestTrip;
      ordered.push(current);
      unvisited.splice(nearestIndex, 1);
    }

    return ordered.map(trip => trip.id);
  }

  /**
   * Create a detailed itinerary with day-by-day breakdown
   */
  static createDetailedItinerary(trips: TripRecommendation[] | SimpleTripForOptimization[]): {
    totalDays: number;
    dailyBreakdown: Array<{
      day: number;
      tripId: string;
      tripTitle: string;
      activity: string;
    }>;
  } {
    const dailyBreakdown: Array<{
      day: number;
      tripId: string;
      tripTitle: string;
      activity: string;
    }> = [];

    let currentDay = 1;

    trips.forEach((trip, index) => {
      // Add travel day if not the first trip
      if (index > 0) {
        dailyBreakdown.push({
          day: currentDay,
          tripId: trip.id,
          tripTitle: trip.title,
          activity: `Trasferimento verso ${trip.destination}`
        });
        currentDay++;
      }

      // Add trip days
      for (let day = 0; day < trip.duration_days; day++) {
        dailyBreakdown.push({
          day: currentDay + day,
          tripId: trip.id,
          tripTitle: trip.title,
          activity: day === 0 ? `Inizio ${trip.title}` : `${trip.title} - Giorno ${day + 1}`
        });
      }

      currentDay += trip.duration_days;
    });

    return {
      totalDays: currentDay - 1,
      dailyBreakdown
    };
  }
}
