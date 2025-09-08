// src/tests/tripAnalysisService.test.ts
import { TripAnalysisService } from '@/lib/trips/tripAnalysisService';
import { TripTestFactory } from '@/tests/unit/factories/TripTestFactory';

// Utilizziamo scenari predefiniti dalla factory
const mockTrips = TripTestFactory.createTripsForAnalysis().map(trip => ({
  ...trip,
  // Adatta il formato per TripAnalysisService (gpxData invece di gpxFile)
  gpxData: trip.gpxFile ? {
    hasGpx: true,
    distance: trip.gpxFile.distance / 1000, // Converti da metri a km per analysis service
    elevationGain: trip.gpxFile.elevationGain,
    waypoints: trip.gpxFile.waypoints
  } : {
    hasGpx: false
  }
}));

describe('TripAnalysisService', () => {
  describe('extractPreferences', () => {
    it('should extract destinations from message', () => {
      const message = 'Vorrei visitare la Toscana e le Dolomiti';
      const prefs = TripAnalysisService.extractPreferences(message);
      
      expect(prefs.destinations).toContain('toscana');
      expect(prefs.destinations).toContain('dolomiti');
    });

    it('should extract duration from message', () => {
      const message = 'Cerco un viaggio di 3 giorni';
      const prefs = TripAnalysisService.extractPreferences(message);
      
      expect(prefs.duration).toBe(3);
    });

    it('should extract themes from message', () => {
      const message = 'Mi piace l\'avventura e la natura';
      const prefs = TripAnalysisService.extractPreferences(message);
      
      expect(prefs.themes).toContain('avventura');
      expect(prefs.themes).toContain('natura');
    });

    it('should extract characteristics from message', () => {
      const message = 'Vorrei strade con curve e bei paesaggio';
      const prefs = TripAnalysisService.extractPreferences(message);

      expect(prefs.characteristics).toContain('curve');
      expect(prefs.characteristics).toContain('panorama');
    });

    it('should extract seasons from message', () => {
      const message = 'Preferisco viaggiare in primavera o estate';
      const prefs = TripAnalysisService.extractPreferences(message);
      
      expect(prefs.seasons).toContain('primavera');
      expect(prefs.seasons).toContain('estate');
    });
  });

  describe('scoreTrip', () => {
    it('should give high score for matching destination', () => {
      const preferences = { destinations: ['toscana'], duration: 3, themes: [], characteristics: [], seasons: [] };
      const { score, matchedCriteria } = TripAnalysisService.scoreTrip(mockTrips[0], preferences);
      
      expect(score).toBeGreaterThan(30);
      expect(matchedCriteria).toContain('Destinazione');
    });

    it('should give score for matching duration', () => {
      const preferences = { destinations: [], duration: 3, themes: [], characteristics: [], seasons: [] };
      const { score, matchedCriteria } = TripAnalysisService.scoreTrip(mockTrips[0], preferences);
      
      expect(score).toBeGreaterThan(15);
      expect(matchedCriteria).toContain('Durata perfetta');
    });

    it('should give score for GPX availability', () => {
      const preferences = { destinations: [], themes: [], characteristics: [], seasons: [] };
      const { score, matchedCriteria } = TripAnalysisService.scoreTrip(mockTrips[0], preferences);
      
      expect(matchedCriteria).toContain('Traccia GPX disponibile');
    });
  });

  describe('analyzeTrips', () => {
    it('should return recommendations based on user message', () => {
      const message = 'Vorrei un viaggio di 3 giorni in Toscana';
      const result = TripAnalysisService.analyzeTrips(mockTrips, message);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0].title).toBe(mockTrips[0].title); // Usa il titolo dalla factory
      expect(result.recommendations[0].relevanceScore).toBeGreaterThan(50); // Should have high score for exact match
    });

    it('should calculate total duration', () => {
      const message = 'Vorrei visitare Toscana e Veneto';
      const result = TripAnalysisService.analyzeTrips(mockTrips, message);
      
      expect(result.totalDuration).toBeGreaterThan(0);
    });

    it('should provide distance warnings for far destinations', () => {
      const message = 'Vorrei visitare Toscana e Veneto';
      const result = TripAnalysisService.analyzeTrips(mockTrips, message);
      
      // Toscana and Veneto are far apart, should generate warning
      expect(result.distanceWarnings.length).toBeGreaterThan(0);
    });
  });

  describe('optimizeTripOrder', () => {
    it('should return single trip for single input', () => {
      const trips = [{ id: '1', title: 'Test', destination: 'Roma', duration_days: 1, summary: '', slug: '' }];
      const order = TripAnalysisService.optimizeTripOrder(trips);
      
      expect(order).toEqual(['1']);
    });

    it('should return optimized order for multiple trips', () => {
      // Usa i primi due trip dalla factory
      const trips = mockTrips.slice(0, 2).map(trip => ({
        id: trip.id,
        title: trip.title,
        destination: trip.destination,
        duration_days: trip.duration_days,
        summary: trip.summary,
        slug: trip.slug
      }));
      const order = TripAnalysisService.optimizeTripOrder(trips);
      
      expect(order).toHaveLength(2);
      expect(order).toContain('1');
      expect(order).toContain('2');
    });
  });

  describe('createDetailedItinerary', () => {
    it('should create day-by-day breakdown', () => {
      // Usa trip dalla factory con durate specifiche per il test
      const trips = [
        { 
          id: mockTrips[2].id, 
          title: mockTrips[2].title, 
          destination: mockTrips[2].destination, 
          duration_days: 2, // Costa Amalfitana - 2 giorni
          summary: mockTrips[2].summary, 
          slug: mockTrips[2].slug 
        },
        { 
          id: mockTrips[0].id, 
          title: mockTrips[0].title, 
          destination: mockTrips[0].destination, 
          duration_days: 3, // Toscana - 3 giorni
          summary: mockTrips[0].summary, 
          slug: mockTrips[0].slug 
        }
      ];
      const itinerary = TripAnalysisService.createDetailedItinerary(trips);
      
      expect(itinerary.totalDays).toBe(6); // 2 + 1 (transfer) + 3
      expect(itinerary.dailyBreakdown).toHaveLength(6);
      expect(itinerary.dailyBreakdown[0].activity).toContain(`Inizio ${mockTrips[2].title}`);
      expect(itinerary.dailyBreakdown[2].activity).toContain('Trasferimento');
    });
  });
});
