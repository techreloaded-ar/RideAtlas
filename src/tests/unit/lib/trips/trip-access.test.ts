/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  isJsonResponse,
  handleNonJsonResponse,
  createUnauthenticatedAccessInfo,
  createUnauthenticatedPurchaseInfo,
  validateTripAccessData,
  parseApiErrorResponse,
  fetchTripAccessFromApi,
  fetchPurchaseStatusFromApi,
  shouldSkipAccessFetch
} from '@/lib/trips/trip-access';

// Mock fetch globally
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Console is already mocked in jest.setup.ts

describe('Trip Access Pure Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('isJsonResponse', () => {
    it('should return true for JSON content type', () => {
      const mockResponse = {
        headers: {
          get: jest.fn().mockReturnValue('application/json; charset=utf-8')
        }
      } as unknown as Response;

      expect(isJsonResponse(mockResponse)).toBe(true);
    });

    it('should return false for HTML content type', () => {
      const mockResponse = {
        headers: {
          get: jest.fn().mockReturnValue('text/html; charset=utf-8')
        }
      } as unknown as Response;

      expect(isJsonResponse(mockResponse)).toBe(false);
    });

    it('should return false for null content type', () => {
      const mockResponse = {
        headers: {
          get: jest.fn().mockReturnValue(null)
        }
      } as unknown as Response;

      expect(isJsonResponse(mockResponse)).toBe(false);
    });

    it('should return false for undefined content type', () => {
      const mockResponse = {
        headers: {
          get: jest.fn().mockReturnValue(undefined)
        }
      } as unknown as Response;

      expect(isJsonResponse(mockResponse)).toBe(false);
    });
  });

  describe('handleNonJsonResponse', () => {
    it('should create error with HTML response details', async () => {
      const mockResponse = {
        status: 500,
        headers: {
          get: jest.fn().mockReturnValue('text/html')
        },
        text: jest.fn().mockResolvedValue('<html><body>Server Error</body></html>')
      } as unknown as Response;

      const error = await handleNonJsonResponse(mockResponse);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Server ha restituito HTML invece di JSON. Status: 500');
    });

    it('should handle long HTML responses', async () => {
      const longHtml = '<html><body>' + 'x'.repeat(300) + '</body></html>';
      const mockResponse = {
        status: 404,
        headers: {
          get: jest.fn().mockReturnValue('text/html')
        },
        text: jest.fn().mockResolvedValue(longHtml)
      } as unknown as Response;

      const error = await handleNonJsonResponse(mockResponse);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Server ha restituito HTML invece di JSON. Status: 404');
    });
  });

  describe('createUnauthenticatedAccessInfo', () => {
    it('should create correct default access info', () => {
      const accessInfo = createUnauthenticatedAccessInfo();

      expect(accessInfo).toEqual({
        canAccess: false,
        isOwner: false,
        hasPurchased: false,
        price: 0,
        reason: 'authentication_required',
        message: 'È necessario effettuare il login'
      });
    });
  });

  describe('createUnauthenticatedPurchaseInfo', () => {
    it('should create correct default purchase info', () => {
      const purchaseInfo = createUnauthenticatedPurchaseInfo();

      expect(purchaseInfo).toEqual({
        purchased: false,
        isOwner: false,
        price: 0
      });
    });
  });

  describe('validateTripAccessData', () => {
    it('should validate correct trip access data', () => {
      const validData = {
        canAccess: true,
        isOwner: false,
        hasPurchased: true,
        price: 25
      };

      expect(validateTripAccessData(validData)).toBe(true);
    });

    it('should reject data without canAccess field', () => {
      const invalidData = {
        isOwner: false,
        hasPurchased: true,
        price: 25
      };

      expect(validateTripAccessData(invalidData)).toBe(false);
    });

    it('should reject data with non-boolean canAccess', () => {
      const invalidData = {
        canAccess: 'true',
        isOwner: false,
        hasPurchased: true,
        price: 25
      };

      expect(validateTripAccessData(invalidData)).toBe(false);
    });

    it('should reject null data', () => {
      expect(validateTripAccessData(null)).toBe(false);
    });

    it('should reject non-object data', () => {
      expect(validateTripAccessData('invalid')).toBe(false);
      expect(validateTripAccessData(123)).toBe(false);
      expect(validateTripAccessData(true)).toBe(false);
    });
  });

  describe('parseApiErrorResponse', () => {
    it('should parse JSON error response', async () => {
      const mockResponse = {
        status: 400,
        json: jest.fn().mockResolvedValue({ error: 'Validation failed' })
      } as unknown as Response;

      const errorMessage = await parseApiErrorResponse(mockResponse);

      expect(errorMessage).toBe('Validation failed');
    });

    it('should use default message when error field is missing', async () => {
      const mockResponse = {
        status: 500,
        json: jest.fn().mockResolvedValue({ message: 'Server error' })
      } as unknown as Response;

      const errorMessage = await parseApiErrorResponse(mockResponse);

      expect(errorMessage).toBe('HTTP error! status: 500');
    });

    it('should handle JSON parsing errors gracefully', async () => {
      const mockResponse = {
        status: 403,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      } as unknown as Response;

      const errorMessage = await parseApiErrorResponse(mockResponse);

      expect(errorMessage).toBe('HTTP error! status: 403');
    });
  });

  describe('fetchTripAccessFromApi', () => {
    it('should fetch access info successfully', async () => {
      const mockAccessData = {
        canAccess: true,
        isOwner: true,
        hasPurchased: false,
        price: 0
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: async () => mockAccessData
      } as Response);

      const result = await fetchTripAccessFromApi('trip-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAccessData);
      expect(mockFetch).toHaveBeenCalledWith('/api/trips/trip-123/access');
    });

    it('should handle 401 responses specially', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        }
      } as Response);

      const result = await fetchTripAccessFromApi('trip-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(createUnauthenticatedAccessInfo());
    });

    it('should handle non-JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('text/html')
        },
        text: async () => '<html>Error</html>'
      } as Response);

      const result = await fetchTripAccessFromApi('trip-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Server ha restituito HTML invece di JSON');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: async () => ({ error: 'Internal server error' })
      } as Response);

      const result = await fetchTripAccessFromApi('trip-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal server error');
    });

    it('should handle invalid data structure', async () => {
      const invalidData = { isOwner: true }; // Missing canAccess

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: async () => invalidData
      } as Response);

      const result = await fetchTripAccessFromApi('trip-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Formato dati ricevuti non valido: manca canAccess');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchTripAccessFromApi('trip-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('fetchPurchaseStatusFromApi', () => {
    it('should fetch purchase status successfully', async () => {
      const mockPurchaseData = {
        purchased: true,
        isOwner: false,
        price: 25,
        purchase: { id: 'purchase-123' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPurchaseData
      } as Response);

      const result = await fetchPurchaseStatusFromApi('trip-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPurchaseData);
      expect(mockFetch).toHaveBeenCalledWith('/api/trips/trip-123/purchase');
    });

    it('should handle 401 responses for purchase status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      } as Response);

      const result = await fetchPurchaseStatusFromApi('trip-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(createUnauthenticatedPurchaseInfo());
    });

    it('should handle other HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      } as Response);

      const result = await fetchPurchaseStatusFromApi('trip-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('HTTP error! status: 500');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await fetchPurchaseStatusFromApi('trip-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });
  });

  describe('shouldSkipAccessFetch', () => {
    it('should skip when tripId is null', () => {
      expect(shouldSkipAccessFetch(null, 'authenticated')).toBe(true);
    });

    it('should skip when session is loading', () => {
      expect(shouldSkipAccessFetch('trip-123', 'loading')).toBe(true);
    });

    it('should skip when user is unauthenticated', () => {
      expect(shouldSkipAccessFetch('trip-123', 'unauthenticated')).toBe(true);
    });

    it('should not skip when tripId exists and user is authenticated', () => {
      expect(shouldSkipAccessFetch('trip-123', 'authenticated')).toBe(false);
    });

    it('should skip when multiple conditions are met', () => {
      expect(shouldSkipAccessFetch(null, 'loading')).toBe(true);
      expect(shouldSkipAccessFetch(null, 'unauthenticated')).toBe(true);
    });
  });
});