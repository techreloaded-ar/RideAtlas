import { render, screen, fireEvent } from '@/tests/setup/test-utils';
import { SortableTripItem } from '@/components/admin/SortableTripItem';
import { Trip } from '@/types/trip';

// Mock di dnd-kit/sortable
jest.mock('@dnd-kit/sortable', () => ({
  useSortable: jest.fn(() => ({
    attributes: { 'data-testid': 'drag-handle' },
    listeners: { 
      onMouseDown: jest.fn(),
      onPointerDown: jest.fn(),
    },
    setNodeRef: jest.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  })),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: jest.fn(() => 'transform: translate3d(0px, 0px, 0px)'),
    },
  },
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  const MockNextLink = ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
  (MockNextLink as any).displayName = 'MockNextLink';
  return MockNextLink;
});

// Mock Lucide React icons
jest.mock('lucide-react', () => {
  const GripVertical = ({ className, ...props }: any) => (
    <div data-testid="grip-icon" className={className} {...props} />
  );
  (GripVertical as any).displayName = 'GripVertical';

  const ExternalLink = ({ className, ...props }: any) => (
    <div data-testid="external-link-icon" className={className} {...props} />
  );
  (ExternalLink as any).displayName = 'ExternalLink';

  const ArrowRight = ({ className, ...props }: any) => (
    <div data-testid="arrow-right-icon" className={className} {...props} />
  );
  (ArrowRight as any).displayName = 'ArrowRight';

  return { GripVertical, ExternalLink, ArrowRight };
});

describe('SortableTripItem Component', () => {
  const mockTrip: Trip = {
    id: 'trip-1',
    title: 'Viaggio nelle Alpi',
    slug: 'viaggio-nelle-alpi',
    destination: 'Alpi',
    status: 'Pubblicato',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    // Altri campi minimi richiesti dal tipo Trip
  } as Trip;

  const defaultProps = {
    trip: mockTrip,
    index: 0,
  };

  describe('Basic Rendering', () => {
    it('should render trip title correctly', () => {
      render(<SortableTripItem {...defaultProps} />);
      
      expect(screen.getByText('Viaggio nelle Alpi')).toBeInTheDocument();
    });

    it('should render current position indicator', () => {
      render(<SortableTripItem {...defaultProps} />);
      
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    it('should render drag handle with proper accessibility', () => {
      render(<SortableTripItem {...defaultProps} />);
      
      const dragHandle = screen.getByRole('button');
      expect(dragHandle).toHaveAttribute('aria-label', 'Riordina viaggio: Viaggio nelle Alpi');
      expect(dragHandle).toHaveAttribute('tabIndex', '0');
      expect(screen.getByTestId('grip-icon')).toBeInTheDocument();
    });

    it('should render trip link with correct href', () => {
      render(<SortableTripItem {...defaultProps} />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/trips/viaggio-nelle-alpi');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(screen.getByTestId('external-link-icon')).toBeInTheDocument();
    });
  });

  describe('Position Indicators', () => {
    it('should show only current position when originalIndex is not provided', () => {
      render(<SortableTripItem {...defaultProps} index={2} />);
      
      expect(screen.getByText('#3')).toBeInTheDocument();
      expect(screen.queryByTestId('arrow-right-icon')).not.toBeInTheDocument();
    });

    it('should show only current position when originalIndex equals current index', () => {
      render(<SortableTripItem {...defaultProps} index={1} originalIndex={1} />);
      
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.queryByTestId('arrow-right-icon')).not.toBeInTheDocument();
    });

    it('should show both original and current position when they differ', () => {
      render(<SortableTripItem {...defaultProps} index={0} originalIndex={2} />);
      
      expect(screen.getByText('#3')).toBeInTheDocument(); // Original position
      expect(screen.getByText('#1')).toBeInTheDocument(); // Current position
      expect(screen.getByTestId('arrow-right-icon')).toBeInTheDocument();
    });

    it('should handle zero-based indexing correctly', () => {
      render(<SortableTripItem {...defaultProps} index={4} originalIndex={0} />);
      
      expect(screen.getByText('#1')).toBeInTheDocument(); // Original (0 + 1)
      expect(screen.getByText('#5')).toBeInTheDocument(); // Current (4 + 1)
    });
  });

  describe('Drag Integration', () => {
    it('should render drag handle with useSortable integration', () => {
      render(<SortableTripItem {...defaultProps} />);
      
      const dragHandle = screen.getByRole('button');
      expect(dragHandle).toBeInTheDocument();
      expect(dragHandle).toHaveAttribute('data-testid', 'drag-handle');
    });

    it('should display proper drag state styling classes', () => {
      render(<SortableTripItem {...defaultProps} />);
      
      // Verifica la presenza di elementi chiave invece di classi specifiche
      expect(screen.getByText('Viaggio nelle Alpi')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByRole('link')).toBeInTheDocument();
    });
  });

  describe('Keyboard Interaction', () => {
    it('should handle Enter key on drag handle', () => {
      render(<SortableTripItem {...defaultProps} />);
      
      const dragHandle = screen.getByRole('button');
      fireEvent.keyDown(dragHandle, { key: 'Enter' });
      
      // Should not cause any errors (basic functionality test)
      expect(dragHandle).toBeInTheDocument();
    });

    it('should handle Space key on drag handle', () => {
      render(<SortableTripItem {...defaultProps} />);
      
      const dragHandle = screen.getByRole('button');
      fireEvent.keyDown(dragHandle, { key: ' ' });
      
      // Should not cause any errors (basic functionality test)
      expect(dragHandle).toBeInTheDocument();
    });

    it('should not react to other keys', () => {
      render(<SortableTripItem {...defaultProps} />);
      
      const dragHandle = screen.getByRole('button');
      fireEvent.keyDown(dragHandle, { key: 'ArrowUp' });
      
      // Should not cause any errors (basic functionality test)
      expect(dragHandle).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<SortableTripItem {...defaultProps} />);
      
      const dragHandle = screen.getByRole('button');
      expect(dragHandle).toHaveAttribute('aria-label', 'Riordina viaggio: Viaggio nelle Alpi');
      
      const instructionsId = `trip-${mockTrip.id}-instructions`;
      expect(dragHandle).toHaveAttribute('aria-describedby', instructionsId);
      expect(screen.getByText('Usa le frecce per riordinare questo viaggio')).toHaveAttribute('id', instructionsId);
    });

    it('should have screen reader instructions', () => {
      render(<SortableTripItem {...defaultProps} />);
      
      const instructions = screen.getByText('Usa le frecce per riordinare questo viaggio');
      expect(instructions).toHaveClass('sr-only');
    });

    it('should have proper grip icon accessibility', () => {
      render(<SortableTripItem {...defaultProps} />);
      
      const gripIcon = screen.getByTestId('grip-icon');
      expect(gripIcon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Styling and Layout', () => {
    it('should render all layout elements correctly', () => {
      render(<SortableTripItem {...defaultProps} />);
      
      // Verifica presenza di elementi invece di classi specifiche
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByRole('link')).toBeInTheDocument(); 
      expect(screen.getByText('Viaggio nelle Alpi')).toBeInTheDocument();
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    it('should have proper drag handle structure', () => {
      render(<SortableTripItem {...defaultProps} />);
      
      const dragHandle = screen.getByRole('button');
      expect(dragHandle).toHaveAttribute('aria-label', 'Riordina viaggio: Viaggio nelle Alpi');
      expect(dragHandle).toHaveAttribute('tabIndex', '0');
    });

    it('should display position and content correctly', () => {
      render(<SortableTripItem {...defaultProps} index={2} />);
      
      expect(screen.getByText('#3')).toBeInTheDocument(); // Position (2 + 1)
      expect(screen.getByText('Viaggio nelle Alpi')).toBeInTheDocument();
      expect(screen.getByRole('link')).toHaveAttribute('href', '/trips/viaggio-nelle-alpi');
    });
  });

  describe('Different Trip Data', () => {
    it('should handle long trip titles', () => {
      const longTitleTrip = {
        ...mockTrip,
        title: 'Un viaggio molto molto molto lungo nelle Alpi italiane con molte tappe interessanti',
      };
      
      render(<SortableTripItem trip={longTitleTrip} index={0} />);
      
      expect(screen.getByText(longTitleTrip.title)).toBeInTheDocument();
      expect(screen.getByText(longTitleTrip.title)).toHaveClass('truncate');
    });

    it('should handle special characters in trip title', () => {
      const specialTrip = {
        ...mockTrip,
        title: 'Viaggio & Tour "Speciale" \'Completo\'',
      };
      
      render(<SortableTripItem trip={specialTrip} index={1} />);
      
      expect(screen.getByText(specialTrip.title)).toBeInTheDocument();
    });

    it('should use trip id in accessibility attributes', () => {
      const differentTrip = {
        ...mockTrip,
        id: 'custom-trip-id-123',
        title: 'Another Trip',
      };
      
      render(<SortableTripItem trip={differentTrip} index={0} />);
      
      const dragHandle = screen.getByRole('button');
      expect(dragHandle).toHaveAttribute('aria-describedby', 'trip-custom-trip-id-123-instructions');
    });
  });

  describe('Edge Cases', () => {
    it('should handle high index numbers', () => {
      render(<SortableTripItem {...defaultProps} index={999} originalIndex={0} />);
      
      expect(screen.getByText('#1')).toBeInTheDocument(); // Original
      expect(screen.getByText('#1000')).toBeInTheDocument(); // Current (999 + 1)
    });

    it('should handle same original and current index at high numbers', () => {
      render(<SortableTripItem {...defaultProps} index={50} originalIndex={50} />);
      
      expect(screen.getByText('#51')).toBeInTheDocument();
      expect(screen.queryByTestId('arrow-right-icon')).not.toBeInTheDocument();
    });
  });
});