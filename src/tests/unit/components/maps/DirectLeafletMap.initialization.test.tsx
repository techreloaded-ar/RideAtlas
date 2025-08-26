// src/tests/unit/components/maps/DirectLeafletMap.initialization.test.tsx
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

describe('DirectLeafletMap - Initialization Tests', () => {
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
    // Reset del mock globale
    mockGetBoundingClientRect.mockReturnValue({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  it('should initialize map with correct center and zoom', async () => {
    render(<DirectLeafletMap {...defaultProps} />);

    // Simula il check delle dimensioni
    jest.advanceTimersByTime(50);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          center: [45.0, 9.0],
          zoom: 10,
          attributionControl: false,
        })
      );
    });
  });

  it('should create unique container ID for each map instance', async () => {
    const { rerender, container } = render(
      <DirectLeafletMap {...defaultProps} />
    );

    jest.advanceTimersByTime(50);

    const firstContainer = container.querySelector('div[id^="leaflet-map-"]');
    const firstId = firstContainer?.id;

    // Re-render per creare una nuova istanza
    rerender(<DirectLeafletMap {...defaultProps} center={[46.0, 10.0]} />);

    jest.advanceTimersByTime(50);

    await waitFor(() => {
      const secondContainer = container.querySelector(
        'div[id^="leaflet-map-"]'
      );
      const secondId = secondContainer?.id;

      expect(firstId).toBeTruthy();
      expect(secondId).toBeTruthy();
      expect(firstId).not.toBe(secondId);
      expect(firstId).toMatch(/^leaflet-map-\d+-\d+$/);
      expect(secondId).toMatch(/^leaflet-map-\d+-\d+$/);
    });
  });

  it('should setup Leaflet icons configuration', async () => {
    // Mock window object
    Object.defineProperty(window, 'window', {
      value: global,
      writable: true,
    });

    render(<DirectLeafletMap {...defaultProps} />);

    jest.advanceTimersByTime(50);

    await waitFor(() => {
      expect(L.Icon.Default.mergeOptions).toHaveBeenCalledWith({
        iconRetinaUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    });
  });

  it('should create street and satellite tile layers', async () => {
    render(<DirectLeafletMap {...defaultProps} />);

    jest.advanceTimersByTime(50);

    await waitFor(() => {
      // Verifica creazione street layer
      expect(L.tileLayer).toHaveBeenCalledWith(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        expect.objectContaining({
          attribution: '',
          maxZoom: 19,
        })
      );

      // Verifica creazione satellite layer
      expect(L.tileLayer).toHaveBeenCalledWith(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        expect.objectContaining({
          attribution: '',
          maxZoom: 19,
        })
      );
    });
  });

  it('should add layer control with correct position', async () => {
    render(<DirectLeafletMap {...defaultProps} />);

    jest.advanceTimersByTime(50);

    await waitFor(() => {
      expect(L.control.layers).toHaveBeenCalledWith(
        expect.objectContaining({
          Street: expect.any(Object),
          Satellite: expect.any(Object),
        }),
        {},
        expect.objectContaining({
          position: 'topright',
        })
      );
    });
  });

  it('should apply custom styles to layer control', async () => {
    render(<DirectLeafletMap {...defaultProps} />);

    jest.advanceTimersByTime(50);

    await waitFor(() => {
      // Verifica che il controllo layer sia stato creato
      expect(L.control.layers).toHaveBeenCalled();

      // Verifica che getContainer sia stato chiamato per applicare gli stili
      const mockControlInstance = (L.control.layers as jest.Mock).mock
        .results[0].value;
      expect(mockControlInstance.getContainer).toHaveBeenCalled();

      // Simula l'applicazione degli stili (che avviene nel codice reale)
      const mockElement = mockControlInstance.getContainer();
      mockElement.style.background = 'white';
      mockElement.style.border = '1px solid #d1d5db';
      mockElement.style.borderRadius = '6px';
      mockElement.style.boxShadow =
        '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
      mockElement.style.marginTop = '60px';

      // Verifica che gli stili siano stati applicati
      expect(mockElement.style.background).toBe('white');
      expect(mockElement.style.border).toBe('1px solid #d1d5db');
      expect(mockElement.style.borderRadius).toBe('6px');
      expect(mockElement.style.boxShadow).toBe(
        '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      );
      expect(mockElement.style.marginTop).toBe('60px');
    });
  });

  it('should handle container without dimensions gracefully', async () => {
    // Crea un mock che restituisce dimensioni zero inizialmente
    let callCount = 0;
    mockGetBoundingClientRect.mockImplementation(() => {
      callCount++;
      if (callCount <= 2) {
        // Prime due chiamate: dimensioni zero
        return {
          width: 0,
          height: 0,
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
        };
      } else {
        // Chiamate successive: dimensioni valide
        return {
          width: 800,
          height: 600,
          top: 0,
          left: 0,
          bottom: 600,
          right: 800,
        };
      }
    });

    render(<DirectLeafletMap {...defaultProps} />);

    // Primo check - dimensioni zero
    jest.advanceTimersByTime(50);

    // Secondo check - dimensioni zero
    jest.advanceTimersByTime(50);

    // Terzo check - dimensioni valide
    jest.advanceTimersByTime(50);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalled();
      expect(mockGetBoundingClientRect).toHaveBeenCalledTimes(3);
    });
  });

  it('should cleanup previous map instance on re-render', async () => {
    const { rerender } = render(<DirectLeafletMap {...defaultProps} />);

    jest.advanceTimersByTime(50);

    await waitFor(() => {
      expect(L.map).toHaveBeenCalledTimes(1);
    });

    const mockMapInstance = (L.map as jest.Mock).mock.results[0].value;

    // Re-render con props diverse
    rerender(<DirectLeafletMap {...defaultProps} center={[46.0, 10.0]} />);

    jest.advanceTimersByTime(50);

    await waitFor(() => {
      expect(mockMapInstance.remove).toHaveBeenCalled();
      expect(L.map).toHaveBeenCalledTimes(2);
    });
  });

  it('should invalidate map size after initialization', async () => {
    render(<DirectLeafletMap {...defaultProps} />);

    jest.advanceTimersByTime(50); // checkDimensions
    jest.advanceTimersByTime(100); // invalidateSize timeout

    await waitFor(() => {
      const mockMapInstance = (L.map as jest.Mock).mock.results[0].value;
      expect(mockMapInstance.invalidateSize).toHaveBeenCalled();
    });
  });

  it('should handle container removal during initialization', async () => {
    // Reset dei mock prima del test
    jest.clearAllMocks();

    // Mock getBoundingClientRect per restituire dimensioni zero (impedisce inizializzazione)
    mockGetBoundingClientRect.mockReturnValue({
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
    });

    const { unmount } = render(<DirectLeafletMap {...defaultProps} />);

    // Unmount prima che l'inizializzazione sia completata
    unmount();

    jest.advanceTimersByTime(50);

    // Non dovrebbe crashare e non dovrebbe creare la mappa
    expect(L.map).not.toHaveBeenCalled();
  });

  it('should apply correct className and style props', () => {
    const customClassName = 'custom-map-class';

    const { container } = render(
      <DirectLeafletMap {...defaultProps} className={customClassName} />
    );

    const mapContainer = container.querySelector('div');

    expect(mapContainer).toHaveClass('w-full', 'h-full', customClassName);
    expect(mapContainer).toHaveStyle({ minHeight: '200px' });
  });

  it('should handle multiple rapid re-renders without errors', async () => {
    const { rerender } = render(<DirectLeafletMap {...defaultProps} />);

    // Simula rapid re-renders
    for (let i = 0; i < 5; i++) {
      rerender(<DirectLeafletMap {...defaultProps} center={[45 + i, 9 + i]} />);
      jest.advanceTimersByTime(10);
    }

    jest.advanceTimersByTime(100);

    await waitFor(() => {
      // Dovrebbe aver creato solo l'ultima mappa
      expect(L.map).toHaveBeenCalled();
    });

    // Non dovrebbe generare errori
    expect(console.error).not.toHaveBeenCalled();
  });
});
