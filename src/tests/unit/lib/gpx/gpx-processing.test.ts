/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { 
  processGPXData, 
  createGPXMetadata, 
  fetchGPXFromUrl, 
  readGPXFromFile 
} from '@/lib/gpx/gpx-processing';
import type { GPXParseResult } from '@/lib/gpx-utils';

// Mock fetch globally
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('GPX Processing Pure Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('processGPXData', () => {
    const mockGPXParseResult: GPXParseResult = {
      tracks: [
        {
          name: 'Track 1',
          points: [
            { lat: 46.0, lng: 11.0, elevation: 1000 },
            { lat: 46.1, lng: 11.1, elevation: 1100 }
          ]
        },
        {
          name: 'Track 2',
          points: [
            { lat: 47.0, lng: 12.0, elevation: 1200 },
            { lat: 47.1, lng: 12.1, elevation: 1300 }
          ]
        }
      ],
      routes: [
        {
          name: 'Route 1',
          points: [
            { lat: 48.0, lng: 13.0, elevation: 1400 }
          ]
        }
      ],
      waypoints: [
        { lat: 49.0, lng: 14.0, name: 'Waypoint 1', elevation: 1500 },
        { lat: 49.1, lng: 14.1, name: 'Waypoint 2', elevation: 1600 }
      ]
    };

    it('should process valid GPX data correctly', () => {
      const result = processGPXData(mockGPXParseResult);

      expect(result.allPoints).toHaveLength(4);
      expect(result.tracks).toHaveLength(2);
      expect(result.routes).toHaveLength(1);
      expect(result.waypoints).toHaveLength(2);

      // Check track processing
      expect(result.tracks[0].name).toBe('Track 1');
      expect(result.tracks[0].points).toHaveLength(2);
      expect(result.tracks[0].color).toBe('#3b82f6'); // First track color
      
      expect(result.tracks[1].name).toBe('Track 2');
      expect(result.tracks[1].color).toMatch(/hsl\(\d+, 70%, 50%\)/); // HSL color pattern

      // Check waypoint processing
      expect(result.waypoints[0].name).toBe('Waypoint 1');
      expect(result.waypoints[0].lat).toBe(49.0);
      expect(result.waypoints[0].elevation).toBe(1500);

      // Check route processing
      expect(result.routes[0].name).toBe('Route 1');
      expect(result.routes[0].points).toHaveLength(1);
    });

    it('should assign default names to unnamed tracks', () => {
      const dataWithoutNames: GPXParseResult = {
        tracks: [
          { name: '', points: [{ lat: 46.0, lng: 11.0 }] },
          { points: [{ lat: 47.0, lng: 12.0 }] } // Missing name property
        ],
        routes: [],
        waypoints: []
      };

      const result = processGPXData(dataWithoutNames);

      expect(result.tracks[0].name).toBe('Traccia 1');
      expect(result.tracks[1].name).toBe('Traccia 2');
    });

    it('should handle tracks without elevation data', () => {
      const dataWithoutElevation: GPXParseResult = {
        tracks: [
          {
            name: 'Flat Track',
            points: [
              { lat: 46.0, lng: 11.0 },
              { lat: 46.1, lng: 11.1 }
            ]
          }
        ],
        routes: [],
        waypoints: []
      };

      const result = processGPXData(dataWithoutElevation);

      expect(result.allPoints[0].elevation).toBeUndefined();
      expect(result.tracks[0].points[0].elevation).toBeUndefined();
    });

    it('should throw error for empty GPX data', () => {
      const emptyData: GPXParseResult = {
        tracks: [],
        routes: [],
        waypoints: []
      };

      expect(() => processGPXData(emptyData)).toThrow('Il file GPX non contiene tracciati validi');
    });

    it('should throw error for null/undefined data', () => {
      expect(() => processGPXData(null as any)).toThrow('Il file GPX non contiene tracciati validi');
      expect(() => processGPXData(undefined as any)).toThrow('Il file GPX non contiene tracciati validi');
    });

    it('should throw error when tracks have no points', () => {
      const dataWithEmptyTracks: GPXParseResult = {
        tracks: [
          { name: 'Empty Track', points: [] }
        ],
        routes: [],
        waypoints: []
      };

      expect(() => processGPXData(dataWithEmptyTracks)).toThrow('Nessun punto trovato nel tracciato GPX');
    });
  });

  describe('createGPXMetadata', () => {
    it('should calculate metadata correctly', () => {
      const processedData = {
        allPoints: [
          { lat: 46.0, lng: 11.0, elevation: 1000 },
          { lat: 46.1, lng: 11.1, elevation: 1100 },
          { lat: 46.2, lng: 11.2 }
        ],
        tracks: [{ name: 'Track 1', points: [], color: '#000' }],
        routes: [
          { name: 'Route 1', points: [] },
          { name: 'Route 2', points: [] }
        ],
        waypoints: [
          { lat: 49.0, lng: 14.0, name: 'WP1' },
          { lat: 49.1, lng: 14.1, name: 'WP2' },
          { lat: 49.2, lng: 14.2, name: 'WP3' }
        ]
      };

      const metadata = createGPXMetadata(processedData);

      expect(metadata.totalPoints).toBe(3);
      expect(metadata.totalTracks).toBe(1);
      expect(metadata.totalRoutes).toBe(2);
      expect(metadata.totalWaypoints).toBe(3);
      expect(metadata.hasElevation).toBe(true); // Some points have elevation
    });

    it('should detect when no elevation data is present', () => {
      const processedData = {
        allPoints: [
          { lat: 46.0, lng: 11.0 },
          { lat: 46.1, lng: 11.1 }
        ],
        tracks: [],
        routes: [],
        waypoints: []
      };

      const metadata = createGPXMetadata(processedData);

      expect(metadata.hasElevation).toBe(false);
    });

    it('should handle empty data', () => {
      const emptyData = {
        allPoints: [],
        tracks: [],
        routes: [],
        waypoints: []
      };

      const metadata = createGPXMetadata(emptyData);

      expect(metadata.totalPoints).toBe(0);
      expect(metadata.totalTracks).toBe(0);
      expect(metadata.totalRoutes).toBe(0);
      expect(metadata.totalWaypoints).toBe(0);
      expect(metadata.hasElevation).toBe(false);
    });
  });

  describe('fetchGPXFromUrl', () => {
    it('should fetch GPX content successfully', async () => {
      const mockGpxContent = '<gpx>test content</gpx>';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => mockGpxContent,
      } as Response);

      const result = await fetchGPXFromUrl('https://example.com/test.gpx');

      expect(result).toBe(mockGpxContent);
      expect(mockFetch).toHaveBeenCalledWith('/api/gpx/preview?url=https%3A%2F%2Fexample.com%2Ftest.gpx');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'File not found' }),
      } as Response);

      await expect(fetchGPXFromUrl('https://example.com/missing.gpx'))
        .rejects.toThrow('File not found');
    });

    it('should handle API errors without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      await expect(fetchGPXFromUrl('https://example.com/error.gpx'))
        .rejects.toThrow('Errore nel caricamento del file GPX');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchGPXFromUrl('https://example.com/network-error.gpx'))
        .rejects.toThrow('Network error');
    });

    it('should properly encode URLs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => 'content',
      } as Response);

      await fetchGPXFromUrl('https://example.com/path with spaces.gpx');

      expect(mockFetch).toHaveBeenCalledWith('/api/gpx/preview?url=https%3A%2F%2Fexample.com%2Fpath%20with%20spaces.gpx');
    });
  });

  describe('readGPXFromFile', () => {
    it('should read file content successfully', async () => {
      const mockContent = '<gpx>file content</gpx>';
      const mockFile = new File([mockContent], 'test.gpx', { type: 'application/gpx+xml' });

      const result = await readGPXFromFile(mockFile);

      expect(result).toBe(mockContent);
    });

    it('should handle file reading errors', async () => {
      // Create a mock file that throws an error
      const mockFile = {
        text: jest.fn().mockRejectedValue(new Error('File read error'))
      } as unknown as File;

      await expect(readGPXFromFile(mockFile))
        .rejects.toThrow('File read error');
    });
  });
});