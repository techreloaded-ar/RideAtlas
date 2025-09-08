import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';
import { useProfile } from '@/hooks/profile/useProfile';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useProfile Hook', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should load profile data successfully', async () => {
      const mockProfileData = {
        success: true,
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          bio: 'Test bio',
          socialLinks: {
            instagram: 'https://instagram.com/testuser',
            website: 'https://testuser.com'
          },
          role: 'EXPLORER',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfileData
      });

      const { result } = renderHook(() => useProfile());

      // Inizialmente dovrebbe essere in loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.profile).toBe(null);
      expect(result.current.error).toBe(null);

      // Aspetta che il caricamento sia completato
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.profile).toEqual(mockProfileData.user);
      expect(result.current.error).toBe(null);
      expect(mockFetch).toHaveBeenCalledWith('/api/profile');
    });

    it('should handle profile with empty social links', async () => {
      const mockProfileData = {
        success: true,
        user: {
          id: 'user-2',
          name: 'User No Social',
          email: 'nosocial@example.com',
          bio: null,
          socialLinks: {},
          role: 'EXPLORER',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfileData
      });

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.profile).toEqual(mockProfileData.user);
      expect(result.current.profile?.socialLinks).toEqual({});
    });
  });

  describe('Error Cases', () => {
    it('should handle API error response', async () => {
      const errorResponse = {
        error: 'Non autorizzato'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => errorResponse
      });

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.profile).toBe(null);
      expect(result.current.error).toBe('Non autorizzato');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.profile).toBe(null);
      expect(result.current.error).toBe('Network error');
    });

    it('should handle API response without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({})
      });

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.profile).toBe(null);
      expect(result.current.error).toBe('Errore nel caricamento del profilo');
    });
  });

  describe('Refetch Functionality', () => {
    it('should refetch profile data when refetch is called', async () => {
      const initialData = {
        success: true,
        user: {
          id: 'user-1',
          name: 'Initial Name',
          email: 'test@example.com',
          bio: null,
          socialLinks: {},
          role: 'EXPLORER',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      };

      const updatedData = {
        success: true,
        user: {
          ...initialData.user,
          name: 'Updated Name',
          bio: 'Updated bio',
          socialLinks: { instagram: 'https://instagram.com/updated' }
        }
      };

      // Setup mock per entrambe le chiamate
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => initialData
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => updatedData
        });

      const { result } = renderHook(() => useProfile());

      // Aspetta il caricamento iniziale
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.profile?.name).toBe('Initial Name');

      // Esegui refetch
      await waitFor(async () => {
        await result.current.refetch();
      });

      // Aspetta che il refetch sia completato
      await waitFor(() => {
        expect(result.current.profile?.name).toBe('Updated Name');
      });

      expect(result.current.profile?.bio).toBe('Updated bio');
      expect(result.current.profile?.socialLinks).toEqual({ 
        instagram: 'https://instagram.com/updated' 
      });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle refetch error', async () => {
      // Prima chiamata successful
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
            bio: null,
            socialLinks: {},
            role: 'EXPLORER',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        })
      });

      const { result } = renderHook(() => useProfile());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.profile).not.toBe(null);

      // Refetch con errore
      mockFetch.mockRejectedValueOnce(new Error('Refetch error'));

      await waitFor(async () => {
        await result.current.refetch();
      });

      // Aspetta che l'errore sia gestito
      await waitFor(() => {
        expect(result.current.error).toBe('Refetch error');
      });

      expect(result.current.profile).toBe(null); // Profile viene resettato in caso di errore
    });
  });
});