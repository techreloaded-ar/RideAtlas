import { PurchaseService } from '@/lib/purchaseService';
import { prisma } from '@/lib/prisma';
import { PurchaseStatus } from '@prisma/client';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    trip: {
      findUnique: jest.fn()
    },
    tripPurchase: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    tripPurchaseTransaction: {
      create: jest.fn(),
      findMany: jest.fn()
    },
    $transaction: jest.fn()
  }
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('PurchaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasPurchasedTrip', () => {
    it('should return true if user has completed purchase', async () => {
      mockPrisma.tripPurchase.findUnique.mockResolvedValue({
        id: 'purchase-1',
        userId: 'user-1',
        tripId: 'trip-1',
        amount: 5.00,
        status: PurchaseStatus.COMPLETED,
        paymentMethod: 'mock',
        stripePaymentId: null,
        purchasedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      const result = await PurchaseService.hasPurchasedTrip('user-1', 'trip-1');
      
      expect(result).toBe(true);
      expect(mockPrisma.tripPurchase.findUnique).toHaveBeenCalledWith({
        where: {
          userId_tripId: {
            userId: 'user-1',
            tripId: 'trip-1'
          }
        }
      });
    });

    it('should return false if user has pending purchase', async () => {
      mockPrisma.tripPurchase.findUnique.mockResolvedValue({
        id: 'purchase-1',
        userId: 'user-1',
        tripId: 'trip-1',
        amount: 5.00,
        status: PurchaseStatus.PENDING,
        paymentMethod: null,
        stripePaymentId: null,
        purchasedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      const result = await PurchaseService.hasPurchasedTrip('user-1', 'trip-1');
      
      expect(result).toBe(false);
    });

    it('should return false if no purchase exists', async () => {
      mockPrisma.tripPurchase.findUnique.mockResolvedValue(null);

      const result = await PurchaseService.hasPurchasedTrip('user-1', 'trip-1');
      
      expect(result).toBe(false);
    });

    it('should return false for invalid parameters', async () => {
      const result1 = await PurchaseService.hasPurchasedTrip('', 'trip-1');
      const result2 = await PurchaseService.hasPurchasedTrip('user-1', '');
      
      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(mockPrisma.tripPurchase.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('canAccessPremiumContent', () => {
    it('should return true if user is trip owner', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: 'trip-1',
        user_id: 'user-1'
      } as any);

      const result = await PurchaseService.canAccessPremiumContent('user-1', 'trip-1');
      
      expect(result).toBe(true);
    });

    it('should return true if user has purchased trip', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: 'trip-1',
        user_id: 'other-user'
      } as any);

      mockPrisma.tripPurchase.findUnique.mockResolvedValue({
        id: 'purchase-1',
        status: PurchaseStatus.COMPLETED
      } as any);

      const result = await PurchaseService.canAccessPremiumContent('user-1', 'trip-1');
      
      expect(result).toBe(true);
    });

    it('should return false if user has not purchased and is not owner', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: 'trip-1',
        user_id: 'other-user'
      } as any);

      mockPrisma.tripPurchase.findUnique.mockResolvedValue(null);

      const result = await PurchaseService.canAccessPremiumContent('user-1', 'trip-1');
      
      expect(result).toBe(false);
    });

    it('should return false if trip does not exist', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(null);

      const result = await PurchaseService.canAccessPremiumContent('user-1', 'trip-1');
      
      expect(result).toBe(false);
    });
  });

  describe('createPurchase', () => {
    it('should create purchase successfully', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: 'trip-1',
        price: 5.00,
        user_id: 'other-user',
        status: 'Pubblicato'
      } as any);

      mockPrisma.tripPurchase.findUnique.mockResolvedValue(null);

      mockPrisma.tripPurchase.create.mockResolvedValue({
        id: 'purchase-1',
        userId: 'user-1',
        tripId: 'trip-1'
      } as any);

      mockPrisma.tripPurchaseTransaction.create.mockResolvedValue({
        id: 'transaction-1',
        purchaseId: 'purchase-1'
      } as any);

      const result = await PurchaseService.createPurchase('user-1', 'trip-1');
      
      expect(result.success).toBe(true);
      expect(result.purchaseId).toBe('purchase-1');
    });

    it('should fail if trip not found', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(null);

      const result = await PurchaseService.createPurchase('user-1', 'trip-1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Viaggio non trovato');
    });

    it('should fail if user tries to buy own trip', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: 'trip-1',
        user_id: 'user-1'
      } as any);

      const result = await PurchaseService.createPurchase('user-1', 'trip-1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Non puoi acquistare il tuo stesso viaggio');
    });

    it('should fail if trip is not published', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: 'trip-1',
        user_id: 'other-user',
        status: 'Bozza'
      } as any);

      const result = await PurchaseService.createPurchase('user-1', 'trip-1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Questo viaggio non è disponibile per l\'acquisto');
    });

    it('should fail if already purchased', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: 'trip-1',
        user_id: 'other-user',
        status: 'Pubblicato'
      } as any);

      mockPrisma.tripPurchase.findUnique.mockResolvedValue({
        id: 'purchase-1',
        status: PurchaseStatus.COMPLETED
      } as any);

      const result = await PurchaseService.createPurchase('user-1', 'trip-1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Hai già acquistato questo viaggio');
    });
  });

  describe('completePurchase', () => {
    it('should complete purchase successfully', async () => {
      const mockPurchase = {
        id: 'purchase-1',
        amount: 5.00,
        status: PurchaseStatus.PENDING
      };

      mockPrisma.tripPurchase.findUnique.mockResolvedValue(mockPurchase as any);

      mockPrisma.$transaction.mockImplementation((queries: any[]) => {
        return Promise.resolve(queries.map(() => ({})));
      });

      const result = await PurchaseService.completePurchase('purchase-1', 'mock');
      
      expect(result.success).toBe(true);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should fail if purchase not found', async () => {
      mockPrisma.tripPurchase.findUnique.mockResolvedValue(null);

      const result = await PurchaseService.completePurchase('purchase-1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Acquisto non trovato');
    });

    it('should fail if purchase already completed', async () => {
      mockPrisma.tripPurchase.findUnique.mockResolvedValue({
        id: 'purchase-1',
        status: PurchaseStatus.COMPLETED
      } as any);

      const result = await PurchaseService.completePurchase('purchase-1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Acquisto già completato');
    });
  });

  describe('getPurchaseTransactions', () => {
    it('should return transaction history for a purchase', async () => {
      const mockTransactions = [
        {
          id: 'transaction-1',
          purchaseId: 'purchase-1',
          amount: 5.00,
          status: PurchaseStatus.COMPLETED,
          paymentMethod: 'mock',
          failureReason: null,
          createdAt: new Date()
        },
        {
          id: 'transaction-2',
          purchaseId: 'purchase-1',
          amount: 5.00,
          status: PurchaseStatus.FAILED,
          paymentMethod: 'mock',
          failureReason: 'Payment declined',
          createdAt: new Date()
        }
      ];

      mockPrisma.tripPurchaseTransaction.findMany.mockResolvedValue(mockTransactions as any);

      const result = await PurchaseService.getPurchaseTransactions('purchase-1');
      
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe(PurchaseStatus.COMPLETED);
      expect(result[1].failureReason).toBe('Payment declined');
      expect(mockPrisma.tripPurchaseTransaction.findMany).toHaveBeenCalledWith({
        where: { purchaseId: 'purchase-1' },
        orderBy: { createdAt: 'desc' }
      });
    });

    it('should return empty array on error', async () => {
      mockPrisma.tripPurchaseTransaction.findMany.mockRejectedValue(new Error('Database error'));

      const result = await PurchaseService.getPurchaseTransactions('purchase-1');
      
      expect(result).toEqual([]);
    });
  });

  describe('getUserTransactionHistory', () => {
    it('should return user transaction history with trip info', async () => {
      const mockTransactions = [
        {
          id: 'transaction-1',
          purchaseId: 'purchase-1',
          amount: 5.00,
          status: PurchaseStatus.COMPLETED,
          paymentMethod: 'mock',
          failureReason: null,
          createdAt: new Date(),
          purchase: {
            trip: {
              id: 'trip-1',
              title: 'Test Trip'
            }
          }
        }
      ];

      mockPrisma.tripPurchaseTransaction.findMany.mockResolvedValue(mockTransactions as any);

      const result = await PurchaseService.getUserTransactionHistory('user-1');
      
      expect(result).toHaveLength(1);
      expect(result[0].tripTitle).toBe('Test Trip');
      expect(result[0].tripId).toBe('trip-1');
    });
  });
});