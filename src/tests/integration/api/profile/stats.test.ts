import { NextRequest } from 'next/server';
import { GET } from '@/app/api/profile/stats/route';
import { auth } from '@/auth';
import { prisma } from '@/lib/core/prisma';
import { TripStatus } from '@prisma/client';
import { UserRole } from '@/types/profile';

// Mock dependencies
jest.mock('@/auth');
jest.mock('@/lib/core/prisma', () => ({
  prisma: {
    trip: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    tripPurchase: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('/api/profile/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return profile stats for Ranger including socialLinks', async () => {
    // Mock authenticated user
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', role: UserRole.Ranger },
    } as any);

    // Mock database responses (distanze in metri)
    mockPrisma.trip.count.mockResolvedValue(2);
    mockPrisma.trip.findMany.mockResolvedValue([
      { gpxFile: { distance: 100000 }, stages: [] }, // 100 km
      { gpxFile: { distance: 150000 }, stages: [] }, // 150 km
    ] as any);
    mockPrisma.tripPurchase.findMany.mockResolvedValue([
      { trip: { gpxFile: { distance: 200000 }, stages: [] } }, // 200 km
    ] as any);
    mockPrisma.user.findUnique.mockResolvedValue({
      createdAt: new Date('2023-01-01'),
      socialLinks: {
        instagram: 'https://instagram.com/user',
        youtube: 'https://youtube.com/@user',
      },
      name: 'Test User',
      bio: 'Test bio',
      email: 'test@example.com',
    } as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      tripsCreated: 2,
      totalKilometers: 450,
      memberSince: expect.any(String),
      user: {
        id: 'user-123',
        name: 'Test User',
        bio: 'Test bio',
        email: 'test@example.com',
        socialLinks: {
          instagram: 'https://instagram.com/user',
          youtube: 'https://youtube.com/@user',
        },
      },
    });
  });

  it('should handle Sentinel users without socialLinks (backward compatibility)', async () => {
    // Mock authenticated user
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', role: UserRole.Sentinel },
    } as any);

    // Mock database responses
    mockPrisma.trip.count.mockResolvedValue(0);
    mockPrisma.trip.findMany.mockResolvedValue([]);
    mockPrisma.tripPurchase.findMany.mockResolvedValue([]);
    mockPrisma.user.findUnique.mockResolvedValue({
      createdAt: new Date('2023-01-01'),
      socialLinks: null, // User without social links
      name: 'Test User',
      bio: null,
      email: 'test@example.com',
    } as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.socialLinks).toBeNull();
  });

  it('should calculate distance from stages for multi-stage trips', async () => {
    // Mock authenticated user
    mockAuth.mockResolvedValue({
      user: { id: 'user-456', role: UserRole.Ranger },
    } as any);

    // Mock database responses with multi-stage trip (distanze in metri)
    mockPrisma.trip.count.mockResolvedValue(1);
    mockPrisma.trip.findMany.mockResolvedValue([
      {
        gpxFile: { distance: 999 }, // This should be IGNORED
        stages: [
          {
            id: 'stage-1',
            tripId: 'trip-1',
            orderIndex: 1,
            title: 'Stage 1',
            description: null,
            routeType: null,
            duration: null,
            media: [],
            gpxFile: { distance: 50000 }, // 50 km
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'stage-2',
            tripId: 'trip-1',
            orderIndex: 2,
            title: 'Stage 2',
            description: null,
            routeType: null,
            duration: null,
            media: [],
            gpxFile: { distance: 75000 }, // 75 km
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      }
    ] as any);
    mockPrisma.tripPurchase.findMany.mockResolvedValue([]);
    mockPrisma.user.findUnique.mockResolvedValue({
      createdAt: new Date('2023-01-01'),
      socialLinks: null,
      name: 'Test Ranger',
      bio: null,
      email: 'ranger@example.com',
    } as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    // Should sum stage distances (50000 + 75000 = 125000 meters), convertiti in km = 125
    expect(data.totalKilometers).toBe(125);
  });

  it('should calculate distance from trip gpxFile for single-stage trips', async () => {
    // Mock authenticated user
    mockAuth.mockResolvedValue({
      user: { id: 'user-789', role: UserRole.Ranger },
    } as any);

    // Mock database responses with single-stage trip (no stages, distanze in metri)
    mockPrisma.trip.count.mockResolvedValue(1);
    mockPrisma.trip.findMany.mockResolvedValue([
      {
        gpxFile: { distance: 100000 }, // 100 km
        stages: [] // No stages
      }
    ] as any);
    mockPrisma.tripPurchase.findMany.mockResolvedValue([]);
    mockPrisma.user.findUnique.mockResolvedValue({
      createdAt: new Date('2023-01-01'),
      socialLinks: null,
      name: 'Test Ranger 2',
      bio: null,
      email: 'ranger2@example.com',
    } as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    // Should use trip.gpxFile.distance (100000 meters) convertiti in km = 100
    expect(data.totalKilometers).toBe(100);
  });

  it('should return only basic info for Explorer users without calculating stats', async () => {
    // Mock authenticated Explorer user
    mockAuth.mockResolvedValue({
      user: { id: 'user-456', role: UserRole.Explorer },
    } as any);

    // Mock database response - only user info
    mockPrisma.user.findUnique.mockResolvedValue({
      createdAt: new Date('2023-06-15'),
      socialLinks: null,
      name: 'Explorer User',
      bio: 'Just exploring',
      email: 'explorer@example.com',
    } as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      memberSince: expect.any(String),
      user: {
        id: 'user-456',
        name: 'Explorer User',
        bio: 'Just exploring',
        email: 'explorer@example.com',
        socialLinks: null,
      },
    });
    // Verify that trip stats are not included
    expect(data.tripsCreated).toBeUndefined();
    expect(data.totalKilometers).toBeUndefined();
    // Verify that trip queries were not called for Explorer
    expect(mockPrisma.trip.count).not.toHaveBeenCalled();
    expect(mockPrisma.trip.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.tripPurchase.findMany).not.toHaveBeenCalled();
  });

  it('should return 401 for unauthenticated users', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Non autorizzato');
  });

  describe('Distance Unit Conversion (Meters to Kilometers)', () => {
    /**
     * REGRESSION TEST SUITE
     *
     * Questi test documentano e verificano che le distanze vengano sempre convertite
     * correttamente da metri (come memorizzate nel DB) a chilometri (come mostrate all'utente).
     *
     * IMPORTANTE: Le distanze GPX sono SEMPRE memorizzate in METRI nel database.
     * L'API deve convertirle in CHILOMETRI per la visualizzazione.
     */

    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-conversion-test', role: UserRole.Ranger },
      } as any);
      mockPrisma.user.findUnique.mockResolvedValue({
        createdAt: new Date('2023-01-01'),
        socialLinks: null,
        name: 'Test User',
        bio: null,
        email: 'test@example.com',
      } as any);
      mockPrisma.trip.count.mockResolvedValue(1);
    });

    it('should convert 1000 meters to 1 kilometer exactly', async () => {
      mockPrisma.trip.findMany.mockResolvedValue([
        { gpxFile: { distance: 1000 }, stages: [] }
      ] as any);
      mockPrisma.tripPurchase.findMany.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(data.totalKilometers).toBe(1);
    });

    it('should convert 5500 meters to 5.5 kilometers with correct precision', async () => {
      mockPrisma.trip.findMany.mockResolvedValue([
        { gpxFile: { distance: 5500 }, stages: [] }
      ] as any);
      mockPrisma.tripPurchase.findMany.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(data.totalKilometers).toBe(5.5);
    });

    it('should round 12345 meters to 12.35 kilometers (2 decimal places)', async () => {
      mockPrisma.trip.findMany.mockResolvedValue([
        { gpxFile: { distance: 12345 }, stages: [] }
      ] as any);
      mockPrisma.tripPurchase.findMany.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      // 12345 / 1000 = 12.345, arrotondato a 2 decimali = 12.35
      expect(data.totalKilometers).toBe(12.35);
    });

    it('should correctly sum created trips + purchased trips in kilometers', async () => {
      // Viaggio creato: 50 km (50000 metri)
      mockPrisma.trip.findMany.mockResolvedValue([
        { gpxFile: { distance: 50000 }, stages: [] }
      ] as any);

      // Viaggio acquistato: 30 km (30000 metri)
      mockPrisma.tripPurchase.findMany.mockResolvedValue([
        { trip: { gpxFile: { distance: 30000 }, stages: [] } }
      ] as any);

      const response = await GET();
      const data = await response.json();

      // Totale: 50 + 30 = 80 km
      expect(data.totalKilometers).toBe(80);
    });

    it('should handle realistic motorcycle trip distances (250km trip)', async () => {
      // Viaggio realistico in moto: 250 km = 250000 metri
      mockPrisma.trip.findMany.mockResolvedValue([
        { gpxFile: { distance: 250000 }, stages: [] }
      ] as any);
      mockPrisma.tripPurchase.findMany.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(data.totalKilometers).toBe(250);
    });

    it('should correctly convert multi-stage trip distances to kilometers', async () => {
      // Viaggio multi-tappa:
      // Tappa 1: 120 km (120000 metri)
      // Tappa 2: 85.5 km (85500 metri)
      // Totale atteso: 205.5 km
      mockPrisma.trip.findMany.mockResolvedValue([
        {
          gpxFile: { distance: 999999 }, // Deve essere ignorato
          stages: [
            {
              id: 'stage-1',
              tripId: 'trip-1',
              orderIndex: 1,
              title: 'Stage 1',
              description: null,
              routeType: null,
              duration: null,
              media: [],
              gpxFile: { distance: 120000 }, // 120 km
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'stage-2',
              tripId: 'trip-1',
              orderIndex: 2,
              title: 'Stage 2',
              description: null,
              routeType: null,
              duration: null,
              media: [],
              gpxFile: { distance: 85500 }, // 85.5 km
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]
        }
      ] as any);
      mockPrisma.tripPurchase.findMany.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      // 120 + 85.5 = 205.5 km
      expect(data.totalKilometers).toBe(205.5);
    });

    it('should handle very small distances (500 meters = 0.5 km)', async () => {
      mockPrisma.trip.findMany.mockResolvedValue([
        { gpxFile: { distance: 500 }, stages: [] }
      ] as any);
      mockPrisma.tripPurchase.findMany.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(data.totalKilometers).toBe(0.5);
    });

    it('should handle zero distance correctly', async () => {
      mockPrisma.trip.findMany.mockResolvedValue([
        { gpxFile: { distance: 0 }, stages: [] }
      ] as any);
      mockPrisma.tripPurchase.findMany.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(data.totalKilometers).toBe(0);
    });

    it('should handle complex rounding case: 123456 meters = 123.46 km', async () => {
      mockPrisma.trip.findMany.mockResolvedValue([
        { gpxFile: { distance: 123456 }, stages: [] }
      ] as any);
      mockPrisma.tripPurchase.findMany.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      // 123456 / 1000 = 123.456, arrotondato a 2 decimali = 123.46
      expect(data.totalKilometers).toBe(123.46);
    });

    it('should sum multiple trips with different decimal precisions correctly', async () => {
      // Trip 1: 12.345 km (12345 metri)
      // Trip 2: 23.456 km (23456 metri)
      // Totale grezzo: 35.801 km
      // Totale arrotondato: 35.8 km
      mockPrisma.trip.findMany.mockResolvedValue([
        { gpxFile: { distance: 12345 }, stages: [] },
        { gpxFile: { distance: 23456 }, stages: [] }
      ] as any);
      mockPrisma.tripPurchase.findMany.mockResolvedValue([]);
      mockPrisma.trip.count.mockResolvedValue(2);

      const response = await GET();
      const data = await response.json();

      // (12345 + 23456) / 1000 = 35.801, arrotondato a 2 decimali = 35.8
      expect(data.totalKilometers).toBe(35.8);
    });
  });
});