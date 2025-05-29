import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '@/app/page';

describe('Home Page', () => {
  it('renderizza correttamente la sezione hero', () => {
    render(<Home />);
    
    // Verifica che il titolo principale sia presente
    expect(screen.getByText(/Scopri itinerari in moto personalizzati con RideAtlas/i)).toBeInTheDocument();
    
    // Verifica che il motto aziendale sia presente (almeno una volta)
    const mottoElements = screen.getAllByText(/Il viaggio lo progettiamo insieme, tu guidi l'avventura/i);
    expect(mottoElements.length).toBeGreaterThan(0);
    
    // Verifica che il badge di certificazione sia presente
    expect(screen.getByText(/Itinerari Testati & Certificati/i)).toBeInTheDocument();
    expect(screen.getByText(/Verificati dai nostri ranger esperti/i)).toBeInTheDocument();
    
    // Verifica che i pulsanti di call-to-action siano presenti
    expect(screen.getByText('Esplora Pacchetti')).toBeInTheDocument();
    expect(screen.getByText('Crea Itinerario')).toBeInTheDocument();
  });

  it('renderizza correttamente la sezione caratteristiche', () => {
    render(<Home />);
    
    // Verifica che il titolo della sezione sia presente
    expect(screen.getByText('Caratteristiche Principali')).toBeInTheDocument();
    
    // Verifica che le tre caratteristiche principali siano presenti con i nuovi titoli
    expect(screen.getByText('Pacchetti Viaggio Curati & Certificati')).toBeInTheDocument();
    expect(screen.getByText('Trip Builder con AI')).toBeInTheDocument();
    expect(screen.getByText('Comunità di Ranger')).toBeInTheDocument();
    
    // Verifica che il badge "TESTATO ✓" sia presente
    expect(screen.getByText('TESTATO ✓')).toBeInTheDocument();
    
    // Verifica che gli indicatori di qualità siano presenti
    expect(screen.getByText(/Testato su strada/i)).toBeInTheDocument();
    expect(screen.getByText(/Verificato sicurezza/i)).toBeInTheDocument();
    expect(screen.getByText(/GPS certificato/i)).toBeInTheDocument();
    
    // Verifica che il testo di supporto umano sia presente nel Trip Builder
    expect(screen.getByText(/supportata dai nostri ranger esperti/i)).toBeInTheDocument();
    expect(screen.getByText(/Supporto umano sempre disponibile/i)).toBeInTheDocument();
  });

  it('renderizza correttamente la sezione CTA', () => {
    render(<Home />);
    
    // Verifica che il motto aziendale sia presente nella sezione CTA (verifica tramite contesto)
    const mottoElements = screen.getAllByText(/Il viaggio lo progettiamo insieme, tu guidi l'avventura/i);
    expect(mottoElements.length).toBeGreaterThan(1); // Dovrebbe essere presente sia in hero che in CTA
    
    // Verifica che il titolo della sezione CTA sia presente
    expect(screen.getByText('Pronto a partire?')).toBeInTheDocument();
    
    // Verifica che il pulsante di call-to-action sia presente
    expect(screen.getByText('Inizia Gratuitamente')).toBeInTheDocument();
  });
});