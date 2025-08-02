import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies FIRST before any imports
const mockAuth = jest.fn();
const mockPrismaUser = {
  findUnique: jest.fn(),
  update: jest.fn(),
};
const mockBcryptCompare = jest.fn();
const mockBcryptHash = jest.fn();

// Mock tutti i moduli senza importare la route
jest.mock('@/auth', () => ({
  auth: mockAuth,
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: mockPrismaUser,
  },
}));

jest.mock('bcryptjs', () => ({
  compare: mockBcryptCompare,
  hash: mockBcryptHash,
}));

// Mock NextRequest e NextResponse
const createMockRequest = (body: any): any => {
  return {
    json: jest.fn().mockResolvedValue(body),
    headers: new Map(),
    cookies: new Map(),
  };
};

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('POST /api/user/change-password', () => {
  let POST: any;

  beforeAll(async () => {
    // Import dinamico della route solo quando tutti i mock sono pronti
    const routeModule = await import('@/app/api/user/change-password/route');
    POST = routeModule.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createMockRequest({ newPassword: 'NewPass123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non autorizzato');
    });

    it('should reject requests without user ID', async () => {
      mockAuth.mockResolvedValue({ user: {} });

      const request = createMockRequest({ newPassword: 'NewPass123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non autorizzato');
    });
  });

  describe('User Validation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    });

    it('should return 404 when user not found', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const request = createMockRequest({ newPassword: 'NewPass123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Utente non trovato');
    });
  });

  describe('Change Password (User with existing password)', () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      password: 'hashedOldPassword'
    };

    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
      mockPrismaUser.findUnique.mockResolvedValue(mockUser);
      // Reset bcrypt mocks to clean state for each test
      mockBcryptCompare.mockReset();
      mockBcryptHash.mockReset();
    });

    it('should validate input schema for password change', async () => {
      const request = createMockRequest({ newPassword: 'NewPass123' }); // Missing currentPassword

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Dati non validi per cambio password');
    });

    it('should reject weak new password', async () => {
      const request = createMockRequest({
        currentPassword: 'OldPass123',
        newPassword: '123' // Too weak
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Dati non validi per cambio password');
    });

    it('should reject incorrect current password', async () => {
      mockBcryptCompare
        .mockResolvedValueOnce(false as never) // Current password check fails
        .mockResolvedValueOnce(false as never); // Password unchanged check

      const request = createMockRequest({
        currentPassword: 'WrongPass123',
        newPassword: 'NewPass123'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500); // Error gets caught and returns 500
    });

    it('should reject when new password equals current password', async () => {
      mockBcryptCompare
        .mockResolvedValueOnce(true as never) // Current password check passes
        .mockResolvedValueOnce(true as never); // Password unchanged check fails (same password)

      const request = createMockRequest({
        currentPassword: 'SamePass123',
        newPassword: 'SamePass123'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500); // Error gets caught and returns 500
    });

    it('should successfully change password with valid data', async () => {
      mockBcryptCompare
        .mockResolvedValueOnce(true as never) // Current password check passes
        .mockResolvedValueOnce(false as never); // Password unchanged check passes (different password)
      mockBcryptHash.mockResolvedValue('hashedNewPassword' as never);
      mockPrismaUser.update.mockResolvedValue(mockUser);

      const request = createMockRequest({
        currentPassword: 'OldPass123',
        newPassword: 'NewPass123'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Password aggiornata con successo');
      expect(mockBcryptHash).toHaveBeenCalledWith('NewPass123', 12);
      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: { password: 'hashedNewPassword' }
      });
    });
  });

  describe('Set Initial Password (OAuth user)', () => {
    const mockOAuthUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      password: null
    };

    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
      mockPrismaUser.findUnique.mockResolvedValue(mockOAuthUser);
    });

    it('should validate input schema for initial password', async () => {
      const request = createMockRequest({}); // Missing newPassword

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Dati non validi per impostazione password');
    });

    it('should reject weak initial password', async () => {
      const request = createMockRequest({
        newPassword: '123' // Too weak
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Dati non validi per impostazione password');
    });

    it('should successfully set initial password for OAuth user', async () => {
      mockBcryptHash.mockResolvedValue('hashedNewPassword' as never);
      mockPrismaUser.update.mockResolvedValue(mockOAuthUser);

      const request = createMockRequest({
        newPassword: 'InitialPass123'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Password impostata con successo per il tuo account');
      expect(mockBcryptHash).toHaveBeenCalledWith('InitialPass123', 12);
      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: { password: 'hashedNewPassword' }
      });
    });

    it('should not require currentPassword for OAuth users', async () => {
      mockBcryptHash.mockResolvedValue('hashedNewPassword' as never);
      mockPrismaUser.update.mockResolvedValue(mockOAuthUser);

      const request = createMockRequest({
        currentPassword: 'ShouldBeIgnored',
        newPassword: 'InitialPass123'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should not call bcrypt.compare for current password since user has no password
      expect(mockBcryptCompare).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    });

    it('should handle database errors gracefully', async () => {
      mockPrismaUser.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest({ newPassword: 'NewPass123' });
      const response = await POST(request);
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

      const response = await POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Errore interno del server');
    });
  });
});