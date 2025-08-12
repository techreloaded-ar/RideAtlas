/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  transformTripDataForSubmission,
  buildApiUrl,
  getHttpMethod,
  parseServerErrors,
  handleHttpErrorStatus,
  transformApiDataToFormData,
  createFieldErrorSetter,
  submitTripToApi,
  fetchTripFromApi
} from '@/lib/trips/trip-submission';
import type { TripWithStagesData } from '@/schemas/trip';

// Mock fetch globally
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('Trip Submission Pure Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('transformTripDataForSubmission', () => {
    const mockFormData: TripWithStagesData = {
      title: 'Test Trip',
      summary: 'Test Summary',
      destination: 'Test Destination',
      theme: 'adventure',
      characteristics: ['mountain', 'scenic'],
      recommended_seasons: ['spring', 'summer'],
      tags: ['hiking', 'nature'],
      media: [],
      gpxFile: null,
      stages: [
        {
          id: 'stage-1',
          orderIndex: 0,
          title: 'Stage 1',
          description: 'First stage',
          routeType: 'mountain',
          duration: '2 hours',
          media: [],
          gpxFile: null
        },
        {
          // Missing optional fields
          orderIndex: 1,
          title: 'Stage 2',
          media: [],
          gpxFile: null
        }
      ]
    };

    it('should transform form data correctly', () => {
      const result = transformTripDataForSubmission(mockFormData);

      expect(result.title).toBe('Test Trip');
      expect(result.stages).toHaveLength(2);
      expect(result.stages[0].id).toBe('stage-1');
      expect(result.stages[0].title).toBe('Stage 1');
      expect(result.stages[0].description).toBe('First stage');
      expect(result.stages[0].routeType).toBe('mountain');
    });

    it('should handle missing optional fields with defaults', () => {
      const result = transformTripDataForSubmission(mockFormData);

      expect(result.stages[1].description).toBe('');
      expect(result.stages[1].routeType).toBe('road');
      expect(result.stages[1].duration).toBe('');
    });

    it('should handle empty stages array', () => {
      const dataWithoutStages = { ...mockFormData, stages: [] };
      const result = transformTripDataForSubmission(dataWithoutStages);

      expect(result.stages).toEqual([]);
    });
  });

  describe('buildApiUrl', () => {
    it('should build create URL', () => {
      const result = buildApiUrl({ mode: 'create' });
      expect(result).toBe('/api/trips');
    });

    it('should build edit URL with tripId', () => {
      const result = buildApiUrl({ mode: 'edit', tripId: 'trip-123' });
      expect(result).toBe('/api/trips/trip-123');
    });
  });

  describe('getHttpMethod', () => {
    it('should return POST for create mode', () => {
      expect(getHttpMethod('create')).toBe('POST');
    });

    it('should return PUT for edit mode', () => {
      expect(getHttpMethod('edit')).toBe('PUT');
    });
  });

  describe('parseServerErrors', () => {
    it('should parse field-specific errors correctly', () => {
      const serverResponse = {
        error: 'Validation failed',
        details: {
          title: ['Title is required'],
          summary: ['Summary too long', 'Summary contains invalid characters']
        }
      };

      const result = parseServerErrors(serverResponse, 'create');

      expect(result.fieldErrors.title).toBe('Title is required');
      expect(result.fieldErrors.summary).toBe('Summary too long'); // Takes first error
      expect(result.generalError).toBeNull();
    });

    it('should handle missing details with general error', () => {
      const serverResponse = { error: 'Server internal error' };
      
      const result = parseServerErrors(serverResponse, 'create');

      expect(result.fieldErrors).toEqual({});
      expect(result.generalError).toBe('Server internal error');
    });

    it('should provide default error message for create mode', () => {
      const serverResponse = {};
      
      const result = parseServerErrors(serverResponse, 'create');

      expect(result.generalError).toBe('Errore durante la creazione del viaggio');
    });

    it('should provide default error message for edit mode', () => {
      const serverResponse = {};
      
      const result = parseServerErrors(serverResponse, 'edit');

      expect(result.generalError).toBe('Errore durante l\'aggiornamento del viaggio');
    });

    it('should handle invalid server response structure', () => {
      const result = parseServerErrors(null, 'create');

      expect(result.fieldErrors).toEqual({});
      expect(result.generalError).toBe('Errore durante la creazione del viaggio');
    });

    it('should handle empty field errors array', () => {
      const serverResponse = {
        error: 'Validation failed',
        details: {
          title: []
        }
      };

      const result = parseServerErrors(serverResponse, 'create');

      expect(result.fieldErrors.title).toBeUndefined();
      expect(result.generalError).toBeNull();
    });
  });

  describe('handleHttpErrorStatus', () => {
    it('should handle 404 status', () => {
      expect(handleHttpErrorStatus(404)).toBe('Viaggio non trovato');
    });

    it('should handle 403 status', () => {
      expect(handleHttpErrorStatus(403)).toBe('Non hai i permessi per modificare questo viaggio');
    });

    it('should handle generic error status', () => {
      expect(handleHttpErrorStatus(500)).toBe('Errore nel caricamento del viaggio');
      expect(handleHttpErrorStatus(400)).toBe('Errore nel caricamento del viaggio');
    });
  });

  describe('transformApiDataToFormData', () => {
    const mockApiData = {
      title: 'API Trip',
      summary: 'API Summary',
      destination: 'API Destination',
      theme: 'nature',
      characteristics: ['forest', 'lake'],
      recommended_seasons: ['fall'],
      tags: ['camping'],
      media: ['photo1.jpg'],
      gpxFile: { url: 'test.gpx' },
      stages: [
        {
          id: 'api-stage-1',
          orderIndex: 0,
          title: 'API Stage 1',
          description: 'First API stage',
          routeType: 'trail',
          duration: '3 hours',
          media: ['stage1.jpg'],
          gpxFile: { url: 'stage1.gpx' }
        }
      ]
    };

    it('should transform API data to form format correctly', () => {
      const result = transformApiDataToFormData(mockApiData);

      expect(result.title).toBe('API Trip');
      expect(result.summary).toBe('API Summary');
      expect(result.stages).toHaveLength(1);
      expect(result.stages[0].id).toBe('api-stage-1');
      expect(result.stages[0].title).toBe('API Stage 1');
    });

    it('should handle missing fields with defaults', () => {
      const incompleteApiData = {
        title: 'Incomplete Trip'
        // Missing most fields
      };

      const result = transformApiDataToFormData(incompleteApiData);

      expect(result.title).toBe('Incomplete Trip');
      expect(result.summary).toBe('');
      expect(result.destination).toBe('');
      expect(result.characteristics).toEqual([]);
      expect(result.stages).toEqual([]);
    });

    it('should handle missing stages array', () => {
      const dataWithoutStages = { ...mockApiData };
      delete dataWithoutStages.stages;

      const result = transformApiDataToFormData(dataWithoutStages);

      expect(result.stages).toEqual([]);
    });

    it('should handle stages with missing fields', () => {
      const dataWithIncompleteStage = {
        ...mockApiData,
        stages: [{ title: 'Incomplete Stage' }]
      };

      const result = transformApiDataToFormData(dataWithIncompleteStage);

      expect(result.stages[0].title).toBe('Incomplete Stage');
      expect(result.stages[0].description).toBe('');
      expect(result.stages[0].routeType).toBe('road');
      expect(result.stages[0].orderIndex).toBe(0);
    });
  });

  describe('createFieldErrorSetter', () => {
    it('should create error setter that calls setError for each field', () => {
      const mockSetError = jest.fn();
      const errorSetter = createFieldErrorSetter(mockSetError);

      const fieldErrors = {
        title: 'Title error',
        summary: 'Summary error'
      };

      errorSetter(fieldErrors);

      expect(mockSetError).toHaveBeenCalledTimes(2);
      expect(mockSetError).toHaveBeenCalledWith('title', {
        type: 'server',
        message: 'Title error'
      });
      expect(mockSetError).toHaveBeenCalledWith('summary', {
        type: 'server',
        message: 'Summary error'
      });
    });

    it('should handle empty field errors', () => {
      const mockSetError = jest.fn();
      const errorSetter = createFieldErrorSetter(mockSetError);

      errorSetter({});

      expect(mockSetError).not.toHaveBeenCalled();
    });
  });

  describe('submitTripToApi', () => {
    const mockTripData = {
      title: 'Test Trip',
      summary: 'Test Summary',
      destination: 'Test Destination',
      theme: 'adventure',
      characteristics: [],
      recommended_seasons: [],
      tags: [],
      media: [],
      gpxFile: null,
      stages: []
    };

    it('should submit data successfully', async () => {
      const mockResponse = { id: 'trip-123', title: 'Test Trip' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await submitTripToApi('/api/trips', 'POST', mockTripData);

      expect(result.success).toBe(true);
      expect(result.result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockTripData)
      });
    });

    it('should handle API errors', async () => {
      const mockError = { error: 'Validation failed' };
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      } as Response);

      const result = await submitTripToApi('/api/trips', 'POST', mockTripData);

      expect(result.success).toBe(false);
      expect(result.result).toEqual(mockError);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        submitTripToApi('/api/trips', 'POST', mockTripData)
      ).rejects.toThrow('Network error');
    });
  });

  describe('fetchTripFromApi', () => {
    it('should fetch trip data successfully', async () => {
      const mockTripData = { id: 'trip-123', title: 'Fetched Trip' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTripData,
      } as Response);

      const result = await fetchTripFromApi('trip-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTripData);
      expect(mockFetch).toHaveBeenCalledWith('/api/trips/trip-123');
    });

    it('should handle 404 error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response);

      const result = await fetchTripFromApi('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Viaggio non trovato');
    });

    it('should handle 403 error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}),
      } as Response);

      const result = await fetchTripFromApi('forbidden');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Non hai i permessi per modificare questo viaggio');
    });

    it('should handle generic errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response);

      const result = await fetchTripFromApi('server-error');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Errore nel caricamento del viaggio');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchTripFromApi('trip-123')).rejects.toThrow('Network error');
    });
  });
});