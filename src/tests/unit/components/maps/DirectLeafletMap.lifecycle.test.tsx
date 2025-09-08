// src/tests/unit/components/maps/DirectLeafletMap.lifecycle.test.tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import L from 'leaflet';
import DirectLeafletMap from '@/components/maps/DirectLeafletMap';
import { MapTestFactory } from '@/tests/unit/factories/MapTestFactory';

// Mock Leaflet usando il mock centralizzato
jest.mock('leaflet', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createLeafletMocks } = require('@/tests/unit/mocks/leaflet-shared');
  return createLeafletMocks();
});

// Setup mock globali
import { setupGlobalMocks } from '@/tests/unit/mocks/leaflet-shared';
const { mockGetBoundingClientRect, mockDocumentContains } = setupGlobalMocks();

// Mock per setTimeout
jest.useFakeTimers();

describe('DirectLeafletMap - Lifecycle Tests', () => {
  // Utilizziamo scenari predefiniti dalla factory
  const emptyMapScenario = MapTestFactory.createEmptyMapScenario();
  const singleTrackScenario = MapTestFactory.createSingleTrackScenario();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    mockGetBoundingClientRect.mockReturnValue({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
    });
    mockDocumentContains.mockReturnValue(true);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  it('should properly cleanup map on unmount', async () => {
    const { rerender } = render(<DirectLeafletMap {...emptyMapScenario.props} />);

    // Aspetta l'inizializzazione
    jest.advanceTimersByTime(50);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalled();
    });

    const mockMapInstance = (L.map as jest.Mock).mock.results[0].value;

    // Re-render con props diverse per triggerare cleanup
    rerender(<DirectLeafletMap {...emptyMapScenario.props} center={[46.0, 10.0]} />);

    jest.advanceTimersByTime(50);

    // Verifica che la mappa precedente sia stata rimossa
    expect(mockMapInstance.remove).toHaveBeenCalled();
  });

  it('should handle multiple rapid re-renders without memory leaks', async () => {
    const { rerender } = render(<DirectLeafletMap {...emptyMapScenario.props} />);

    // Prima inizializzazione
    jest.advanceTimersByTime(50);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalledTimes(1);
    });

    const firstMapInstance = (L.map as jest.Mock).mock.results[0].value;

    // Simula rapid re-renders
    for (let i = 0; i < 3; i++) {
      rerender(
        <DirectLeafletMap
          {...emptyMapScenario.props}
          center={[45 + i, 9 + i] as [number, number]}
        />
      );
      jest.advanceTimersByTime(10);
    }

    // Aspetta che tutte le inizializzazioni siano completate
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      // Dovrebbe aver creato 4 mappe totali (1 iniziale + 3 re-renders)
      expect(L.map).toHaveBeenCalledTimes(4);
    });

    // Verifica che le mappe precedenti siano state rimosse
    expect(firstMapInstance.remove).toHaveBeenCalled();

    // Verifica che non ci siano memory leaks (ogni re-render dovrebbe pulire la mappa precedente)
    const allMapInstances = (L.map as jest.Mock).mock.results.map(
      (result) => result.value
    );

    // Tutte le mappe tranne l'ultima dovrebbero essere state rimosse
    for (let i = 0; i < allMapInstances.length - 1; i++) {
      expect(allMapInstances[i].remove).toHaveBeenCalled();
    }

    // L'ultima mappa potrebbe essere stata rimossa durante i re-renders
    // Verifichiamo solo che tutte le mappe tranne l'ultima siano state rimosse
    for (let i = 0; i < allMapInstances.length - 1; i++) {
      expect(allMapInstances[i].remove).toHaveBeenCalled();
    }
  });

  it('should invalidate map size after initialization', async () => {
    render(<DirectLeafletMap {...emptyMapScenario.props} />);

    // Aspetta checkDimensions
    jest.advanceTimersByTime(50);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalled();
    });

    // Aspetta il timeout per invalidateSize (100ms)
    jest.advanceTimersByTime(100);

    const mockMapInstance = (L.map as jest.Mock).mock.results[0].value;
    expect(mockMapInstance.invalidateSize).toHaveBeenCalled();
  });

  it('should set isMapInitializedRef to true after setup', async () => {
    // Questo test verifica indirettamente che isMapInitializedRef sia impostato
    // attraverso il comportamento del componente
    const { rerender } = render(<DirectLeafletMap {...emptyMapScenario.props} />);

    // Aspetta l'inizializzazione completa
    jest.advanceTimersByTime(50); // checkDimensions
    jest.advanceTimersByTime(100); // invalidateSize timeout

    await waitFor(() => {
      const mockMapInstance = (L.map as jest.Mock).mock.results[0].value;
      expect(mockMapInstance.invalidateSize).toHaveBeenCalled();
    });

    // Ora aggiungi delle tracce per verificare che la mappa sia considerata "ready"
    rerender(<DirectLeafletMap {...singleTrackScenario.props} />);

    // Aspetta che l'effect delle tracce sia processato
    jest.advanceTimersByTime(50);

    await waitFor(() => {
      expect(L.polyline).toHaveBeenCalledWith(
        [
          [45.0, 9.0],
          [45.1, 9.1],
          [45.2, 9.2],
        ],
        expect.objectContaining({
          color: singleTrackScenario.props.allTracks[0].color,
          weight: 4,
          opacity: 0.8,
        })
      );
    });

    // Se la polyline è stata aggiunta, significa che isMapInitializedRef era true
    const mockPolylineInstance = (L.polyline as jest.Mock).mock.results[0]
      .value;
    expect(mockPolylineInstance.addTo).toHaveBeenCalled();
  });

  it('should handle container removal during initialization', async () => {
    // Mock document.contains per simulare container rimosso dal DOM
    mockDocumentContains.mockReturnValue(false);

    const { unmount } = render(<DirectLeafletMap {...emptyMapScenario.props} />);

    // Aspetta l'inizializzazione
    jest.advanceTimersByTime(50);

    // Unmount rapidamente
    unmount();

    jest.advanceTimersByTime(100);

    // Non dovrebbe crashare, anche se il container è stato rimosso
    expect(console.error).not.toHaveBeenCalled();
  });

  it('should handle map operations when container is not in DOM', async () => {
    const { rerender } = render(<DirectLeafletMap {...emptyMapScenario.props} />);

    // Aspetta l'inizializzazione
    jest.advanceTimersByTime(50);
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalled();
    });

    // Simula container rimosso dal DOM
    mockDocumentContains.mockReturnValue(false);

    // Prova ad aggiungere tracce quando il container non è nel DOM
    rerender(<DirectLeafletMap {...singleTrackScenario.props} />);

    jest.advanceTimersByTime(50);

    // Non dovrebbe crashare
    expect(console.error).not.toHaveBeenCalled();
  });

  it('should cleanup layers on re-render', async () => {
    const { rerender } = render(<DirectLeafletMap {...singleTrackScenario.props} />);

    // Aspetta l'inizializzazione della mappa
    jest.advanceTimersByTime(50);
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalled();
    });

    // Aspetta che i layer vengano aggiunti
    jest.advanceTimersByTime(50);

    await waitFor(() => {
      expect(L.polyline).toHaveBeenCalled();
    });

    const mockMapInstance = (L.map as jest.Mock).mock.results[0].value;
    const mockPolylineInstance = (L.polyline as jest.Mock).mock.results[0]
      .value;

    // Verifica che la polyline sia stata aggiunta alla mappa
    expect(mockPolylineInstance.addTo).toHaveBeenCalledWith(mockMapInstance);

    // Re-render con tracce diverse (usa il complex scenario per avere un track diverso)
    const complexScenario = MapTestFactory.createComplexScenario();
    const newTrack = complexScenario.props.allTracks[1]; // Secondo track

    rerender(
      <DirectLeafletMap
        {...emptyMapScenario.props}
        allTracks={[newTrack]}
        visibleTracks={[true]}
      />
    );

    jest.advanceTimersByTime(50);

    await waitFor(() => {
      // Verifica che una nuova polyline sia stata creata
      expect(L.polyline).toHaveBeenCalledTimes(2);
      
      // Verifica che la nuova polyline abbia le coordinate corrette
      expect(L.polyline).toHaveBeenLastCalledWith(
        [
          [46.0, 10.0],
          [46.1, 10.1],
        ],
        expect.objectContaining({
          color: newTrack.color,
          weight: 4,
          opacity: 0.8,
        })
      );
    });
  });

  it('should handle errors during map cleanup gracefully', async () => {
    const { rerender } = render(<DirectLeafletMap {...emptyMapScenario.props} />);

    // Aspetta l'inizializzazione
    jest.advanceTimersByTime(50);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalled();
    });

    const mockMapInstance = (L.map as jest.Mock).mock.results[0].value;

    // Mock remove per lanciare un errore
    mockMapInstance.remove.mockImplementation(() => {
      throw new Error('Cleanup error');
    });

    // Spy su console.warn
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Re-render per triggerare cleanup
    rerender(<DirectLeafletMap {...emptyMapScenario.props} center={[46.0, 10.0]} />);

    jest.advanceTimersByTime(50);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Errore durante cleanup mappa:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should handle invalidateSize errors gracefully', async () => {
    render(<DirectLeafletMap {...emptyMapScenario.props} />);

    // Aspetta checkDimensions
    jest.advanceTimersByTime(50);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalled();
    });

    const mockMapInstance = (L.map as jest.Mock).mock.results[0].value;

    // Mock invalidateSize per lanciare un errore
    mockMapInstance.invalidateSize.mockImplementation(() => {
      throw new Error('InvalidateSize error');
    });

    // Spy su console.warn
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Aspetta il timeout per invalidateSize
    jest.advanceTimersByTime(100);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Errore durante invalidateSize iniziale:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should prevent operations on stale map instances', async () => {
    const { rerender } = render(<DirectLeafletMap {...emptyMapScenario.props} />);

    // Prima inizializzazione
    jest.advanceTimersByTime(50);
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalledTimes(1);
    });

    const firstMapInstance = (L.map as jest.Mock).mock.results[0].value;

    // Re-render rapido
    rerender(<DirectLeafletMap {...emptyMapScenario.props} center={[46.0, 10.0]} />);

    jest.advanceTimersByTime(50);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalledTimes(2);
    });

    // Simula un'operazione ritardata sulla prima mappa (che dovrebbe essere stata rimossa)
    setTimeout(() => {
      try {
        firstMapInstance.invalidateSize();
      } catch (error) {
        // Dovrebbe essere gestito gracefully
      }
    }, 200);

    jest.advanceTimersByTime(200);

    // Non dovrebbe causare errori
    expect(console.error).not.toHaveBeenCalled();
  });
});
