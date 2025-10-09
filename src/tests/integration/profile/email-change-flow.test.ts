import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import bcrypt from 'bcryptjs';

// Mock email functions
jest.mock('@/lib/core/email', () => ({
  sendEmailChangeVerification: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock Prisma
const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  emailChangeToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock('@/lib/core/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock auth
const mockAuth = jest.fn();
jest.mock('@/auth', () => ({
  auth: mockAuth,
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Email Change Flow Integration', () => {
  const testUserId = 'test-user-id';
  const oldEmail = 'old@example.com';
  const newEmail = 'new@example.com';
  const userPassword = 'Password123';
  const hashedPassword = 'hashed-password';
  const changeToken = 'change-token-abc123';

  beforeEach(async () => {
    jest.clearAllMocks();

    // Setup default user with password
    mockPrisma.user.findUnique.mockResolvedValue({
      id: testUserId,
      email: oldEmail,
      password: hashedPassword,
      name: 'Test User',
      emailVerified: new Date(),
    });

    // Mock auth to return authenticated session
    mockAuth.mockResolvedValue({
      user: { id: testUserId, email: oldEmail, role: 'Ranger' },
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Complete Email Change Flow', () => {
    it('should successfully complete full email change flow', async () => {
      // Step 1: Request email change
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Email di verifica inviata. Controlla la tua nuova email.',
          requiresVerification: true,
        }),
      });

      // Mock bcrypt password comparison
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      // Mock token creation
      const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      mockPrisma.emailChangeToken.create.mockResolvedValue({
        id: 'token-id',
        userId: testUserId,
        oldEmail,
        newEmail,
        token: changeToken,
        expiresAt: tokenExpiresAt,
        createdAt: new Date(),
      });

      // Request email change
      const changeResponse = await fetch('/api/profile/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newEmail,
          password: userPassword,
        }),
      });

      expect(changeResponse.status).toBe(200);
      const changeData = await changeResponse.json();
      expect(changeData.success).toBe(true);
      expect(changeData.requiresVerification).toBe(true);

      // Step 2: Verify email change with token
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Email modificata con successo',
        }),
      });

      // Mock token verification
      mockPrisma.emailChangeToken.findUnique.mockResolvedValue({
        id: 'token-id',
        userId: testUserId,
        oldEmail,
        newEmail,
        token: changeToken,
        expiresAt: tokenExpiresAt,
        createdAt: new Date(),
        user: { id: testUserId, email: oldEmail },
      });

      // Mock email availability check (no conflict)
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Mock transaction for updating email and deleting token
      mockPrisma.$transaction.mockResolvedValue([
        {
          id: testUserId,
          email: newEmail,
          emailVerified: new Date(),
        },
        {
          id: 'token-id',
        },
      ]);

      // Verify email change
      const verifyResponse = await fetch('/api/profile/verify-email-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: changeToken }),
      });

      expect(verifyResponse.status).toBe(200);
      const verifyData = await verifyResponse.json();
      expect(verifyData.success).toBe(true);
      expect(verifyData.message).toBe('Email modificata con successo');
    });

    it('should fail if user does not have password set', async () => {
      // User without password (OAuth user)
      mockPrisma.user.findUnique.mockResolvedValue({
        id: testUserId,
        email: oldEmail,
        password: null,
        name: 'OAuth User',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Utente non valido o password non impostata',
        }),
      });

      const response = await fetch('/api/profile/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newEmail,
          password: userPassword,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Utente non valido o password non impostata');
    });

    it('should fail if password is incorrect', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Password non corretta',
        }),
      });

      const response = await fetch('/api/profile/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newEmail,
          password: 'WrongPassword',
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Password non corretta');
    });

    it('should fail if new email equals current email', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'La nuova email è uguale a quella attuale',
        }),
      });

      const response = await fetch('/api/profile/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newEmail: oldEmail,
          password: userPassword,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('La nuova email è uguale a quella attuale');
    });

    it('should fail if new email is already taken', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      // Mock that new email is taken by another user
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({
          id: testUserId,
          email: oldEmail,
          password: hashedPassword,
        })
        .mockResolvedValueOnce({
          id: 'other-user-id',
          email: newEmail,
        });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: 'Email già in uso da un altro account',
        }),
      });

      const response = await fetch('/api/profile/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newEmail,
          password: userPassword,
        }),
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toBe('Email già in uso da un altro account');
    });
  });

  describe('Token Verification Failures', () => {
    it('should fail with invalid token', async () => {
      mockPrisma.emailChangeToken.findUnique.mockResolvedValue(null);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Token non valido',
        }),
      });

      const response = await fetch('/api/profile/verify-email-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'invalid-token' }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Token non valido');
    });

    it('should fail with expired token', async () => {
      const expiredDate = new Date(Date.now() - 1000); // Expired 1 second ago

      mockPrisma.emailChangeToken.findUnique.mockResolvedValue({
        id: 'token-id',
        userId: testUserId,
        oldEmail,
        newEmail,
        token: changeToken,
        expiresAt: expiredDate,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
        user: { id: testUserId, email: oldEmail },
      });

      mockPrisma.emailChangeToken.delete.mockResolvedValue({
        id: 'token-id',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Token scaduto. Richiedi un nuovo cambio email.',
        }),
      });

      const response = await fetch('/api/profile/verify-email-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: changeToken }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Token scaduto. Richiedi un nuovo cambio email.');
    });

    it('should fail if email becomes taken during verification (race condition)', async () => {
      const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      mockPrisma.emailChangeToken.findUnique.mockResolvedValue({
        id: 'token-id',
        userId: testUserId,
        oldEmail,
        newEmail,
        token: changeToken,
        expiresAt: tokenExpiresAt,
        createdAt: new Date(),
        user: { id: testUserId, email: oldEmail },
      });

      // Another user took the email in the meantime
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'other-user-id',
        email: newEmail,
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: 'Email già in uso da un altro account',
        }),
      });

      const response = await fetch('/api/profile/verify-email-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: changeToken }),
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toBe('Email già in uso da un altro account');
    });
  });

  describe('Token Expiration', () => {
    it('should accept token that expires in 24 hours', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      mockPrisma.emailChangeToken.create.mockResolvedValue({
        id: 'token-id',
        userId: testUserId,
        oldEmail,
        newEmail,
        token: changeToken,
        expiresAt: tokenExpiresAt,
        createdAt: new Date(),
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          requiresVerification: true,
        }),
      });

      const response = await fetch('/api/profile/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newEmail,
          password: userPassword,
        }),
      });

      expect(response.status).toBe(200);
    });

    it('should reject token after 24 hours', async () => {
      const expiredDate = new Date(Date.now() - 1);

      mockPrisma.emailChangeToken.findUnique.mockResolvedValue({
        id: 'token-id',
        userId: testUserId,
        oldEmail,
        newEmail,
        token: changeToken,
        expiresAt: expiredDate,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
        user: { id: testUserId, email: oldEmail },
      });

      mockPrisma.emailChangeToken.delete.mockResolvedValue({
        id: 'token-id',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Token scaduto. Richiedi un nuovo cambio email.',
        }),
      });

      const response = await fetch('/api/profile/verify-email-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: changeToken }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Database Transaction', () => {
    it('should atomically update email and delete token', async () => {
      const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      mockPrisma.emailChangeToken.findUnique.mockResolvedValue({
        id: 'token-id',
        userId: testUserId,
        oldEmail,
        newEmail,
        token: changeToken,
        expiresAt: tokenExpiresAt,
        createdAt: new Date(),
        user: { id: testUserId, email: oldEmail },
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);

      const emailVerifiedDate = new Date();
      mockPrisma.$transaction.mockResolvedValue([
        {
          id: testUserId,
          email: newEmail,
          emailVerified: emailVerifiedDate,
        },
        {
          id: 'token-id',
        },
      ]);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Email modificata con successo',
        }),
      });

      const response = await fetch('/api/profile/verify-email-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: changeToken }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should rollback if transaction fails', async () => {
      const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      mockPrisma.emailChangeToken.findUnique.mockResolvedValue({
        id: 'token-id',
        userId: testUserId,
        oldEmail,
        newEmail,
        token: changeToken,
        expiresAt: tokenExpiresAt,
        createdAt: new Date(),
        user: { id: testUserId, email: oldEmail },
      });

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Errore interno del server',
        }),
      });

      const response = await fetch('/api/profile/verify-email-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: changeToken }),
      });

      expect(response.status).toBe(500);
    });
  });
});
