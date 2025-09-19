/**
 * Utilità per la ricerca e il filtro dei viaggi
 * Fornisce funzioni helper per sanitizzazione input e logica di filtro
 */

// Lunghezza massima consentita per i termini di ricerca
const MAX_SEARCH_LENGTH = 100;

/**
 * Sanitizza l'input di ricerca dell'utente
 * Rimuove caratteri potenzialmente pericolosi e normalizza il testo
 * 
 * @param input - Il testo di input da sanitizzare
 * @returns Il testo sanitizzato e normalizzato
 */
export function sanitizeSearchInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Limita la lunghezza dell'input
  const trimmedInput = input.slice(0, MAX_SEARCH_LENGTH);
  
  // Rimuove spazi multipli e trim
  const normalizedInput = trimmedInput.trim().replace(/\s+/g, ' ');
  
  // Rimuove caratteri HTML potenzialmente pericolosi
  const sanitizedInput = normalizedInput
    .replace(/[<>]/g, '') // Rimuove < e >
    .replace(/[&]/g, ''); // Rimuove &
  
  return sanitizedInput;
}

/**
 * Divide il termine di ricerca in parole individuali
 * Gestisce spazi multipli e termini vuoti
 * 
 * @param searchTerm - Il termine di ricerca da dividere
 * @returns Array di termini individuali in lowercase
 */
export function parseSearchTerms(searchTerm: string): string[] {
  const sanitized = sanitizeSearchInput(searchTerm);
  
  if (!sanitized) {
    return [];
  }
  
  return sanitized
    .toLowerCase()
    .split(' ')
    .filter(term => term.length > 0); // Rimuove termini vuoti
}

/**
 * Verifica se un testo contiene tutti i termini di ricerca specificati
 * La ricerca è case-insensitive
 * 
 * @param text - Il testo in cui cercare
 * @param searchTerms - Array di termini da cercare
 * @returns true se tutti i termini sono trovati nel testo
 */
export function textContainsAllTerms(text: string, searchTerms: string[]): boolean {
  if (!text || !searchTerms.length) {
    return searchTerms.length === 0; // Se non ci sono termini, ritorna true
  }
  
  const lowerText = text.toLowerCase();
  
  return searchTerms.every(term => lowerText.includes(term.toLowerCase()));
}

/**
 * Verifica se almeno uno degli elementi in un array contiene tutti i termini di ricerca
 * Utile per cercare in array di tag o caratteristiche
 * 
 * @param items - Array di stringhe in cui cercare
 * @param searchTerms - Array di termini da cercare
 * @returns true se almeno un elemento contiene tutti i termini
 */
export function arrayContainsAllTerms(items: string[], searchTerms: string[]): boolean {
  if (!items.length || !searchTerms.length) {
    return searchTerms.length === 0;
  }
  
  return items.some(item => textContainsAllTerms(item, searchTerms));
}

/**
 * Tipo per rappresentare i dati di un viaggio necessari per la ricerca
 */
export interface SearchableTrip {
  title: string;
  destination: string;
  tags: string[];
}

/**
 * Filtra un array di viaggi basandosi sui termini di ricerca
 * Cerca in titolo, destinazione e tag usando logica AND (tutti i termini devono essere presenti)
 * 
 * @param trips - Array di viaggi da filtrare
 * @param searchTerm - Termine di ricerca inserito dall'utente
 * @returns Array di viaggi che corrispondono ai criteri di ricerca
 */
export function filterTrips<T extends SearchableTrip>(trips: T[], searchTerm: string): T[] {
  const searchTerms = parseSearchTerms(searchTerm);
  
  // Se non ci sono termini di ricerca, ritorna tutti i viaggi
  if (searchTerms.length === 0) {
    return trips;
  }
  
  return trips.filter(trip => {
    // Per ogni termine di ricerca, verifica se è presente in almeno uno dei campi
    return searchTerms.every(term => {
      const titleMatch = trip.title.toLowerCase().includes(term.toLowerCase());
      const destinationMatch = trip.destination.toLowerCase().includes(term.toLowerCase());
      const tagsMatch = trip.tags.some(tag => tag.toLowerCase().includes(term.toLowerCase()));
      
      // Il termine deve essere trovato in almeno uno dei campi
      return titleMatch || destinationMatch || tagsMatch;
    });
  });
}

/**
 * Valida se un termine di ricerca è valido
 * 
 * @param searchTerm - Il termine da validare
 * @returns Oggetto con risultato validazione e eventuale messaggio di errore
 */
export function validateSearchTerm(searchTerm: string): { isValid: boolean; error?: string } {
  if (!searchTerm) {
    return { isValid: true }; // Termine vuoto è valido (mostra tutti i risultati)
  }
  
  if (searchTerm.length > MAX_SEARCH_LENGTH) {
    return { 
      isValid: false, 
      error: `Il termine di ricerca non può superare ${MAX_SEARCH_LENGTH} caratteri` 
    };
  }
  
  const sanitized = sanitizeSearchInput(searchTerm);
  if (sanitized !== searchTerm.trim()) {
    return { 
      isValid: false, 
      error: 'Il termine di ricerca contiene caratteri non validi' 
    };
  }
  
  return { isValid: true };
}