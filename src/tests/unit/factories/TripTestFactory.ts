// src/tests/unit/factories/TripTestFactory.ts
/**
 * Factory pattern for creating test scenarios for Trip and Stage API tests
 * Provides consistent test data and scenarios across different test files
 */

import { NextRequest } from 'next/server';
import { UserRole } from '@/types/profile';
import { MediaItem } from '@/types/trip';

export interface TestUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface TestTrip {
  id: string;
  title: string;
  summary?: string;
  destination?: string;
  duration_days?: number;
  duration_nights?: number;
  tags?: string[];
  theme?: string;
  characteristics?: string[];
  recommended_seasons?: string[];
  media?: MediaItem[];
  slug?: string;
  status?: string;
  created_at?: Date;
  updated_at?: Date;
  user_id: string;
  user?: {
    id: string;
    role: UserRole;
  };
  stages?: TestStage[];
  insights?: string | null;
  gpxFile?: any;
}

export interface TestStage {
  id: string;
  tripId: string;
  orderIndex: number;
  title: string;
  description: string;
  routeType: string;
  media: MediaItem[];
  gpxFile: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthScenario {
  name: string;
  description: string;
  user: TestUser | null;
  session: {
    user: TestUser;
    expires: string;
  } | null;
  expectedStatus?: number;
  expectedError?: string;
}

export interface TripAPIScenario {
  name: string;
  description: string;
  trip: TestTrip;
  authUser: TestUser;
  expectedBehavior: {
    shouldSucceed: boolean;
    expectedStatus: number;
    shouldCallPrisma?: boolean;
  };
}

export interface StageAPIScenario {
  name: string;
  description: string;
  stage: TestStage;
  stageData?: Partial<TestStage>;
  trip: TestTrip;
  authUser: TestUser;
  expectedBehavior: {
    shouldSucceed: boolean;
    expectedStatus: number;
    shouldCallStageUtils?: boolean;
  };
}

export class TripTestFactory {
  /**
   * Creates test users with different roles
   */
  static createUserScenarios(): {
    tripOwner: TestUser;
    sentinel: TestUser;
    explorer: TestUser;
    anotherRanger: TestUser;
  } {
    return {
      tripOwner: {
        id: 'user-123',
        name: 'Trip Owner',
        email: 'owner@example.com',
        role: UserRole.Ranger,
      },
      sentinel: {
        id: 'sentinel-456',
        name: 'Sentinel User',
        email: 'sentinel@example.com',
        role: UserRole.Sentinel,
      },
      explorer: {
        id: 'explorer-789',
        name: 'Explorer User',
        email: 'explorer@example.com',
        role: UserRole.Explorer,
      },
      anotherRanger: {
        id: 'ranger-999',
        name: 'Another Ranger',
        email: 'ranger@example.com',
        role: UserRole.Ranger,
      },
    };
  }

  /**
   * Creates authentication scenarios for testing
   */
  static createAuthScenarios(): AuthScenario[] {
    const users = this.createUserScenarios();

    return [
      {
        name: 'Authenticated Trip Owner',
        description: 'User who owns the trip',
        user: users.tripOwner,
        session: {
          user: users.tripOwner,
          expires: '2024-12-31T23:59:59.999Z',
        },
      },
      {
        name: 'Authenticated Sentinel',
        description: 'Sentinel user with admin privileges',
        user: users.sentinel,
        session: {
          user: users.sentinel,
          expires: '2024-12-31T23:59:59.999Z',
        },
      },
      {
        name: 'Authenticated Explorer',
        description: 'Explorer user with limited privileges',
        user: users.explorer,
        session: {
          user: users.explorer,
          expires: '2024-12-31T23:59:59.999Z',
        },
        expectedStatus: 403,
        expectedError:
          'Non hai i permessi per visualizzare le tappe di questo viaggio',
      },
      {
        name: 'Unauthenticated User',
        description: 'No authentication session',
        user: null,
        session: null,
        expectedStatus: 401,
        expectedError: 'Non autorizzato',
      },
    ];
  }

  /**
   * Creates basic media items for testing
   */
  static createMediaItems(): MediaItem[] {
    return [
      {
        id: 'media-1',
        type: 'image',
        url: 'https://example.com/image.jpg',
        caption: 'Immagine di test',
      },
      {
        id: 'media-2',
        type: 'video',
        url: 'https://www.youtube.com/embed/abcdef12345',
        thumbnailUrl:
          'https://img.youtube.com/vi/abcdef12345/maxresdefault.jpg',
        caption: 'Video di test',
      },
    ];
  }

  /**
   * Creates a basic trip scenario
   */
  static createBasicTrip(): TestTrip {
    const users = this.createUserScenarios();

    return {
      id: 'trip-123',
      title: 'Test Trip',
      summary: 'Un viaggio di test per verificare la funzionalità',
      destination: 'Destinazione test',
      duration_days: 3,
      duration_nights: 2,
      tags: ['test', 'basic'],
      theme: 'Avventura',
      characteristics: ['Percorso panoramico'],
      recommended_seasons: ['Estate'],
      media: [],
      slug: 'test-trip',
      status: 'Bozza',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
      user_id: users.tripOwner.id,
      user: {
        id: users.tripOwner.id,
        role: users.tripOwner.role,
      },
      stages: [],
    };
  }

  /**
   * Creates a trip with media items
   */
  static createTripWithMedia(): TestTrip {
    const basicTrip = this.createBasicTrip();
    const mediaItems = this.createMediaItems();

    return {
      ...basicTrip,
      title: 'Viaggio Test con Media',
      summary: 'Un viaggio di test per verificare la funzionalità dei media',
      duration_days: 5,
      duration_nights: 4,
      tags: ['test', 'media', 'integrazione'],
      media: mediaItems,
      slug: 'viaggio-test-con-media',
    };
  }

  /**
   * Creates a basic stage
   */
  static createBasicStage(tripId: string = 'trip-123'): TestStage {
    return {
      id: 'stage-123',
      tripId,
      orderIndex: 0,
      title: 'Prima Tappa',
      description: 'Descrizione della prima tappa',
      routeType: 'Mountain',
      media: [],
      gpxFile: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };
  }

  /**
   * Creates a trip with stages
   */
  static createTripWithStages(): TestTrip {
    const basicTrip = this.createBasicTrip();
    const stage1 = this.createBasicStage(basicTrip.id);
    const stage2 = {
      ...stage1,
      id: 'stage-456',
      orderIndex: 1,
      title: 'Seconda Tappa',
      description: 'Descrizione della seconda tappa',
      routeType: 'Highway',
    };

    return {
      ...basicTrip,
      title: 'Trip with Stages',
      stages: [stage1, stage2],
    };
  }

  /**
   * Creates valid stage data for POST/PUT requests
   */
  static createValidStageData(): Partial<TestStage> {
    return {
      title: 'Nuova Tappa',
      description: 'Descrizione della nuova tappa',
      routeType: 'Highway',
      media: [],
      gpxFile: null,
    };
  }

  /**
   * Creates invalid stage data for validation testing
   */
  static createInvalidStageData(): Partial<TestStage> {
    return {
      title: 'AB', // Too short
      description: '',
      routeType: 'InvalidType',
    };
  }

  /**
   * Creates a mock NextRequest for API testing
   */
  static createMockRequest(
    method: string,
    body?: unknown,
    tripId: string = 'trip-123',
    stageId?: string
  ): NextRequest {
    const baseUrl = `http://localhost/api/trips/${tripId}/stages`;
    const url = stageId ? `${baseUrl}/${stageId}` : baseUrl;

    return new NextRequest(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Creates mock route params
   */
  static createMockParams(tripId: string, stageId?: string) {
    return {
      params: stageId ? { id: tripId, stageId } : { id: tripId },
    };
  }

  /**
   * Creates trip API test scenarios
   */
  static createTripAPIScenarios(): TripAPIScenario[] {
    const users = this.createUserScenarios();
    const basicTrip = this.createBasicTrip();
    const tripWithMedia = this.createTripWithMedia();

    return [
      {
        name: 'Create Trip Success',
        description: 'Successfully create a trip as trip owner',
        trip: basicTrip,
        authUser: users.tripOwner,
        expectedBehavior: {
          shouldSucceed: true,
          expectedStatus: 201,
          shouldCallPrisma: true,
        },
      },
      {
        name: 'Create Trip with Media',
        description: 'Successfully create a trip with media items',
        trip: tripWithMedia,
        authUser: users.tripOwner,
        expectedBehavior: {
          shouldSucceed: true,
          expectedStatus: 201,
          shouldCallPrisma: true,
        },
      },
      {
        name: 'Unauthorized Access',
        description: 'Fail to create trip without authentication',
        trip: basicTrip,
        authUser: users.explorer, // Will be set to null in test
        expectedBehavior: {
          shouldSucceed: false,
          expectedStatus: 401,
          shouldCallPrisma: false,
        },
      },
    ];
  }

  /**
   * Creates stage API test scenarios
   */
  static createStageAPIScenarios(): StageAPIScenario[] {
    const users = this.createUserScenarios();
    const trip = this.createBasicTrip();
    const stage = this.createBasicStage();
    const validStageData = this.createValidStageData();
    const invalidStageData = this.createInvalidStageData();

    return [
      {
        name: 'Create Stage Success',
        description: 'Successfully create a stage as trip owner',
        stage,
        stageData: validStageData,
        trip,
        authUser: users.tripOwner,
        expectedBehavior: {
          shouldSucceed: true,
          expectedStatus: 201,
          shouldCallStageUtils: true,
        },
      },
      {
        name: 'Create Stage Invalid Data',
        description: 'Fail to create stage with invalid data',
        stage,
        stageData: invalidStageData,
        trip,
        authUser: users.tripOwner,
        expectedBehavior: {
          shouldSucceed: false,
          expectedStatus: 400,
          shouldCallStageUtils: false,
        },
      },
      {
        name: 'Unauthorized Stage Access',
        description: 'Fail to access stage without proper permissions',
        stage,
        trip,
        authUser: users.explorer,
        expectedBehavior: {
          shouldSucceed: false,
          expectedStatus: 403,
          shouldCallStageUtils: false,
        },
      },
    ];
  }

  /**
   * Creates trip with insights for testing
   */
  static createTripWithInsights(): TestTrip {
    const basicTrip = this.createBasicTrip();

    return {
      ...basicTrip,
      id: 'trip-456',
      title: 'Viaggio con insights',
      summary: 'Un viaggio con approfondimenti dettagliati',
      destination: 'Toscana',
      duration_days: 7,
      duration_nights: 6,
      tags: ['toscana', 'cultura', 'vino'],
      theme: 'Culturale',
      characteristics: ['Città storiche', 'Strade panoramiche'],
      recommended_seasons: ['Primavera'],
      insights:
        'La Toscana è una regione ricca di storia e cultura. Durante questo viaggio potrai visitare luoghi famosi come Firenze, Siena e San Gimignano, conoscere la loro storia e assaporare la cucina locale.',
      slug: 'viaggio-toscana-insights',
    };
  }

  /**
   * Creates trips for analysis service testing
   */
  static createTripsForAnalysis(): TestTrip[] {
    const users = this.createUserScenarios();

    return [
      {
        id: '1',
        title: 'Viaggio in Toscana',
        summary: 'Bellissimo viaggio tra le colline toscane',
        destination: 'Toscana',
        duration_days: 3,
        duration_nights: 2,
        tags: ['natura', 'cultura'],
        theme: 'Cultura e paesaggio',
        characteristics: ['Curve strette', 'Bel paesaggio'],
        recommended_seasons: ['Primavera', 'Estate'],
        slug: 'viaggio-toscana',
        user_id: users.tripOwner.id,
        media: [],
        status: 'Pubblicato',
        created_at: new Date(),
        updated_at: new Date(),
        // Simula GPX data per analysis
        gpxFile: {
          url: 'toscana.gpx',
          filename: 'toscana.gpx',
          waypoints: 15,
          distance: 250000, // 250km in metri
          elevationGain: 1200,
          elevationLoss: 1000,
          isValid: true,
        },
      },
      {
        id: '2',
        title: 'Avventura in Veneto',
        summary: 'Percorso mozzafiato nel Veneto',
        destination: 'Veneto',
        duration_days: 5,
        duration_nights: 4,
        tags: ['montagna', 'avventura'],
        theme: 'Montagna e avventura',
        characteristics: ['Curve strette', 'Strade sterrate'],
        recommended_seasons: ['Estate', 'Autunno'],
        slug: 'avventura-veneto',
        user_id: users.tripOwner.id,
        media: [],
        status: 'Pubblicato',
        created_at: new Date(),
        updated_at: new Date(),
        gpxFile: {
          url: 'veneto.gpx',
          filename: 'veneto.gpx',
          waypoints: 25,
          distance: 400000, // 400km in metri
          elevationGain: 2500,
          elevationLoss: 2200,
          isValid: true,
        },
      },
      {
        id: '3',
        title: 'Costa Amalfitana',
        summary: 'Viaggio lungo la splendida costiera amalfitana',
        destination: 'Amalfi',
        duration_days: 2,
        duration_nights: 1,
        tags: ['mare', 'panorama'],
        theme: 'Mare e relax',
        characteristics: ['Bel paesaggio', 'Curve strette'],
        recommended_seasons: ['Primavera', 'Estate'],
        slug: 'costa-amalfitana',
        user_id: users.tripOwner.id,
        media: [],
        status: 'Pubblicato',
        created_at: new Date(),
        updated_at: new Date(),
        gpxFile: null, // Nessun GPX per questo viaggio
      },
    ];
  }

  /**
   * Creates stages for trip utilities testing
   */
  static createStagesForUtils(): {
    stage1: TestStage;
    stage2: TestStage;
    stage3: TestStage;
  } {
    return {
      stage1: {
        id: 'stage-1',
        tripId: 'trip-multi-1',
        orderIndex: 0,
        title: 'Prima tappa',
        description: 'Descrizione prima tappa',
        routeType: 'Asfalto',
        media: [],
        gpxFile: {
          url: 'stage1.gpx',
          filename: 'stage1.gpx',
          waypoints: 50,
          distance: 8000, // 8km
          elevationGain: 200,
          elevationLoss: 150,
          isValid: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      stage2: {
        id: 'stage-2',
        tripId: 'trip-multi-1',
        orderIndex: 1,
        title: 'Seconda tappa',
        description: 'Descrizione seconda tappa',
        routeType: 'Sterrato',
        media: [],
        gpxFile: {
          url: 'stage2.gpx',
          filename: 'stage2.gpx',
          waypoints: 75,
          distance: 12000, // 12km
          elevationGain: 300,
          elevationLoss: 250,
          isValid: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      stage3: {
        id: 'stage-3',
        tripId: 'trip-multi-1',
        orderIndex: 2,
        title: 'Terza tappa',
        description: 'Descrizione terza tappa',
        routeType: 'Misto',
        media: [],
        gpxFile: null, // Tappa senza GPX
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  }

  /**
   * Creates trips for utilities testing
   */
  static createTripsForUtils(): {
    legacyTrip: TestTrip;
    multiStageTrip: TestTrip;
    emptyStagesTrip: TestTrip;
  } {
    const users = this.createUserScenarios();
    const stages = this.createStagesForUtils();

    const legacyTrip: TestTrip = {
      id: 'trip-legacy-1',
      title: 'Viaggio Legacy',
      summary: 'Un viaggio tradizionale',
      destination: 'Roma',
      duration_days: 3,
      duration_nights: 2,
      tags: ['montagna'],
      theme: 'natura',
      characteristics: ['panoramico'],
      recommended_seasons: ['Primavera'],
      media: [],
      gpxFile: {
        url: 'test.gpx',
        filename: 'test.gpx',
        waypoints: 100,
        distance: 15000, // 15km
        elevationGain: 500,
        elevationLoss: 400,
        isValid: true,
      },
      insights: null,
      slug: 'viaggio-legacy',
      status: 'Pubblicato',
      created_at: new Date(),
      updated_at: new Date(),
      user_id: users.tripOwner.id,
    };

    const multiStageTrip: TestTrip = {
      ...legacyTrip,
      id: 'trip-multi-1',
      title: 'Viaggio Multi-Tappa',
      slug: 'viaggio-multi-tappa',
      stages: [stages.stage1, stages.stage2, stages.stage3],
    };

    const emptyStagesTrip: TestTrip = {
      ...legacyTrip,
      id: 'trip-empty-stages',
      title: 'Viaggio con Stages Vuote',
      slug: 'viaggio-empty-stages',
      stages: [],
    };

    return {
      legacyTrip,
      multiStageTrip,
      emptyStagesTrip,
    };
  }

  /**
   * Gets all available test scenarios
   */
  static getAllScenarios(): {
    users: ReturnType<typeof TripTestFactory.createUserScenarios>;
    authScenarios: AuthScenario[];
    trips: {
      basic: TestTrip;
      withMedia: TestTrip;
      withStages: TestTrip;
      withInsights: TestTrip;
    };
    stages: {
      basic: TestStage;
      validData: Partial<TestStage>;
      invalidData: Partial<TestStage>;
    };
    apiScenarios: {
      trip: TripAPIScenario[];
      stage: StageAPIScenario[];
    };
    analysisTrips: TestTrip[];
    utilsTrips: {
      legacyTrip: TestTrip;
      multiStageTrip: TestTrip;
      emptyStagesTrip: TestTrip;
    };
    utilsStages: {
      stage1: TestStage;
      stage2: TestStage;
      stage3: TestStage;
    };
  } {
    return {
      users: this.createUserScenarios(),
      authScenarios: this.createAuthScenarios(),
      trips: {
        basic: this.createBasicTrip(),
        withMedia: this.createTripWithMedia(),
        withStages: this.createTripWithStages(),
        withInsights: this.createTripWithInsights(),
      },
      stages: {
        basic: this.createBasicStage(),
        validData: this.createValidStageData(),
        invalidData: this.createInvalidStageData(),
      },
      apiScenarios: {
        trip: this.createTripAPIScenarios(),
        stage: this.createStageAPIScenarios(),
      },
      analysisTrips: this.createTripsForAnalysis(),
      utilsTrips: this.createTripsForUtils(),
      utilsStages: this.createStagesForUtils(),
    };
  }
}
