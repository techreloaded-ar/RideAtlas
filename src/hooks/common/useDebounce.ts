/**
 * Custom hook per implementare debouncing
 * Ritarda l'esecuzione di una funzione fino a quando non passano N millisecondi
 * dall'ultima chiamata
 */

import { useCallback, useRef, useEffect, useState } from 'react';

/**
 * Hook per debouncing di funzioni
 * @param callback - Funzione da eseguire con debounce
 * @param delay - Ritardo in millisecondi
 * @returns Funzione debouncata
 */
export function useDebounce<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      // Cancella il timeout precedente se esiste
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Imposta un nuovo timeout
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

/**
 * Hook per debouncing di valori
 * @param value - Valore da debounceare
 * @param delay - Ritardo in millisecondi
 * @returns Valore debouncato
 */
export const useDebounceValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

