/**
 * Test to verify the profile API response structure includes socialLinks
 */

import { NextRequest } from 'next/server';
import { PUT } from '@/app/api/profile/update/route';
import { prisma } from '@/lib/core/prisma';
import { auth } from '@/auth';

// Mock the auth function
jest.mock('@/auth');
const mockAuth = auth as jest.MockedFunction<typeof auth>;

// Mock Prisma
jest.mock('@/lib/core/prisma', () => ({
  prisma: {
    user: {
      update: jest.fn(),
    },
  },
}));

const mockPrismaUpdate = prisma.user.update as jest.MockedFunction<typeof prisma.user.update>;

describe('Profile API Response Structure', () => {
  const mockUserId = 'test-user-id';
  const mockSession = {
    user: { id: mockUserId },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession as any);
  });

  it('should return response with correct structure including socialLinks', async () => {
    const requestBody = {
      name: 'Test User',
      bio: 'Test bio',
      socialLinks: {
        instagram: 'https://instagram.com/testuser',
        website: 'https://example.com'
      }
    };

    const mockUpdatedUser = {
      id: mockUserId,
      name: 'Test User',
      bio: 'Test bio',
      email: 'test@example.com',
      socialLinks: {
        instagram: 'https://instagram.com/testuser',
        website: 'https://example.com/'
      }
    };

    mockPrismaUpdate.mockResolvedValue(mockUpdatedUser as any);

    const request = new NextRequest('http://localhost:3000/api/profile/update', {
      method: 'PUT',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await PUT(request);
    const data = await response.json();

    // Verify response structure
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('user');
    
    // Verify user object structure
    const user = data.user;
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('bio');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('socialLinks');
    
    // Verify socialLinks structure
    expect(user.socialLinks).toEqual({
      instagram: 'https://instagram.com/testuser',
      website: 'https://example.com/'
    });

    // Verify Prisma was called with correct select fields
    expect(mockPrismaUpdate).toHaveBeenCalledWith({
      where: { id: mockUserId },
      data: expect.any(Object),
      select: {
        id: true,
        name: true,
        bio: true,
        email: true,
        socialLinks: true
      }
    });
  });

  it('should handle null socialLinks in response', async () => {
    const requestBody = {
      name: 'Test User',
      socialLinks: {}
    };

    const mockUpdatedUser = {
      id: mockUserId,
      name: 'Test User',
      bio: null,
      email: 'test@example.com',
      socialLinks: null
    };

    mockPrismaUpdate.mockResolvedValue(mockUpdatedUser as any);

    const request = new NextRequest('http://localhost:3000/api/profile/update', {
      method: 'PUT',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.socialLinks).toBeNull();
  });
});