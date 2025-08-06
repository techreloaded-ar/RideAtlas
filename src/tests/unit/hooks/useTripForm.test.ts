// src/tests/unit/hooks/useTripForm.test.ts
import { renderHook, act } from '@testing-library/react';
import { useTripForm } from '@/hooks/useTripForm';
import { RecommendedSeason } from '@/types/trip';

// Mock delle dipendenze
global.fetch = jest.fn();

describe('useTripForm Hook - Optional Fields', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'trip-123', slug: 'test-trip' }),
    });
  });

  describe('Form Submission with Optional Fields', () => {
    it('shouldSubmitSuccessfullyWithEmptyDescription', async () => {
      const mockOnSuccess = jest.fn();
      
      const { result } = renderHook(() =>
        useTripForm({
          mode: 'create',
          onSuccess: mockOnSuccess,
        })
      );

      // Popola il form con dati minimi
      act(() => {
        result.current.handleChange({
          target: { name: 'title', value: 'Test Trip' },
        } as any);
        result.current.handleChange({
          target: { name: 'summary', value: 'A test trip summary with minimum required length' },
        } as any);
        result.current.handleChange({
          target: { name: 'destination', value: 'Test Destination' },
        } as any);
        // result.current.handleChange({
        //   target: { name: 'duration_days', value: '2' },
        // } as any);
        // result.current.handleChange({
        //   target: { name: 'duration_nights', value: '1' },
        // } as any);
        result.current.handleChange({
          target: { name: 'theme', value: 'Test Theme' },
        } as any);
        result.current.handleChange({
          target: { name: 'insights', value: '' }, // Descrizione vuota
        } as any);
      });

      act(() => {
        result.current.handleSeasonChange(RecommendedSeason.Estate, true);
      });

      // Aggiungi una tappa mock per superare la validazione
      act(() => {
        result.current.handleStagesChange([{
          id: 'stage-1',
          orderIndex: 0,
          title: 'Tappa Mock',
          description: 'Tappa di test',
          media: [],
          gpxFile: null,
          routeType: 'strada'
        }]);
      });

      // Verifica che il form accetti la submission con descrizione vuota
      await act(async () => {
        const success = await result.current.submitForm();
        expect(success).toBe(true);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"insights":""'),
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it('shouldSubmitSuccessfullyWithEmptyTags', async () => {
      const mockOnSuccess = jest.fn();
      
      const { result } = renderHook(() =>
        useTripForm({
          mode: 'create',
          onSuccess: mockOnSuccess,
        })
      );

      // Popola il form senza aggiungere tag
      act(() => {
        result.current.handleChange({
          target: { name: 'title', value: 'Trip Without Tags' },
        } as any);
        result.current.handleChange({
          target: { name: 'summary', value: 'A trip summary without any tags assigned to it' },
        } as any);
        result.current.handleChange({
          target: { name: 'destination', value: 'Tagless Destination' },
        } as any);
        result.current.handleChange({
          target: { name: 'duration_days', value: '1' },
        } as any);
        result.current.handleChange({
          target: { name: 'duration_nights', value: '1' },
        } as any);
        result.current.handleChange({
          target: { name: 'theme', value: 'No Tags Theme' },
        } as any);
      });

      act(() => {
        result.current.handleSeasonChange(RecommendedSeason.Primavera, true);
      });

      // Aggiungi una tappa mock per superare la validazione
      act(() => {
        result.current.handleStagesChange([{
          id: 'stage-1',
          orderIndex: 0,
          title: 'Tappa Mock',
          description: 'Tappa di test',
          media: [],
          gpxFile: null,
          routeType: 'strada'
        }]);
      });

      // Verifica che il form accetti la submission senza tag
      await act(async () => {
        const success = await result.current.submitForm();
        expect(success).toBe(true);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"tags":[]'),
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it('shouldSubmitSuccessfullyWithBothEmptyDescriptionAndTags', async () => {
      const mockOnSuccess = jest.fn();
      
      const { result } = renderHook(() =>
        useTripForm({
          mode: 'create',
          onSuccess: mockOnSuccess,
        })
      );

      // Form con solo campi obbligatori
      act(() => {
        result.current.handleChange({
          target: { name: 'title', value: 'Minimal Trip' },
        } as any);
        result.current.handleChange({
          target: { name: 'summary', value: 'A minimal trip with only required fields filled' },
        } as any);
        result.current.handleChange({
          target: { name: 'destination', value: 'Minimal Destination' },
        } as any);
        result.current.handleChange({
          target: { name: 'duration_days', value: '1' },
        } as any);
        result.current.handleChange({
          target: { name: 'duration_nights', value: '1' },
        } as any);
        result.current.handleChange({
          target: { name: 'theme', value: 'Minimal' },
        } as any);
        result.current.handleChange({
          target: { name: 'insights', value: '' },
        } as any);
      });

      act(() => {
        result.current.handleSeasonChange(RecommendedSeason.Estate, true);
      });

      // Aggiungi una tappa mock per superare la validazione
      act(() => {
        result.current.handleStagesChange([{
          id: 'stage-1',
          orderIndex: 0,
          title: 'Tappa Mock',
          description: 'Tappa di test',
          media: [],
          gpxFile: null,
          routeType: 'strada'
        }]);
      });

      await act(async () => {
        const success = await result.current.submitForm();
        expect(success).toBe(true);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringMatching(/"tags":\[\].*"insights":""/),
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  describe('Form State Management', () => {
    it('shouldInitializeWithEmptyOptionalFields', () => {
      const { result } = renderHook(() =>
        useTripForm({
          mode: 'create',
        })
      );

      expect(result.current.formData.tags).toEqual([]);
      expect(result.current.formData.insights).toBe('');
    });

    it('shouldHandleNullInsightsGracefully', () => {
      const initialData = {
        title: 'Test Trip',
        summary: 'Test summary',
        destination: 'Test destination',
        duration_days: 1,
        duration_nights: 1,
        tags: [],
        theme: 'Test',
        characteristics: [],
        recommended_seasons: [RecommendedSeason.Estate],
        insights: null, // Null insights
        media: [],
      };

      const { result } = renderHook(() =>
        useTripForm({
          mode: 'edit',
          initialData,
        })
      );

      // Il hook dovrebbe gestire null insights convertendolo in stringa vuota
      expect(result.current.formData.insights).toBe('');
    });
  });

  describe('Tag Management', () => {
    it('shouldAllowEmptyTagsList', () => {
      const { result } = renderHook(() =>
        useTripForm({
          mode: 'create',
        })
      );

      // Verifica che la lista tag sia inizialmente vuota
      expect(result.current.formData.tags).toEqual([]);
      
      // Verifica che non ci siano errori quando si cerca di rimuovere da lista vuota
      act(() => {
        result.current.removeTag('nonexistent');
      });

      expect(result.current.formData.tags).toEqual([]);
    });

    it('shouldAddAndRemoveTagsCorrectly', () => {
      const { result } = renderHook(() =>
        useTripForm({
          mode: 'create',
        })
      );

      // Aggiungi un tag
      act(() => {
        result.current.handleTagInputChange({
          target: { value: 'adventure' },
        } as any);
      });

      act(() => {
        result.current.addTag();
      });

      expect(result.current.formData.tags).toContain('adventure');

      // Rimuovi il tag
      act(() => {
        result.current.removeTag('adventure');
      });

      expect(result.current.formData.tags).toEqual([]);
    });
  });
});
