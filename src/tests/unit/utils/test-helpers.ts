// src/tests/unit/utils/test-helpers.ts
import { GPXTrack, GPXRoute, GPXWaypoint, GPXPoint } from '@/types/gpx';

/**
 * Creates a test GPX point with proper typing
 */
export const createTestGPXPoint = (
  lat: number,
  lng: number,
  elevation?: number
): GPXPoint => ({
  lat,
  lng,
  ...(elevation && { elevation })
});

/**
 * Creates a test GPX track with proper typing
 */
export const createTestGPXTrack = (
  name: string,
  points: GPXPoint[],
  color?: string
): GPXTrack => ({
  name,
  points,
  ...(color && { color })
});

/**
 * Creates a test GPX route with proper typing
 */
export const createTestGPXRoute = (
  name: string,
  points: GPXPoint[],
  color?: string
): GPXRoute => ({
  name,
  points,
  ...(color && { color })
});

/**
 * Creates a test GPX waypoint with proper typing
 */
export const createTestGPXWaypoint = (
  lat: number,
  lng: number,
  name?: string,
  elevation?: number
): GPXWaypoint => ({
  lat,
  lng,
  ...(name && { name }),
  ...(elevation && { elevation })
});

/**
 * Default test props for DirectLeafletMap component
 */
export const getDefaultMapProps = () => ({
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
});

/**
 * Advances timers for common test scenarios
 */
export const advanceMapInitialization = () => {
  // checkDimensions delay
  jest.advanceTimersByTime(50);
  // invalidateSize timeout
  jest.advanceTimersByTime(100);
};

/**
 * Waits for map to be fully initialized
 */
export const waitForMapInitialization = async () => {
  advanceMapInitialization();
  // Additional wait for async operations
  await new Promise(resolve => setTimeout(resolve, 0));
};