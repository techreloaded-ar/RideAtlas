// src/tests/tripAnalysisService.test.ts
import { TripAnalysisService } from '../lib/tripAnalysisService';

const mockTrips = [
  {
    id: '1',
    title: 'Viaggio in Toscana',
    summary: 'Bellissimo viaggio tra le colline toscane',
    destination: 'Toscana',
    duration_days: 3,
    duration_nights: 2,
    tags: ['natura', 'cultura'],
    theme: 'Cultura e paesaggio',
    characteristics: ['Curve strette', 'Bel paesaggio'],
    recommended_seasons: ['Primavera', 'Estate'],
    slug: 'viaggio-toscana',
    gpxData: { hasGpx: true, distance: 250, elevationGain: 1200, waypoints: 15 }
  },
  {
    id: '2',
    title: 'Avventura nelle Dolomiti',
    summary: 'Percorso mozzafiato tra le vette delle Dolomiti',
    destination: 'Dolomiti',
    duration_days: 5,
    duration_nights: 4,
    tags: ['montagna', 'avventura'],
    theme: 'Montagna e avventura',
    characteristics: ['Curve strette', 'Strade sterrate'],
    recommended_seasons: ['Estate', 'Autunno'],
    slug: 'avventura-dolomiti',
    gpxData: { hasGpx: true, distance: 400, elevationGain: 2500, waypoints: 25 }
  },
  {
    id: '3',
    title: 'Costa Amalfitana',
    summary: 'Viaggio lungo la splendida costiera amalfitana',
    destination: 'Amalfi',
    duration_days: 2,
    duration_nights: 1,
    tags: ['mare', 'panorama'],
    theme: 'Mare e relax',
    characteristics: ['Bel paesaggio', 'Curve strette'],
    recommended_seasons: ['Primavera', 'Estate'],
    slug: 'costa-amalfitana',
    gpxData: { hasGpx: false }
  }
];

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
      expect(result.recommendations[0].title).toBe('Viaggio in Toscana');
      expect(result.recommendations[0].relevanceScore).toBeGreaterThan(50); // Should have high score for exact match
    });

    it('should calculate total duration', () => {
      const message = 'Vorrei visitare Toscana e Dolomiti';
      const result = TripAnalysisService.analyzeTrips(mockTrips, message);
      
      expect(result.totalDuration).toBeGreaterThan(0);
    });

    it('should provide distance warnings for far destinations', () => {
      const message = 'Vorrei visitare Toscana e Dolomiti';
      const result = TripAnalysisService.analyzeTrips(mockTrips, message);
      
      // Toscana and Dolomiti are far apart, should generate warning
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
      const trips = [
        { id: '1', title: 'Roma Trip', destination: 'Roma', duration_days: 1, summary: '', slug: '' },
        { id: '2', title: 'Milano Trip', destination: 'Milano', duration_days: 1, summary: '', slug: '' }
      ];
      const order = TripAnalysisService.optimizeTripOrder(trips);
      
      expect(order).toHaveLength(2);
      expect(order).toContain('1');
      expect(order).toContain('2');
    });
  });

  describe('createDetailedItinerary', () => {
    it('should create day-by-day breakdown', () => {
      const trips = [
        { id: '1', title: 'Trip 1', destination: 'Roma', duration_days: 2, summary: '', slug: '' },
        { id: '2', title: 'Trip 2', destination: 'Milano', duration_days: 3, summary: '', slug: '' }
      ];
      const itinerary = TripAnalysisService.createDetailedItinerary(trips);
      
      expect(itinerary.totalDays).toBe(6); // 2 + 1 (transfer) + 3
      expect(itinerary.dailyBreakdown).toHaveLength(6);
      expect(itinerary.dailyBreakdown[0].activity).toContain('Inizio Trip 1');
      expect(itinerary.dailyBreakdown[2].activity).toContain('Trasferimento');
    });
  });
});
