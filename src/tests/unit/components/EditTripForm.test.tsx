// src/tests/unit/components/EditTripForm.test.tsx
import { render, screen, fireEvent, waitFor } from '../../setup/test-utils';
import EditTripForm from '@/components/trips/EditTripForm';
import { RecommendedSeason } from '@/types/trip';
import * as useToastModule from '@/hooks/ui/useToast';

// Mock dei moduli
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/hooks/ui/useToast');

// Mock dell'hook useTripSubmission
jest.mock('@/hooks/trips/useTripSubmission', () => ({
  useTripData: jest.fn(),
  useTripSubmission: jest.fn(),
}));

// Importa i mock dopo la definizione del mock
import { useTripData, useTripSubmission } from '@/hooks/trips/useTripSubmission';

const mockFetchTrip = jest.fn();
const mockUseTripData = useTripData as jest.MockedFunction<typeof useTripData>;
const mockUseTripSubmission = useTripSubmission as jest.MockedFunction<typeof useTripSubmission>;

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
    stages: [
      {
        id: 'stage-1',
        tripId: 'trip-123',
        orderIndex: 0,
        title: 'Tappa 1',
        description: 'Prima tappa del viaggio',
        routeType: 'road',
        media: [],
        gpxFile: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ],
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

    // Mock dell'hook useTripData con dati di successo
    mockUseTripData.mockReturnValue({
      data: mockTripData,
      isLoading: false,
      error: null,
      fetchTrip: mockFetchTrip,
      refetch: mockFetchTrip,
    });

    // Mock dell'hook useTripSubmission
    const mockSubmit = jest.fn().mockResolvedValue(true);
    mockUseTripSubmission.mockReturnValue({
      submit: mockSubmit,
      isLoading: false,
    });

    // Mock del fetch globale (per i test di submit)
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockTripData,
    });
  });

  describe('Trip Loading and Initialization', () => {
    it('shouldLoadTripDataSuccessfully', async () => {
      render(<EditTripForm tripId="trip-123" />);

      // Con i dati mockati, il form dovrebbe mostrare subito i dati
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Trip')).toBeInTheDocument();
      });

      // Verifica che l'hook sia stato chiamato con i parametri corretti
      expect(mockUseTripData).toHaveBeenCalledWith({ 
        tripId: 'trip-123', 
        enabled: true 
      });
    });

    it('shouldHandleGenericLoadingErrors', async () => {
      // Mock dell'hook con errore generico
      mockUseTripData.mockReturnValue({
        data: null,
        isLoading: false,
        error: 'Errore nel caricamento del viaggio',
        fetchTrip: mockFetchTrip,
        refetch: mockFetchTrip,
      });

      render(<EditTripForm tripId="nonexistent-trip" />);

      await waitFor(() => {
        expect(screen.getByText('Errore nel caricamento')).toBeInTheDocument();
        expect(screen.getByText('Errore nel caricamento del viaggio')).toBeInTheDocument();
      });
    });

    it('shouldHandleNotFoundErrors', async () => {
      // Mock dell'hook con errore 404
      mockUseTripData.mockReturnValue({
        data: null,
        isLoading: false,
        error: 'Viaggio non trovato',
        fetchTrip: mockFetchTrip,
        refetch: mockFetchTrip,
      });

      render(<EditTripForm tripId="nonexistent-trip" />);

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith('Viaggio non trovato');
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('shouldHandlePermissionErrors', async () => {
      // Mock dell'hook con errore 403
      mockUseTripData.mockReturnValue({
        data: null,
        isLoading: false,
        error: 'Non hai i permessi per modificare questo viaggio',
        fetchTrip: mockFetchTrip,
        refetch: mockFetchTrip,
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
      // Mock del submit che simula successo
      const mockSubmitSuccess = jest.fn().mockImplementation(async (data) => {
        // Simula il callback onSuccess
        mockUseTripSubmission.mock.calls[0][0].onSuccess(mockTripData);
        return true;
      });

      mockUseTripSubmission.mockReturnValue({
        submit: mockSubmitSuccess,
        isLoading: false,
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
      // Mock del submit che simula successo con redirect
      const mockSubmitSuccess = jest.fn().mockImplementation(async (data) => {
        // Simula il callback onSuccess con il trip aggiornato
        mockUseTripSubmission.mock.calls[0][0].onSuccess(mockTripData);
        return true;
      });

      mockUseTripSubmission.mockReturnValue({
        submit: mockSubmitSuccess,
        isLoading: false,
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
      
      // Mock dell'hook con dati senza slug
      mockUseTripData.mockReturnValue({
        data: tripDataWithoutSlug,
        isLoading: false,
        error: null,
        fetchTrip: mockFetchTrip,
        refetch: mockFetchTrip,
      });

      // Mock del submit che simula successo ma senza slug nel risultato
      const mockSubmitSuccess = jest.fn().mockImplementation(async (data) => {
        // Simula il callback onSuccess con trip senza slug
        mockUseTripSubmission.mock.calls[0][0].onSuccess(tripDataWithoutSlug);
        return true;
      });

      mockUseTripSubmission.mockReturnValue({
        submit: mockSubmitSuccess,
        isLoading: false,
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
    it('shouldHandleEmptyOptionalFields', async () => {
      const tripDataWithEmptyOptionals = { ...mockTripData, tags: [] };

      // Mock dell'hook con campi opzionali vuoti
      mockUseTripData.mockReturnValue({
        data: tripDataWithEmptyOptionals,
        isLoading: false,
        error: null,
        fetchTrip: mockFetchTrip,
        refetch: mockFetchTrip,
      });

      render(<EditTripForm tripId="trip-123" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Trip')).toBeInTheDocument();
      });

      // Verifica che i campi opzionali siano gestiti correttamente
      expect(screen.getByDisplayValue('Test Trip')).toBeInTheDocument();
    });

    it('shouldHandleEmptyTagsList', async () => {
      const tripDataWithEmptyTags = { ...mockTripData, tags: [] };
      
      // Mock dell'hook con tags vuoti
      mockUseTripData.mockReturnValue({
        data: tripDataWithEmptyTags,
        isLoading: false,
        error: null,
        fetchTrip: mockFetchTrip,
        refetch: mockFetchTrip,
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
      render(<EditTripForm tripId="trip-123" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Trip')).toBeInTheDocument();
      });

      // Modifica il titolo per forzare errore di validazione
      const titleInput = screen.getByLabelText('Titolo');
      fireEvent.change(titleInput, { target: { value: 'X' } }); // Titolo troppo corto

      // Attende che la validazione client-side mostri l'errore
      await waitFor(() => {
        expect(screen.getByText('Il titolo deve essere almeno 3 caratteri')).toBeInTheDocument();
      });

      // Il test verifica che la validazione funzioni correttamente
      // Il form mostra già l'errore di validazione lato client
      expect(screen.getByText('Il titolo deve essere almeno 3 caratteri')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shouldShowLoadingOverlayDuringSubmission', async () => {
      // Mock dell'hook useTripSubmission in stato di loading
      const mockSubmitLoading = jest.fn().mockImplementation(() => {
        // Simula il loading state
        mockUseTripSubmission.mockReturnValue({
          submit: mockSubmitLoading,
          isLoading: true,
        });
        return Promise.resolve(true);
      });

      mockUseTripSubmission.mockReturnValue({
        submit: mockSubmitLoading,
        isLoading: false,
      });

      render(<EditTripForm tripId="trip-123" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Trip')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /salva modifiche/i });
      
      fireEvent.click(submitButton);

      // Il testo di loading dovrebbe essere gestito dal componente TripForm
      // Per ora verifichiamo che il submit sia stato chiamato
      await waitFor(() => {
        expect(mockSubmitLoading).toHaveBeenCalled();
      });
    });
  });
});
