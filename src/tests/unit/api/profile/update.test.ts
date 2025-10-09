import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies FIRST before any imports
const mockAuth = jest.fn();
const mockPrismaUser = {
  update: jest.fn(),
};
const mockValidateAndSanitizeUrl = jest.fn();

// Mock modules
jest.mock('@/auth', () => ({
  auth: mockAuth,
}));

jest.mock('@/lib/core/prisma', () => ({
  prisma: {
    user: mockPrismaUser,
  },
}));

jest.mock('@/lib/utils/url-sanitizer', () => ({
  validateAndSanitizeUrl: mockValidateAndSanitizeUrl,
}));

// Mock NextRequest
const createMockRequest = (body: any): any => {
  return {
    json: jest.fn().mockResolvedValue(body),
    headers: new Map(),
    cookies: new Map(),
  };
};

describe('PUT /api/profile/update', () => {
  let PUT: any;

  beforeAll(async () => {
    const routeModule = await import('@/app/api/profile/update/route');
    PUT = routeModule.PUT;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createMockRequest({ name: 'Test User' });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non autorizzato');
    });

    it('should reject requests without user ID', async () => {
      mockAuth.mockResolvedValue({ user: {} });

      const request = createMockRequest({ name: 'Test User' });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non autorizzato');
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    });

    it('should reject missing name', async () => {
      const request = createMockRequest({ bio: 'Test bio' });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Dati non validi');
    });

    it('should reject empty name', async () => {
      const request = createMockRequest({ name: '' });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Dati non validi');
    });

    it('should reject name longer than 100 characters', async () => {
      const request = createMockRequest({ name: 'a'.repeat(101) });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Dati non validi');
    });

    it('should reject bio longer than 1000 characters', async () => {
      const request = createMockRequest({
        name: 'Test User',
        bio: 'a'.repeat(1001),
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Dati non validi');
    });

    it('should reject bikeDescription longer than 500 characters', async () => {
      const request = createMockRequest({
        name: 'Test User',
        bikeDescription: 'a'.repeat(501),
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Dati non validi');
    });

    it('should accept valid input with all fields', async () => {
      mockPrismaUser.update.mockResolvedValue({
        id: 'test-user-id',
        name: 'Test User',
        bio: 'Test bio',
        bikeDescription: 'Test bike',
        email: 'test@example.com',
        socialLinks: null,
      });

      const request = createMockRequest({
        name: 'Test User',
        bio: 'Test bio',
        bikeDescription: 'Test bike',
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should accept valid input with only required fields', async () => {
      mockPrismaUser.update.mockResolvedValue({
        id: 'test-user-id',
        name: 'Test User',
        bio: null,
        bikeDescription: null,
        email: 'test@example.com',
        socialLinks: null,
      });

      const request = createMockRequest({ name: 'Test User' });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Social Links Validation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    });

    it('should validate and sanitize valid social links', async () => {
      mockValidateAndSanitizeUrl.mockReturnValue({
        isValid: true,
        sanitizedUrl: 'https://instagram.com/user',
      });

      mockPrismaUser.update.mockResolvedValue({
        id: 'test-user-id',
        name: 'Test User',
        bio: null,
        bikeDescription: null,
        email: 'test@example.com',
        socialLinks: { instagram: 'https://instagram.com/user' },
      });

      const request = createMockRequest({
        name: 'Test User',
        socialLinks: {
          instagram: 'https://instagram.com/user',
        },
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockValidateAndSanitizeUrl).toHaveBeenCalledWith('instagram', 'https://instagram.com/user');
    });

    it('should reject invalid social links', async () => {
      mockValidateAndSanitizeUrl.mockReturnValue({
        isValid: false,
        error: 'URL non valido per instagram',
      });

      const request = createMockRequest({
        name: 'Test User',
        socialLinks: {
          instagram: 'invalid-url',
        },
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Link social non validi');
      expect(data.details).toContain('instagram: URL non valido per instagram');
    });

    it('should handle multiple social links with mixed validity', async () => {
      mockValidateAndSanitizeUrl
        .mockReturnValueOnce({ isValid: true, sanitizedUrl: 'https://instagram.com/user' })
        .mockReturnValueOnce({ isValid: false, error: 'URL non valido' });

      const request = createMockRequest({
        name: 'Test User',
        socialLinks: {
          instagram: 'https://instagram.com/user',
          youtube: 'invalid-url',
        },
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Link social non validi');
    });

    it('should remove null/empty social links', async () => {
      mockPrismaUser.update.mockResolvedValue({
        id: 'test-user-id',
        name: 'Test User',
        bio: null,
        bikeDescription: null,
        email: 'test@example.com',
        socialLinks: null,
      });

      const request = createMockRequest({
        name: 'Test User',
        socialLinks: {
          instagram: '',
          youtube: '',
        },
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // When all links are empty, socialLinks should be undefined (not set)
      expect(mockPrismaUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            socialLinks: undefined,
          }),
        })
      );
    });

    it('should set socialLinks to null if all links are empty', async () => {
      mockPrismaUser.update.mockResolvedValue({
        id: 'test-user-id',
        name: 'Test User',
        bio: null,
        bikeDescription: null,
        email: 'test@example.com',
        socialLinks: null,
      });

      const request = createMockRequest({
        name: 'Test User',
        socialLinks: {
          instagram: '',
          youtube: '',
          facebook: '',
        },
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockValidateAndSanitizeUrl).not.toHaveBeenCalled();
    });
  });

  describe('Database Updates', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    });

    it('should update user with correct data structure', async () => {
      const mockUpdatedUser = {
        id: 'test-user-id',
        name: 'Updated Name',
        bio: 'Updated bio',
        bikeDescription: 'Updated bike',
        email: 'test@example.com',
        socialLinks: null,
      };

      mockPrismaUser.update.mockResolvedValue(mockUpdatedUser);

      const request = createMockRequest({
        name: 'Updated Name',
        bio: 'Updated bio',
        bikeDescription: 'Updated bike',
      });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toEqual(mockUpdatedUser);

      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: {
          name: 'Updated Name',
          bio: 'Updated bio',
          bikeDescription: 'Updated bike',
          socialLinks: undefined,
        },
        select: {
          id: true,
          name: true,
          bio: true,
          bikeDescription: true,
          email: true,
          socialLinks: true,
        },
      });
    });

    it('should handle empty optional fields correctly', async () => {
      mockPrismaUser.update.mockResolvedValue({
        id: 'test-user-id',
        name: 'Test User',
        bio: null,
        bikeDescription: null,
        email: 'test@example.com',
        socialLinks: null,
      });

      const request = createMockRequest({
        name: 'Test User',
        bio: '',
        bikeDescription: '',
      });
      const response = await PUT(request);

      expect(response.status).toBe(200);
      expect(mockPrismaUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bio: null,
            bikeDescription: null,
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    });

    it('should handle database errors gracefully', async () => {
      mockPrismaUser.update.mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest({ name: 'Test User' });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Errore interno del server');
    });

    it('should handle malformed JSON gracefully', async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        headers: new Map(),
        cookies: new Map(),
      };

      const response = await PUT(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Errore interno del server');
    });
  });
});
