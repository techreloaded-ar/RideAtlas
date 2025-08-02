import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies FIRST before any imports
const mockAuth = jest.fn();
const mockPrismaUser = {
  findUnique: jest.fn(),
};

jest.mock('@/auth', () => ({
  auth: mockAuth,
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: mockPrismaUser,
  },
}));

jest.mock('next/server', () => ({
  NextResponse: jest.fn().mockImplementation((body, init) => ({
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(body ? String(body) : ''),
    status: init?.status || 200,
  })),
}));

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;

beforeEach(() => {
  console.error = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

describe('HEAD /api/user/password-status', () => {
  let HEAD: any;

  beforeAll(async () => {
    // Import dinamico della route solo quando tutti i mock sono pronti
    const routeModule = await import('@/app/api/user/password-status/route');
    HEAD = routeModule.HEAD;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when no session exists', async () => {
      mockAuth.mockResolvedValue(null);

      const response = await HEAD();

      expect(response.status).toBe(401);
      expect(mockPrismaUser.findUnique).not.toHaveBeenCalled();
    });

    it('should return 401 when session exists but has no user', async () => {
      mockAuth.mockResolvedValue({ user: {} });

      const response = await HEAD();

      expect(response.status).toBe(401);
      expect(mockPrismaUser.findUnique).not.toHaveBeenCalled();
    });

    it('should return 401 when session exists but has no user ID', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });

      const response = await HEAD();

      expect(response.status).toBe(401);
      expect(mockPrismaUser.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('User Validation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    });

    it('should return 404 when user not found in database', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const response = await HEAD();

      expect(response.status).toBe(404);
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        select: { password: true }
      });
    });
  });

  describe('Password Status Check', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    });

    it('should return 200 when user has existing password', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({
        password: 'hashedPassword123'
      });

      const response = await HEAD();

      expect(response.status).toBe(200);
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        select: { password: true }
      });
    });

    it('should return 404 when user has no password (OAuth user)', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({
        password: null
      });

      const response = await HEAD();

      expect(response.status).toBe(404);
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        select: { password: true }
      });
    });

    it('should return 404 when user password is empty string', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({
        password: ''
      });

      const response = await HEAD();

      expect(response.status).toBe(404);
    });

    it('should return 404 when user password is undefined', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({
        password: undefined
      });

      const response = await HEAD();

      expect(response.status).toBe(404);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    });

    it('should handle database connection errors gracefully', async () => {
      mockPrismaUser.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const response = await HEAD();

      expect(response.status).toBe(500);
      expect(console.error).toHaveBeenCalledWith(
        'Error checking password status:',
        expect.any(Error)
      );
    });

    it('should handle auth service errors gracefully', async () => {
      mockAuth.mockRejectedValue(new Error('Auth service unavailable'));

      const response = await HEAD();

      expect(response.status).toBe(500);
      expect(console.error).toHaveBeenCalledWith(
        'Error checking password status:',
        expect.any(Error)
      );
    });

    it('should handle prisma query errors gracefully', async () => {
      mockPrismaUser.findUnique.mockRejectedValue(new Error('Invalid query'));

      const response = await HEAD();

      expect(response.status).toBe(500);
      expect(console.error).toHaveBeenCalledWith(
        'Error checking password status:',
        expect.any(Error)
      );
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    });

    it('should return empty response body for successful requests', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({
        password: 'hashedPassword123'
      });

      const response = await HEAD();

      expect(response.status).toBe(200);
      // HEAD requests should not have response body
      const body = await response.text();
      expect(body).toBe('');
    });

    it('should return empty response body for not found responses', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({
        password: null
      });

      const response = await HEAD();

      expect(response.status).toBe(404);
      // HEAD requests should not have response body
      const body = await response.text();
      expect(body).toBe('');
    });

    it('should only query password field from database', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({
        password: 'hashedPassword123'
      });

      await HEAD();

      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        select: { password: true } // Only password field should be selected
      });
    });
  });
});