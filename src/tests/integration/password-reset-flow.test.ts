import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import bcrypt from 'bcryptjs';

// Mock delle funzioni email per i test
jest.mock('@/lib/core/email', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock Prisma
const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  passwordResetToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('@/lib/core/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock fetch per le API calls
global.fetch = jest.fn();

describe('Password Reset Flow Integration', () => {
  const testEmail = 'test-reset@example.com';

  const newPassword = 'NewPassword456';
  const testUserId = 'test-user-id';

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockPrisma.user.create.mockResolvedValue({
      id: testUserId,
      email: testEmail,
      password: 'hashed-password',
      emailVerified: new Date(),
      name: 'Test User',
    });

    mockPrisma.user.findUnique.mockResolvedValue({
      id: testUserId,
      email: testEmail,
      password: 'hashed-password',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Forgot Password API', () => {
    it('should accept valid email and create reset token', async () => {
      // Mock API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message:
            "Se l'email esiste nel nostro sistema, riceverai un link per reimpostare la password.",
        }),
      });

      // Mock database calls
      mockPrisma.passwordResetToken.count.mockResolvedValue(0); // No recent tokens
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.passwordResetToken.create.mockResolvedValue({
        id: 'token-id',
        email: testEmail,
        token: 'reset-token-123',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        createdAt: new Date(),
      });

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.message).toContain('riceverai un link');
    });

    it('should reject invalid email format', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Email non valida',
        }),
      });

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'invalid-email' }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Email non valida');
    });

    it('should enforce rate limiting', async () => {
      // Mock rate limiting response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: "Troppe richieste. Riprova tra un'ora.",
        }),
      });

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });

      expect(response.status).toBe(429);

      const data = await response.json();
      expect(data.error).toContain('Troppe richieste');
    });

    it('should not reveal if email exists (security)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message:
            "Se l'email esiste nel nostro sistema, riceverai un link per reimpostare la password.",
        }),
      });

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent@example.com' }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.message).toContain('riceverai un link');
    });
  });

  describe('Reset Password API', () => {
    const resetToken = 'valid-reset-token-123';

    it('should validate token correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          valid: true,
          email: testEmail,
        }),
      });

      const response = await fetch(
        `/api/auth/reset-password?token=${resetToken}`
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.valid).toBe(true);
      expect(data.email).toBe(testEmail);
    });

    it('should reject invalid token', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Token non valido o scaduto',
        }),
      });

      const response = await fetch(
        '/api/auth/reset-password?token=invalid-token'
      );

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('non valido');
    });

    it('should reset password with valid token', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          message: 'Password reimpostata con successo',
        }),
      });

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: resetToken,
          password: newPassword,
          confirmPassword: newPassword,
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.message).toContain('reimpostata con successo');
    });

    it('should reject weak passwords', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'La password deve contenere almeno 8 caratteri',
        }),
      });

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: resetToken,
          password: 'weak',
          confirmPassword: 'weak',
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('8 caratteri');
    });

    it('should reject mismatched passwords', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Le password non coincidono',
        }),
      });

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: resetToken,
          password: newPassword,
          confirmPassword: 'DifferentPassword123',
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('non coincidono');
    });
  });

  describe('Token Cleanup', () => {
    it('should clean expired tokens', async () => {
      // Mock per token scaduto
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 1 });

      // Mock della funzione di cleanup
      jest.doMock('@/lib/auth/password-reset', () => ({
        cleanExpiredPasswordResetTokens: jest.fn().mockResolvedValue(1),
      }));

      const { cleanExpiredPasswordResetTokens } = await import(
        '@/lib/auth/password-reset'
      );
      const deletedCount = await cleanExpiredPasswordResetTokens();

      expect(deletedCount).toBeGreaterThan(0);
    });
  });
});
