import { describe, it, expect } from '@jest/globals';
import { generateTempMediaId, castToMediaItems, castToJsonValue } from '@/lib/utils/media';
import type { MediaItem } from '@/types/profile';

describe('lib/utils/media', () => {
  describe('generateTempMediaId', () => {
    it('should generate ID with correct format', () => {
      const id = generateTempMediaId();
      expect(id).toMatch(/^temp_\d+_[a-z0-9]+$/);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateTempMediaId());
      }
      expect(ids.size).toBe(100);
    });

    it('should include timestamp in ID', () => {
      const beforeTimestamp = Date.now();
      const id = generateTempMediaId();
      const afterTimestamp = Date.now();

      const parts = id.split('_');
      expect(parts[0]).toBe('temp');

      const timestamp = parseInt(parts[1]);
      expect(timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(timestamp).toBeLessThanOrEqual(afterTimestamp);
    });

    it('should include random string in ID', () => {
      const id = generateTempMediaId();
      const parts = id.split('_');

      expect(parts.length).toBe(3);
      expect(parts[2]).toMatch(/^[a-z0-9]+$/);
      expect(parts[2].length).toBeGreaterThan(0);
    });
  });

  describe('castToMediaItems', () => {
    it('should return empty array for null input', () => {
      const result = castToMediaItems(null);
      expect(result).toEqual([]);
    });

    it('should return empty array for undefined input', () => {
      const result = castToMediaItems(undefined);
      expect(result).toEqual([]);
    });

    it('should return empty array for non-array input', () => {
      expect(castToMediaItems('string')).toEqual([]);
      expect(castToMediaItems(123)).toEqual([]);
      expect(castToMediaItems({})).toEqual([]);
      expect(castToMediaItems(true)).toEqual([]);
    });

    it('should return empty array for empty array', () => {
      const result = castToMediaItems([]);
      expect(result).toEqual([]);
    });

    it('should convert valid MediaItem array', () => {
      const input: MediaItem[] = [
        {
          id: 'media-1',
          type: 'image',
          url: 'https://example.com/photo1.jpg',
          uploadedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'media-2',
          type: 'image',
          url: 'https://example.com/photo2.jpg',
          caption: 'Test caption',
          uploadedAt: '2024-01-02T00:00:00.000Z',
        },
      ];

      const result = castToMediaItems(input);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(input[0]);
      expect(result[1]).toEqual(input[1]);
    });

    it('should handle array with single item', () => {
      const input: MediaItem[] = [
        {
          id: 'media-1',
          type: 'image',
          url: 'https://example.com/photo.jpg',
          uploadedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      const result = castToMediaItems(input);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(input[0]);
    });

    it('should preserve all MediaItem properties', () => {
      const input: MediaItem[] = [
        {
          id: 'media-1',
          type: 'image',
          url: 'https://example.com/photo.jpg',
          caption: 'My bike photo',
          uploadedAt: '2024-01-01T12:00:00.000Z',
        },
      ];

      const result = castToMediaItems(input);

      expect(result[0].id).toBe('media-1');
      expect(result[0].type).toBe('image');
      expect(result[0].url).toBe('https://example.com/photo.jpg');
      expect(result[0].caption).toBe('My bike photo');
      expect(result[0].uploadedAt).toBe('2024-01-01T12:00:00.000Z');
    });

    it('should handle MediaItem without optional fields', () => {
      const input: MediaItem[] = [
        {
          id: 'media-1',
          type: 'image',
          url: 'https://example.com/photo.jpg',
          uploadedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      const result = castToMediaItems(input);

      expect(result[0].caption).toBeUndefined();
    });

    it('should handle JSON parsed from database', () => {
      // Simulate JSON data from Prisma
      const dbJson = JSON.parse(
        JSON.stringify([
          {
            id: 'media-1',
            type: 'image',
            url: 'https://example.com/photo.jpg',
            uploadedAt: '2024-01-01T00:00:00.000Z',
          },
        ])
      );

      const result = castToMediaItems(dbJson);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('media-1');
    });
  });

  describe('castToJsonValue', () => {
    it('should cast primitive values', () => {
      expect(castToJsonValue('string')).toBe('string');
      expect(castToJsonValue(123)).toBe(123);
      expect(castToJsonValue(true)).toBe(true);
      expect(castToJsonValue(null)).toBe(null);
    });

    it('should cast object values', () => {
      const obj = { key: 'value', nested: { prop: 123 } };
      const result = castToJsonValue(obj);

      expect(result).toEqual(obj);
    });

    it('should cast array values', () => {
      const arr = [1, 2, 3, 'test', { key: 'value' }];
      const result = castToJsonValue(arr);

      expect(result).toEqual(arr);
    });

    it('should cast MediaItem object', () => {
      const mediaItem: MediaItem = {
        id: 'media-1',
        type: 'image',
        url: 'https://example.com/photo.jpg',
        caption: 'Test',
        uploadedAt: '2024-01-01T00:00:00.000Z',
      };

      const result = castToJsonValue(mediaItem);
      expect(result).toEqual(mediaItem);
    });

    it('should cast array of MediaItems', () => {
      const mediaItems: MediaItem[] = [
        {
          id: 'media-1',
          type: 'image',
          url: 'https://example.com/photo1.jpg',
          uploadedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'media-2',
          type: 'image',
          url: 'https://example.com/photo2.jpg',
          uploadedAt: '2024-01-02T00:00:00.000Z',
        },
      ];

      const result = castToJsonValue(mediaItems);
      expect(result).toEqual(mediaItems);
    });

    it('should handle complex nested structures', () => {
      const complex = {
        users: [
          { id: 1, name: 'User 1', media: [{ id: 'media-1', type: 'image' }] },
          { id: 2, name: 'User 2', media: [] },
        ],
        metadata: {
          count: 2,
          hasMore: false,
        },
      };

      const result = castToJsonValue(complex);
      expect(result).toEqual(complex);
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-01-01T00:00:00.000Z');
      const result = castToJsonValue(date);

      expect(result).toEqual(date);
    });

    it('should handle undefined', () => {
      const result = castToJsonValue(undefined);
      expect(result).toBeUndefined();
    });

    it('should maintain type safety at compile time', () => {
      // This test verifies TypeScript type checking works correctly
      const value: MediaItem = {
        id: 'test',
        type: 'image',
        url: 'https://example.com/test.jpg',
        uploadedAt: '2024-01-01T00:00:00.000Z',
      };

      // Should compile without errors
      const result = castToJsonValue<MediaItem>(value);

      // TypeScript should know this is a MediaItem at compile time
      expect(result).toBeDefined();
    });
  });

  describe('Integration: generateTempMediaId + castToJsonValue', () => {
    it('should work together to create JSON-safe MediaItem', () => {
      const mediaItem: MediaItem = {
        id: generateTempMediaId(),
        type: 'image',
        url: 'https://example.com/photo.jpg',
        caption: 'Test photo',
        uploadedAt: new Date().toISOString(),
      };

      const jsonValue = castToJsonValue(mediaItem);

      expect(jsonValue).toMatchObject({
        id: expect.stringMatching(/^temp_\d+_[a-z0-9]+$/),
        type: 'image',
        url: 'https://example.com/photo.jpg',
        caption: 'Test photo',
        uploadedAt: expect.any(String),
      });
    });
  });

  describe('Integration: castToMediaItems + castToJsonValue roundtrip', () => {
    it('should handle database roundtrip correctly', () => {
      const originalItems: MediaItem[] = [
        {
          id: generateTempMediaId(),
          type: 'image',
          url: 'https://example.com/photo1.jpg',
          uploadedAt: new Date().toISOString(),
        },
        {
          id: generateTempMediaId(),
          type: 'image',
          url: 'https://example.com/photo2.jpg',
          caption: 'My bike',
          uploadedAt: new Date().toISOString(),
        },
      ];

      // Simulate saving to database
      const forDatabase = originalItems.map(item => castToJsonValue(item));

      // Simulate reading from database
      const fromDatabase = castToMediaItems(forDatabase);

      expect(fromDatabase).toHaveLength(2);
      expect(fromDatabase[0].url).toBe(originalItems[0].url);
      expect(fromDatabase[1].caption).toBe(originalItems[1].caption);
    });
  });
});
