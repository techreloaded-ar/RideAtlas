import { render, screen } from '@testing-library/react';
import { RangerTripCard } from '@/components/ranger/RangerTripCard';
import type { RangerTripSummary } from '@/types/ranger';

describe('RangerTripCard', () => {
  const mockTrip: RangerTripSummary = {
    id: 'trip1',
    title: 'Test Trip',
    slug: 'test-trip',
    thumbnailUrl: 'https://example.com/image.jpg',
    durationDays: 5,
    distanceKm: null,
  };

  it('should render trip title', () => {
    render(<RangerTripCard trip={mockTrip} />);
    expect(screen.getByText('Test Trip')).toBeInTheDocument();
  });

  it('should render duration in giorni (plural)', () => {
    render(<RangerTripCard trip={mockTrip} />);
    expect(screen.getByText('5 giorni')).toBeInTheDocument();
  });

  it('should use singular "giorno" for durationDays = 1', () => {
    const singleDayTrip = { ...mockTrip, durationDays: 1 };
    render(<RangerTripCard trip={singleDayTrip} />);
    expect(screen.getByText('1 giorno')).toBeInTheDocument();
  });

  it('should render thumbnail image when provided', () => {
    render(<RangerTripCard trip={mockTrip} />);
    const image = screen.getByAltText('Test Trip');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', expect.stringContaining('image.jpg'));
  });

  it('should render placeholder when thumbnailUrl is null', () => {
    const tripWithoutImage = { ...mockTrip, thumbnailUrl: null };
    render(<RangerTripCard trip={tripWithoutImage} />);
    expect(screen.getByText('Nessuna immagine')).toBeInTheDocument();
  });

  it('should link to trip detail page', () => {
    render(<RangerTripCard trip={mockTrip} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/trips/test-trip');
  });

  it('should be keyboard accessible', () => {
    render(<RangerTripCard trip={mockTrip} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href');
    // Link should be focusable
    link.focus();
    expect(link).toHaveFocus();
  });

  it('should hide distance when distanceKm is null', () => {
    render(<RangerTripCard trip={mockTrip} />);
    expect(screen.queryByText(/km$/)).not.toBeInTheDocument();
  });

  it('should display distance when distanceKm is provided', () => {
    const tripWithDistance = { ...mockTrip, distanceKm: 150 };
    render(<RangerTripCard trip={tripWithDistance} />);
    expect(screen.getByText('150 km')).toBeInTheDocument();
  });

  it('should have hover effect class', () => {
    render(<RangerTripCard trip={mockTrip} />);
    const link = screen.getByRole('link');
    expect(link).toHaveClass('hover:shadow-lg');
  });
});
