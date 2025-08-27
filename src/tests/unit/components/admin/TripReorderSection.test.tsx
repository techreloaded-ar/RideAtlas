import { render, screen, fireEvent, waitFor } from '@/tests/setup/test-utils';
import { TripReorderSection } from '@/components/admin/TripReorderSection';
import { Trip } from '@/types/trip';
import * as useTripReorderModule from '@/hooks/admin/useTripReorder';
import * as useToastModule from '@/hooks/ui/useToast';

// Mock dei moduli
jest.mock('@/hooks/admin/useTripReorder');
jest.mock('@/hooks/ui/useToast');

// Mock di dnd-kit - versione semplificata
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>,
  closestCenter: jest.fn(),
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
}));

jest.mock('@dnd-kit/sortable', () => ({
  arrayMove: jest.fn(),
  SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
  sortableKeyboardCoordinates: jest.fn(),
  verticalListSortingStrategy: jest.fn(),
}));

jest.mock('@/components/admin/SortableTripItem', () => ({
  SortableTripItem: ({ trip, index }: any) => (
    <div data-testid={`sortable-trip-${trip.id}`} data-index={index}>
      {trip.title}
    </div>
  ),
}));

describe('TripReorderSection Component', () => {
  const mockUseTripReorder = useTripReorderModule.useTripReorder as jest.MockedFunction<typeof useTripReorderModule.useTripReorder>;
  const mockUseToast = useToastModule.useToast as jest.MockedFunction<typeof useToastModule.useToast>;
  
  const mockShowSuccess = jest.fn();
  const mockShowError = jest.fn();
  const mockOnReorderComplete = jest.fn();
  
  const mockTrips: Trip[] = [
    {
      id: 'trip-1',
      title: 'Viaggio Alpi',
      slug: 'viaggio-alpi',
      destination: 'Alpi',
      status: 'Pubblicato',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
    } as Trip,
    {
      id: 'trip-2',
      title: 'Tour Toscana',
      slug: 'tour-toscana',
      destination: 'Toscana', 
      status: 'Pubblicato',
      created_at: new Date('2024-01-02'),
      updated_at: new Date('2024-01-02'),
    } as Trip,
    {
      id: 'trip-3',
      title: 'Giro Sicilia',
      slug: 'giro-sicilia',
      destination: 'Sicilia',
      status: 'Pubblicato', 
      created_at: new Date('2024-01-03'),
      updated_at: new Date('2024-01-03'),
    } as Trip,
  ];

  const defaultHookReturn = {
    reorderedTrips: mockTrips,
    hasChanges: false,
    isLoading: false,
    error: null,
    handleReorder: jest.fn(),
    saveOrder: jest.fn(),
    resetOrder: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseToast.mockReturnValue({
      showSuccess: mockShowSuccess,
      showError: mockShowError,
      showInfo: jest.fn(),
      showWarning: jest.fn(),
    });

    mockUseTripReorder.mockReturnValue(defaultHookReturn);
  });

  describe('Rendering', () => {
    it('should render trips list correctly', () => {
      render(
        <TripReorderSection 
          trips={mockTrips} 
          onReorderComplete={mockOnReorderComplete} 
        />
      );

      expect(screen.getByText('Riordina Viaggi')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-trip-trip-1')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-trip-trip-2')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-trip-trip-3')).toBeInTheDocument();
      expect(screen.getByText('3 viaggi in totale')).toBeInTheDocument();
    });

    it('should render empty state when no trips provided', () => {
      render(
        <TripReorderSection 
          trips={[]} 
          onReorderComplete={mockOnReorderComplete} 
        />
      );

      expect(screen.getByText('Nessun viaggio disponibile')).toBeInTheDocument();
      expect(screen.getByText('Non ci sono viaggi da riordinare al momento')).toBeInTheDocument();
      expect(screen.queryByText('Riordina Viaggi')).not.toBeInTheDocument();
    });

    it('should show changes indicator when hasChanges is true', () => {
      mockUseTripReorder.mockReturnValue({
        ...defaultHookReturn,
        hasChanges: true,
      });

      render(
        <TripReorderSection 
          trips={mockTrips} 
          onReorderComplete={mockOnReorderComplete} 
        />
      );

      expect(screen.getByText('Modifiche non salvate')).toBeInTheDocument();
      expect(screen.queryByText('Ordinamento salvato')).not.toBeInTheDocument();
    });

    it('should show saved indicator when no changes', () => {
      render(
        <TripReorderSection 
          trips={mockTrips} 
          onReorderComplete={mockOnReorderComplete} 
        />
      );

      expect(screen.getByText('Ordinamento salvato')).toBeInTheDocument();
      expect(screen.queryByText('Modifiche non salvate')).not.toBeInTheDocument();
    });

    it('should show error message when error exists', () => {
      const errorMessage = 'Errore di connessione';
      mockUseTripReorder.mockReturnValue({
        ...defaultHookReturn,
        error: errorMessage,
      });

      render(
        <TripReorderSection 
          trips={mockTrips} 
          onReorderComplete={mockOnReorderComplete} 
        />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Save functionality', () => {
    it('should call saveOrder and show success message on successful save', async () => {
      const mockSaveOrder = jest.fn().mockResolvedValue(undefined);
      mockUseTripReorder.mockReturnValue({
        ...defaultHookReturn,
        hasChanges: true,
        saveOrder: mockSaveOrder,
      });

      render(
        <TripReorderSection 
          trips={mockTrips} 
          onReorderComplete={mockOnReorderComplete} 
        />
      );

      const saveButton = screen.getByRole('button', { name: /salva ordinamento/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSaveOrder).toHaveBeenCalledTimes(1);
        expect(mockShowSuccess).toHaveBeenCalledWith('Ordinamento viaggi salvato con successo!');
        expect(mockOnReorderComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('should not allow save when button is disabled due to no changes', () => {
      render(
        <TripReorderSection 
          trips={mockTrips} 
          onReorderComplete={mockOnReorderComplete} 
        />
      );

      const saveButton = screen.getByRole('button', { name: /salva ordinamento/i });
      expect(saveButton).toBeDisabled();
      
      // Button disabled = no callback execution
      fireEvent.click(saveButton);
      expect(mockOnReorderComplete).not.toHaveBeenCalled();
    });

    it('should handle save error correctly', async () => {
      const errorMessage = 'Errore durante il salvataggio';
      const mockSaveOrder = jest.fn().mockRejectedValue(new Error(errorMessage));
      mockUseTripReorder.mockReturnValue({
        ...defaultHookReturn,
        hasChanges: true,
        saveOrder: mockSaveOrder,
      });

      render(
        <TripReorderSection 
          trips={mockTrips} 
          onReorderComplete={mockOnReorderComplete} 
        />
      );

      const saveButton = screen.getByRole('button', { name: /salva ordinamento/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith(`Errore nel salvataggio: ${errorMessage}`);
        expect(mockOnReorderComplete).not.toHaveBeenCalled();
      });
    });

    it('should show loading state during save', async () => {
      const mockSaveOrder = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      mockUseTripReorder.mockReturnValue({
        ...defaultHookReturn,
        hasChanges: true,
        isLoading: true,
        saveOrder: mockSaveOrder,
      });

      render(
        <TripReorderSection 
          trips={mockTrips} 
          onReorderComplete={mockOnReorderComplete} 
        />
      );

      expect(screen.getByText('Salvando...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /salvando/i })).toBeDisabled();
    });
  });

  describe('Reset functionality', () => {
    it('should call resetOrder and show success message', () => {
      const mockResetOrder = jest.fn();
      mockUseTripReorder.mockReturnValue({
        ...defaultHookReturn,
        hasChanges: true,
        resetOrder: mockResetOrder,
      });

      render(
        <TripReorderSection 
          trips={mockTrips} 
          onReorderComplete={mockOnReorderComplete} 
        />
      );

      const resetButton = screen.getByRole('button', { name: /ripristina/i });
      fireEvent.click(resetButton);

      expect(mockResetOrder).toHaveBeenCalledTimes(1);
      expect(mockShowSuccess).toHaveBeenCalledWith('Ordinamento ripristinato all\'ordine originale');
    });

    it('should not allow reset when button is disabled due to no changes', () => {
      render(
        <TripReorderSection 
          trips={mockTrips} 
          onReorderComplete={mockOnReorderComplete} 
        />
      );

      const resetButton = screen.getByRole('button', { name: /ripristina/i });
      expect(resetButton).toBeDisabled();
      
      // Button disabled = no callback execution  
      fireEvent.click(resetButton);
      // Since button is disabled, no mock functions should be called
      expect(mockShowSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Button states', () => {
    it('should disable buttons when no changes', () => {
      render(
        <TripReorderSection 
          trips={mockTrips} 
          onReorderComplete={mockOnReorderComplete} 
        />
      );

      const saveButton = screen.getByRole('button', { name: /salva ordinamento/i });
      const resetButton = screen.getByRole('button', { name: /ripristina/i });

      expect(saveButton).toBeDisabled();
      expect(resetButton).toBeDisabled();
    });

    it('should enable buttons when changes exist', () => {
      mockUseTripReorder.mockReturnValue({
        ...defaultHookReturn,
        hasChanges: true,
      });

      render(
        <TripReorderSection 
          trips={mockTrips} 
          onReorderComplete={mockOnReorderComplete} 
        />
      );

      const saveButton = screen.getByRole('button', { name: /salva ordinamento/i });
      const resetButton = screen.getByRole('button', { name: /ripristina/i });

      expect(saveButton).toBeEnabled();
      expect(resetButton).toBeEnabled();
    });

    it('should disable buttons during loading', () => {
      mockUseTripReorder.mockReturnValue({
        ...defaultHookReturn,
        hasChanges: true,
        isLoading: true,
      });

      render(
        <TripReorderSection 
          trips={mockTrips} 
          onReorderComplete={mockOnReorderComplete} 
        />
      );

      const saveButton = screen.getByRole('button', { name: /salvando/i });
      const resetButton = screen.getByRole('button', { name: /ripristina/i });

      expect(saveButton).toBeDisabled();
      expect(resetButton).toBeDisabled();
    });
  });

  describe('Rendering Integration', () => {
    it('should render SortableTripItem components with correct data', () => {
      render(
        <TripReorderSection 
          trips={mockTrips} 
          onReorderComplete={mockOnReorderComplete} 
        />
      );

      expect(screen.getByTestId('sortable-trip-trip-1')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-trip-trip-2')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-trip-trip-3')).toBeInTheDocument();
      
      expect(screen.getByText('Viaggio Alpi')).toBeInTheDocument();
      expect(screen.getByText('Tour Toscana')).toBeInTheDocument();
      expect(screen.getByText('Giro Sicilia')).toBeInTheDocument();
    });
  });

  describe('Trip count display', () => {
    it('should show singular form for single trip', () => {
      const mockSingleTrip = [mockTrips[0]];
      mockUseTripReorder.mockReturnValue({
        ...defaultHookReturn,
        reorderedTrips: mockSingleTrip,
      });

      render(
        <TripReorderSection 
          trips={mockSingleTrip} 
          onReorderComplete={mockOnReorderComplete} 
        />
      );

      expect(screen.getByText('1 viaggio in totale')).toBeInTheDocument();
    });

    it('should show plural form for multiple trips', () => {
      render(
        <TripReorderSection 
          trips={mockTrips} 
          onReorderComplete={mockOnReorderComplete} 
        />
      );

      expect(screen.getByText('3 viaggi in totale')).toBeInTheDocument();
    });
  });

  describe('Instructions', () => {
    it('should display usage instructions', () => {
      render(
        <TripReorderSection 
          trips={mockTrips} 
          onReorderComplete={mockOnReorderComplete} 
        />
      );

      expect(screen.getByText(/trascina i viaggi per riordinarli/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <TripReorderSection 
          trips={mockTrips} 
          onReorderComplete={mockOnReorderComplete} 
        />
      );

      const saveButton = screen.getByRole('button', { name: /salva ordinamento/i });
      const resetButton = screen.getByRole('button', { name: /ripristina/i });

      expect(saveButton).toBeInTheDocument();
      expect(resetButton).toBeInTheDocument();
    });

    it('should render DndContext with accessibility announcements', () => {
      render(
        <TripReorderSection 
          trips={mockTrips} 
          onReorderComplete={mockOnReorderComplete} 
        />
      );

      expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
    });
  });
});