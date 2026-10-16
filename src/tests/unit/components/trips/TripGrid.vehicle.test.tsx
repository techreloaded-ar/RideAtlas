import React from 'react';
import { render, screen } from '@testing-library/react';
import TripGrid from '@/components/trips/TripGrid';
import { UserRole } from '@prisma/client';

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => {
    return <img src={src} alt={alt} />;
  },
}));

jest.mock('lucide-react', () => ({
  Calendar: () => <div />,
  MapPin: () => <div />,
  Tag: () => <div />,
  User: () => <div />,
  Clock: () => <div />,
  Navigation: () => <div />,
}));

jest.mock('@/components/ui/SeasonIcon', () => ({
  SeasonIcon: ({ season }: { season: string }) => <div data-testid={`season-icon-${season}`} />,
}));

jest.mock('@/lib/utils/tripStatusUtils', () => ({
  getTripStatusColor: jest.fn(() => 'bg-blue-100'),
  getTripStatusLabel: jest.fn(() => 'Pubblicato'),
  shouldShowStatusBadge: jest.fn(() => false),
}));

const makeTrip = (extra: Record<string, unknown>) =>
  ({
    id: '1',
    title: 'Viaggio',
    slug: 'viaggio-slug',
    destination: 'Italia',
    tags: [],
    theme: 'Culturale',
    duration_days: 5,
    characteristics: [],
    recommended_seasons: [],
    status: 'Pubblicato',
    price: 10,
    user: { name: 'Mario', email: 'm@test.com', image: null, role: UserRole.Ranger },
    stages: [],
    processedGpxFile: null,
    processedMedia: [],
    travelDate: null,
    ...extra,
  }) as any;

describe('TripGrid - mezzo', () => {
  it('mostra Monopattino per un viaggio MONOPATTINO', () => {
    render(<TripGrid trips={[makeTrip({ vehicle: 'MONOPATTINO' })]} userRole={null} />);
    expect(screen.getByTestId('trip-vehicle')).toHaveTextContent('Monopattino');
  });

  it('mostra Moto se il mezzo è assente', () => {
    render(<TripGrid trips={[makeTrip({})]} userRole={null} />);
    expect(screen.getByTestId('trip-vehicle')).toHaveTextContent('Moto');
  });

  it.each(['MOTO', 'MONOPATTINO'])('il link al dettaglio è /trips/<slug> per %s', (vehicle) => {
    render(<TripGrid trips={[makeTrip({ vehicle })]} userRole={null} />);
    const link = screen.getByRole('link', { name: /Visualizza Dettagli/ });
    expect(link).toHaveAttribute('href', '/trips/viaggio-slug');
  });
});
