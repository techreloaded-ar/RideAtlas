import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TripsPageClient from '@/app/trips/TripsPageClient';

jest.mock('@/components/trips/TripGrid', () => {
  return function MockTripGrid({ trips }: { trips: any[] }) {
    return (
      <div data-testid="trip-grid">
        {trips.map((trip) => (
          <div key={trip.id} data-testid={`trip-${trip.id}`}>{trip.title}</div>
        ))}
      </div>
    );
  };
});

jest.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  X: () => <div data-testid="x-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  Navigation: () => <div data-testid="navigation-icon" />,
}));

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

const make = (id: string, title: string, vehicle: string) => ({
  id,
  title,
  destination: 'Italia',
  tags: [],
  vehicle,
  theme: 'Relax',
  duration_days: 3,
  characteristics: [],
  recommended_seasons: [],
  status: 'Pubblicato',
  price: 10,
  user: { name: 'U', email: 'u@test.com', image: null },
  stages: [],
  processedGpxFile: null,
  processedMedia: [],
  slug: `slug-${id}`,
  travelDate: null,
});

describe('TripsPageClient - filtro mezzo', () => {
  const trips: any[] = [
    make('1', 'Giro in moto', 'MOTO'),
    make('2', 'Giro in bici', 'BICI'),
    make('3', 'Giro in ebike', 'EBIKE'),
    make('4', 'Giro in monopattino', 'MONOPATTINO'),
  ];

  it('mostra tutti i viaggi inizialmente', () => {
    render(<TripsPageClient trips={trips} userRole={null} />);
    for (const id of ['1', '2', '3', '4']) {
      expect(screen.getByTestId(`trip-${id}`)).toBeInTheDocument();
    }
  });

  it('filtrando per Monopattino mostra solo i viaggi in monopattino, Tutti li ripristina', async () => {
    const user = userEvent.setup();
    render(<TripsPageClient trips={trips} userRole={null} />);

    await user.click(screen.getByRole('button', { name: 'Monopattino' }));
    expect(screen.getByTestId('trip-4')).toBeInTheDocument();
    for (const id of ['1', '2', '3']) {
      expect(screen.queryByTestId(`trip-${id}`)).toBeNull();
    }

    await user.click(screen.getByRole('button', { name: 'Tutti' }));
    for (const id of ['1', '2', '3', '4']) {
      expect(screen.getByTestId(`trip-${id}`)).toBeInTheDocument();
    }
  });

  it('si combina con la ricerca testuale', async () => {
    const user = userEvent.setup();
    render(<TripsPageClient trips={trips} userRole={null} />);

    await user.type(screen.getByRole('searchbox'), 'bici');
    await user.click(screen.getByRole('button', { name: 'Monopattino' }));
    await waitFor(() => {
      for (const id of ['1', '2', '3', '4']) {
        expect(screen.queryByTestId(`trip-${id}`)).toBeNull();
      }
    });

    await user.click(screen.getByRole('button', { name: 'Bici' }));
    await waitFor(() => {
      expect(screen.getByTestId('trip-2')).toBeInTheDocument();
      expect(screen.queryByTestId('trip-4')).toBeNull();
    });
  });
});
