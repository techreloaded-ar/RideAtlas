import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import bcrypt from 'bcryptjs';

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn()
  },
  passwordResetToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    delete: jest.fn()
  }
};

jest.mock('@/lib/core/prisma', () => ({
  prisma: mockPrisma
}));

// Mock crypto
const mockCrypto = {
  randomBytes: jest.fn()
};

jest.mock('crypto', () => mockCrypto);

describe('Password Reset Utilities', () => {
  const testEmail = 'test@example.com';
  const testToken = 'abc123def456';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock crypto.randomBytes
    mockCrypto.randomBytes.mockReturnValue({
      toString: jest.fn().mockReturnValue(testToken)
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('generatePasswordResetToken', () => {
    it('should generate token for existing user with password', async () => {
      // Mock user exists with password
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        password: 'hashed-password'
      });
      
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.passwordResetToken.create.mockResolvedValue({
        id: 'token-id',
        email: testEmail,
        token: testToken,
        expiresAt: new Date(),
        createdAt: new Date()
      });

      const { generatePasswordResetToken } = await import('@/lib/auth/password-reset');
      const result = await generatePasswordResetToken(testEmail);

      expect(result).toBe(testToken);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: testEmail },
        select: { id: true, password: true }
      });
      expect(mockPrisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { email: testEmail }
      });
      expect(mockPrisma.passwordResetToken.create).toHaveBeenCalled();
    });

    it('should return null for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const { generatePasswordResetToken } = await import('@/lib/auth/password-reset');
      const result = await generatePasswordResetToken(testEmail);

      expect(result).toBeNull();
    });

    it('should return null for user without password (OAuth only)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        password: null
      });

      const { generatePasswordResetToken } = await import('@/lib/auth/password-reset');
      const result = await generatePasswordResetToken(testEmail);

      expect(result).toBeNull();
    });
  });

  describe('validatePasswordResetToken', () => {
    it('should validate valid non-expired token', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        email: testEmail,
        expiresAt: futureDate
      });

      const { validatePasswordResetToken } = await import('@/lib/auth/password-reset');
      const result = await validatePasswordResetToken(testToken);

      expect(result).toBe(testEmail);
    });

    it('should return null for non-existent token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

      const { validatePasswordResetToken } = await import('@/lib/auth/password-reset');
      const result = await validatePasswordResetToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null and delete expired token', async () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        email: testEmail,
        expiresAt: pastDate
      });
      mockPrisma.passwordResetToken.delete.mockResolvedValue({});

      const { validatePasswordResetToken } = await import('@/lib/auth/password-reset');
      const result = await validatePasswordResetToken(testToken);

      expect(result).toBeNull();
      expect(mockPrisma.passwordResetToken.delete).toHaveBeenCalledWith({
        where: { token: testToken }
      });
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000);
      const newPassword = 'NewPassword123';
      
      // Mock token validation
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        email: testEmail,
        expiresAt: futureDate
      });
      
      // Mock user update
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.passwordResetToken.delete.mockResolvedValue({});

      const { resetPassword } = await import('@/lib/auth/password-reset');
      const result = await resetPassword(testToken, newPassword);

      expect(result).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { email: testEmail },
        data: { password: expect.any(String) }
      });
      expect(mockPrisma.passwordResetToken.delete).toHaveBeenCalledWith({
        where: { token: testToken }
      });
    });

    it('should return false for invalid token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

      const { resetPassword } = await import('@/lib/auth/password-reset');
      const result = await resetPassword('invalid-token', 'NewPassword123');

      expect(result).toBe(false);
    });
  });

  describe('canRequestPasswordReset', () => {
    it('should allow request when under rate limit', async () => {
      mockPrisma.passwordResetToken.count.mockResolvedValue(2); // Under limit of 3

      const { canRequestPasswordReset } = await import('@/lib/auth/password-reset');
      const result = await canRequestPasswordReset(testEmail);

      expect(result).toBe(true);
    });

    it('should deny request when at rate limit', async () => {
      mockPrisma.passwordResetToken.count.mockResolvedValue(3); // At limit

      const { canRequestPasswordReset } = await import('@/lib/auth/password-reset');
      const result = await canRequestPasswordReset(testEmail);

      expect(result).toBe(false);
    });
  });

  describe('cleanExpiredPasswordResetTokens', () => {
    it('should clean expired tokens', async () => {
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 5 });

      const { cleanExpiredPasswordResetTokens } = await import('@/lib/auth/password-reset');
      const result = await cleanExpiredPasswordResetTokens();

      expect(result).toBe(5);
      expect(mockPrisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date)
          }
        }
      });
    });
  });

  describe('generateSecureToken', () => {
    it('should generate secure token', async () => {
      const { generateSecureToken } = await import('@/lib/auth/password-reset');
      const result = generateSecureToken();

      expect(result).toBe(testToken);
      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32);
    });
  });
});