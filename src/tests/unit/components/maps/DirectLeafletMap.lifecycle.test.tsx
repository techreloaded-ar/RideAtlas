// src/tests/unit/components/maps/DirectLeafletMap.lifecycle.test.tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import L from 'leaflet';
import DirectLeafletMap from '@/components/maps/DirectLeafletMap';
import { GPXTrack, GPXRoute, GPXWaypoint } from '@/types/gpx';

// Mock Leaflet completamente
jest.mock('leaflet', () => {
  const mockMap = {
    remove: jest.fn(),
    getContainer: jest.fn(() => document.createElement('div')),
    getSize: jest.fn(() => ({ x: 800, y: 600 })),
    getCenter: jest.fn(() => ({ lat: 45.0, lng: 9.0 })),
    invalidateSize: jest.fn(),
    hasLayer: jest.fn(() => false),
    removeLayer: jest.fn(),
    addLayer: jest.fn(),
    fitBounds: jest.fn(),
  };

  const mockTileLayer = {
    addTo: jest.fn(() => mockTileLayer),
    remove: jest.fn(),
  };

  const mockControl = {
    addTo: jest.fn(() => mockControl),
    getContainer: jest.fn(() => {
      const div = document.createElement('div');
      div.style.background = '';
      div.style.border = '';
      div.style.borderRadius = '';
      div.style.boxShadow = '';
      div.style.marginTop = '';
      return div;
    }),
  };

  const mockPolyline = {
    addTo: jest.fn(() => mockPolyline),
  };

  const mockMarker = {
    addTo: jest.fn(() => mockMarker),
    bindPopup: jest.fn(() => mockMarker),
  };

  return {
    map: jest.fn(() => mockMap),
    tileLayer: jest.fn(() => mockTileLayer),
    control: {
      layers: jest.fn(() => mockControl),
    },
    polyline: jest.fn(() => mockPolyline),
    marker: jest.fn(() => mockMarker),
    latLngBounds: jest.fn(() => ({})),
    Icon: {
      Default: {
        prototype: {},
        mergeOptions: jest.fn(),
      },
    },
  };
});

// Mock globale per getBoundingClientRect
const mockGetBoundingClientRect = jest.fn(() => ({
  width: 800,
  height: 600,
  top: 0,
  left: 0,
  bottom: 600,
  right: 800,
}));

Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  value: mockGetBoundingClientRect,
  configurable: true,
});

// Mock per requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 0));

// Mock per setTimeout
jest.useFakeTimers();

// Mock per document.contains
const mockDocumentContains = jest.fn(() => true);
Object.defineProperty(document, 'contains', {
  value: mockDocumentContains,
  writable: true,
});

describe('DirectLeafletMap - Lifecycle Tests', () => {
  const defaultProps = {
    allTracks: [] as GPXTrack[],
    routes: [] as GPXRoute[],
    waypoints: [] as GPXWaypoint[],
    visibleTracks: [],
    visibleRoutes: [],
    visibleWaypoints: false,
    center: [45.0, 9.0] as [number, number],
    bounds: null,
    defaultZoom: 10,
    autoFit: false,
  };

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
    const { rerender } = render(<DirectLeafletMap {...defaultProps} />);

    // Aspetta l'inizializzazione
    jest.advanceTimersByTime(50);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalled();
    });

    const mockMapInstance = (L.map as jest.Mock).mock.results[0].value;

    // Re-render con props diverse per triggerare cleanup
    rerender(<DirectLeafletMap {...defaultProps} center={[46.0, 10.0]} />);

    jest.advanceTimersByTime(50);

    // Verifica che la mappa precedente sia stata rimossa
    expect(mockMapInstance.remove).toHaveBeenCalled();
  });

  it('should handle multiple rapid re-renders without memory leaks', async () => {
    const { rerender } = render(<DirectLeafletMap {...defaultProps} />);

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
          {...defaultProps}
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
    render(<DirectLeafletMap {...defaultProps} />);

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
    const { rerender } = render(<DirectLeafletMap {...defaultProps} />);

    // Aspetta l'inizializzazione completa
    jest.advanceTimersByTime(50); // checkDimensions
    jest.advanceTimersByTime(100); // invalidateSize timeout

    await waitFor(() => {
      const mockMapInstance = (L.map as jest.Mock).mock.results[0].value;
      expect(mockMapInstance.invalidateSize).toHaveBeenCalled();
    });

    // Ora aggiungi delle tracce per verificare che la mappa sia considerata "ready"
    const trackWithPoints: GPXTrack = {
      name: 'Test Track',
      points: [
        { lat: 45.0, lng: 9.0, elevation: 100 },
        { lat: 45.1, lng: 9.1, elevation: 110 },
      ],
      color: '#3b82f6',
    };

    rerender(
      <DirectLeafletMap
        {...defaultProps}
        allTracks={[trackWithPoints]}
        visibleTracks={[true]}
      />
    );

    // Aspetta che l'effect delle tracce sia processato
    jest.advanceTimersByTime(50);

    await waitFor(() => {
      expect(L.polyline).toHaveBeenCalledWith(
        [
          [45.0, 9.0],
          [45.1, 9.1],
        ],
        expect.objectContaining({
          color: '#3b82f6',
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

    const { unmount } = render(<DirectLeafletMap {...defaultProps} />);

    // Aspetta l'inizializzazione
    jest.advanceTimersByTime(50);

    // Unmount rapidamente
    unmount();

    jest.advanceTimersByTime(100);

    // Non dovrebbe crashare, anche se il container è stato rimosso
    expect(console.error).not.toHaveBeenCalled();
  });

  it('should handle map operations when container is not in DOM', async () => {
    const { rerender } = render(<DirectLeafletMap {...defaultProps} />);

    // Aspetta l'inizializzazione
    jest.advanceTimersByTime(50);
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalled();
    });

    // Simula container rimosso dal DOM
    mockDocumentContains.mockReturnValue(false);

    // Prova ad aggiungere tracce quando il container non è nel DOM
    const trackWithPoints: GPXTrack = {
      name: 'Test Track',
      points: [
        { lat: 45.0, lng: 9.0, elevation: 100 },
        { lat: 45.1, lng: 9.1, elevation: 110 },
      ],
      color: '#3b82f6',
    };

    rerender(
      <DirectLeafletMap
        {...defaultProps}
        allTracks={[trackWithPoints]}
        visibleTracks={[true]}
      />
    );

    jest.advanceTimersByTime(50);

    // Non dovrebbe crashare
    expect(console.error).not.toHaveBeenCalled();
  });

  it('should cleanup layers on re-render', async () => {
    const trackWithPoints: GPXTrack = {
      name: 'Test Track',
      points: [
        { lat: 45.0, lng: 9.0, elevation: 100 },
        { lat: 45.1, lng: 9.1, elevation: 110 },
      ],
      color: '#3b82f6',
    };

    const { rerender } = render(
      <DirectLeafletMap
        {...defaultProps}
        allTracks={[trackWithPoints]}
        visibleTracks={[true]}
      />
    );

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

    // Re-render con tracce diverse
    const newTrack: GPXTrack = {
      name: 'New Track',
      points: [
        { lat: 46.0, lng: 10.0, elevation: 200 },
        { lat: 46.1, lng: 10.1, elevation: 210 },
      ],
      color: '#dc2626',
    };

    // Mock hasLayer per simulare che la polyline è presente
    mockMapInstance.hasLayer.mockReturnValue(true);

    rerender(
      <DirectLeafletMap
        {...defaultProps}
        allTracks={[newTrack]}
        visibleTracks={[true]}
      />
    );

    jest.advanceTimersByTime(50);

    await waitFor(() => {
      // Verifica che la vecchia polyline sia stata rimossa
      expect(mockMapInstance.removeLayer).toHaveBeenCalledWith(
        mockPolylineInstance
      );

      // Verifica che una nuova polyline sia stata creata
      expect(L.polyline).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle errors during map cleanup gracefully', async () => {
    const { rerender } = render(<DirectLeafletMap {...defaultProps} />);

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
    rerender(<DirectLeafletMap {...defaultProps} center={[46.0, 10.0]} />);

    jest.advanceTimersByTime(50);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Errore durante cleanup mappa:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should handle invalidateSize errors gracefully', async () => {
    render(<DirectLeafletMap {...defaultProps} />);

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
    const { rerender } = render(<DirectLeafletMap {...defaultProps} />);

    // Prima inizializzazione
    jest.advanceTimersByTime(50);
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalledTimes(1);
    });

    const firstMapInstance = (L.map as jest.Mock).mock.results[0].value;

    // Re-render rapido
    rerender(<DirectLeafletMap {...defaultProps} center={[46.0, 10.0]} />);

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
