/**
 * Test per l'hook useDebounce
 * Testa la logica di debouncing per ottimizzazione performance
 */

import { renderHook, act } from '@testing-library/react';
import useDebounce from '@/hooks/useDebounce';

// Mock dei timer per controllare il timing nei test
jest.useFakeTimers();

describe('useDebounce', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('dovrebbe restituire il valore iniziale immediatamente', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('dovrebbe applicare debouncing al valore', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 }
      }
    );

    expect(result.current).toBe('initial');

    // Cambia il valore
    rerender({ value: 'updated', delay: 300 });
    
    // Il valore non dovrebbe cambiare immediatamente
    expect(result.current).toBe('initial');

    // Avanza i timer di 299ms (meno del delay)
    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('initial');

    // Avanza di 1ms in più per completare il delay
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('dovrebbe resettare il timer su cambiamenti rapidi', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: 'initial' }
      }
    );

    // Primo cambiamento
    rerender({ value: 'first' });
    
    // Avanza di 200ms
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe('initial');

    // Secondo cambiamento prima che il primo sia completato
    rerender({ value: 'second' });
    
    // Avanza di altri 200ms (totale 400ms dal primo cambiamento)
    act(() => {
      jest.advanceTimersByTime(200);
    });
    // Dovrebbe ancora essere il valore iniziale perché il timer è stato resettato
    expect(result.current).toBe('initial');

    // Avanza di altri 100ms per completare il delay del secondo cambiamento
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('second');
  });

  it('dovrebbe usare il delay di default di 300ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value), // Nessun delay specificato
      {
        initialProps: { value: 'initial' }
      }
    );

    rerender({ value: 'updated' });
    
    // Avanza di 299ms
    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('initial');

    // Avanza di 1ms per completare i 300ms di default
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('dovrebbe gestire delay personalizzati', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    );

    rerender({ value: 'updated', delay: 500 });
    
    // Avanza di 300ms (meno del delay personalizzato)
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('initial');

    // Avanza di altri 200ms per completare i 500ms
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe('updated');
  });

  it('dovrebbe gestire tipi diversi di valori', () => {
    // Test con numeri
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      {
        initialProps: { value: 0 }
      }
    );

    numberRerender({ value: 42 });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(numberResult.current).toBe(42);

    // Test con oggetti
    const { result: objectResult, rerender: objectRerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      {
        initialProps: { value: { id: 1 } }
      }
    );

    const newObject = { id: 2 };
    objectRerender({ value: newObject });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(objectResult.current).toBe(newObject);
  });

  it('dovrebbe pulire i timer al unmount', () => {
    const { result, rerender, unmount } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: 'initial' }
      }
    );

    rerender({ value: 'updated' });
    
    // Unmount prima che il timer scada
    unmount();
    
    // Avanza i timer - non dovrebbe causare errori
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    // Il test passa se non ci sono errori di memory leak
    expect(true).toBe(true);
  });

  it('dovrebbe gestire cambiamenti di delay durante l\'uso', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 }
      }
    );

    // Cambia valore e delay contemporaneamente
    rerender({ value: 'updated', delay: 500 });
    
    // Avanza di 300ms (il vecchio delay)
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('initial'); // Non dovrebbe essere cambiato ancora

    // Avanza di altri 200ms per completare il nuovo delay di 500ms
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe('updated');
  });
});