// src/tests/unit/components/TripFormContainer.test.tsx
import { render, screen, fireEvent, waitFor } from '../../setup/test-utils';
import TripFormContainer from '@/components/TripFormContainer';
import { RecommendedSeason } from '@/types/trip';

// Mock dei moduli
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('TripFormContainer Component', () => {
  const mockFormData = {
    title: 'Test Trip',
    summary: 'Test summary with required minimum length for validation',
    destination: 'Test Destination',
    duration_days: 2,
    duration_nights: 1,
    tags: [],
    theme: 'Test Theme',
    characteristics: [],
    recommended_seasons: [RecommendedSeason.Estate],
    insights: '',
    media: [],
    gpxFile: null,
  };

  const mockProps = {
    initialData: mockFormData,
    mediaItems: [],
    gpxFile: null,
    tagInput: '',
    fieldErrors: null,
    isLoading: false,
    handleChange: jest.fn(),
    handleTagInputChange: jest.fn(),
    addTag: jest.fn(),
    removeTag: jest.fn(),
    handleCharacteristicChange: jest.fn(),
    handleSeasonChange: jest.fn(),
    addMedia: jest.fn(),
    removeMedia: jest.fn(),
    updateMediaCaption: jest.fn(),
    setGpxFile: jest.fn(),
    removeGpxFile: jest.fn(),
    onSubmit: jest.fn(),
    mode: 'create' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  describe('Form Submission', () => {
    it('shouldSubmitFormSuccessfully', async () => {
      const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
      
      render(
        <TripFormContainer
          {...mockProps}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByRole('button', { name: /crea viaggio/i });
      
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('shouldPreventDoubleSubmission', async () => {
      const mockOnSubmit = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(
        <TripFormContainer
          {...mockProps}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByRole('button', { name: /crea viaggio/i });
      
      // Clicca rapidamente due volte
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });
    });

    it('shouldShowLoadingStateWhenSubmitting', async () => {
      const mockOnSubmit = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(
        <TripFormContainer
          {...mockProps}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByRole('button', { name: /crea viaggio/i });
      
      fireEvent.click(submitButton);

      // Verifica che il loading overlay sia visibile
      await waitFor(() => {
        expect(screen.getByText('Creazione viaggio in corso...')).toBeInTheDocument();
      });
      
      // Verifica che il bottone mostri lo stato di loading
      expect(screen.getByText('Creazione...')).toBeInTheDocument();
    });
  });

  describe('Loading Overlay Styling', () => {
    it('shouldDisplayLoadingOverlayWithCorrectStyles', () => {
      render(
        <TripFormContainer
          {...mockProps}
          isLoading={true}
        />
      );

      // Find the outer loading overlay div - it's the parent of the white container
      const textElement = screen.getByText('Creazione viaggio in corso...');
      const loadingOverlay = textElement.closest('.fixed');
      
      expect(loadingOverlay).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-25');
      expect(loadingOverlay).toHaveClass('flex', 'items-center', 'justify-center', 'z-50');
    });

    it('shouldDisplayCorrectLoadingMessageForEditMode', () => {
      render(
        <TripFormContainer
          {...mockProps}
          mode="edit"
          isLoading={true}
        />
      );

      expect(screen.getByText('Salvataggio modifiche...')).toBeInTheDocument();
    });
  });

  describe('Form Button States', () => {
    it('shouldDisableButtonsWhenLoading', () => {
      render(
        <TripFormContainer
          {...mockProps}
          isLoading={true}
        />
      );

      const submitButton = screen.getByRole('button', { name: /creazione\.\.\./i });
      const cancelButton = screen.getByRole('button', { name: /annulla/i });

      expect(submitButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('shouldShowCorrectButtonTextForCreateMode', () => {
      render(
        <TripFormContainer
          {...mockProps}
          mode="create"
        />
      );

      expect(screen.getByRole('button', { name: /crea viaggio/i })).toBeInTheDocument();
    });

    it('shouldShowCorrectButtonTextForEditMode', () => {
      render(
        <TripFormContainer
          {...mockProps}
          mode="edit"
          submitButtonText="Salva Modifiche"
        />
      );

      expect(screen.getByRole('button', { name: /salva modifiche/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('shouldHandleSubmissionErrors', async () => {
      const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'));
      
      // Spy su console.error per verificare il logging
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <TripFormContainer
          {...mockProps}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByRole('button', { name: /crea viaggio/i });
      
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error creating trip:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Form Header and Description', () => {
    it('shouldDisplayCorrectHeaderForCreateMode', () => {
      render(
        <TripFormContainer
          {...mockProps}
          mode="create"
        />
      );

      expect(screen.getByText('Crea Nuovo Viaggio')).toBeInTheDocument();
      expect(screen.getByText('Condividi la tua esperienza di viaggio con la community')).toBeInTheDocument();
    });

    it('shouldDisplayCorrectHeaderForEditMode', () => {
      render(
        <TripFormContainer
          {...mockProps}
          mode="edit"
          title="Modifica Viaggio"
        />
      );

      expect(screen.getByText('Modifica Viaggio')).toBeInTheDocument();
      expect(screen.getByText('Modifica i dettagli del tuo viaggio')).toBeInTheDocument();
    });
  });

  describe('Form Layout and Styling', () => {
    it('shouldHaveCorrectFormStructure', () => {
      render(
        <TripFormContainer
          {...mockProps}
        />
      );

      // Verifica la presenza degli elementi principali del layout
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      
      // Verifica le classi CSS per il layout
      const mainContainer = form?.closest('.min-h-screen');
      expect(mainContainer).toHaveClass('bg-gray-50', 'py-8');
    });

    it('shouldHaveResponsiveLayout', () => {
      render(
        <TripFormContainer
          {...mockProps}
        />
      );

      const form = document.querySelector('form');
      const contentContainer = form?.closest('.mx-auto');
      expect(contentContainer).toHaveClass('max-w-4xl', 'px-4', 'sm:px-6', 'lg:px-8');
    });
  });

  describe('Integration with TripFormFields', () => {
    it('shouldPassCorrectPropsToTripFormFields', () => {
      render(
        <TripFormContainer
          {...mockProps}
        />
      );

      // Verifica che i campi del form siano presenti
      expect(screen.getByLabelText('Titolo')).toBeInTheDocument();
      expect(screen.getByLabelText('Sommario')).toBeInTheDocument();
      expect(screen.getByLabelText('Destinazione/Area Geografica')).toBeInTheDocument();
      
      // Verifica che le nuove caratteristiche siano presenti
      expect(screen.getByLabelText('Presenza pedaggi')).toBeInTheDocument();
      expect(screen.getByLabelText('Interesse gastronomico')).toBeInTheDocument();
      expect(screen.getByLabelText('Interesse storico-culturale')).toBeInTheDocument();
    });

    it('shouldHandleCancelButtonClick', () => {
      render(
        <TripFormContainer
          {...mockProps}
          mode="create"
        />
      );

      const cancelButton = screen.getByRole('button', { name: /annulla/i });
      fireEvent.click(cancelButton);

      // Verifica che il router.push sia chiamato con /dashboard per create mode
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('shouldHandleCancelButtonClickInEditMode', () => {
      render(
        <TripFormContainer
          {...mockProps}
          mode="edit"
          tripId="test-id"
        />
      );

      const cancelButton = screen.getByRole('button', { name: /annulla/i });
      fireEvent.click(cancelButton);

      // Verifica che il router.push sia chiamato con il trip ID per edit mode
      expect(mockPush).toHaveBeenCalledWith('/trips/test-id');
    });
  });
});
