/**
 * Test per le utilità di ricerca dei viaggi
 * Testa la logica core di sanitizzazione, validazione e filtro
 */

import {
  sanitizeSearchInput,
  parseSearchTerms,
  textContainsAllTerms,
  arrayContainsAllTerms,
  filterTrips,
  validateSearchTerm,
  type SearchableTrip
} from '@/lib/utils/searchUtils';

describe('searchUtils', () => {
  describe('sanitizeSearchInput', () => {
    it('dovrebbe rimuovere spazi multipli e fare trim', () => {
      expect(sanitizeSearchInput('  hello   world  ')).toBe('hello world');
      expect(sanitizeSearchInput('test\t\n  multiple\r\n  spaces')).toBe('test multiple spaces');
    });

    it('dovrebbe rimuovere caratteri HTML pericolosi', () => {
      expect(sanitizeSearchInput('test<script>alert("xss")</script>')).toBe('testscriptalert("xss")/script');
      expect(sanitizeSearchInput('hello & world')).toBe('hello  world');
      expect(sanitizeSearchInput('test > 5 < 10')).toBe('test  5  10');
    });

    it('dovrebbe limitare la lunghezza a 100 caratteri', () => {
      const longInput = 'a'.repeat(150);
      const result = sanitizeSearchInput(longInput);
      expect(result.length).toBe(100);
    });

    it('dovrebbe gestire input non validi', () => {
      expect(sanitizeSearchInput('')).toBe('');
      expect(sanitizeSearchInput(null as any)).toBe('');
      expect(sanitizeSearchInput(undefined as any)).toBe('');
      expect(sanitizeSearchInput(123 as any)).toBe('');
    });
  });

  describe('parseSearchTerms', () => {
    it('dovrebbe dividere correttamente i termini di ricerca', () => {
      expect(parseSearchTerms('hello world')).toEqual(['hello', 'world']);
      expect(parseSearchTerms('  test   multiple   spaces  ')).toEqual(['test', 'multiple', 'spaces']);
    });

    it('dovrebbe convertire in lowercase', () => {
      expect(parseSearchTerms('Hello WORLD Test')).toEqual(['hello', 'world', 'test']);
    });

    it('dovrebbe gestire input vuoti', () => {
      expect(parseSearchTerms('')).toEqual([]);
      expect(parseSearchTerms('   ')).toEqual([]);
    });

    it('dovrebbe rimuovere termini vuoti', () => {
      expect(parseSearchTerms('hello  world')).toEqual(['hello', 'world']);
    });
  });

  describe('textContainsAllTerms', () => {
    it('dovrebbe trovare tutti i termini nel testo', () => {
      expect(textContainsAllTerms('Hello beautiful world', ['hello', 'world'])).toBe(true);
      expect(textContainsAllTerms('Test string', ['test'])).toBe(true);
    });

    it('dovrebbe essere case-insensitive', () => {
      expect(textContainsAllTerms('HELLO WORLD', ['hello', 'world'])).toBe(true);
      expect(textContainsAllTerms('hello world', ['HELLO', 'WORLD'])).toBe(true);
    });

    it('dovrebbe restituire false se manca un termine', () => {
      expect(textContainsAllTerms('Hello world', ['hello', 'missing'])).toBe(false);
    });

    it('dovrebbe gestire array vuoti', () => {
      expect(textContainsAllTerms('any text', [])).toBe(true);
      expect(textContainsAllTerms('', [])).toBe(true);
    });

    it('dovrebbe gestire testo vuoto', () => {
      expect(textContainsAllTerms('', ['term'])).toBe(false);
    });
  });

  describe('arrayContainsAllTerms', () => {
    it('dovrebbe trovare termini in almeno un elemento dell\'array', () => {
      const items = ['montagna', 'mare', 'città'];
      expect(arrayContainsAllTerms(items, ['mont'])).toBe(true);
      expect(arrayContainsAllTerms(items, ['mare'])).toBe(true);
    });

    it('dovrebbe richiedere tutti i termini nello stesso elemento', () => {
      const items = ['montagna alta', 'mare blu', 'città grande'];
      expect(arrayContainsAllTerms(items, ['montagna', 'alta'])).toBe(true);
      expect(arrayContainsAllTerms(items, ['montagna', 'blu'])).toBe(false);
    });

    it('dovrebbe gestire array vuoti', () => {
      expect(arrayContainsAllTerms([], ['term'])).toBe(false);
      expect(arrayContainsAllTerms(['item'], [])).toBe(true);
    });
  });

  describe('filterTrips', () => {
    const mockTrips: SearchableTrip[] = [
      {
        title: 'Viaggio in Toscana',
        destination: 'Firenze, Italia',
        tags: ['cultura', 'arte', 'vino']
      },
      {
        title: 'Tour delle Dolomiti',
        destination: 'Alto Adige, Italia',
        tags: ['montagna', 'natura', 'avventura']
      },
      {
        title: 'Costa Amalfitana',
        destination: 'Campania, Italia',
        tags: ['mare', 'panorama', 'relax']
      }
    ];

    it('dovrebbe filtrare per titolo', () => {
      const result = filterTrips(mockTrips, 'toscana');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Viaggio in Toscana');
    });

    it('dovrebbe filtrare per destinazione', () => {
      const result = filterTrips(mockTrips, 'firenze');
      expect(result).toHaveLength(1);
      expect(result[0].destination).toBe('Firenze, Italia');
    });

    it('dovrebbe filtrare per tag', () => {
      const result = filterTrips(mockTrips, 'montagna');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Tour delle Dolomiti');
    });

    it('dovrebbe essere case-insensitive', () => {
      const result = filterTrips(mockTrips, 'TOSCANA');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Viaggio in Toscana');
    });

    it('dovrebbe supportare termini multipli (AND logic)', () => {
      const result = filterTrips(mockTrips, 'italia cultura');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Viaggio in Toscana');
    });

    it('dovrebbe restituire tutti i viaggi per ricerca vuota', () => {
      const result = filterTrips(mockTrips, '');
      expect(result).toHaveLength(3);
    });

    it('dovrebbe restituire array vuoto per termini non trovati', () => {
      const result = filterTrips(mockTrips, 'nonexistent');
      expect(result).toHaveLength(0);
    });

    it('dovrebbe trovare viaggi che corrispondono in qualsiasi campo', () => {
      // Cerca "italia" che è presente in tutte le destinazioni
      const result = filterTrips(mockTrips, 'italia');
      expect(result).toHaveLength(3);
    });
  });

  describe('validateSearchTerm', () => {
    it('dovrebbe validare termini corretti', () => {
      const result = validateSearchTerm('valid search');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('dovrebbe accettare termini vuoti', () => {
      const result = validateSearchTerm('');
      expect(result.isValid).toBe(true);
    });

    it('dovrebbe rifiutare termini troppo lunghi', () => {
      const longTerm = 'a'.repeat(101);
      const result = validateSearchTerm(longTerm);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('100 caratteri');
    });

    it('dovrebbe rifiutare caratteri non validi', () => {
      const result = validateSearchTerm('test<script>');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('caratteri non validi');
    });
  });
});