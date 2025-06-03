// src/tests/unit/types/trip.test.ts
import { castToMediaItems, castToJsonValue, MediaItem } from '@/types/trip';

describe('Trip Type Utilities', () => {
  // Dati di esempio
  const sampleMediaItems: MediaItem[] = [
    {
      id: '1',
      type: 'image',
      url: 'https://example.com/image.jpg',
      caption: 'Test image'
    },
    {
      id: '2',
      type: 'video',
      url: 'https://www.youtube.com/embed/abcdef12345',
      thumbnailUrl: 'https://img.youtube.com/vi/abcdef12345/maxresdefault.jpg',
      caption: 'Test video'
    }
  ];
  
  const sampleJsonValues = [
    {
      id: '1',
      type: 'image',
      url: 'https://example.com/image.jpg',
      caption: 'Test image'
    },
    {
      id: '2',
      type: 'video',
      url: 'https://www.youtube.com/embed/abcdef12345',
      thumbnailUrl: 'https://img.youtube.com/vi/abcdef12345/maxresdefault.jpg',
      caption: 'Test video'
    }
  ];

  describe('castToMediaItems', () => {
    it('deve convertire correttamente JsonValue[] in MediaItem[]', () => {
      const result = castToMediaItems(sampleJsonValues);
      
      expect(result).toEqual(sampleMediaItems);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('url');
      expect(result[0]).toHaveProperty('caption');
      
      expect(result[1]).toHaveProperty('thumbnailUrl');
      expect(result[1].type).toBe('video');
    });
    
    it('deve gestire correttamente array vuoti', () => {
      const result = castToMediaItems([]);
      
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('castToJsonValue', () => {
    it('deve convertire correttamente MediaItem[] in JsonValue[]', () => {
      const result = castToJsonValue(sampleMediaItems);
      
      expect(result).toEqual(sampleJsonValues);
    });
    
    it('deve gestire correttamente array vuoti', () => {
      const result = castToJsonValue([]);
      
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });
    
    it('deve produrre strutture dati serializzabili in JSON', () => {
      const result = castToJsonValue(sampleMediaItems);
      
      // Verifica che la conversione a JSON e ritorno funzioni senza errori
      const serialized = JSON.stringify(result);
      const deserialized = JSON.parse(serialized);
      
      expect(deserialized).toEqual(sampleJsonValues);
    });
  });
});
