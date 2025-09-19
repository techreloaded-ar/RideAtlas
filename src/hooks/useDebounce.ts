import { useState, useEffect } from 'react';

/**
 * Hook personalizzato per implementare debouncing su un valore
 * Ritarda l'aggiornamento del valore fino a quando non passano `delay` millisecondi
 * senza nuovi cambiamenti, ottimizzando le performance per input frequenti
 * 
 * @param value - Il valore da sottoporre a debouncing
 * @param delay - Il ritardo in millisecondi (default: 300ms)
 * @returns Il valore con debouncing applicato
 */
function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Imposta un timer per aggiornare il valore dopo il delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancella il timer se il valore cambia prima che scada
    // Questo previene aggiornamenti non necessari e memory leaks
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;