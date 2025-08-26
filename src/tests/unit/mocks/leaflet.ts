// src/tests/unit/mocks/leaflet.ts
/**
 * Mock completo di Leaflet per i test
 * Simula tutte le funzionalità necessarie per testare DirectLeafletMap
 */

export interface MockLeafletMap {
  remove: jest.Mock
  getContainer: jest.Mock
  getSize: jest.Mock
  getCenter: jest.Mock
  invalidateSize: jest.Mock
  hasLayer: jest.Mock
  removeLayer: jest.Mock
  addLayer: jest.Mock
  fitBounds: jest.Mock
  setView: jest.Mock
  setZoom: jest.Mock
}

export interface MockTileLayer {
  addTo: jest.Mock<MockTileLayer, [MockLeafletMap]>
  remove: jest.Mock
  setOpacity: jest.Mock
}

export interface MockControl {
  addTo: jest.Mock<MockControl, [MockLeafletMap]>
  remove: jest.Mock
  getContainer: jest.Mock<HTMLElement, []>
}

export interface MockPolyline {
  addTo: jest.Mock<MockPolyline, [MockLeafletMap]>
  remove: jest.Mock
  setStyle: jest.Mock
  getBounds: jest.Mock
}

export interface MockMarker {
  addTo: jest.Mock<MockMarker, [MockLeafletMap]>
  remove: jest.Mock
  bindPopup: jest.Mock<MockMarker, [string]>
  openPopup: jest.Mock
  closePopup: jest.Mock
  setLatLng: jest.Mock
}

// Mock DOMRect completo per getBoundingClientRect
export interface MockDOMRect {
  width: number
  height: number
  top: number
  left: number
  bottom: number
  right: number
  x: number
  y: number
  toJSON: () => string
}

// Crea mock instances
const createMockMap = (): MockLeafletMap => {
  const mockContainer = document.createElement('div')
  mockContainer.style.width = '800px'
  mockContainer.style.height = '600px'
  
  // Mock getBoundingClientRect con tipo completo
  const mockGetBoundingClientRect = jest.fn((): MockDOMRect => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    bottom: 600,
    right: 800,
    x: 0,
    y: 0,
    toJSON: () => JSON.stringify({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      x: 0,
      y: 0
    })
  }))
  
  Object.defineProperty(mockContainer, 'getBoundingClientRect', {
    value: mockGetBoundingClientRect,
    configurable: true
  })
  
  return {
    remove: jest.fn(),
    getContainer: jest.fn(() => mockContainer),
    getSize: jest.fn(() => ({ x: 800, y: 600 })),
    getCenter: jest.fn(() => ({ lat: 45.0, lng: 9.0 })),
    invalidateSize: jest.fn(),
    hasLayer: jest.fn(() => false),
    removeLayer: jest.fn(),
    addLayer: jest.fn(),
    fitBounds: jest.fn(),
    setView: jest.fn(),
    setZoom: jest.fn()
  }
}

const createMockTileLayer = (): MockTileLayer => ({
  addTo: jest.fn<MockTileLayer, [MockLeafletMap]>(function(this: MockTileLayer) { return this }),
  remove: jest.fn(),
  setOpacity: jest.fn()
})

const createMockControl = (): MockControl => {
  const mockDiv = document.createElement('div')
  mockDiv.style.background = ''
  mockDiv.style.border = ''
  mockDiv.style.borderRadius = ''
  mockDiv.style.boxShadow = ''
  mockDiv.style.marginTop = ''
  
  return {
    addTo: jest.fn<MockControl, [MockLeafletMap]>(function(this: MockControl) { return this }),
    remove: jest.fn(),
    getContainer: jest.fn(() => mockDiv)
  }
}

const createMockPolyline = (): MockPolyline => ({
  addTo: jest.fn<MockPolyline, [MockLeafletMap]>(function(this: MockPolyline) { return this }),
  remove: jest.fn(),
  setStyle: jest.fn(),
  getBounds: jest.fn(() => ({
    getSouthWest: () => ({ lat: 45.0, lng: 9.0 }),
    getNorthEast: () => ({ lat: 45.1, lng: 9.1 })
  }))
})

const createMockMarker = (): MockMarker => ({
  addTo: jest.fn<MockMarker, [MockLeafletMap]>(function(this: MockMarker) { return this }),
  remove: jest.fn(),
  bindPopup: jest.fn<MockMarker, [string]>(function(this: MockMarker) { return this }),
  openPopup: jest.fn(),
  closePopup: jest.fn(),
  setLatLng: jest.fn()
})

// Mock principale di Leaflet
const L = {
  map: jest.fn(() => createMockMap()),
  tileLayer: jest.fn(() => createMockTileLayer()),
  control: {
    layers: jest.fn(() => createMockControl())
  },
  polyline: jest.fn(() => createMockPolyline()),
  marker: jest.fn(() => createMockMarker()),
  latLngBounds: jest.fn((bounds) => ({
    getSouthWest: () => bounds[0],
    getNorthEast: () => bounds[1],
    isValid: () => true,
    extend: jest.fn(),
    pad: jest.fn()
  })),
  Icon: {
    Default: {
      prototype: {
        _getIconUrl: undefined
      },
      mergeOptions: jest.fn()
    }
  },
  DomUtil: {
    create: jest.fn((tag) => document.createElement(tag)),
    addClass: jest.fn(),
    removeClass: jest.fn()
  },
  Util: {
    extend: jest.fn((dest, ...sources) => Object.assign(dest, ...sources)),
    stamp: jest.fn(() => Math.random().toString(36))
  }
}

export default L

// Export per compatibilità con import * as L
export const map = L.map
export const tileLayer = L.tileLayer
export const control = L.control
export const polyline = L.polyline
export const marker = L.marker
export const latLngBounds = L.latLngBounds
export const Icon = L.Icon
export const DomUtil = L.DomUtil
export const Util = L.Util

// Utility functions for test setup
export const createMockBoundingClientRect = (
  width = 800,
  height = 600,
  top = 0,
  left = 0
): MockDOMRect => ({
  width,
  height,
  top,
  left,
  bottom: top + height,
  right: left + width,
  x: left,
  y: top,
  toJSON: () => JSON.stringify({ width, height, top, left, bottom: top + height, right: left + width, x: left, y: top })
})

export const setupGlobalMocks = () => {
  // Mock globale per getBoundingClientRect
  const mockGetBoundingClientRect = jest.fn(() => createMockBoundingClientRect())
  
  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    value: mockGetBoundingClientRect,
    configurable: true
  })

  // Mock per requestAnimationFrame
  global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 0))

  // Mock per document.contains
  const originalContains = document.contains
  document.contains = jest.fn(() => true)

  return {
    mockGetBoundingClientRect,
    originalContains,
    cleanup: () => {
      document.contains = originalContains
    }
  }
}

export const createTestGPXPoint = (lat: number, lng: number, elevation?: number) => ({
  lat,
  lng,
  ...(elevation && { elevation })
})