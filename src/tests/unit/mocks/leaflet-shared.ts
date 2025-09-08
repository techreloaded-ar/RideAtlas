// src/tests/unit/mocks/leaflet-shared.ts

// Mock types for Leaflet with proper TypeScript typing
export interface MockLeafletMap {
  addLayer: jest.Mock<void, [MockPolyline | MockMarker | MockTileLayer]>;
  removeLayer: jest.Mock<void, [MockPolyline | MockMarker | MockTileLayer]>;
  hasLayer: jest.Mock<boolean, [MockPolyline | MockMarker | MockTileLayer]>;
  fitBounds: jest.Mock<void, [MockLatLngBounds, any?]>;
  setView: jest.Mock<MockLeafletMap, [MockLatLng, number, any?]>;
  getZoom: jest.Mock<number, []>;
  setZoom: jest.Mock<MockLeafletMap, [number, any?]>;
  getBounds: jest.Mock<MockLatLngBounds, []>;
  getCenter: jest.Mock<MockLatLng, []>;
  getSize: jest.Mock<{ x: number; y: number }, []>;
  getContainer: jest.Mock<HTMLElement, []>;
  remove: jest.Mock<void, []>;
  invalidateSize: jest.Mock<MockLeafletMap, [any?]>;
  on: jest.Mock<MockLeafletMap, [string, (...args: any[]) => void]>;
  off: jest.Mock<MockLeafletMap, [string, ((...args: any[]) => void)?]>;
  fire: jest.Mock<MockLeafletMap, [string, any?]>;
}

export interface MockTileLayer {
  addTo: jest.Mock<MockTileLayer, [MockLeafletMap]>;
  remove: jest.Mock<void, []>;
}

export interface MockPolyline {
  addTo: jest.Mock<MockPolyline, [MockLeafletMap]>;
  remove: jest.Mock<void, []>;
  getBounds: jest.Mock<MockLatLngBounds, []>;
  setStyle: jest.Mock<MockPolyline, [any]>;
}

export interface MockMarker {
  addTo: jest.Mock<MockMarker, [MockLeafletMap]>;
  remove: jest.Mock<void, []>;
  setLatLng: jest.Mock<MockMarker, [MockLatLng]>;
  getLatLng: jest.Mock<MockLatLng, []>;
  bindPopup: jest.Mock<MockMarker, [string | HTMLElement]>;
}

export interface MockLatLngBounds {
  extend: jest.Mock<MockLatLngBounds, [MockLatLng | MockLatLngBounds]>;
  isValid: jest.Mock<boolean, []>;
  getNorthEast: jest.Mock<MockLatLng, []>;
  getSouthWest: jest.Mock<MockLatLng, []>;
}

export interface MockLatLng {
  lat: number;
  lng: number;
}

export interface MockControl {
  addTo: jest.Mock<MockControl, [MockLeafletMap]>;
  getContainer: jest.Mock<HTMLElement, []>;
}

// Create mock implementations with proper typing
export const createMockLatLng = (lat: number = 0, lng: number = 0): MockLatLng => ({
  lat,
  lng,
});

export const createMockLatLngBounds = (): MockLatLngBounds => ({
  extend: jest.fn().mockReturnThis(),
  isValid: jest.fn(() => true),
  getNorthEast: jest.fn(() => createMockLatLng(46, 10)),
  getSouthWest: jest.fn(() => createMockLatLng(45, 9)),
});

export const createMockPolyline = (): MockPolyline => {
  const polyline: MockPolyline = {
    addTo: jest.fn((map: MockLeafletMap) => polyline),
    remove: jest.fn(),
    getBounds: jest.fn(() => createMockLatLngBounds()),
    setStyle: jest.fn((style: any) => polyline),
  };
  return polyline;
};

export const createMockMarker = (): MockMarker => {
  const marker: MockMarker = {
    addTo: jest.fn((map: MockLeafletMap) => marker),
    remove: jest.fn(),
    setLatLng: jest.fn((latlng: MockLatLng) => marker),
    getLatLng: jest.fn(() => createMockLatLng()),
    bindPopup: jest.fn((content: string | HTMLElement) => marker),
  };
  return marker;
};

export const createMockTileLayer = (): MockTileLayer => {
  const tileLayer: MockTileLayer = {
    addTo: jest.fn((map: MockLeafletMap) => tileLayer),
    remove: jest.fn(),
  };
  return tileLayer;
};

export const createMockControl = (): MockControl => {
  const control: MockControl = {
    addTo: jest.fn((map: MockLeafletMap) => control),
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
  return control;
};

export const createMockMap = (): MockLeafletMap => {
  const map = {
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    hasLayer: jest.fn((layer: MockPolyline | MockMarker | MockTileLayer) => false),
    fitBounds: jest.fn(),
    setView: jest.fn(),
    getZoom: jest.fn(() => 10),
    setZoom: jest.fn(),
    getBounds: jest.fn(() => createMockLatLngBounds()),
    getCenter: jest.fn(() => createMockLatLng(45.0, 9.0)),
    getSize: jest.fn(() => ({ x: 800, y: 600 })),
    getContainer: jest.fn(() => document.createElement('div')),
    remove: jest.fn(),
    invalidateSize: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    fire: jest.fn(),
  } as MockLeafletMap;

  // Make methods return the map instance for chaining
  map.setView.mockReturnValue(map);
  map.setZoom.mockReturnValue(map);
  map.invalidateSize.mockReturnValue(map);
  map.on.mockReturnValue(map);
  map.off.mockReturnValue(map);
  map.fire.mockReturnValue(map);

  return map;
};

// Complete Leaflet mock object with proper typing - CENTRALIZED VERSION
export const createLeafletMocks = () => ({
  map: jest.fn(() => createMockMap()),
  tileLayer: jest.fn(() => createMockTileLayer()),
  control: {
    layers: jest.fn(() => createMockControl()),
  },
  polyline: jest.fn(() => createMockPolyline()),
  marker: jest.fn(() => createMockMarker()),
  latLng: jest.fn((lat: number, lng: number) => createMockLatLng(lat, lng)),
  latLngBounds: jest.fn(() => createMockLatLngBounds()),
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: jest.fn(),
    },
  },
});

// Mock globale per getBoundingClientRect
export const setupGlobalMocks = () => {
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

  // Mock per document.contains
  const mockDocumentContains = jest.fn(() => true);
  Object.defineProperty(document, 'contains', {
    value: mockDocumentContains,
    writable: true,
  });

  return {
    mockGetBoundingClientRect,
    mockDocumentContains,
  };
};
