// src/tests/geoUtils.test.ts
import { 
  calculateDistance, 
  getApproximateCoordinates, 
  calculateTripDistance, 
  shouldWarnAboutDistance,
  formatDistance 
} from '../lib/geoUtils';

describe('GeoUtils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between Rome and Milan correctly', () => {
      // Rome: 41.9028, 12.4964
      // Milan: 45.4642, 9.1900
      const distance = calculateDistance(41.9028, 12.4964, 45.4642, 9.1900);
      
      // Expected distance is approximately 477km
      expect(distance).toBeGreaterThan(470);
      expect(distance).toBeLessThan(485);
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(45.4642, 9.1900, 45.4642, 9.1900);
      expect(distance).toBe(0);
    });
  });

  describe('getApproximateCoordinates', () => {
    it('should return coordinates for known cities', () => {
      const romaCoords = getApproximateCoordinates('Roma');
      expect(romaCoords).toEqual({ lat: 41.9028, lng: 12.4964 });

      const milanoCoords = getApproximateCoordinates('Milano');
      expect(milanoCoords).toEqual({ lat: 45.4642, lng: 9.1900 });
    });

    it('should return coordinates for regions', () => {
      const toscanaCoords = getApproximateCoordinates('Toscana');
      expect(toscanaCoords).toBeTruthy();
      expect(toscanaCoords?.lat).toBeCloseTo(43.7711, 1);
    });

    it('should return null for unknown locations', () => {
      const unknownCoords = getApproximateCoordinates('Unknown Location');
      expect(unknownCoords).toBeNull();
    });

    it('should be case insensitive', () => {
      const romaLower = getApproximateCoordinates('roma');
      const romaUpper = getApproximateCoordinates('ROMA');
      expect(romaLower).toEqual(romaUpper);
    });
  });

  describe('calculateTripDistance', () => {
    it('should calculate distance between trip destinations', () => {
      const distance = calculateTripDistance('Roma', 'Milano');
      expect(distance).toBeGreaterThan(470);
      expect(distance).toBeLessThan(485);
    });

    it('should return null for unknown destinations', () => {
      const distance = calculateTripDistance('Unknown1', 'Unknown2');
      expect(distance).toBeNull();
    });

    it('should return null if one destination is unknown', () => {
      const distance = calculateTripDistance('Roma', 'Unknown');
      expect(distance).toBeNull();
    });
  });

  describe('shouldWarnAboutDistance', () => {
    it('should warn for distances over 30km', () => {
      expect(shouldWarnAboutDistance(50)).toBe(true);
      expect(shouldWarnAboutDistance(100)).toBe(true);
    });

    it('should not warn for distances under 30km', () => {
      expect(shouldWarnAboutDistance(20)).toBe(false);
      expect(shouldWarnAboutDistance(30)).toBe(false);
    });

    it('should not warn for null distances', () => {
      expect(shouldWarnAboutDistance(null)).toBe(false);
    });

    it('should respect custom threshold', () => {
      expect(shouldWarnAboutDistance(40, 50)).toBe(false);
      expect(shouldWarnAboutDistance(60, 50)).toBe(true);
    });
  });

  describe('formatDistance', () => {
    it('should format distances in kilometers', () => {
      expect(formatDistance(1.5)).toBe('1.5km');
      expect(formatDistance(100)).toBe('100km');
    });

    it('should format small distances in meters', () => {
      expect(formatDistance(0.5)).toBe('500m');
      expect(formatDistance(0.123)).toBe('123m');
    });
  });
});
