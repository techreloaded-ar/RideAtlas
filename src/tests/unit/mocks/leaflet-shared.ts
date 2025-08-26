// src/tests/unit/mocks/leaflet-shared.ts

export const createLeafletMocks = () => {
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
};

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