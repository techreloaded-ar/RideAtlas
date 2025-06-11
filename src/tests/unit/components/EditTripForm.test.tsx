// src/tests/unit/components/EditTripForm.test.tsx
import { render, screen, fireEvent, waitFor } from '../../setup/test-utils';
import EditTripForm from '@/components/EditTripForm';
import { RecommendedSeason } from '@/types/trip';
import * as useToastModule from '@/hooks/useToast';

// Mock dei moduli
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/hooks/useToast');

// Mock del fetch globale
global.fetch = jest.fn();

describe('EditTripForm Component - Toast Integration and Slug Redirect', () => {
  const mockShowSuccess = jest.fn();
  const mockShowError = jest.fn();

  const mockTripData = {
    id: 'trip-123',
    slug: 'test-trip-slug',
    title: 'Test Trip',
    summary: 'Test summary with required minimum length for validation',
    destination: 'Test Destination',
    duration_days: 2,
    duration_nights: 1,
    tags: ['adventure'],
    theme: 'Test Theme',
    characteristics: ['Presenza pedaggi', 'Interesse gastronomico'],
    recommended_seasons: [RecommendedSeason.Estate],
    insights: 'Test insights content',
    media: [],
    gpxFile: null,
    user_id: 'user-123',
    status: 'Bozza',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock del hook useToast
    (useToastModule.useToast as jest.Mock).mockReturnValue({
      showSuccess: mockShowSuccess,
      showError: mockShowError,
      showWarning: jest.fn(),
      showInfo: jest.fn(),
    });

    // Mock del router
    jest.mocked(mockPush).mockClear();

    // Mock del fetch per il caricamento del trip
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockTripData,
    });
  });

  describe('Trip Loading and Initialization', () => {
    it('shouldLoadTripDataSuccessfully', async () => {
      render(<EditTripForm tripId="trip-123" />);

      expect(screen.getByText('Caricamento viaggio...')).toBeInTheDocument();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/trips/trip-123');
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Trip')).toBeInTheDocument();
      });
    });

    it('shouldHandleGenericLoadingErrors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(<EditTripForm tripId="nonexistent-trip" />);

      await waitFor(() => {
        expect(screen.getByText('Errore nel caricamento')).toBeInTheDocument();
        expect(screen.getByText('Errore nel caricamento del viaggio')).toBeInTheDocument();
      });
    });

    it('shouldHandleNotFoundErrors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      render(<EditTripForm tripId="nonexistent-trip" />);

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('Viaggio non trovato');
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('shouldHandlePermissionErrors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
      });

      render(<EditTripForm tripId="unauthorized-trip" />);

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('Non hai i permessi per modificare questo viaggio');
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Form Initialization with Updated Characteristics', () => {
    it('shouldInitializeFormWithExistingCharacteristics', async () => {
      render(<EditTripForm tripId="trip-123" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Trip')).toBeInTheDocument();
      });

      // Verifica che le caratteristiche esistenti siano selezionate
      const presenzaPedaggiCheckbox = screen.getByLabelText('Presenza pedaggi') as HTMLInputElement;
      const interesseGastronomicoCheckbox = screen.getByLabelText('Interesse gastronomico') as HTMLInputElement;
      
      expect(presenzaPedaggiCheckbox.checked).toBe(true);
      expect(interesseGastronomicoCheckbox.checked).toBe(true);
    });

    it('shouldDisplayAllNewCharacteristicsOptions', async () => {
      render(<EditTripForm tripId="trip-123" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Trip')).toBeInTheDocument();
      });

      // Verifica che tutte le nuove caratteristiche siano disponibili
      expect(screen.getByLabelText('Visita prolungata')).toBeInTheDocument();
      expect(screen.getByLabelText('Interesse gastronomico')).toBeInTheDocument();
      expect(screen.getByLabelText('Interesse storico-culturale')).toBeInTheDocument();
      
      // Verifica che le caratteristiche positive siano presenti
      expect(screen.getByLabelText('Presenza pedaggi')).toBeInTheDocument();
      expect(screen.getByLabelText('Presenza traghetti')).toBeInTheDocument();
    });
  });

  describe('Form Submission and Toast Notifications', () => {
    it('shouldShowCustomToastOnSuccessfulUpdate', async () => {
      // Mock del fetch per l'aggiornamento
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockTripData,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ ...mockTripData, title: 'Updated Trip' }),
        });

      render(<EditTripForm tripId="trip-123" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Trip')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /salva modifiche/i });
      
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith('Viaggio aggiornato con successo!');
      });
    });

    it('shouldRedirectToTripPageWithSlugAfterUpdate', async () => {
      // Mock del fetch per l'aggiornamento
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockTripData,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockTripData,
        });

      render(<EditTripForm tripId="trip-123" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Trip')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /salva modifiche/i });
      
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/trips/test-trip-slug');
      });
    });

    it('shouldFallbackToDashboardIfSlugNotAvailable', async () => {
      const tripDataWithoutSlug = { ...mockTripData, slug: undefined };
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => tripDataWithoutSlug,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => tripDataWithoutSlug,
        });

      // Spy su console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<EditTripForm tripId="trip-123" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Trip')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /salva modifiche/i });
      
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Slug non trovato per il reindirizzamento');
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Optional Fields Handling', () => {
    it('shouldHandleEmptyInsightsField', async () => {
      const tripDataWithEmptyInsights = { ...mockTripData, insights: '' };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => tripDataWithEmptyInsights,
      });

      render(<EditTripForm tripId="trip-123" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Trip')).toBeInTheDocument();
      });

      const insightsTextarea = screen.getByLabelText('Approfondimenti');
      expect(insightsTextarea).toHaveValue('');
    });

    it('shouldHandleEmptyTagsList', async () => {
      const tripDataWithEmptyTags = { ...mockTripData, tags: [] };
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => tripDataWithEmptyTags,
      });

      render(<EditTripForm tripId="trip-123" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Trip')).toBeInTheDocument();
      });

      // Verifica che non ci siano tag visualizzati
      const tagInput = screen.getByLabelText(/tag/i);
      expect(tagInput).toHaveValue('');
    });
  });

  describe('Error Display and Handling', () => {
    it('shouldDisplayFieldErrors', async () => {
      // Mock del fetch che ritorna errori di validazione
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockTripData,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({
            error: 'Dati non validi',
            details: {
              title: ['Il titolo è troppo corto'],
            },
          }),
        });

      render(<EditTripForm tripId="trip-123" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Trip')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /salva modifiche/i });
      
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Il titolo è troppo corto')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shouldShowLoadingOverlayDuringSubmission', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockTripData,
        })
        .mockImplementationOnce(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({
              ok: true,
              status: 200,
              json: async () => mockTripData,
            }), 100)
          )
        );

      render(<EditTripForm tripId="trip-123" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Trip')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /salva modifiche/i });
      
      fireEvent.click(submitButton);

      expect(screen.getByText('Salvataggio modifiche...')).toBeInTheDocument();
    });
  });
});
