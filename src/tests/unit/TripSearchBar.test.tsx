/**
 * Test per il componente TripSearchBar
 * Testa l'interfaccia utente e l'interazione della barra di ricerca
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TripSearchBar from '@/components/trips/TripSearchBar';

// Mock delle icone Lucide per evitare problemi nei test
jest.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  X: () => <div data-testid="x-icon" />,
  Loader2: () => <div data-testid="loader-icon" />
}));

describe('TripSearchBar', () => {
  const defaultProps = {
    searchTerm: '',
    onSearchChange: jest.fn(),
    onClear: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dovrebbe renderizzare correttamente', () => {
    render(<TripSearchBar {...defaultProps} />);
    
    const input = screen.getByRole('searchbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Cerca viaggi per titolo, destinazione o tag...');
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('dovrebbe mostrare il valore del searchTerm', () => {
    render(<TripSearchBar {...defaultProps} searchTerm="test search" />);
    
    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('test search');
  });

  it('dovrebbe chiamare onSearchChange quando l\'utente digita', async () => {
    const onSearchChange = jest.fn();
    
    render(<TripSearchBar {...defaultProps} onSearchChange={onSearchChange} />);
    
    const input = screen.getByRole('searchbox');
    
    // Simula la digitazione diretta nel campo input
    fireEvent.change(input, { target: { value: 'toscana' } });
    
    expect(onSearchChange).toHaveBeenCalledTimes(1);
    expect(onSearchChange).toHaveBeenCalledWith('toscana');
  });

  it('dovrebbe mostrare il pulsante clear quando c\'è testo', () => {
    render(<TripSearchBar {...defaultProps} searchTerm="test" />);
    
    const clearButton = screen.getByRole('button', { name: /cancella ricerca/i });
    expect(clearButton).toBeInTheDocument();
    expect(screen.getByTestId('x-icon')).toBeInTheDocument();
  });

  it('non dovrebbe mostrare il pulsante clear quando non c\'è testo', () => {
    render(<TripSearchBar {...defaultProps} searchTerm="" />);
    
    const clearButton = screen.queryByRole('button', { name: /cancella ricerca/i });
    expect(clearButton).not.toBeInTheDocument();
  });

  it('dovrebbe chiamare onClear quando si clicca il pulsante clear', async () => {
    const user = userEvent.setup();
    const onClear = jest.fn();
    
    render(<TripSearchBar {...defaultProps} searchTerm="test" onClear={onClear} />);
    
    const clearButton = screen.getByRole('button', { name: /cancella ricerca/i });
    await user.click(clearButton);
    
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('dovrebbe gestire il tasto Enter', async () => {
    const user = userEvent.setup();
    
    render(<TripSearchBar {...defaultProps} />);
    
    const input = screen.getByRole('searchbox');
    await user.type(input, 'test{Enter}');
    
    // Il tasto Enter dovrebbe rimuovere il focus (blur)
    expect(input).not.toHaveFocus();
  });

  it('dovrebbe gestire il tasto Escape', async () => {
    const user = userEvent.setup();
    const onClear = jest.fn();
    
    render(<TripSearchBar {...defaultProps} searchTerm="test" onClear={onClear} />);
    
    const input = screen.getByRole('searchbox');
    input.focus();
    await user.keyboard('{Escape}');
    
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(input).not.toHaveFocus();
  });

  it('dovrebbe mostrare l\'icona di loading quando isSearching è true', () => {
    render(<TripSearchBar {...defaultProps} isSearching={true} />);
    
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('search-icon')).not.toBeInTheDocument();
  });

  it('dovrebbe mostrare il contatore risultati', () => {
    render(
      <TripSearchBar 
        {...defaultProps} 
        searchTerm="test" 
        resultsCount={5} 
        isSearching={false}
      />
    );
    
    expect(screen.getByText('5 viaggi trovati')).toBeInTheDocument();
  });

  it('dovrebbe mostrare il messaggio per un solo risultato', () => {
    render(
      <TripSearchBar 
        {...defaultProps} 
        searchTerm="test" 
        resultsCount={1} 
        isSearching={false}
      />
    );
    
    expect(screen.getByText('1 viaggio trovato')).toBeInTheDocument();
  });

  it('dovrebbe mostrare il messaggio per nessun risultato', () => {
    render(
      <TripSearchBar 
        {...defaultProps} 
        searchTerm="test" 
        resultsCount={0} 
        isSearching={false}
      />
    );
    
    expect(screen.getByText(/nessun viaggio trovato per/i)).toBeInTheDocument();
  });

  it('dovrebbe mostrare il messaggio di ricerca in corso', () => {
    render(
      <TripSearchBar 
        {...defaultProps} 
        searchTerm="test" 
        isSearching={true}
      />
    );
    
    expect(screen.getByText('Ricerca in corso...')).toBeInTheDocument();
  });

  it('dovrebbe mostrare il messaggio di errore quando la ricerca non è valida', () => {
    render(
      <TripSearchBar 
        {...defaultProps} 
        isValid={false}
        errorMessage="Termine troppo lungo"
      />
    );
    
    expect(screen.getByText(/errore:/i)).toBeInTheDocument();
    expect(screen.getByText('Termine troppo lungo')).toBeInTheDocument();
  });

  it('dovrebbe applicare stili di errore quando la ricerca non è valida', () => {
    render(
      <TripSearchBar 
        {...defaultProps} 
        isValid={false}
      />
    );
    
    const input = screen.getByRole('searchbox');
    expect(input).toHaveClass('border-red-300');
  });

  it('dovrebbe mostrare il testo di aiuto quando non c\'è ricerca attiva', () => {
    render(<TripSearchBar {...defaultProps} />);
    
    expect(screen.getByText(/cerca per titolo, destinazione geografica o tag/i)).toBeInTheDocument();
  });

  it('dovrebbe usare placeholder personalizzato', () => {
    const customPlaceholder = 'Placeholder personalizzato';
    render(
      <TripSearchBar 
        {...defaultProps} 
        placeholder={customPlaceholder}
      />
    );
    
    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('placeholder', customPlaceholder);
  });

  it('dovrebbe avere attributi di accessibilità corretti', () => {
    render(<TripSearchBar {...defaultProps} />);
    
    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('aria-label', 'Cerca viaggi per titolo, destinazione o tag');
    expect(input).toHaveAttribute('aria-describedby', 'search-help');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).toHaveAttribute('autoComplete', 'off');
    expect(input).toHaveAttribute('spellCheck', 'false');
  });

  it('dovrebbe aggiornare gli attributi ARIA quando c\'è un errore', () => {
    render(
      <TripSearchBar 
        {...defaultProps} 
        isValid={false}
        errorMessage="Errore di test"
      />
    );
    
    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('aria-describedby', 'search-error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('dovrebbe aggiornare gli attributi ARIA quando ci sono risultati', () => {
    render(
      <TripSearchBar 
        {...defaultProps} 
        searchTerm="test"
        resultsCount={5}
        isSearching={false}
      />
    );
    
    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('aria-describedby', 'search-results');
  });

  it('dovrebbe avere aria-live per annunci dinamici', () => {
    render(
      <TripSearchBar 
        {...defaultProps} 
        searchTerm="test"
        resultsCount={5}
        isSearching={false}
      />
    );
    
    const resultsElement = screen.getByText('5 viaggi trovati');
    expect(resultsElement.closest('[aria-live]')).toHaveAttribute('aria-live', 'polite');
  });

  it('dovrebbe applicare classi CSS personalizzate', () => {
    const customClass = 'custom-search-bar';
    render(
      <TripSearchBar 
        {...defaultProps} 
        className={customClass}
      />
    );
    
    const container = screen.getByRole('searchbox').closest('.custom-search-bar');
    expect(container).toBeInTheDocument();
  });
});