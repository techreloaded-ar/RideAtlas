import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies FIRST before any imports
const mockAuth = jest.fn();
const mockPrismaUser = {
  findUnique: jest.fn(),
};
const mockPrismaEmailChangeToken = {
  create: jest.fn(),
};
const mockBcryptCompare = jest.fn();
const mockRandomBytes = jest.fn();
const mockSendEmailChangeVerification = jest.fn();

// Mock modules
jest.mock('@/auth', () => ({
  auth: mockAuth,
}));

jest.mock('@/lib/core/prisma', () => ({
  prisma: {
    user: mockPrismaUser,
    emailChangeToken: mockPrismaEmailChangeToken,
  },
}));

jest.mock('bcryptjs', () => ({
  compare: mockBcryptCompare,
}));

jest.mock('crypto', () => ({
  randomBytes: mockRandomBytes,
}));

jest.mock('@/lib/core/email', () => ({
  sendEmailChangeVerification: mockSendEmailChangeVerification,
}));

// Mock NextRequest
const createMockRequest = (body: any): any => {
  return {
    json: jest.fn().mockResolvedValue(body),
    headers: new Map(),
    cookies: new Map(),
  };
};

describe('POST /api/profile/change-email', () => {
  let POST: any;

  beforeAll(async () => {
    const routeModule = await import('@/app/api/profile/change-email/route');
    POST = routeModule.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createMockRequest({
        newEmail: 'new@example.com',
        password: 'Password123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non autorizzato');
    });

    it('should reject requests without user ID', async () => {
      mockAuth.mockResolvedValue({ user: {} });

      const request = createMockRequest({
        newEmail: 'new@example.com',
        password: 'Password123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Non autorizzato');
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    });

    it('should reject missing newEmail', async () => {
      const request = createMockRequest({ password: 'Password123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Dati non validi');
    });

    it('should reject invalid email format', async () => {
      const request = createMockRequest({
        newEmail: 'invalid-email',
        password: 'Password123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Dati non validi');
    });

    it('should reject email too short', async () => {
      const request = createMockRequest({
        newEmail: 'a@b',
        password: 'Password123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Dati non validi');
    });

    it('should reject email too long', async () => {
      const request = createMockRequest({
        newEmail: 'a'.repeat(95) + '@example.com',
        password: 'Password123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Dati non validi');
    });

    it('should reject missing password', async () => {
      const request = createMockRequest({ newEmail: 'new@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Dati non validi');
    });
  });

  describe('User Validation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    });

    it('should reject if user not found', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      const request = createMockRequest({
        newEmail: 'new@example.com',
        password: 'Password123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Utente non valido o password non impostata');
    });

    it('should reject if user has no password', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'test-user-id',
        email: 'old@example.com',
        password: null,
      });

      const request = createMockRequest({
        newEmail: 'new@example.com',
        password: 'Password123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Utente non valido o password non impostata');
    });
  });

  describe('Password Verification', () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'old@example.com',
      password: 'hashedPassword123',
    };

    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
      mockPrismaUser.findUnique.mockResolvedValue(mockUser);
    });

    it('should reject incorrect password', async () => {
      mockBcryptCompare.mockResolvedValue(false as never);

      const request = createMockRequest({
        newEmail: 'new@example.com',
        password: 'WrongPassword',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Password non corretta');
      expect(mockBcryptCompare).toHaveBeenCalledWith('WrongPassword', 'hashedPassword123');
    });

    it('should accept correct password', async () => {
      mockBcryptCompare.mockResolvedValue(true as never);
      mockRandomBytes.mockReturnValue(Buffer.from('a'.repeat(32)));
      mockPrismaUser.findUnique
        .mockResolvedValueOnce(mockUser) // First call for user validation
        .mockResolvedValueOnce(null); // Second call for duplicate email check
      mockSendEmailChangeVerification.mockResolvedValue(undefined);

      const request = createMockRequest({
        newEmail: 'new@example.com',
        password: 'CorrectPassword',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockBcryptCompare).toHaveBeenCalledWith('CorrectPassword', 'hashedPassword123');
    });
  });

  describe('Email Validation', () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'old@example.com',
      password: 'hashedPassword123',
    };

    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
      mockPrismaUser.findUnique.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(true as never);
    });

    it('should reject if new email equals current email (case insensitive)', async () => {
      const request = createMockRequest({
        newEmail: 'OLD@example.com',
        password: 'Password123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('La nuova email è uguale a quella attuale');
    });

    it('should reject if new email is already in use', async () => {
      mockPrismaUser.findUnique
        .mockResolvedValueOnce(mockUser) // First call for user validation
        .mockResolvedValueOnce({ id: 'other-user-id', email: 'new@example.com' }); // Second call for duplicate check

      const request = createMockRequest({
        newEmail: 'new@example.com',
        password: 'Password123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Email già in uso da un altro account');
    });
  });

  describe('Token Generation and Email Sending', () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'old@example.com',
      password: 'hashedPassword123',
    };

    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
      mockPrismaUser.findUnique
        .mockResolvedValueOnce(mockUser) // User validation
        .mockResolvedValueOnce(null); // Duplicate email check
      mockBcryptCompare.mockResolvedValue(true as never);
    });

    it('should generate secure token and save to database', async () => {
      const mockTokenBuffer = Buffer.from('a'.repeat(32));
      const expectedToken = mockTokenBuffer.toString('hex');

      mockRandomBytes.mockReturnValue(mockTokenBuffer);
      mockSendEmailChangeVerification.mockResolvedValue(undefined);

      const request = createMockRequest({
        newEmail: 'new@example.com',
        password: 'Password123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.requiresVerification).toBe(true);

      expect(mockRandomBytes).toHaveBeenCalledWith(32);
      expect(mockPrismaEmailChangeToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'test-user-id',
          oldEmail: 'old@example.com',
          newEmail: 'new@example.com',
          token: expectedToken,
          expiresAt: expect.any(Date),
        }),
      });
    });

    it('should set token expiration to 24 hours', async () => {
      mockRandomBytes.mockReturnValue(Buffer.from('a'.repeat(32)));
      mockSendEmailChangeVerification.mockResolvedValue(undefined);

      const beforeRequest = Date.now();
      const request = createMockRequest({
        newEmail: 'new@example.com',
        password: 'Password123',
      });
      await POST(request);
      const afterRequest = Date.now();

      const createCall = mockPrismaEmailChangeToken.create.mock.calls[0][0];
      const expiresAt = createCall.data.expiresAt as Date;
      const expectedExpiration = 24 * 60 * 60 * 1000; // 24 hours in ms

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(beforeRequest + expectedExpiration);
      expect(expiresAt.getTime()).toBeLessThanOrEqual(afterRequest + expectedExpiration);
    });

    it('should send verification email to new address', async () => {
      const mockTokenBuffer = Buffer.from('a'.repeat(32));
      const expectedToken = mockTokenBuffer.toString('hex');

      mockRandomBytes.mockReturnValue(mockTokenBuffer);
      mockSendEmailChangeVerification.mockResolvedValue(undefined);

      const request = createMockRequest({
        newEmail: 'new@example.com',
        password: 'Password123',
      });
      await POST(request);

      expect(mockSendEmailChangeVerification).toHaveBeenCalledWith('new@example.com', expectedToken);
    });

    it('should return success message after sending email', async () => {
      mockRandomBytes.mockReturnValue(Buffer.from('a'.repeat(32)));
      mockSendEmailChangeVerification.mockResolvedValue(undefined);

      const request = createMockRequest({
        newEmail: 'new@example.com',
        password: 'Password123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Email di verifica inviata. Controlla la tua nuova email.');
      expect(data.requiresVerification).toBe(true);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: 'test-user-id' } });
    });

    it('should handle database errors gracefully', async () => {
      mockPrismaUser.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest({
        newEmail: 'new@example.com',
        password: 'Password123',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Errore interno del server');
    });

    it('should handle email sending errors gracefully', async () => {
      mockPrismaUser.findUnique
        .mockResolvedValueOnce({
          id: 'test-user-id',
          email: 'old@example.com',
          password: 'hashedPassword123',
        })
        .mockResolvedValueOnce(null);
      mockBcryptCompare.mockResolvedValue(true as never);
      mockRandomBytes.mockReturnValue(Buffer.from('a'.repeat(32)));
      mockSendEmailChangeVerification.mockRejectedValue(new Error('Email service failed'));

      const request = createMockRequest({
        newEmail: 'new@example.com',
        password: 'Password123',
      });
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
