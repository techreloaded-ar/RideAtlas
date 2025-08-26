// src/tests/unit/factories/MapTestFactory.ts
/**
 * Factory pattern for creating test scenarios for DirectLeafletMap
 * Provides consistent test data and scenarios across different test files
 */

import { GPXTrack, GPXRoute, GPXWaypoint } from '@/types/gpx';
import { createTestGPXTrack, createTestGPXPoint, createTestGPXRoute, createTestGPXWaypoint } from '@/tests/unit/utils/test-helpers';

export interface MapTestScenario {
  name: string;
  description: string;
  props: {
    allTracks: GPXTrack[];
    routes: GPXRoute[];
    waypoints: GPXWaypoint[];
    visibleTracks: boolean[];
    visibleRoutes: boolean[];
    visibleWaypoints: boolean;
    center: [number, number];
    bounds: {
      southwest: { lat: number; lng: number };
      northeast: { lat: number; lng: number };
    } | null;
    defaultZoom: number;
    autoFit: boolean;
  };
  expectedBehavior: {
    shouldCreateMap: boolean;
    shouldCreateTracks: number;
    shouldCreateRoutes: number;
    shouldCreateWaypoints: number;
    shouldFitBounds: boolean;
  };
}

export class MapTestFactory {
  /**
   * Creates a basic empty map scenario
   */
  static createEmptyMapScenario(): MapTestScenario {
    return {
      name: 'Empty Map',
      description: 'Map with no tracks, routes, or waypoints',
      props: {
        allTracks: [],
        routes: [],
        waypoints: [],
        visibleTracks: [],
        visibleRoutes: [],
        visibleWaypoints: false,
        center: [45.0, 9.0],
        bounds: null,
        defaultZoom: 10,
        autoFit: false,
      },
      expectedBehavior: {
        shouldCreateMap: true,
        shouldCreateTracks: 0,
        shouldCreateRoutes: 0,
        shouldCreateWaypoints: 0,
        shouldFitBounds: false,
      },
    };
  }

  /**
   * Creates a scenario with a single track
   */
  static createSingleTrackScenario(): MapTestScenario {
    const track = createTestGPXTrack('Test Track', [
      createTestGPXPoint(45.0, 9.0, 100),
      createTestGPXPoint(45.1, 9.1, 110),
      createTestGPXPoint(45.2, 9.2, 120),
    ], '#3b82f6');

    return {
      name: 'Single Track',
      description: 'Map with one visible track',
      props: {
        allTracks: [track],
        routes: [],
        waypoints: [],
        visibleTracks: [true],
        visibleRoutes: [],
        visibleWaypoints: false,
        center: [45.1, 9.1],
        bounds: {
          southwest: { lat: 45.0, lng: 9.0 },
          northeast: { lat: 45.2, lng: 9.2 },
        },
        defaultZoom: 12,
        autoFit: true,
      },
      expectedBehavior: {
        shouldCreateMap: true,
        shouldCreateTracks: 1,
        shouldCreateRoutes: 0,
        shouldCreateWaypoints: 0,
        shouldFitBounds: true,
      },
    };
  }

  /**
   * Creates a scenario with multiple tracks and routes
   */
  static createComplexScenario(): MapTestScenario {
    const track1 = createTestGPXTrack('Track 1', [
      createTestGPXPoint(45.0, 9.0, 100),
      createTestGPXPoint(45.1, 9.1, 110),
    ], '#3b82f6');

    const track2 = createTestGPXTrack('Track 2', [
      createTestGPXPoint(46.0, 10.0, 200),
      createTestGPXPoint(46.1, 10.1, 210),
    ], '#dc2626');

    const route1 = createTestGPXRoute('Route 1', [
      createTestGPXPoint(45.5, 9.5, 150),
      createTestGPXPoint(45.6, 9.6, 160),
    ], '#10b981');

    const waypoint1 = createTestGPXWaypoint(45.05, 9.05, 'Waypoint 1', 105);
    const waypoint2 = createTestGPXWaypoint(46.05, 10.05, 'Waypoint 2', 205);

    return {
      name: 'Complex Scenario',
      description: 'Map with multiple tracks, routes, and waypoints',
      props: {
        allTracks: [track1, track2],
        routes: [route1],
        waypoints: [waypoint1, waypoint2],
        visibleTracks: [true, false], // Only first track visible
        visibleRoutes: [true],
        visibleWaypoints: true,
        center: [45.5, 9.5],
        bounds: {
          southwest: { lat: 45.0, lng: 9.0 },
          northeast: { lat:46.1, lng: 10.1 },
        },
        defaultZoom: 10,
        autoFit: true,
      },
      expectedBehavior: {
        shouldCreateMap: true,
        shouldCreateTracks: 1, // Only visible tracks
        shouldCreateRoutes: 1,
        shouldCreateWaypoints: 2,
        shouldFitBounds: true,
      },
    };
  }

  /**
   * Creates a scenario for testing visibility changes
   */
  static createVisibilityChangeScenario(): {
    initial: MapTestScenario;
    updated: MapTestScenario;
  } {
    const track = createTestGPXTrack('Toggle Track', [
      createTestGPXPoint(45.0, 9.0, 100),
      createTestGPXPoint(45.1, 9.1, 110),
    ], '#3b82f6');

    const baseProps = {
      allTracks: [track],
      routes: [],
      waypoints: [],
      visibleRoutes: [],
      visibleWaypoints: false,
      center: [45.0, 9.0] as [number, number],
      bounds: null,
      defaultZoom: 10,
      autoFit: false,
    };

    return {
      initial: {
        name: 'Track Hidden',
        description: 'Track initially hidden',
        props: {
          ...baseProps,
          visibleTracks: [false],
        },
        expectedBehavior: {
          shouldCreateMap: true,
          shouldCreateTracks: 0,
          shouldCreateRoutes: 0,
          shouldCreateWaypoints: 0,
          shouldFitBounds: false,
        },
      },
      updated: {
        name: 'Track Visible',
        description: 'Track made visible',
        props: {
          ...baseProps,
          visibleTracks: [true],
        },
        expectedBehavior: {
          shouldCreateMap: true,
          shouldCreateTracks: 1,
          shouldCreateRoutes: 0,
          shouldCreateWaypoints: 0,
          shouldFitBounds: false,
        },
      },
    };
  }

  /**
   * Creates error scenarios for testing error handling
   */
  static createErrorScenarios(): MapTestScenario[] {
    return [
      {
        name: 'Invalid Track Data',
        description: 'Track with empty points array',
        props: {
          allTracks: [createTestGPXTrack('Empty Track', [])],
          routes: [],
          waypoints: [],
          visibleTracks: [true],
          visibleRoutes: [],
          visibleWaypoints: false,
          center: [45.0, 9.0],
          bounds: null,
          defaultZoom: 10,
          autoFit: false,
        },
        expectedBehavior: {
          shouldCreateMap: true,
          shouldCreateTracks: 0, // Empty tracks shouldn't create polylines
          shouldCreateRoutes: 0,
          shouldCreateWaypoints: 0,
          shouldFitBounds: false,
        },
      },
    ];
  }

  /**
   * Gets all available test scenarios
   */
  static getAllScenarios(): MapTestScenario[] {
    const visibilityScenarios = this.createVisibilityChangeScenario();
    return [
      this.createEmptyMapScenario(),
      this.createSingleTrackScenario(),
      this.createComplexScenario(),
      visibilityScenarios.initial,
      visibilityScenarios.updated,
      ...this.createErrorScenarios(),
    ];
  }
}