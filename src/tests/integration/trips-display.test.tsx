import { render, screen } from '../setup/test-utils';
import TripsPage from '@/app/trips/page';

// Mock di Prisma con jest.fn() inline
jest.mock('@/lib/prisma', () => ({
  prisma: {
    trip: {
      findMany: jest.fn(),
    },
  },
}));

// Import del mock dopo la definizione
import { prisma } from '@/lib/prisma';
const mockTripFindMany = prisma.trip.findMany as jest.MockedFunction<typeof prisma.trip.findMany>;

// Mock delle icone di Lucide React
jest.mock('lucide-react', () => ({
  Calendar: () => <span data-testid="calendar-icon" />,
  MapPin: () => <span data-testid="mappin-icon" />,
  Tag: () => <span data-testid="tag-icon" />,
  User: () => <span data-testid="user-icon" />,
  Clock: () => <span data-testid="clock-icon" />,
  Navigation: () => <span data-testid="navigation-icon" />,
}));

// Mock di Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
    return <img src={src} alt={alt} className={className} data-testid="mock-image" />;
  };
});

// Mock di Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
    return <a href={href} className={className}>{children}</a>;
  };
});

describe('Trips Display Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty State', () => {
    it('displays empty state when no trips are available', async () => {
      // Mock empty trips array
      mockTripFindMany.mockResolvedValue([]);

      const component = await TripsPage();
      render(component);

      // Verifica il titolo della pagina
      expect(screen.getByText('Tutti i Pacchetti Viaggio')).toBeInTheDocument();

      // Verifica lo stato vuoto
      expect(screen.getByText('Nessun pacchetto disponibile')).toBeInTheDocument();
      expect(screen.getByText('Non ci sono ancora viaggi pubblicati. Sii il primo a creare un itinerario!')).toBeInTheDocument();
      
      // Verifica il link per creare il primo viaggio
      const createLink = screen.getByText('Crea il primo itinerario');
      expect(createLink.closest('a')).toHaveAttribute('href', '/create-trip');
    });
  });

  describe('Trips Display', () => {
    const mockTrips = [
      {
        id: '1',
        title: 'Viaggio nelle Dolomiti',
        summary: 'Un incredibile viaggio attraverso le Dolomiti con panorami mozzafiato',
        destination: 'Dolomiti, Alto Adige',
        duration_days: 3,
        duration_nights: 2,
        tags: ['montagna', 'panoramico', 'natura'],
        theme: 'Natura',
        characteristics: ['Curve strette', 'Bel paesaggio', 'No Autostrada'],
        recommended_season: 'Estate',
        slug: 'viaggio-dolomiti',
        status: 'Pubblicato',
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15'),
        user_id: 'user1',
        user: {
          name: 'Marco Rossi',
          email: 'marco.rossi@example.com',
          image: '/avatar-marco.jpg'
        }
      },
      {
        id: '2',
        title: 'Tour della Toscana',
        summary: 'Esplora le colline toscane e i borghi medievali',
        destination: 'Toscana',
        duration_days: 5,
        duration_nights: 4,
        tags: ['cultura', 'enogastronomia', 'borghi'],
        theme: 'Culturale',
        characteristics: ['Strade sterrate', 'No pedaggi'],
        recommended_season: 'Primavera',
        slug: 'tour-toscana',
        status: 'Bozza',
        created_at: new Date('2024-02-20'),
        updated_at: new Date('2024-02-20'),
        user_id: 'user2',
        user: {
          name: 'Laura Bianchi',
          email: 'laura.bianchi@example.com',
          image: null
        }
      }
    ];

    it('displays trips correctly with all information', async () => {
      // Mock trips data
      mockTripFindMany.mockResolvedValue(mockTrips);

      const component = await TripsPage();
      render(component);

      // Verifica il titolo della pagina
      expect(screen.getByText('Tutti i Pacchetti Viaggio')).toBeInTheDocument();

      // Verifica che entrambi i viaggi siano visualizzati
      expect(screen.getByText('Viaggio nelle Dolomiti')).toBeInTheDocument();
      expect(screen.getByText('Tour della Toscana')).toBeInTheDocument();

      // Verifica le destinazioni
      expect(screen.getByText('Dolomiti, Alto Adige')).toBeInTheDocument();
      expect(screen.getByText('Toscana')).toBeInTheDocument();

      // Verifica le durate
      expect(screen.getByText('3 giorni, 2 notti')).toBeInTheDocument();
      expect(screen.getByText('5 giorni, 4 notti')).toBeInTheDocument();

      // Verifica i temi
      expect(screen.getByText('Natura')).toBeInTheDocument();
      expect(screen.getByText('Culturale')).toBeInTheDocument();

      // Verifica gli status
      expect(screen.getByText('Pubblicato')).toBeInTheDocument();
      expect(screen.getByText('Bozza')).toBeInTheDocument();

      // Verifica i nomi degli utenti
      expect(screen.getByText('Marco Rossi')).toBeInTheDocument();
      expect(screen.getByText('Laura Bianchi')).toBeInTheDocument();
    });

    it('displays status badges with correct colors', async () => {
      mockTripFindMany.mockResolvedValue(mockTrips);

      const component = await TripsPage();
      render(component);

      // Verifica il badge "Pubblicato" (dovrebbe essere verde)
      const publishedBadge = screen.getByText('Pubblicato');
      expect(publishedBadge).toHaveClass('bg-green-500', 'text-white');

      // Verifica il badge "Bozza" (dovrebbe essere giallo)
      const draftBadge = screen.getByText('Bozza');
      expect(draftBadge).toHaveClass('bg-yellow-500', 'text-white');
    });

    it('displays correct detail links for each trip', async () => {
      mockTripFindMany.mockResolvedValue(mockTrips);

      const component = await TripsPage();
      render(component);

      // Verifica i link ai dettagli
      const detailLinks = screen.getAllByText('Visualizza Dettagli');
      expect(detailLinks).toHaveLength(2);

      expect(detailLinks[0].closest('a')).toHaveAttribute('href', '/trips/viaggio-dolomiti');
      expect(detailLinks[1].closest('a')).toHaveAttribute('href', '/trips/tour-toscana');
    });

    it('displays tags correctly', async () => {
      mockTripFindMany.mockResolvedValue(mockTrips);

      const component = await TripsPage();
      render(component);

      // Verifica i tag del primo viaggio
      expect(screen.getByText('montagna')).toBeInTheDocument();
      expect(screen.getByText('panoramico')).toBeInTheDocument();
      expect(screen.getByText('natura')).toBeInTheDocument();

      // Verifica i tag del secondo viaggio
      expect(screen.getByText('cultura')).toBeInTheDocument();
      expect(screen.getByText('enogastronomia')).toBeInTheDocument();
      expect(screen.getByText('borghi')).toBeInTheDocument();
    });

    it('displays user avatars correctly', async () => {
      mockTripFindMany.mockResolvedValue(mockTrips);

      const component = await TripsPage();
      render(component);

      // Verifica che l'avatar di Marco sia presente
      const marcoAvatar = screen.getByAltText('Marco Rossi');
      expect(marcoAvatar).toBeInTheDocument();
      expect(marcoAvatar).toHaveAttribute('src', '/avatar-marco.jpg');

      // Verifica che per Laura (senza avatar) sia presente l'icona di default
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('displays icons correctly', async () => {
      mockTripFindMany.mockResolvedValue(mockTrips);

      const component = await TripsPage();
      render(component);

      // Verifica la presenza delle icone
      expect(screen.getAllByTestId('mappin-icon')).toHaveLength(2); // Destinazioni
      expect(screen.getAllByTestId('clock-icon')).toHaveLength(2); // Durate
      expect(screen.getAllByTestId('calendar-icon')).toHaveLength(2); // Date di creazione
      expect(screen.getAllByTestId('tag-icon')).toHaveLength(6); // Tag (3 per viaggio)
    });
  });

  describe('Call to Action Section', () => {
    it('displays call to action when trips are present', async () => {
      const mockTrips = [
        {
          id: '1',
          title: 'Test Trip',
          summary: 'Test summary',
          destination: 'Test destination',
          duration_days: 1,
          duration_nights: 1,
          tags: ['test'],
          theme: 'Test',
          characteristics: [],
          recommended_season: 'Tutte',
          slug: 'test-trip',
          status: 'Pubblicato',
          created_at: new Date(),
          updated_at: new Date(),
          user_id: 'user1',
          user: {
            name: 'Test User',
            email: 'test@example.com',
            image: null
          }
        }
      ];

      mockTripFindMany.mockResolvedValue(mockTrips);

      const component = await TripsPage();
      render(component);

      // Verifica la sezione call-to-action
      expect(screen.getByText('Hai un itinerario da condividere?')).toBeInTheDocument();
      expect(screen.getByText('Unisciti alla nostra community e condividi i tuoi percorsi preferiti con altri motociclisti')).toBeInTheDocument();
      
      const createTripLink = screen.getByText('Crea il tuo itinerario');
      expect(createTripLink.closest('a')).toHaveAttribute('href', '/create-trip');
    });

    it('does not display call to action when no trips are present', async () => {
      mockTripFindMany.mockResolvedValue([]);

      const component = await TripsPage();
      render(component);

      // Verifica che la call-to-action non sia presente nello stato vuoto
      expect(screen.queryByText('Hai un itinerario da condividere?')).not.toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('calls prisma with correct parameters', async () => {
      mockTripFindMany.mockResolvedValue([]);

      const component = await TripsPage();
      render(component);

      // Verifica che mockTripFindMany sia stato chiamato con i parametri corretti
      expect(mockTripFindMany).toHaveBeenCalledWith({
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });
    });
  });
});
