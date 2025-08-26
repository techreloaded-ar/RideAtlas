// src/tests/unit/components/maps/DirectLeafletMap.tracks.test.tsx
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

describe('DirectLeafletMap - GPX Tracks Tests', () => {
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

  it('should render visible tracks as polylines', async () => {
    const trackWithPoints: GPXTrack = {
      name: 'Test Track',
      points: [
        { lat: 45.0, lng: 9.0, elevation: 100, time: new Date() },
        { lat: 45.1, lng: 9.1, elevation: 110, time: new Date() },
        { lat: 45.2, lng: 9.2, elevation: 120, time: new Date() },
      ],
      color: '#ff0000',
    };

    render(
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

    // Aspetta che le tracce vengano processate
    jest.advanceTimersByTime(50);

    await waitFor(() => {
      expect(L.polyline).toHaveBeenCalledWith(
        [
          [45.0, 9.0],
          [45.1, 9.1],
          [45.2, 9.2],
        ],
        expect.objectContaining({
          color: '#ff0000',
          weight: 4,
          opacity: 0.8,
        })
      );
    });

    const mockPolylineInstance = (L.polyline as jest.Mock).mock.results[0].value;
    const mockMapInstance = (L.map as jest.Mock).mock.results[0].value;
    expect(mockPolylineInstance.addTo).toHaveBeenCalledWith(mockMapInstance);
  });

  it('should not render hidden tracks', async () => {
    const trackWithPoints: GPXTrack = {
      name: 'Hidden Track',
      points: [
        { lat: 45.0, lng: 9.0, elevation: 100, time: new Date() },
        { lat: 45.1, lng: 9.1, elevation: 110, time: new Date() },
      ],
      color: '#ff0000',
    };

    render(
      <DirectLeafletMap
        {...defaultProps}
        allTracks={[trackWithPoints]}
        visibleTracks={[false]} // Track nascosta
      />
    );

    // Aspetta l'inizializzazione della mappa
    jest.advanceTimersByTime(50);
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalled();
    });

    // Aspetta che le tracce vengano processate
    jest.advanceTimersByTime(50);

    // Non dovrebbe creare polyline per tracce nascoste
    expect(L.polyline).not.toHaveBeenCalled();
  });

  it('should use correct track colors or default blue', async () => {
    const trackWithCustomColor: GPXTrack = {
      name: 'Custom Color Track',
      points: [
        { lat: 45.0, lng: 9.0, elevation: 100, time: new Date() },
        { lat: 45.1, lng: 9.1, elevation: 110, time: new Date() },
      ],
      color: '#ff5733',
    };

    const trackWithoutColor: GPXTrack = {
      name: 'Default Color Track',
      points: [
        { lat: 46.0, lng: 10.0, elevation: 200, time: new Date() },
        { lat: 46.1, lng: 10.1, elevation: 210, time: new Date() },
      ],
      // Nessun colore specificato
    };

    render(
      <DirectLeafletMap
        {...defaultProps}
        allTracks={[trackWithCustomColor, trackWithoutColor]}
        visibleTracks={[true, true]}
      />
    );

    // Aspetta l'inizializzazione
    jest.advanceTimersByTime(50);
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalled();
    });

    jest.advanceTimersByTime(50);

    await waitFor(() => {
      expect(L.polyline).toHaveBeenCalledTimes(2);
    });

    // Verifica colore personalizzato
    expect(L.polyline).toHaveBeenCalledWith(
      [
        [45.0, 9.0],
        [45.1, 9.1],
      ],
      expect.objectContaining({
        color: '#ff5733',
      })
    );

    // Verifica colore di default
    expect(L.polyline).toHaveBeenCalledWith(
      [
        [46.0, 10.0],
        [46.1, 10.1],
      ],
      expect.objectContaining({
        color: '#3b82f6', // Colore di default
      })
    );
  });

  it('should handle empty tracks array', async () => {
    render(
      <DirectLeafletMap
        {...defaultProps}
        allTracks={[]} // Array vuoto
        visibleTracks={[]}
      />
    );

    // Aspetta l'inizializzazione
    jest.advanceTimersByTime(50);
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalled();
    });

    jest.advanceTimersByTime(50);

    // Non dovrebbe creare polyline
    expect(L.polyline).not.toHaveBeenCalled();
  });

  it('should handle tracks with no points', async () => {
    const emptyTrack: GPXTrack = {
      name: 'Empty Track',
      points: [], // Nessun punto
      color: '#ff0000',
    };

    const trackWithOnePoint: GPXTrack = {
      name: 'Single Point Track',
      points: [{ lat: 45.0, lng: 9.0, elevation: 100, time: new Date() }],
      color: '#00ff00',
    };

    render(
      <DirectLeafletMap
        {...defaultProps}
        allTracks={[emptyTrack, trackWithOnePoint]}
        visibleTracks={[true, true]}
      />
    );

    // Aspetta l'inizializzazione
    jest.advanceTimersByTime(50);
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalled();
    });

    jest.advanceTimersByTime(50);

    await waitFor(() => {
      // Dovrebbe creare una polyline per la traccia con un punto (comportamento di Leaflet)
      // ma non per la traccia vuota
      expect(L.polyline).toHaveBeenCalledTimes(1);
      expect(L.polyline).toHaveBeenCalledWith(
        [[45.0, 9.0]], // Un solo punto
        expect.objectContaining({
          color: '#00ff00',
          weight: 4,
          opacity: 0.8,
        })
      );
    });
  });

  it('should remove old tracks when updating', async () => {
    const initialTrack: GPXTrack = {
      name: 'Initial Track',
      points: [
        { lat: 45.0, lng: 9.0, elevation: 100, time: new Date() },
        { lat: 45.1, lng: 9.1, elevation: 110, time: new Date() },
      ],
      color: '#ff0000',
    };

    const { rerender } = render(
      <DirectLeafletMap
        {...defaultProps}
        allTracks={[initialTrack]}
        visibleTracks={[true]}
      />
    );

    // Aspetta l'inizializzazione
    jest.advanceTimersByTime(50);
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalled();
    });

    jest.advanceTimersByTime(50);

    await waitFor(() => {
      expect(L.polyline).toHaveBeenCalledTimes(1);
    });

    const mockMapInstance = (L.map as jest.Mock).mock.results[0].value;
    const mockPolylineInstance = (L.polyline as jest.Mock).mock.results[0].value;

    // Mock hasLayer per simulare che la polyline è presente
    mockMapInstance.hasLayer.mockReturnValue(true);

    // Re-render con nuova traccia
    const newTrack: GPXTrack = {
      name: 'New Track',
      points: [
        { lat: 46.0, lng: 10.0, elevation: 200, time: new Date() },
        { lat: 46.1, lng: 10.1, elevation: 210, time: new Date() },
      ],
      color: '#00ff00',
    };

    rerender(
      <DirectLeafletMap
        {...defaultProps}
        allTracks={[newTrack]}
        visibleTracks={[true]}
      />
    );

    jest.advanceTimersByTime(50);

    await waitFor(() => {
      // Verifica che la vecchia traccia sia stata rimossa
      expect(mockMapInstance.removeLayer).toHaveBeenCalledWith(
        mockPolylineInstance
      );

      // Verifica che una nuova traccia sia stata creata
      expect(L.polyline).toHaveBeenCalledTimes(2);
    });
  });

  it('should apply correct polyline styles (weight, opacity)', async () => {
    const trackWithPoints: GPXTrack = {
      name: 'Styled Track',
      points: [
        { lat: 45.0, lng: 9.0, elevation: 100, time: new Date() },
        { lat: 45.1, lng: 9.1, elevation: 110, time: new Date() },
      ],
      color: '#ff0000',
    };

    render(
      <DirectLeafletMap
        {...defaultProps}
        allTracks={[trackWithPoints]}
        visibleTracks={[true]}
      />
    );

    // Aspetta l'inizializzazione
    jest.advanceTimersByTime(50);
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalled();
    });

    jest.advanceTimersByTime(50);

    await waitFor(() => {
      expect(L.polyline).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          color: '#ff0000',
          weight: 4, // Peso della linea
          opacity: 0.8, // Opacità
        })
      );
    });
  });

  it('should handle track visibility changes', async () => {
    const track1: GPXTrack = {
      name: 'Track 1',
      points: [
        { lat: 45.0, lng: 9.0, elevation: 100, time: new Date() },
        { lat: 45.1, lng: 9.1, elevation: 110, time: new Date() },
      ],
      color: '#ff0000',
    };

    const track2: GPXTrack = {
      name: 'Track 2',
      points: [
        { lat: 46.0, lng: 10.0, elevation: 200, time: new Date() },
        { lat: 46.1, lng: 10.1, elevation: 210, time: new Date() },
      ],
      color: '#00ff00',
    };

    const { rerender } = render(
      <DirectLeafletMap
        {...defaultProps}
        allTracks={[track1, track2]}
        visibleTracks={[true, false]} // Solo track1 visibile
      />
    );

    // Aspetta l'inizializzazione
    jest.advanceTimersByTime(50);
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalled();
    });

    jest.advanceTimersByTime(50);

    await waitFor(() => {
      // Solo una polyline dovrebbe essere creata
      expect(L.polyline).toHaveBeenCalledTimes(1);
      expect(L.polyline).toHaveBeenCalledWith(
        [
          [45.0, 9.0],
          [45.1, 9.1],
        ],
        expect.objectContaining({
          color: '#ff0000',
        })
      );
    });

    const mockMapInstance = (L.map as jest.Mock).mock.results[0].value;
    mockMapInstance.hasLayer.mockReturnValue(true);

    // Cambia visibilità: nascondi track1, mostra track2
    rerender(
      <DirectLeafletMap
        {...defaultProps}
        allTracks={[track1, track2]}
        visibleTracks={[false, true]} // Solo track2 visibile
      />
    );

    jest.advanceTimersByTime(50);

    await waitFor(() => {
      // Dovrebbe essere creata una nuova polyline per track2
      expect(L.polyline).toHaveBeenCalledTimes(2);
      expect(L.polyline).toHaveBeenLastCalledWith(
        [
          [46.0, 10.0],
          [46.1, 10.1],
        ],
        expect.objectContaining({
          color: '#00ff00',
        })
      );
    });
  });

  it('should handle multiple visible tracks', async () => {
    const track1: GPXTrack = {
      name: 'Track 1',
      points: [
        { lat: 45.0, lng: 9.0, elevation: 100, time: new Date() },
        { lat: 45.1, lng: 9.1, elevation: 110, time: new Date() },
      ],
      color: '#ff0000',
    };

    const track2: GPXTrack = {
      name: 'Track 2',
      points: [
        { lat: 46.0, lng: 10.0, elevation: 200, time: new Date() },
        { lat: 46.1, lng: 10.1, elevation: 210, time: new Date() },
      ],
      color: '#00ff00',
    };

    const track3: GPXTrack = {
      name: 'Track 3',
      points: [
        { lat: 47.0, lng: 11.0, elevation: 300, time: new Date() },
        { lat: 47.1, lng: 11.1, elevation: 310, time: new Date() },
      ],
      color: '#0000ff',
    };

    render(
      <DirectLeafletMap
        {...defaultProps}
        allTracks={[track1, track2, track3]}
        visibleTracks={[true, true, true]} // Tutte visibili
      />
    );

    // Aspetta l'inizializzazione
    jest.advanceTimersByTime(50);
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalled();
    });

    jest.advanceTimersByTime(50);

    await waitFor(() => {
      // Dovrebbero essere create 3 polyline
      expect(L.polyline).toHaveBeenCalledTimes(3);
    });

    const mockMapInstance = (L.map as jest.Mock).mock.results[0].value;
    const mockPolylineInstances = (L.polyline as jest.Mock).mock.results.map(
      (result) => result.value
    );

    // Verifica che tutte le polyline siano state aggiunte alla mappa
    mockPolylineInstances.forEach((polyline) => {
      expect(polyline.addTo).toHaveBeenCalledWith(mockMapInstance);
    });
  });

  it('should handle tracks with complex point arrays', async () => {
    const complexTrack: GPXTrack = {
      name: 'Complex Track',
      points: [
        { lat: 45.0, lng: 9.0, elevation: 100, time: new Date('2023-01-01T10:00:00Z') },
        { lat: 45.1, lng: 9.1, elevation: 110, time: new Date('2023-01-01T10:05:00Z') },
        { lat: 45.2, lng: 9.2, elevation: 120, time: new Date('2023-01-01T10:10:00Z') },
        { lat: 45.3, lng: 9.3, elevation: 130, time: new Date('2023-01-01T10:15:00Z') },
        { lat: 45.4, lng: 9.4, elevation: 140, time: new Date('2023-01-01T10:20:00Z') },
      ],
      color: '#purple',
    };

    render(
      <DirectLeafletMap
        {...defaultProps}
        allTracks={[complexTrack]}
        visibleTracks={[true]}
      />
    );

    // Aspetta l'inizializzazione
    jest.advanceTimersByTime(50);
    jest.advanceTimersByTime(100);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalled();
    });

    jest.advanceTimersByTime(50);

    await waitFor(() => {
      expect(L.polyline).toHaveBeenCalledWith(
        [
          [45.0, 9.0],
          [45.1, 9.1],
          [45.2, 9.2],
          [45.3, 9.3],
          [45.4, 9.4],
        ],
        expect.objectContaining({
          color: '#purple',
          weight: 4,
          opacity: 0.8,
        })
      );
    });
  });
});