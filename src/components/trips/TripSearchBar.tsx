'use client';

import React, { useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

/**
 * Props per il componente TripSearchBar
 */
export interface TripSearchBarProps {
  /** Termine di ricerca corrente */
  searchTerm: string;
  /** Callback chiamata quando il termine di ricerca cambia */
  onSearchChange: (searchTerm: string) => void;
  /** Callback chiamata quando l'utente vuole cancellare la ricerca */
  onClear: () => void;
  /** Placeholder text per il campo di input */
  placeholder?: string;
  /** Indica se è in corso una ricerca (mostra loading) */
  isSearching?: boolean;
  /** Indica se la ricerca è valida */
  isValid?: boolean;
  /** Messaggio di errore da mostrare */
  errorMessage?: string;
  /** Numero di risultati trovati */
  resultsCount?: number;
  /** Classe CSS aggiuntiva per personalizzazione */
  className?: string;
}

/**
 * Componente barra di ricerca per i viaggi
 * Fornisce un'interfaccia intuitiva per cercare viaggi per titolo, destinazione e tag
 */
const TripSearchBar: React.FC<TripSearchBarProps> = React.memo(({
  searchTerm,
  onSearchChange,
  onClear,
  placeholder = "Cerca viaggi per titolo, destinazione o tag...",
  isSearching = false,
  isValid = true,
  errorMessage,
  resultsCount,
  className = "",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Gestisce i tasti speciali (Enter, Escape)
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'Enter':
        // Previene il submit del form se presente
        event.preventDefault();
        // Rimuove il focus dall'input per nascondere la tastiera mobile
        inputRef.current?.blur();
        break;
      case 'Escape':
        // Cancella la ricerca e rimuove il focus
        onClear();
        inputRef.current?.blur();
        break;
    }
  };

  // Gestisce il cambiamento del valore di input
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  // Gestisce il click sul pulsante clear
  const handleClearClick = () => {
    onClear();
    // Mantiene il focus sull'input dopo la cancellazione
    inputRef.current?.focus();
  };

  // Focus automatico su desktop (non su mobile per evitare apertura tastiera)
  useEffect(() => {
    // Rileva se siamo su dispositivo mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    // Focus automatico solo su desktop e solo se non c'è già un elemento con focus
    if (!isMobile && inputRef.current && !document.activeElement?.matches('input, textarea, select')) {
      // Ritarda leggermente il focus per permettere al DOM di stabilizzarsi
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* Container principale della barra di ricerca */}
      <div className="relative">
        {/* Icona di ricerca */}
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>

        {/* Campo di input */}
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            w-full pl-12 pr-12 py-4 text-lg
            bg-white border-2 rounded-xl shadow-sm
            transition-all duration-200 ease-in-out
            placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            hover:border-gray-300
            ${!isValid ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-200'}
            ${isSearching ? 'bg-gray-50' : 'bg-white'}
          `}
          aria-label="Cerca viaggi per titolo, destinazione o tag"
          aria-describedby={errorMessage ? 'search-error' : resultsCount !== undefined ? 'search-results' : 'search-help'}
          aria-invalid={!isValid}
          role="searchbox"
          autoComplete="off"
          spellCheck="false"
        />

        {/* Pulsante clear - mostrato solo quando c'è testo */}
        {searchTerm && (
          <button
            onClick={handleClearClick}
            className="
              absolute inset-y-0 right-0 pr-4 flex items-center
              text-gray-400 hover:text-gray-600 
              transition-colors duration-200
              focus:outline-none focus:text-gray-600
            "
            aria-label="Cancella ricerca"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Area feedback sotto la barra di ricerca */}
      <div className="mt-2 min-h-[1.5rem]">
        {/* Messaggio di errore */}
        {errorMessage && !isValid && (
          <p id="search-error" className="text-sm text-red-600 flex items-center gap-1">
            <span className="font-medium">Errore:</span>
            {errorMessage}
          </p>
        )}

        {/* Contatore risultati e stato di ricerca */}
        {isValid && searchTerm && (
          <div id="search-results" className="text-sm text-gray-600" aria-live="polite">
            {isSearching ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Ricerca in corso...
              </span>
            ) : resultsCount === 0 ? (
              <span>Nessun viaggio trovato per &quot;{searchTerm}&quot;</span>
            ) : resultsCount === 1 ? (
              <span>1 viaggio trovato</span>
            ) : (
              <span>{resultsCount} viaggi trovati</span>
            )}
          </div>
        )}

        {/* Testo di aiuto quando non c'è ricerca attiva */}
        {!searchTerm && (
          <p id="search-help" className="text-sm text-gray-500">
            Cerca per titolo, destinazione geografica o tag del viaggio
          </p>
        )}
      </div>
    </div>
  );
});

TripSearchBar.displayName = 'TripSearchBar';

export default TripSearchBar;