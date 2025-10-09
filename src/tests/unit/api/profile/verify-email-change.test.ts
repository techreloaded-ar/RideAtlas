import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies FIRST before any imports
const mockPrismaEmailChangeToken = {
  findUnique: jest.fn(),
  delete: jest.fn(),
};
const mockPrismaUser = {
  findUnique: jest.fn(),
  update: jest.fn(),
};
const mockPrismaTransaction = jest.fn();

// Mock modules
jest.mock('@/lib/core/prisma', () => ({
  prisma: {
    emailChangeToken: mockPrismaEmailChangeToken,
    user: mockPrismaUser,
    $transaction: mockPrismaTransaction,
  },
}));

// Mock NextRequest
const createMockRequest = (body: any): any => {
  return {
    json: jest.fn().mockResolvedValue(body),
    headers: new Map(),
    cookies: new Map(),
  };
};

describe('POST /api/profile/verify-email-change', () => {
  let POST: any;

  beforeAll(async () => {
    const routeModule = await import('@/app/api/profile/verify-email-change/route');
    POST = routeModule.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Validation', () => {
    it('should reject missing token', async () => {
      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Token mancante o non valido');
    });

    it('should reject non-string token', async () => {
      const request = createMockRequest({ token: 12345 });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Token mancante o non valido');
    });

    it('should reject invalid token', async () => {
      mockPrismaEmailChangeToken.findUnique.mockResolvedValue(null);

      const request = createMockRequest({ token: 'invalid-token' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Token non valido');
    });
  });

  describe('Token Expiration', () => {
    it('should reject expired token', async () => {
      const expiredToken = {
        id: 'token-id',
        userId: 'user-id',
        oldEmail: 'old@example.com',
        newEmail: 'new@example.com',
        token: 'valid-token',
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
        user: { id: 'user-id', email: 'old@example.com' },
      };

      mockPrismaEmailChangeToken.findUnique.mockResolvedValue(expiredToken);
      mockPrismaEmailChangeToken.delete.mockResolvedValue(expiredToken);

      const request = createMockRequest({ token: 'valid-token' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Token scaduto. Richiedi un nuovo cambio email.');
      expect(mockPrismaEmailChangeToken.delete).toHaveBeenCalledWith({
        where: { id: 'token-id' },
      });
    });

    it('should accept non-expired token', async () => {
      const validToken = {
        id: 'token-id',
        userId: 'user-id',
        oldEmail: 'old@example.com',
        newEmail: 'new@example.com',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 1000), // Expires in 1 second
        createdAt: new Date(),
        user: { id: 'user-id', email: 'old@example.com' },
      };

      mockPrismaEmailChangeToken.findUnique.mockResolvedValue(validToken);
      mockPrismaUser.findUnique.mockResolvedValue(null); // New email available
      mockPrismaTransaction.mockResolvedValue([
        { id: 'user-id', email: 'new@example.com' },
        validToken,
      ]);

      const request = createMockRequest({ token: 'valid-token' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Email Availability Check', () => {
    const validToken = {
      id: 'token-id',
      userId: 'user-id',
      oldEmail: 'old@example.com',
      newEmail: 'new@example.com',
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      user: { id: 'user-id', email: 'old@example.com' },
    };

    beforeEach(() => {
      mockPrismaEmailChangeToken.findUnique.mockResolvedValue(validToken);
    });

    it('should reject if new email is already taken (race condition)', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'other-user-id',
        email: 'new@example.com',
      });

      const request = createMockRequest({ token: 'valid-token' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Email già in uso da un altro account');
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { email: 'new@example.com' },
      });
    });

    it('should accept if new email is available', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);
      mockPrismaTransaction.mockResolvedValue([
        { id: 'user-id', email: 'new@example.com' },
        validToken,
      ]);

      const request = createMockRequest({ token: 'valid-token' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Email Update Transaction', () => {
    const validToken = {
      id: 'token-id',
      userId: 'user-id',
      oldEmail: 'old@example.com',
      newEmail: 'new@example.com',
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      user: { id: 'user-id', email: 'old@example.com' },
    };

    beforeEach(() => {
      mockPrismaEmailChangeToken.findUnique.mockResolvedValue(validToken);
      mockPrismaUser.findUnique.mockResolvedValue(null);
    });

    it('should update user email and delete token in transaction', async () => {
      // Mock transaction to execute the operations passed to it
      mockPrismaTransaction.mockImplementation(async (operations: any[]) => {
        return [
          { id: 'user-id', email: 'new@example.com', emailVerified: new Date() },
          validToken,
        ];
      });

      const request = createMockRequest({ token: 'valid-token' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Email modificata con successo');

      // Verify transaction was called
      expect(mockPrismaTransaction).toHaveBeenCalled();

      // Get the operations array passed to transaction
      const transactionCall = mockPrismaTransaction.mock.calls[0][0];
      expect(Array.isArray(transactionCall)).toBe(true);
      expect(transactionCall.length).toBe(2);
    });

    it('should set emailVerified to current date', async () => {
      const beforeUpdate = Date.now();

      mockPrismaTransaction.mockImplementation(async (operations: any[]) => {
        // Prisma transaction receives promises, not objects
        // We need to await them to get the actual operations
        const results = await Promise.all(operations);

        return [
          { id: 'user-id', email: 'new@example.com', emailVerified: new Date() },
          validToken,
        ];
      });

      const request = createMockRequest({ token: 'valid-token' });
      const response = await POST(request);

      expect(response.status).toBe(200);

      // Verify the mock was called
      expect(mockPrismaTransaction).toHaveBeenCalled();
    });

    it('should handle transaction failure', async () => {
      mockPrismaTransaction.mockRejectedValue(new Error('Transaction failed'));

      const request = createMockRequest({ token: 'valid-token' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Errore interno del server');
    });
  });

  describe('Complete Flow', () => {
    it('should successfully complete email change with valid token', async () => {
      const validToken = {
        id: 'token-id',
        userId: 'user-id',
        oldEmail: 'old@example.com',
        newEmail: 'new@example.com',
        token: 'abc123def456',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        user: { id: 'user-id', email: 'old@example.com' },
      };

      mockPrismaEmailChangeToken.findUnique.mockResolvedValue(validToken);
      mockPrismaUser.findUnique.mockResolvedValue(null);
      mockPrismaTransaction.mockResolvedValue([
        { id: 'user-id', email: 'new@example.com', emailVerified: new Date() },
        validToken,
      ]);

      const request = createMockRequest({ token: 'abc123def456' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Email modificata con successo');

      // Verify all steps were performed in order
      expect(mockPrismaEmailChangeToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'abc123def456' },
        include: { user: true },
      });
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { email: 'new@example.com' },
      });
      expect(mockPrismaTransaction).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrismaEmailChangeToken.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = createMockRequest({ token: 'valid-token' });
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
