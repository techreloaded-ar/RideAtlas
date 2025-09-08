import { NextRequest } from 'next/server';
import { GET } from '@/app/api/profile/stats/route';
import { auth } from '@/auth';
import { prisma } from '@/lib/core/prisma';
import { TripStatus } from '@prisma/client';

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

  it('should return profile stats including socialLinks', async () => {
    // Mock authenticated user
    mockAuth.mockResolvedValue({
      user: { id: 'user-123' },
    } as any);

    // Mock database responses
    mockPrisma.trip.count.mockResolvedValue(2);
    mockPrisma.trip.findMany.mockResolvedValue([
      { gpxFile: { distance: 100 } },
      { gpxFile: { distance: 150 } },
    ] as any);
    mockPrisma.tripPurchase.findMany.mockResolvedValue([
      { trip: { gpxFile: { distance: 200 } } },
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

  it('should handle users without socialLinks (backward compatibility)', async () => {
    // Mock authenticated user
    mockAuth.mockResolvedValue({
      user: { id: 'user-123' },
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

  it('should return 401 for unauthenticated users', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Non autorizzato');
  });
});