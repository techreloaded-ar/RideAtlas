// src/tests/unit/components/maps/DirectLeafletMap.tracks.test.tsx
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

describe('DirectLeafletMap - GPX Tracks Tests', () => {
  // Utilizziamo scenari predefiniti dalla factory
  const emptyMapScenario = MapTestFactory.createEmptyMapScenario();
  const singleTrackScenario = MapTestFactory.createSingleTrackScenario();
  const complexScenario = MapTestFactory.createComplexScenario();
  const { initial: hiddenTrackScenario, updated: visibleTrackScenario } = MapTestFactory.createVisibilityChangeScenario();

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
    render(<DirectLeafletMap {...singleTrackScenario.props} />);

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
          color: singleTrackScenario.props.allTracks[0].color,
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
    render(<DirectLeafletMap {...hiddenTrackScenario.props} />);

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
    const { customColor, defaultColor } = MapTestFactory.createColorTestScenarios();
    
    render(
      <DirectLeafletMap
        {...emptyMapScenario.props}
        allTracks={[...customColor.props.allTracks, ...defaultColor.props.allTracks]}
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
    render(<DirectLeafletMap {...emptyMapScenario.props} />);

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
    const { emptyTrack, singlePointTrack } = MapTestFactory.createEdgeCaseScenarios();
    
    render(
      <DirectLeafletMap
        {...emptyMapScenario.props}
        allTracks={[...emptyTrack.props.allTracks, ...singlePointTrack.props.allTracks]}
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
          color: singlePointTrack.props.allTracks[0].color,
          weight: 4,
          opacity: 0.8,
        })
      );
    });
  });

  it('should remove old tracks when updating', async () => {
    const { rerender } = render(<DirectLeafletMap {...singleTrackScenario.props} />);

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

    // Re-render con nuova traccia (usa il secondo track del complex scenario)
    const newTrackScenario = MapTestFactory.createComplexScenario();
    const newTrack = newTrackScenario.props.allTracks[1]; // Secondo track

    rerender(
      <DirectLeafletMap
        {...emptyMapScenario.props}
        allTracks={[newTrack]}
        visibleTracks={[true]}
      />
    );

    jest.advanceTimersByTime(50);

    await waitFor(() => {
      // Verifica che una nuova traccia sia stata creata
      expect(L.polyline).toHaveBeenCalledTimes(2);
      
      // Verifica che la nuova traccia abbia le coordinate corrette
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

  it('should apply correct polyline styles (weight, opacity)', async () => {
    render(<DirectLeafletMap {...singleTrackScenario.props} />);

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
          color: singleTrackScenario.props.allTracks[0].color,
          weight: 4, // Peso della linea
          opacity: 0.8, // Opacità
        })
      );
    });
  });

  it('should handle track visibility changes', async () => {
    // Usa il complex scenario ma con entrambi i tracks visibili inizialmente
    const { rerender } = render(
      <DirectLeafletMap
        {...complexScenario.props}
        visibleTracks={[true, true]} // Entrambi i tracks visibili
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
      // Dovrebbero essere create almeno 2 polylines (entrambi i tracks visibili)
      expect(L.polyline).toHaveBeenCalledWith(
        [
          [45.0, 9.0],
          [45.1, 9.1],
        ],
        expect.objectContaining({
          color: complexScenario.props.allTracks[0].color,
        })
      );
    });

    const mockMapInstance = (L.map as jest.Mock).mock.results[0].value;
    mockMapInstance.hasLayer.mockReturnValue(true);

    // Cambia visibilità: nascondi primo track, mantieni secondo
    rerender(
      <DirectLeafletMap
        {...complexScenario.props}
        visibleTracks={[false, true]} // Solo secondo track visibile
      />
    );

    jest.advanceTimersByTime(50);

    await waitFor(() => {
      // Dovrebbe essere creata una nuova polyline per il secondo track
      expect(L.polyline).toHaveBeenCalledWith(
        [
          [46.0, 10.0],
          [46.1, 10.1],
        ],
        expect.objectContaining({
          color: complexScenario.props.allTracks[1].color,
        })
      );
    });
  });

  it('should handle multiple visible tracks', async () => {
    // Usa il complex scenario ma solo con tracks (no routes/waypoints)
    render(
      <DirectLeafletMap
        {...emptyMapScenario.props}
        allTracks={complexScenario.props.allTracks}
        visibleTracks={[true, true]} // Entrambi visibili
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
      // Dovrebbero essere create 2 polylines (entrambi i tracks visibili)
      expect(L.polyline).toHaveBeenCalledTimes(2);
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
    // Creiamo uno scenario ad-hoc per questo test
    const complexTrackScenario = {
      props: {
        ...emptyMapScenario.props,
        allTracks: [{
          name: 'Complex Track',
          points: [
            { lat: 45.0, lng: 9.0, elevation: 100 },
            { lat: 45.1, lng: 9.1, elevation: 110 },
            { lat: 45.2, lng: 9.2, elevation: 120 },
            { lat: 45.3, lng: 9.3, elevation: 130 },
            { lat: 45.4, lng: 9.4, elevation: 140 },
          ],
          color: '#purple',
        }],
        visibleTracks: [true],
      }
    };

    render(<DirectLeafletMap {...complexTrackScenario.props} />);

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
          color: complexTrackScenario.props.allTracks[0].color,
          weight: 4,
          opacity: 0.8,
        })
      );
    });
  });
});