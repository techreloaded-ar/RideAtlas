/**
 * Test unitari per TripGrid
 * Testa la visualizzazione della griglia viaggi e la gestione dei ruoli utente
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import TripGrid from '@/components/trips/TripGrid';
import { UserRole } from '@prisma/client';

// Mock di Next.js Link e Image
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} />;
  },
}));

// Mock delle icone
jest.mock('lucide-react', () => ({
  Calendar: () => <div data-testid="calendar-icon" />,
  MapPin: () => <div data-testid="mappin-icon" />,
  Tag: () => <div data-testid="tag-icon" />,
  User: () => <div data-testid="user-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Navigation: () => <div data-testid="navigation-icon" />,
}));

// Mock di SeasonIcon
jest.mock('@/components/ui/SeasonIcon', () => ({
  SeasonIcon: ({ season }: { season: string }) => <div data-testid={`season-icon-${season}`} />,
}));

// Mock delle utility
jest.mock('@/lib/utils/tripStatusUtils', () => ({
  getTripStatusColor: jest.fn(() => 'bg-blue-100'),
  getTripStatusLabel: jest.fn(() => 'Pubblicato'),
  shouldShowStatusBadge: jest.fn(() => false),
}));

describe('TripGrid', () => {
  const mockTrips = [
    {
      id: '1',
      title: 'Viaggio in Toscana',
      slug: 'viaggio-toscana',
      destination: 'Firenze, Italia',
      tags: ['cultura', 'arte'],
      theme: 'Culturale',
      duration_days: 5,
      characteristics: ['panoramico'],
      recommended_seasons: ['Primavera'],
      status: 'Pubblicato',
      price: 299,
      user: {
        name: 'Mario Rossi',
        email: 'mario@test.com',
        image: null,
        role: UserRole.Ranger
      },
      stages: [],
      processedGpxFile: null,
      processedMedia: [],
      travelDate: null,
    },
  ];

  describe('Stato vuoto', () => {
    it('dovrebbe mostrare messaggio quando non ci sono viaggi per Ranger', () => {
      render(<TripGrid trips={[]} userRole={UserRole.Ranger} />);

      expect(screen.getByText('Nessun viaggio trovato')).toBeInTheDocument();
      expect(screen.getByText('Prova a modificare i criteri di ricerca o esplora tutti i viaggi disponibili.')).toBeInTheDocument();
      expect(screen.getByText('Crea un nuovo itinerario')).toBeInTheDocument();
    });

    it('dovrebbe mostrare messaggio quando non ci sono viaggi per Sentinel', () => {
      render(<TripGrid trips={[]} userRole={UserRole.Sentinel} />);

      expect(screen.getByText('Nessun viaggio trovato')).toBeInTheDocument();
      expect(screen.getByText('Crea un nuovo itinerario')).toBeInTheDocument();
    });

    it('dovrebbe nascondere pulsante crea per Explorer', () => {
      render(<TripGrid trips={[]} userRole={UserRole.Explorer} />);

      expect(screen.getByText('Nessun viaggio trovato')).toBeInTheDocument();
      expect(screen.queryByText('Crea un nuovo itinerario')).not.toBeInTheDocument();
    });

    it('dovrebbe nascondere pulsante crea per utenti non autenticati', () => {
      render(<TripGrid trips={[]} userRole={null} />);

      expect(screen.getByText('Nessun viaggio trovato')).toBeInTheDocument();
      expect(screen.queryByText('Crea un nuovo itinerario')).not.toBeInTheDocument();
    });

    it('dovrebbe nascondere pulsante crea quando userRole non è fornito', () => {
      render(<TripGrid trips={[]} />);

      expect(screen.getByText('Nessun viaggio trovato')).toBeInTheDocument();
      expect(screen.queryByText('Crea un nuovo itinerario')).not.toBeInTheDocument();
    });
  });

  describe('Visualizzazione viaggi', () => {
    it('dovrebbe mostrare i viaggi quando presenti', () => {
      render(<TripGrid trips={mockTrips} userRole={UserRole.Ranger} />);

      expect(screen.getByText('Viaggio in Toscana')).toBeInTheDocument();
      expect(screen.getByText('Firenze, Italia')).toBeInTheDocument();
      expect(screen.getByText('5 giorni')).toBeInTheDocument();
      expect(screen.getByText('Culturale')).toBeInTheDocument();
    });

    it('dovrebbe mostrare i viaggi anche senza userRole', () => {
      render(<TripGrid trips={mockTrips} />);

      expect(screen.getByText('Viaggio in Toscana')).toBeInTheDocument();
      expect(screen.getByText('Firenze, Italia')).toBeInTheDocument();
    });

    it('dovrebbe mostrare tags e caratteristiche', () => {
      render(<TripGrid trips={mockTrips} userRole={UserRole.Explorer} />);

      expect(screen.getByText('cultura')).toBeInTheDocument();
      expect(screen.getByText('arte')).toBeInTheDocument();
      expect(screen.getByText('panoramico')).toBeInTheDocument();
    });

    it('dovrebbe mostrare stagioni consigliate', () => {
      render(<TripGrid trips={mockTrips} userRole={UserRole.Explorer} />);

      expect(screen.getByText('Primavera')).toBeInTheDocument();
    });

    it('dovrebbe mostrare pulsante visualizza dettagli', () => {
      render(<TripGrid trips={mockTrips} userRole={UserRole.Explorer} />);

      const detailsButton = screen.getByText('Visualizza Dettagli');
      expect(detailsButton).toBeInTheDocument();
      expect(detailsButton.closest('a')).toHaveAttribute('href', '/trips/viaggio-toscana');
    });

    it('dovrebbe mostrare nome utente come link per Ranger', () => {
      render(<TripGrid trips={mockTrips} userRole={UserRole.Explorer} />);

      const userLink = screen.getByText('Mario Rossi');
      expect(userLink).toBeInTheDocument();
      expect(userLink.closest('a')).toHaveAttribute('href', '/ranger/Mario%20Rossi');
    });
  });

  describe('Gestione caratteristiche multiple', () => {
    it('dovrebbe mostrare solo prime 3 caratteristiche con indicatore', () => {
      const tripWithManyCharacteristics = {
        ...mockTrips[0],
        characteristics: ['panoramico', 'storico', 'gastronomico', 'relax', 'avventura'],
      };

      render(<TripGrid trips={[tripWithManyCharacteristics]} userRole={UserRole.Explorer} />);

      expect(screen.getByText('panoramico')).toBeInTheDocument();
      expect(screen.getByText('storico')).toBeInTheDocument();
      expect(screen.getByText('gastronomico')).toBeInTheDocument();
      expect(screen.getByText('+2 altre')).toBeInTheDocument();
      expect(screen.queryByText('relax')).not.toBeInTheDocument();
    });

    it('dovrebbe mostrare solo primi 3 tag con indicatore', () => {
      const tripWithManyTags = {
        ...mockTrips[0],
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      };

      render(<TripGrid trips={[tripWithManyTags]} userRole={UserRole.Explorer} />);

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('tag3')).toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();
      expect(screen.queryByText('tag4')).not.toBeInTheDocument();
    });
  });

  describe('Gestione viaggi multipli', () => {
    it('dovrebbe mostrare tutti i viaggi forniti', () => {
      const multipleTrips = [
        mockTrips[0],
        {
          ...mockTrips[0],
          id: '2',
          title: 'Tour delle Dolomiti',
          slug: 'tour-dolomiti',
          destination: 'Alto Adige',
        },
        {
          ...mockTrips[0],
          id: '3',
          title: 'Costa Amalfitana',
          slug: 'costa-amalfitana',
          destination: 'Campania',
        },
      ];

      render(<TripGrid trips={multipleTrips} userRole={UserRole.Explorer} />);

      expect(screen.getByText('Viaggio in Toscana')).toBeInTheDocument();
      expect(screen.getByText('Tour delle Dolomiti')).toBeInTheDocument();
      expect(screen.getByText('Costa Amalfitana')).toBeInTheDocument();
    });
  });
});
