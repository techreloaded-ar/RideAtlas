import { getRangerProfile } from '@/lib/actions/ranger';
import { isValidUsername } from '@/lib/utils/validation';
import { prisma } from '@/lib/core/prisma';

// Mock Prisma client
jest.mock('@/lib/core/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
    },
    trip: {
      findMany: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('isValidUsername', () => {
  it('should return true for valid usernames', () => {
    expect(isValidUsername('John Doe')).toBe(true);
    expect(isValidUsername('john-doe')).toBe(true);
    expect(isValidUsername('john_doe')).toBe(true);
    expect(isValidUsername('JohnDoe123')).toBe(true);
  });

  it('should return false for invalid usernames', () => {
    expect(isValidUsername('')).toBe(false);
    expect(isValidUsername('a')).toBe(false); // Too short
    expect(isValidUsername('a'.repeat(101))).toBe(false); // Too long
    expect(isValidUsername('john@doe')).toBe(false); // Invalid char
    expect(isValidUsername('john<script>')).toBe(false); // XSS attempt
    expect(isValidUsername('john/doe')).toBe(false); // Invalid char
  });

  it('should return false for non-string inputs', () => {
    expect(isValidUsername(123 as any)).toBe(false);
    expect(isValidUsername(null as any)).toBe(false);
    expect(isValidUsername(undefined as any)).toBe(false);
  });
});

describe('getRangerProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return NOT_FOUND for invalid username format', async () => {
    const result = await getRangerProfile('a'); // Too short

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('NOT_FOUND');
    }
    expect(mockPrisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('should return profile + trips for valid Ranger', async () => {
    const mockUser = {
      id: 'user123',
      name: 'John Doe',
      image: 'https://example.com/avatar.jpg',
      bio: 'Test bio',
      socialLinks: {
        instagram: 'https://instagram.com/johndoe',
      },
    };

    const mockTrips = [
      {
        id: 'trip1',
        title: 'Trip 1',
        slug: 'trip-1',
        media: [{ url: 'https://example.com/trip1.jpg' }],
        duration_days: 5,
        created_at: new Date('2024-01-01'),
      },
      {
        id: 'trip2',
        title: 'Trip 2',
        slug: 'trip-2',
        media: [],
        duration_days: 3,
        created_at: new Date('2024-01-02'),
      },
    ];

    mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
    mockPrisma.trip.findMany.mockResolvedValue(mockTrips as any);

    const result = await getRangerProfile('John Doe');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ranger.id).toBe('user123');
      expect(result.data.ranger.name).toBe('John Doe');
      expect(result.data.ranger.bio).toBe('Test bio');
      expect(result.data.trips).toHaveLength(2);
      expect(result.data.trips[0].title).toBe('Trip 1');
      expect(result.data.trips[0].thumbnailUrl).toBe('https://example.com/trip1.jpg');
      expect(result.data.trips[1].thumbnailUrl).toBe(null); // Empty media array
      expect(result.data.totalTripsCount).toBe(2);
    }
  });

  it('should return NOT_FOUND for non-existent username', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);

    const result = await getRangerProfile('NonExistent');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('NOT_FOUND');
      expect(result.error.message).toBe('Ranger non trovato');
    }
  });

  it('should filter by Ranger/Sentinel role', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);

    await getRangerProfile('John Doe');

    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        name: 'John Doe',
        role: { in: ['Ranger', 'Sentinel'] },
      },
      select: expect.objectContaining({
        id: true,
        name: true,
        image: true,
        bio: true,
        socialLinks: true,
      }),
    });
  });

  it('CRITICAL: MUST NOT include email in response (FR-008)', async () => {
    const mockUser = {
      id: 'user123',
      name: 'John Doe',
      image: null,
      bio: null,
      socialLinks: null,
    };

    mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
    mockPrisma.trip.findMany.mockResolvedValue([]);

    const result = await getRangerProfile('John Doe');

    // Verify query does not select email
    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.not.objectContaining({
          email: expect.anything(),
        }),
      })
    );

    // Verify result does not contain email
    expect(result.success).toBe(true);
    if (result.success) {
      expect('email' in result.data.ranger).toBe(false);
      expect(JSON.stringify(result.data)).not.toContain('email');
    }
  });

  it('should return empty trips array for Ranger with no published trips', async () => {
    const mockUser = {
      id: 'user123',
      name: 'John Doe',
      image: null,
      bio: null,
      socialLinks: null,
    };

    mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
    mockPrisma.trip.findMany.mockResolvedValue([]);

    const result = await getRangerProfile('John Doe');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.trips).toEqual([]);
      expect(result.data.totalTripsCount).toBe(0);
    }
  });

  it('should limit trips to 20 most recent', async () => {
    const mockUser = {
      id: 'user123',
      name: 'John Doe',
      image: null,
      bio: null,
      socialLinks: null,
    };

    mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
    mockPrisma.trip.findMany.mockResolvedValue([]);

    await getRangerProfile('John Doe');

    expect(mockPrisma.trip.findMany).toHaveBeenCalledWith({
      where: {
        user_id: 'user123',
        status: 'Pubblicato',
      },
      select: expect.objectContaining({
        id: true,
        title: true,
        slug: true,
        media: true,
        duration_days: true,
        created_at: true,
      }),
      orderBy: {
        created_at: 'desc', // Most recent first
      },
      take: 20, // Limit to 20
    });
  });

  it('should only include trips with status = Pubblicato', async () => {
    const mockUser = {
      id: 'user123',
      name: 'John Doe',
      image: null,
      bio: null,
      socialLinks: null,
    };

    mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
    mockPrisma.trip.findMany.mockResolvedValue([]);

    await getRangerProfile('John Doe');

    expect(mockPrisma.trip.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'Pubblicato',
        }),
      })
    );
  });

  it('should order trips by created_at DESC', async () => {
    const mockUser = {
      id: 'user123',
      name: 'John Doe',
      image: null,
      bio: null,
      socialLinks: null,
    };

    mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
    mockPrisma.trip.findMany.mockResolvedValue([]);

    await getRangerProfile('John Doe');

    expect(mockPrisma.trip.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          created_at: 'desc',
        },
      })
    );
  });

  it('should handle database errors gracefully', async () => {
    mockPrisma.user.findFirst.mockRejectedValue(new Error('Database error'));

    const result = await getRangerProfile('John Doe');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('NOT_FOUND');
    }
  });

  it('should set distanceKm to null for MVP', async () => {
    const mockUser = {
      id: 'user123',
      name: 'John Doe',
      image: null,
      bio: null,
      socialLinks: null,
    };

    const mockTrips = [
      {
        id: 'trip1',
        title: 'Trip 1',
        slug: 'trip-1',
        media: [],
        duration_days: 5,
        created_at: new Date(),
      },
    ];

    mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
    mockPrisma.trip.findMany.mockResolvedValue(mockTrips as any);

    const result = await getRangerProfile('John Doe');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.trips[0].distanceKm).toBe(null);
    }
  });

  it('should set isActive to true for MVP', async () => {
    const mockUser = {
      id: 'user123',
      name: 'John Doe',
      image: null,
      bio: null,
      socialLinks: null,
    };

    mockPrisma.user.findFirst.mockResolvedValue(mockUser as any);
    mockPrisma.trip.findMany.mockResolvedValue([]);

    const result = await getRangerProfile('John Doe');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ranger.isActive).toBe(true);
    }
  });
});
