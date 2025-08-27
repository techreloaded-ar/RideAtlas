import { PATCH } from '@/app/api/admin/trips/reorder/route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/core/prisma';
import { UserRole } from '@/types/profile';
import { TripReorderRequest } from '@/types/api/trips';

// Mock delle dipendenze
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/core/prisma', () => ({
  prisma: {
    trip: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockAuth = auth as jest.Mock;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('PATCH /api/admin/trips/reorder - Riordino Viaggi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // Mock console.log per i test
    console.error = jest.fn(); // Mock console.error per i test
  });

  const createMockRequest = (body: TripReorderRequest | any): NextRequest => {
    return new NextRequest('http://localhost/api/admin/trips/reorder', {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  const mockSentinelSession = {
    user: {
      id: 'sentinel-user-id',
      name: 'Admin Sentinel',
      email: 'admin@rideatlas.com',
      role: UserRole.Sentinel,
    },
  };

  const mockTripsData = [
    { id: 'ckhdqxzvx0001z6fzjh2lz6r1', title: 'Viaggio Alpi' },
    { id: 'ckhdqxzvx0002z6fzjh2lz6r2', title: 'Tour Toscana' },
    { id: 'ckhdqxzvx0003z6fzjh2lz6r3', title: 'Giro Sicilia' },
  ];

  describe('Autorizzazione', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createMockRequest({ tripIds: ['ckhdqxzvx0001z6fzjh2lz6r1', 'ckhdqxzvx0002z6fzjh2lz6r2'] });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Utente non autorizzato.');
    });

    it('should return 403 if user is not Sentinel', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-id',
          role: UserRole.Explorer,
        },
      } as any);

      const request = createMockRequest({ tripIds: ['ckhdqxzvx0001z6fzjh2lz6r1', 'ckhdqxzvx0002z6fzjh2lz6r2'] });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Permessi insufficienti. Solo i Sentinel possono riordinare i viaggi.');
    });

    it('should allow Sentinel to reorder trips', async () => {
      mockAuth.mockResolvedValue(mockSentinelSession as any);
      mockPrisma.trip.findMany.mockResolvedValue(mockTripsData);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback({
          trip: {
            update: jest.fn().mockImplementation(({ where, data }) => 
              Promise.resolve({ id: where.id, title: `Title for ${where.id}` })
            ),
          },
        });
      });

      const request = createMockRequest({ tripIds: [
        'ckhdqxzvx0001z6fzjh2lz6r1', 
        'ckhdqxzvx0002z6fzjh2lz6r2', 
        'ckhdqxzvx0003z6fzjh2lz6r3'
      ]});
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.updatedCount).toBe(3);
    });
  });

  describe('Validazione input', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSentinelSession as any);
    });

    it('should reject empty tripIds array', async () => {
      const request = createMockRequest({ tripIds: [] });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Dati non validi.');
      expect(data.details?.tripIds).toBeDefined();
    });

    it('should reject invalid tripIds format', async () => {
      const request = createMockRequest({ tripIds: ['invalid-id', 'not-a-cuid'] });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Dati non validi.');
    });

    it('should reject missing tripIds field', async () => {
      const request = createMockRequest({});
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Dati non validi.');
    });

    it('should reject duplicate tripIds', async () => {
      const duplicateIds = [
        'ckhdqxzvx0001z6fzjh2lz6r1', 
        'ckhdqxzvx0002z6fzjh2lz6r2', 
        'ckhdqxzvx0001z6fzjh2lz6r1'
      ];
      mockPrisma.trip.findMany.mockResolvedValue([
        { id: 'ckhdqxzvx0001z6fzjh2lz6r1', title: 'Viaggio 1' },
        { id: 'ckhdqxzvx0002z6fzjh2lz6r2', title: 'Viaggio 2' },
      ]);

      const request = createMockRequest({ tripIds: duplicateIds });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('ID viaggi duplicati non sono permessi.');
    });
  });

  describe('Gestione viaggi non esistenti', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSentinelSession as any);
    });

    it('should reject if some trips do not exist', async () => {
      const requestIds = [
        'ckhdqxzvx0001z6fzjh2lz6r1', 
        'ckhdqxzvx0002z6fzjh2lz6r2', 
        'ckhdqxzvx0009z6fzjh2lz6r9'
      ];
      mockPrisma.trip.findMany.mockResolvedValue([
        { id: 'ckhdqxzvx0001z6fzjh2lz6r1', title: 'Viaggio 1' },
        { id: 'ckhdqxzvx0002z6fzjh2lz6r2', title: 'Viaggio 2' },
      ]);

      const request = createMockRequest({ tripIds: requestIds });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Alcuni viaggi non sono stati trovati.');
      expect(data.details?.missingIds).toContain('ckhdqxzvx0009z6fzjh2lz6r9');
    });

    it('should proceed if all trips exist', async () => {
      const requestIds = ['ckhdqxzvx0001z6fzjh2lz6r1', 'ckhdqxzvx0002z6fzjh2lz6r2'];
      mockPrisma.trip.findMany.mockResolvedValue([
        { id: 'ckhdqxzvx0001z6fzjh2lz6r1', title: 'Viaggio 1' },
        { id: 'ckhdqxzvx0002z6fzjh2lz6r2', title: 'Viaggio 2' },
      ]);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback({
          trip: {
            update: jest.fn().mockImplementation(({ where }) => 
              Promise.resolve({ id: where.id, title: `Updated ${where.id}` })
            ),
          },
        });
      });

      const request = createMockRequest({ tripIds: requestIds });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.updatedCount).toBe(2);
      expect(mockPrisma.trip.findMany).toHaveBeenCalledWith({
        where: { id: { in: requestIds } },
        select: { id: true, title: true },
      });
    });
  });

  describe('Aggiornamento ordinamento', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSentinelSession as any);
      mockPrisma.trip.findMany.mockResolvedValue(mockTripsData);
    });

    it('should update orderIndex for all trips in correct order', async () => {
      const requestIds = ['ckhdqxzvx0003z6fzjh2lz6r3', 'ckhdqxzvx0001z6fzjh2lz6r1', 'ckhdqxzvx0002z6fzjh2lz6r2'];
      const mockUpdates = requestIds.map((id, index) => ({
        id,
        title: `Updated ${id}`,
      }));

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          trip: {
            update: jest.fn().mockImplementation(({ where, data }) => {
              const index = requestIds.indexOf(where.id);
              expect(data.orderIndex).toBe(index);
              return Promise.resolve({ id: where.id, title: `Updated ${where.id}` });
            }),
          },
        };
        return await callback(mockTx);
      });

      const request = createMockRequest({ tripIds: requestIds });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.updatedCount).toBe(3);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should handle single trip reorder', async () => {
      const requestIds = ['ckhdqxzvx0001z6fzjh2lz6r1'];
      mockPrisma.trip.findMany.mockResolvedValue([{ id: 'ckhdqxzvx0001z6fzjh2lz6r1', title: 'Solo viaggio' }]);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback({
          trip: {
            update: jest.fn().mockResolvedValue({ id: 'ckhdqxzvx0001z6fzjh2lz6r1', title: 'Solo viaggio' }),
          },
        });
      });

      const request = createMockRequest({ tripIds: requestIds });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.updatedCount).toBe(1);
    });
  });

  describe('Gestione errori database', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSentinelSession as any);
      mockPrisma.trip.findMany.mockResolvedValue(mockTripsData);
    });

    it('should handle Prisma unique constraint error (P2002)', async () => {
      const prismaError = { code: 'P2002', message: 'Unique constraint failed' };
      mockPrisma.trip.findMany.mockResolvedValue(mockTripsData);
      mockPrisma.$transaction.mockRejectedValue(prismaError);

      const request = createMockRequest({ tripIds: ['ckhdqxzvx0001z6fzjh2lz6r1', 'ckhdqxzvx0002z6fzjh2lz6r2'] });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Conflitto di dati durante l'aggiornamento.");
    });

    it('should handle Prisma record not found error (P2025)', async () => {
      const prismaError = { code: 'P2025', message: 'Record not found' };
      mockPrisma.trip.findMany.mockResolvedValue(mockTripsData);
      mockPrisma.$transaction.mockRejectedValue(prismaError);

      const request = createMockRequest({ tripIds: ['ckhdqxzvx0001z6fzjh2lz6r1', 'ckhdqxzvx0002z6fzjh2lz6r2'] });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Uno o più viaggi non sono stati trovati.');
    });

    it('should handle generic database errors', async () => {
      const genericError = new Error('Database connection failed');
      mockPrisma.trip.findMany.mockResolvedValue(mockTripsData);
      mockPrisma.$transaction.mockRejectedValue(genericError);

      const request = createMockRequest({ tripIds: ['ckhdqxzvx0001z6fzjh2lz6r1', 'ckhdqxzvx0002z6fzjh2lz6r2'] });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Errore interno del server.');
      expect(data.details).toBe('Database connection failed');
    });

    it('should handle findMany database error', async () => {
      mockPrisma.trip.findMany.mockRejectedValue(new Error('Connection timeout'));

      const request = createMockRequest({ tripIds: ['ckhdqxzvx0001z6fzjh2lz6r1', 'ckhdqxzvx0002z6fzjh2lz6r2'] });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Errore interno del server.');
    });
  });

  describe('Rollback transaction', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSentinelSession as any);
      mockPrisma.trip.findMany.mockResolvedValue(mockTripsData);
    });

    it('should rollback transaction if any update fails', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          trip: {
            update: jest.fn()
              .mockResolvedValueOnce({ id: 'ckhdqxzvx0001z6fzjh2lz6r1', title: 'Updated 1' })
              .mockRejectedValueOnce(new Error('Update failed for trip-2')),
          },
        };
        
        try {
          return await callback(mockTx);
        } catch (error) {
          throw error; // Simula rollback automatico
        }
      });

      const request = createMockRequest({ tripIds: ['ckhdqxzvx0001z6fzjh2lz6r1', 'ckhdqxzvx0002z6fzjh2lz6r2'] });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });
});