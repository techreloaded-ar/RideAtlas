import { render, screen } from '@testing-library/react';
import { RangerTripsList } from '@/components/ranger/RangerTripsList';
import type { RangerTripSummary } from '@/types/ranger';

describe('RangerTripsList', () => {
  const mockTrips: RangerTripSummary[] = [
    {
      id: 'trip1',
      title: 'Trip 1',
      slug: 'trip-1',
      thumbnailUrl: 'https://example.com/trip1.jpg',
      durationDays: 5,
      distanceKm: null,
    },
    {
      id: 'trip2',
      title: 'Trip 2',
      slug: 'trip-2',
      thumbnailUrl: null,
      durationDays: 3,
      distanceKm: null,
    },
  ];

  it('should render section title with ranger name', () => {
    render(<RangerTripsList trips={mockTrips} rangerName="John Doe" />);
    expect(screen.getByText('Viaggi di John Doe')).toBeInTheDocument();
  });

  it('should render all trip cards', () => {
    render(<RangerTripsList trips={mockTrips} rangerName="John Doe" />);
    expect(screen.getByText('Trip 1')).toBeInTheDocument();
    expect(screen.getByText('Trip 2')).toBeInTheDocument();
  });

  it('should show empty state when trips array is empty (FR-015)', () => {
    render(<RangerTripsList trips={[]} rangerName="John Doe" />);
    expect(
      screen.getByText('Nessun viaggio pubblicato ancora.')
    ).toBeInTheDocument();
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('should use grid layout', () => {
    const { container } = render(
      <RangerTripsList trips={mockTrips} rangerName="John Doe" />
    );
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
  });

  it('should render correct number of cards', () => {
    render(<RangerTripsList trips={mockTrips} rangerName="John Doe" />);
    const cards = screen.getAllByTestId('ranger-trip-card');
    expect(cards).toHaveLength(2);
  });

  it('should not render grid when trips are empty', () => {
    const { container } = render(
      <RangerTripsList trips={[]} rangerName="John Doe" />
    );
    const grid = container.querySelector('.grid');
    expect(grid).not.toBeInTheDocument();
  });
});
