import {
  extractCharacteristicsFromTags,
  filterOutCharacteristicTags,
  enrichTripWithCharacteristics
} from '@/lib/trip-utils';

describe('tripUtils', () => {
  describe('extractCharacteristicsFromTags', () => {

    it('should extract characteristics from tags', () => {
      const tags = ['char:mountain', 'adventure'];
      const result = extractCharacteristicsFromTags(tags);
      expect(result).toEqual(['mountain']);
    });

    it('should extract characteristics from tags with char: prefix', () => {
      const tags = ['char:mountain', 'char:scenic', 'adventure', 'char:difficult'];
      const result = extractCharacteristicsFromTags(tags);
      
      expect(result).toEqual(['mountain', 'scenic', 'difficult']);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no characteristic tags present', () => {
      const tags = ['adventure', 'nature', 'weekend'];
      const result = extractCharacteristicsFromTags(tags);
      
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle empty tags array', () => {
      const tags: string[] = [];
      const result = extractCharacteristicsFromTags(tags);
      
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle tags with partial char prefix', () => {
      const tags = ['char', 'character', 'char:', 'char:valid'];
      const result = extractCharacteristicsFromTags(tags);
      
      expect(result).toEqual(['', 'valid']);
    });

    it('should handle case sensitivity correctly', () => {
      const tags = ['CHAR:mountain', 'Char:scenic', 'char:DIFFICULT'];
      const result = extractCharacteristicsFromTags(tags);
      
      expect(result).toEqual(['DIFFICULT']);
    });

    it('should handle special characters in characteristics', () => {
      const tags = ['char:mountain-trail', 'char:eco-friendly', 'char:5★rating'];
      const result = extractCharacteristicsFromTags(tags);
      
      expect(result).toEqual(['mountain-trail', 'eco-friendly', '5★rating']);
    });
  });

  describe('filterOutCharacteristicTags', () => {
    it('should filter out characteristic tags', () => {
      const tags = ['char:mountain', 'adventure', 'char:scenic', 'nature'];
      const result = filterOutCharacteristicTags(tags);
      
      expect(result).toEqual(['adventure', 'nature']);
      expect(result).toHaveLength(2);
    });

    it('should return all tags when no characteristic tags present', () => {
      const tags = ['adventure', 'nature', 'weekend'];
      const result = filterOutCharacteristicTags(tags);
      
      expect(result).toEqual(['adventure', 'nature', 'weekend']);
      expect(result).toHaveLength(3);
    });

    it('should handle empty tags array', () => {
      const tags: string[] = [];
      const result = filterOutCharacteristicTags(tags);
      
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return empty array when all tags are characteristics', () => {
      const tags = ['char:mountain', 'char:scenic', 'char:difficult'];
      const result = filterOutCharacteristicTags(tags);
      
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle case sensitivity correctly', () => {
      const tags = ['CHAR:mountain', 'adventure', 'Char:scenic', 'char:valid'];
      const result = filterOutCharacteristicTags(tags);
      
      expect(result).toEqual(['CHAR:mountain', 'adventure', 'Char:scenic']);
    });
  });

  describe('enrichTripWithCharacteristics', () => {
    it('should enrich trip with characteristics and filter tags', () => {
      const trip = {
        id: 1,
        title: 'Mountain Adventure',
        tags: ['char:mountain', 'adventure', 'char:scenic', 'nature']
      };
      
      const result = enrichTripWithCharacteristics(trip);
      
      expect(result).toEqual({
        id: 1,
        title: 'Mountain Adventure',
        tags: ['adventure', 'nature'],
        characteristics: ['mountain', 'scenic']
      });
    });

    it('should handle trip without tags', () => {
      const trip = {
        id: 1,
        title: 'Mountain Adventure'
      };
      
      const result = enrichTripWithCharacteristics(trip);
      
      expect(result).toEqual({
        id: 1,
        title: 'Mountain Adventure'
      });
    });

    it('should handle trip with null tags', () => {
      const trip = {
        id: 1,
        title: 'Mountain Adventure',
        tags: null
      };
      
      const result = enrichTripWithCharacteristics(trip);
      
      expect(result).toEqual({
        id: 1,
        title: 'Mountain Adventure',
        tags: null
      });
    });

    it('should handle trip with non-array tags', () => {
      const trip = {
        id: 1,
        title: 'Mountain Adventure',
        tags: 'invalid-tags' as any
      };
      
      const result = enrichTripWithCharacteristics(trip);
      
      expect(result).toEqual({
        id: 1,
        title: 'Mountain Adventure',
        tags: 'invalid-tags'
      });
    });

    it('should handle empty tags array', () => {
      const trip = {
        id: 1,
        title: 'Mountain Adventure',
        tags: []
      };
      
      const result = enrichTripWithCharacteristics(trip);
      
      expect(result).toEqual({
        id: 1,
        title: 'Mountain Adventure',
        tags: [],
        characteristics: []
      });
    });

    it('should handle null or undefined trip', () => {
      expect(enrichTripWithCharacteristics(null as any)).toBeNull();
      expect(enrichTripWithCharacteristics(undefined as any)).toBeUndefined();
    });

    it('should preserve all other trip properties', () => {
      const trip = {
        id: 1,
        title: 'Mountain Adventure',
        description: 'A great trip',
        duration: 5,
        difficulty: 'hard',
        tags: ['char:mountain', 'adventure'],
        createdAt: new Date('2024-01-01'),
        metadata: { location: 'Alps' }
      };
      
      const result = enrichTripWithCharacteristics(trip);
      
      expect(result).toEqual({
        id: 1,
        title: 'Mountain Adventure',
        description: 'A great trip',
        duration: 5,
        difficulty: 'hard',
        tags: ['adventure'],
        characteristics: ['mountain'],
        createdAt: new Date('2024-01-01'),
        metadata: { location: 'Alps' }
      });
    });

    it('should handle immutability - not modify original trip', () => {
      const trip = {
        id: 1,
        title: 'Immutable Test',
        tags: ['char:mountain', 'adventure']
      };
      
      const originalTags = [...trip.tags];
      const result = enrichTripWithCharacteristics(trip);
      
      expect(trip.tags).toEqual(originalTags);
      expect(result).not.toBe(trip);
      expect(result.tags).not.toBe(trip.tags);
    });
  });
});