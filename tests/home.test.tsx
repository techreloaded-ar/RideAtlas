import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '@/app/page';

// Mock dei componenti Next.js che non sono supportati in ambiente di test
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: jest.fn().mockReturnValue('/'),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />
  },
}))

describe('Home Page', () => {
  it('renderizza correttamente la sezione hero', () => {
    render(<Home />);
    
    // Verifica che il titolo principale sia presente
    expect(screen.getByText(/Scopri itinerari in moto personalizzati con RideAtlas/i)).toBeInTheDocument();
    
    // Verifica che la descrizione sia presente
    expect(screen.getByText(/Pacchetti viaggio multimediali e costruttore di percorsi assistito da AI/i)).toBeInTheDocument();
    
    // Verifica che i pulsanti di call-to-action siano presenti
    expect(screen.getByText('Esplora Pacchetti')).toBeInTheDocument();
    expect(screen.getByText('Crea Itinerario')).toBeInTheDocument();
  });

  it('renderizza correttamente la sezione caratteristiche', () => {
    render(<Home />);
    
    // Verifica che il titolo della sezione sia presente
    expect(screen.getByText('Caratteristiche Principali')).toBeInTheDocument();
    
    // Verifica che le tre caratteristiche principali siano presenti
    expect(screen.getByText('Pacchetti Viaggio Curati')).toBeInTheDocument();
    expect(screen.getByText('Trip Builder con AI')).toBeInTheDocument();
    expect(screen.getByText('Comunità di Ranger')).toBeInTheDocument();
  });

  it('renderizza correttamente la sezione CTA', () => {
    render(<Home />);
    
    // Verifica che il titolo della sezione CTA sia presente
    expect(screen.getByText('Pronto a partire?')).toBeInTheDocument();
    
    // Verifica che il pulsante di call-to-action sia presente
    expect(screen.getByText('Inizia Gratuitamente')).toBeInTheDocument();
  });
});