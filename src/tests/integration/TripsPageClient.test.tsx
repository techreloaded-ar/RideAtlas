/**
 * Test di integrazione per TripsPageClient
 * Testa l'integrazione completa tra ricerca, filtri e visualizzazione
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TripsPageClient from '@/app/trips/TripsPageClient';

// Mock dei componenti per semplificare i test di integrazione
jest.mock('@/components/trips/TripGrid', () => {
  return function MockTripGrid({ trips }: { trips: any[] }) {
    return (
      <div data-testid="trip-grid">
        {trips.map((trip) => (
          <div key={trip.id} data-testid={`trip-${trip.id}`}>
            {trip.title}
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  X: () => <div data-testid="x-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  Navigation: () => <div data-testid="navigation-icon" />
}));

// Mock di Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe('TripsPageClient Integration', () => {
  const mockTrips = [
    {
      id: '1',
      title: 'Viaggio in Toscana',
      destination: 'Firenze, Italia',
      tags: ['cultura', 'arte', 'vino'],
      theme: 'Culturale',
      duration_days: 5,
      characteristics: ['panoramico'],
      recommended_seasons: ['Primavera'],
      status: 'Pubblicato',
      price: 299,
      user: { name: 'Mario Rossi', email: 'mario@test.com', image: null },
      stages: [],
      processedGpxFile: null,
      processedMedia: [],
      slug: 'viaggio-toscana',
      travelDate: null
    },
    {
      id: '2',
      title: 'Tour delle Dolomiti',
      destination: 'Alto Adige, Italia',
      tags: ['montagna', 'natura', 'avventura'],
      theme: 'Avventura',
      duration_days: 7,
      characteristics: ['impegnativo'],
      recommended_seasons: ['Estate'],
      status: 'Pubblicato',
      price: 450,
      user: { name: 'Luca Bianchi', email: 'luca@test.com', image: null },
      stages: [],
      processedGpxFile: null,
      processedMedia: [],
      slug: 'tour-dolomiti',
      travelDate: null
    },
    {
      id: '3',
      title: 'Costa Amalfitana',
      destination: 'Campania, Italia',
      tags: ['mare', 'panorama', 'relax'],
      theme: 'Relax',
      duration_days: 4,
      characteristics: ['facile'],
      recommended_seasons: ['Estate'],
      status: 'Pubblicato',
      price: 199,
      user: { name: 'Anna Verdi', email: 'anna@test.com', image: null },
      stages: [],
      processedGpxFile: null,
      processedMedia: [],
      slug: 'costa-amalfitana',
      travelDate: null
    }
  ];

  it('dovrebbe mostrare tutti i viaggi inizialmente', () => {
    render(<TripsPageClient trips={mockTrips} />);
    
    expect(screen.getByTestId('trip-1')).toBeInTheDocument();
    expect(screen.getByTestId('trip-2')).toBeInTheDocument();
    expect(screen.getByTestId('trip-3')).toBeInTheDocument();
    
    expect(screen.getByText('Viaggio in Toscana')).toBeInTheDocument();
    expect(screen.getByText('Tour delle Dolomiti')).toBeInTheDocument();
    expect(screen.getByText('Costa Amalfitana')).toBeInTheDocument();
  });

  it('dovrebbe filtrare i viaggi quando si cerca per titolo', async () => {
    const user = userEvent.setup();
    render(<TripsPageClient trips={mockTrips} />);
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'toscana');
    
    await waitFor(() => {
      expect(screen.getByTestId('trip-1')).toBeInTheDocument();
      expect(screen.queryByTestId('trip-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trip-3')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('1 viaggio trovato')).toBeInTheDocument();
  });

  it('dovrebbe filtrare i viaggi quando si cerca per destinazione', async () => {
    const user = userEvent.setup();
    render(<TripsPageClient trips={mockTrips} />);
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'alto adige');
    
    await waitFor(() => {
      expect(screen.queryByTestId('trip-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('trip-2')).toBeInTheDocument();
      expect(screen.queryByTestId('trip-3')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('1 viaggio trovato')).toBeInTheDocument();
  });

  it('dovrebbe filtrare i viaggi quando si cerca per tag', async () => {
    const user = userEvent.setup();
    render(<TripsPageClient trips={mockTrips} />);
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'mare');
    
    await waitFor(() => {
      expect(screen.queryByTestId('trip-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trip-2')).not.toBeInTheDocument();
      expect(screen.getByTestId('trip-3')).toBeInTheDocument();
    });
    
    expect(screen.getByText('1 viaggio trovato')).toBeInTheDocument();
  });

  it('dovrebbe mostrare tutti i viaggi che contengono "italia"', async () => {
    const user = userEvent.setup();
    render(<TripsPageClient trips={mockTrips} />);
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'italia');
    
    await waitFor(() => {
      expect(screen.getByTestId('trip-1')).toBeInTheDocument();
      expect(screen.getByTestId('trip-2')).toBeInTheDocument();
      expect(screen.getByTestId('trip-3')).toBeInTheDocument();
    });
    
    // Aspetta che il debouncing finisca e il contatore risultati appaia
    await waitFor(() => {
      expect(screen.getByText('3 viaggi trovati')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('dovrebbe mostrare messaggio quando non ci sono risultati', async () => {
    const user = userEvent.setup();
    render(<TripsPageClient trips={mockTrips} />);
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'nonexistent');
    
    await waitFor(() => {
      expect(screen.queryByTestId('trip-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trip-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trip-3')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText(/nessun viaggio trovato per/i)).toBeInTheDocument();
    expect(screen.getByText('Nessun risultato trovato')).toBeInTheDocument();
    expect(screen.getByText('Mostra tutti i viaggi')).toBeInTheDocument();
  });

  it('dovrebbe permettere di cancellare la ricerca', async () => {
    const user = userEvent.setup();
    render(<TripsPageClient trips={mockTrips} />);
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'toscana');
    
    // Verifica che il filtro sia applicato
    await waitFor(() => {
      expect(screen.getByTestId('trip-1')).toBeInTheDocument();
      expect(screen.queryByTestId('trip-2')).not.toBeInTheDocument();
    });
    
    // Clicca il pulsante clear
    const clearButton = screen.getByRole('button', { name: /cancella ricerca/i });
    await user.click(clearButton);
    
    // Verifica che tutti i viaggi siano di nuovo visibili
    await waitFor(() => {
      expect(screen.getByTestId('trip-1')).toBeInTheDocument();
      expect(screen.getByTestId('trip-2')).toBeInTheDocument();
      expect(screen.getByTestId('trip-3')).toBeInTheDocument();
    });
    
    expect(searchInput).toHaveValue('');
  });

  it('dovrebbe permettere di cancellare la ricerca dal pulsante "Mostra tutti i viaggi"', async () => {
    const user = userEvent.setup();
    render(<TripsPageClient trips={mockTrips} />);
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'nonexistent');
    
    // Verifica che non ci siano risultati
    await waitFor(() => {
      expect(screen.getByText('Nessun risultato trovato')).toBeInTheDocument();
    });
    
    // Clicca "Mostra tutti i viaggi"
    const showAllButton = screen.getByText('Mostra tutti i viaggi');
    await user.click(showAllButton);
    
    // Verifica che tutti i viaggi siano di nuovo visibili
    await waitFor(() => {
      expect(screen.getByTestId('trip-1')).toBeInTheDocument();
      expect(screen.getByTestId('trip-2')).toBeInTheDocument();
      expect(screen.getByTestId('trip-3')).toBeInTheDocument();
    });
    
    expect(searchInput).toHaveValue('');
  });

  it('dovrebbe gestire ricerca con termini multipli', async () => {
    const user = userEvent.setup();
    render(<TripsPageClient trips={mockTrips} />);
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'italia cultura');
    
    await waitFor(() => {
      expect(screen.getByTestId('trip-1')).toBeInTheDocument(); // Ha "italia" e "cultura"
      expect(screen.queryByTestId('trip-2')).not.toBeInTheDocument(); // Ha "italia" ma non "cultura"
      expect(screen.queryByTestId('trip-3')).not.toBeInTheDocument(); // Ha "italia" ma non "cultura"
    });
    
    // Aspetta che il debouncing finisca e il contatore risultati appaia
    await waitFor(() => {
      expect(screen.getByText('1 viaggio trovato')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('dovrebbe mostrare il call-to-action quando ci sono risultati', async () => {
    render(<TripsPageClient trips={mockTrips} />);
    
    // Con tutti i viaggi visibili
    expect(screen.getByText('Hai un itinerario da condividere?')).toBeInTheDocument();
    expect(screen.getByText('Crea il tuo itinerario')).toBeInTheDocument();
  });

  it('dovrebbe nascondere il call-to-action quando non ci sono risultati', async () => {
    const user = userEvent.setup();
    render(<TripsPageClient trips={mockTrips} />);
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'nonexistent');
    
    await waitFor(() => {
      expect(screen.queryByText('Hai un itinerario da condividere?')).not.toBeInTheDocument();
    });
  });

  it('dovrebbe gestire array di viaggi vuoto', () => {
    render(<TripsPageClient trips={[]} />);
    
    expect(screen.getByText('Nessun viaggio disponibile')).toBeInTheDocument();
    expect(screen.getByText('Crea il primo itinerario')).toBeInTheDocument();
  });
});