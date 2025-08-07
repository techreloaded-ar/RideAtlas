import { PurchaseService } from '@/lib/purchaseService';
import { prisma } from '@/lib/prisma';
import { PurchaseStatus } from '@prisma/client';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tripPurchase: {
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    trip: {
      findUnique: jest.fn(),
    },
    tripPurchaseTransaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockPrisma = prisma as any;

describe('PurchaseService - Admin Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('refundPurchase', () => {
    const mockPurchase = {
      id: 'purchase-1',
      userId: 'user-1',
      tripId: 'trip-1',
      amount: 29.99,
      status: PurchaseStatus.COMPLETED,
      createdAt: new Date(),
    };

    it('should successfully refund a completed purchase', async () => {
      mockPrisma.tripPurchase.findUnique.mockResolvedValue(mockPurchase);
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      const result = await PurchaseService.refundPurchase('purchase-1', 'admin-1', 'Customer request');

      expect(result.success).toBe(true);
      expect(mockPrisma.tripPurchase.findUnique).toHaveBeenCalledWith({
        where: { id: 'purchase-1' }
      });
      expect(mockPrisma.$transaction).toHaveBeenCalledWith([
        expect.objectContaining({
          // Update purchase to REFUNDED
        }),
        expect.objectContaining({
          // Create refund transaction
        })
      ]);
    });

    it('should fail if purchase not found', async () => {
      mockPrisma.tripPurchase.findUnique.mockResolvedValue(null);

      const result = await PurchaseService.refundPurchase('purchase-1', 'admin-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Acquisto non trovato');
    });

    it('should fail if purchase is not completed', async () => {
      mockPrisma.tripPurchase.findUnique.mockResolvedValue({
        ...mockPurchase,
        status: PurchaseStatus.PENDING
      });

      const result = await PurchaseService.refundPurchase('purchase-1', 'admin-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Solo gli acquisti completati possono essere rimborsati');
    });
  });

  describe('giftTrip', () => {
    const mockTrip = {
      id: 'trip-1',
      title: 'Test Trip',
      price: 29.99,
      user_id: 'owner-1',
      status: 'Pubblicato'
    };

    it('should successfully gift a trip to a user', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
      mockPrisma.tripPurchase.findUnique.mockResolvedValue(null);
      
      const mockCreatedPurchase = {
        id: 'new-purchase-1',
        userId: 'user-1',
        tripId: 'trip-1',
        amount: 0,
        status: PurchaseStatus.COMPLETED,
      };
      
      mockPrisma.tripPurchase.upsert.mockResolvedValue(mockCreatedPurchase);
      mockPrisma.tripPurchaseTransaction.create.mockResolvedValue({});

      const result = await PurchaseService.giftTrip('user-1', 'trip-1', 'admin-1', 'Holiday gift');

      expect(result.success).toBe(true);
      expect(mockPrisma.trip.findUnique).toHaveBeenCalledWith({
        where: { id: 'trip-1' },
        select: expect.objectContaining({
          id: true,
          price: true,
          user_id: true,
          status: true,
          title: true
        })
      });
    });

    it('should fail if trip not found', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(null);

      const result = await PurchaseService.giftTrip('user-1', 'trip-1', 'admin-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Viaggio non trovato');
    });

    it('should fail if trying to gift trip to owner', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);

      const result = await PurchaseService.giftTrip('owner-1', 'trip-1', 'admin-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Non puoi regalare un viaggio al suo proprietario');
    });

    it('should fail if trip is not published', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        ...mockTrip,
        status: 'Bozza'
      });

      const result = await PurchaseService.giftTrip('user-1', 'trip-1', 'admin-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Questo viaggio non è disponibile');
    });

    it('should fail if user already purchased the trip', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
      mockPrisma.tripPurchase.findUnique.mockResolvedValue({
        id: 'existing-purchase',
        status: PurchaseStatus.COMPLETED
      });

      const result = await PurchaseService.giftTrip('user-1', 'trip-1', 'admin-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('L\'utente ha già acquistato questo viaggio');
    });
  });

  describe('getAllPurchases', () => {
    const mockPurchases = [
      {
        id: 'purchase-1',
        userId: 'user-1',
        tripId: 'trip-1',
        amount: 29.99,
        status: PurchaseStatus.COMPLETED,
        createdAt: new Date(),
        user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
        trip: { id: 'trip-1', title: 'Test Trip', price: 29.99 }
      }
    ];

    it('should return paginated purchases', async () => {
      mockPrisma.tripPurchase.findMany.mockResolvedValue(mockPurchases);
      mockPrisma.tripPurchase.count.mockResolvedValue(1);

      const result = await PurchaseService.getAllPurchases(1, 10);

      expect(result.purchases).toEqual(mockPurchases);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        pages: 1
      });
    });

    it('should apply filters correctly', async () => {
      mockPrisma.tripPurchase.findMany.mockResolvedValue([]);
      mockPrisma.tripPurchase.count.mockResolvedValue(0);

      await PurchaseService.getAllPurchases(1, 10, {
        userId: 'user-1',
        status: PurchaseStatus.COMPLETED,
        search: 'john'
      });

      expect(mockPrisma.tripPurchase.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: 'user-1',
          status: PurchaseStatus.COMPLETED,
          OR: expect.any(Array)
        }),
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.tripPurchase.findMany.mockRejectedValue(new Error('Database error'));

      const result = await PurchaseService.getAllPurchases();

      expect(result.purchases).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });
});