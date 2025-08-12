// src/tests/unit/hooks/useStages.test.ts
// Test per hook useStages

import { renderHook, act, waitFor } from '@testing-library/react';
import { useStages } from '@/hooks/stages/useStages';
import { Stage, StageCreationData, StageUpdateData } from '@/types/trip';

// Mock fetch globalmente
global.fetch = jest.fn();

// Mock data
const mockStage1: Stage = {
  id: 'stage-1',
  tripId: 'trip-123',
  orderIndex: 0,
  title: 'Tappa 1: Milano',
  description: 'Prima tappa del viaggio',
  routeType: 'Autostrada',
  media: [],
  gpxFile: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};

const mockStage2: Stage = {
  id: 'stage-2',
  tripId: 'trip-123',
  orderIndex: 1,
  title: 'Tappa 2: Roma',
  description: 'Seconda tappa del viaggio',
  routeType: 'Statale',
  media: [],
  gpxFile: null,
  createdAt: new Date('2024-01-02'),
  updatedAt: new Date('2024-01-02')
};

const mockStages = [mockStage1, mockStage2];

describe('useStages Hook', () => {
  beforeEach(() => {
    // Reset mock
    jest.clearAllMocks();
    
    // Mock successful fetch by default
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ stages: mockStages })
    } as Response);
  });

  describe('Initialization and Data Fetching', () => {
    it('should initialize correctly and fetch stages on mount', async () => {
      const { result } = renderHook(() => useStages({ tripId: 'trip-123' }));

      // Initial state
      expect(result.current.stages).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);

      // Wait for fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stages).toEqual(mockStages);
      expect(result.current.error).toBe(null);
      expect(global.fetch).toHaveBeenCalledWith('/api/trips/trip-123/stages');
    });

    it('should not auto-fetch when autoFetch is false', () => {
      renderHook(() => useStages({ tripId: 'trip-123', autoFetch: false }));

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle fetch error correctly', async () => {
      const errorMessage = 'Network error';
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useStages({ tripId: 'trip-123' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.stages).toEqual([]);
    });
  });

  describe('CRUD Operations', () => {
    it('should create a stage successfully', async () => {
      const { result } = renderHook(() => useStages({ tripId: 'trip-123' }));

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock successful stage creation
      const newStage: Stage = {
        id: 'stage-3',
        tripId: 'trip-123',
        orderIndex: 2,
        title: 'Tappa 3: Napoli',
        description: 'Terza tappa',
        routeType: 'Panoramica',
        media: [],
        gpxFile: null,
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03')
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stage: newStage })
      } as Response);

      const stageData: StageCreationData = {
        orderIndex: 2,
        title: 'Tappa 3: Napoli',
        description: 'Terza tappa',
        routeType: 'Panoramica',
        media: [],
        gpxFile: null
      };

      let createdStage: Stage | null = null;
      await act(async () => {
        createdStage = await result.current.createStage(stageData);
      });

      expect(createdStage).toEqual(newStage);
      expect(result.current.stages).toHaveLength(3);
      expect(result.current.getTotalStages()).toBe(3);
    });

    it('should update a stage successfully', async () => {
      const { result } = renderHook(() => useStages({ tripId: 'trip-123' }));

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedStage = { ...mockStage1, title: 'Tappa 1: Milano Aggiornata' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stage: updatedStage })
      } as Response);

      const updateData: StageUpdateData = {
        title: 'Tappa 1: Milano Aggiornata'
      };

      let resultStage: Stage | null = null;
      await act(async () => {
        resultStage = await result.current.updateStage('stage-1', updateData);
      });

      expect(resultStage?.title).toBe('Tappa 1: Milano Aggiornata');
      expect(result.current.stages[0].title).toBe('Tappa 1: Milano Aggiornata');
    });

    it('should delete a stage successfully', async () => {
      const { result } = renderHook(() => useStages({ tripId: 'trip-123' }));

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock successful deletion and subsequent refresh
      const mockFetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ stages: [mockStage2] })
        } as Response);

      global.fetch = mockFetch;

      let deleteResult = false;
      await act(async () => {
        deleteResult = await result.current.deleteStage('stage-1');
      });

      expect(deleteResult).toBe(true);
      expect(result.current.stages).toHaveLength(1);
      expect(result.current.stages[0].id).toBe('stage-2');
    });
  });

  describe('Utility Functions', () => {
    it('should find stage by ID correctly', async () => {
      const { result } = renderHook(() => useStages({ tripId: 'trip-123' }));

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const foundStage = result.current.getStageById('stage-1');
      expect(foundStage).toEqual(mockStage1);

      const notFoundStage = result.current.getStageById('nonexistent');
      expect(notFoundStage).toBeUndefined();
    });

    it('should return correct total stages count', async () => {
      const { result } = renderHook(() => useStages({ tripId: 'trip-123' }));

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getTotalStages()).toBe(2);
    });

    it('should clear error correctly', async () => {
      // Mock error response first
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

      const { result } = renderHook(() => useStages({ tripId: 'trip-123' }));

      // Wait for error to be set
      await waitFor(() => {
        expect(result.current.error).toBe('Test error');
      });

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Error Handling and Rollback', () => {
    it('should rollback optimistic update on create failure', async () => {
      const { result } = renderHook(() => useStages({ tripId: 'trip-123' }));

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialStagesCount = result.current.stages.length;

      // Mock failed creation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Creation failed' })
      } as Response);

      const stageData: StageCreationData = {
        orderIndex: 2,
        title: 'Failed Stage',
        media: [],
        gpxFile: null
      };

      let createdStage: Stage | null = null;
      await act(async () => {
        createdStage = await result.current.createStage(stageData);
      });

      // Should not create stage and error should be set
      expect(createdStage).toBe(null);
      expect(result.current.error).toBe('Creation failed');
      expect(result.current.stages).toHaveLength(initialStagesCount);
    });

    it('should rollback optimistic update on update failure', async () => {
      const { result } = renderHook(() => useStages({ tripId: 'trip-123' }));

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const originalTitle = result.current.stages[0].title;

      // Mock failed update
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Update failed' })
      } as Response);

      const updateData: StageUpdateData = {
        title: 'Failed Update'
      };

      let updatedStage: Stage | null = null;
      await act(async () => {
        updatedStage = await result.current.updateStage('stage-1', updateData);
      });

      // Should rollback to original state
      expect(updatedStage).toBe(null);
      expect(result.current.error).toBe('Update failed');
      expect(result.current.stages[0].title).toBe(originalTitle);
    });
  });

  describe('Reordering', () => {
    it('should reorder stages successfully', async () => {
      const { result } = renderHook(() => useStages({ tripId: 'trip-123' }));

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock successful reorder (2 PUT requests for 2 stages)
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ stages: [mockStage2, mockStage1] })
        } as Response);

      const newOrder = [mockStage2, mockStage1]; // Reverse order

      let reorderResult = false;
      await act(async () => {
        reorderResult = await result.current.reorderStages(newOrder);
      });

      expect(reorderResult).toBe(true);
      expect(result.current.isReordering).toBe(false);
    });

    it('should handle reorder validation errors', async () => {
      const { result } = renderHook(() => useStages({ tripId: 'trip-123' }));

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Try to reorder with wrong number of stages
      const invalidOrder = [mockStage1]; // Missing stage2

      let reorderResult = false;
      await act(async () => {
        reorderResult = await result.current.reorderStages(invalidOrder);
      });

      expect(reorderResult).toBe(false);
      expect(result.current.error).toContain('numero di tappe non corrispondente');
    });
  });
});