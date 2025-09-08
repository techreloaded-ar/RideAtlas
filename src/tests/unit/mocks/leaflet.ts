// src/tests/unit/mocks/leaflet.ts
/**
 * Mock completo di Leaflet per i test - USA VERSIONE CENTRALIZZATA
 * Simula tutte le funzionalità necessarie per testare DirectLeafletMap
 */

import { createLeafletMocks } from './leaflet-shared';

// Usa il mock centralizzato per eliminare duplicazione
const L = createLeafletMocks();

export default L;

// Export per compatibilità con import * as L
export const map = L.map;
export const tileLayer = L.tileLayer;
export const control = L.control;
export const polyline = L.polyline;
export const marker = L.marker;
export const latLng = L.latLng;
export const latLngBounds = L.latLngBounds;
export const Icon = L.Icon;

// Re-export types from shared mock
export type {
  MockLeafletMap,
  MockTileLayer,
  MockPolyline,
  MockMarker,
  MockLatLngBounds,
  MockLatLng,
  MockControl
} from './leaflet-shared';

// Mock DOMRect type for tests
interface MockDOMRect {
  width: number;
  height: number;
  top: number;
  left: number;
  bottom: number;
  right: number;
  x: number;
  y: number;
  toJSON: () => string;
}

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