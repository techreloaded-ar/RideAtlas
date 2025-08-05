import { PurchaseService } from '@/lib/purchaseService';
import { PurchaseStatus } from '@prisma/client';

// Mock Prisma for integration tests
jest.mock('@/lib/prisma', () => ({
  prisma: (global as any).mockPrisma
}));

import { prisma } from '@/lib/prisma';
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Purchase Flow Integration', () => {
  const testUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'Explorer'
  };

  const otherUser = {
    id: 'other-user-id',
    email: 'other@example.com',
    name: 'Other User',
    role: 'Ranger'
  };

  const testTrip = {
    id: 'test-trip-id',
    title: 'Test Trip',
    summary: 'A test trip for purchase flow',
    destination: 'Test Destination',
    duration_days: 3,
    duration_nights: 2,
    tags: ['test'],
    theme: 'Adventure',
    status: 'Pubblicato',
    price: 15.50,
    user_id: otherUser.id
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Purchase Flow', () => {
    it('should complete full purchase workflow', async () => {
      // Mock initial state - no purchase exists
      mockPrisma.tripPurchase.findUnique.mockResolvedValueOnce(null);
      mockPrisma.trip.findUnique.mockResolvedValueOnce(testTrip as any);
      
      // 1. Initially user should not have access
      const initialAccess = await PurchaseService.canAccessPremiumContent(testUser.id, testTrip.id);
      expect(initialAccess).toBe(false);

      // Mock for hasPurchasedTrip check
      mockPrisma.tripPurchase.findUnique.mockResolvedValueOnce(null);
      const initialPurchaseStatus = await PurchaseService.hasPurchasedTrip(testUser.id, testTrip.id);
      expect(initialPurchaseStatus).toBe(false);

      // 2. Create purchase - mock the database operations
      mockPrisma.trip.findUnique.mockResolvedValueOnce(testTrip as any);
      mockPrisma.tripPurchase.findUnique.mockResolvedValueOnce(null); // No existing purchase
      
      const newPurchase = {
        id: 'purchase-1',
        userId: testUser.id,
        tripId: testTrip.id,
        amount: 15.50,
        status: PurchaseStatus.PENDING,
        paymentMethod: null,
        stripePaymentId: null,
        purchasedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockPrisma.tripPurchase.create.mockResolvedValueOnce(newPurchase as any);
      mockPrisma.tripPurchaseTransaction.create.mockResolvedValueOnce({
        id: 'transaction-1',
        purchaseId: 'purchase-1'
      } as any);

      const createResult = await PurchaseService.createPurchase(testUser.id, testTrip.id);
      expect(createResult.success).toBe(true);
      expect(createResult.purchaseId).toBe('purchase-1');

      // 3. Complete the purchase
      mockPrisma.tripPurchase.findUnique.mockResolvedValueOnce(newPurchase as any);
      const completedPurchase = {
        ...newPurchase,
        status: PurchaseStatus.COMPLETED,
        paymentMethod: 'mock',
        purchasedAt: new Date()
      };
      mockPrisma.$transaction.mockImplementation((queries: any[]) => {
        return Promise.resolve(queries.map(() => ({})));
      });

      const completeResult = await PurchaseService.completePurchase('purchase-1', 'mock');
      expect(completeResult.success).toBe(true);

      // 4. User should now have access
      mockPrisma.trip.findUnique.mockResolvedValueOnce(testTrip as any);
      mockPrisma.tripPurchase.findUnique.mockResolvedValueOnce(completedPurchase as any);
      
      const finalAccess = await PurchaseService.canAccessPremiumContent(testUser.id, testTrip.id);
      expect(finalAccess).toBe(true);

      mockPrisma.tripPurchase.findUnique.mockResolvedValueOnce(completedPurchase as any);
      const finalPurchaseStatus = await PurchaseService.hasPurchasedTrip(testUser.id, testTrip.id);
      expect(finalPurchaseStatus).toBe(true);
    });

    it('should not allow duplicate completed purchases', async () => {
      const existingPurchase = {
        id: 'existing-purchase',
        userId: testUser.id,
        tripId: testTrip.id,
        amount: 15.50,
        status: PurchaseStatus.COMPLETED,
        paymentMethod: 'mock',
        purchasedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.trip.findUnique.mockResolvedValueOnce(testTrip as any);
      mockPrisma.tripPurchase.findUnique.mockResolvedValueOnce(existingPurchase as any);

      const result = await PurchaseService.createPurchase(testUser.id, testTrip.id);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Hai già acquistato questo viaggio');
    });
  });

  describe('Owner Access', () => {
    it('should allow owner to access without purchase', async () => {
      mockPrisma.trip.findUnique.mockResolvedValueOnce(testTrip as any);

      const result = await PurchaseService.canAccessPremiumContent(otherUser.id, testTrip.id);
      expect(result).toBe(true);
    });

    it('should not allow owner to purchase own trip', async () => {
      mockPrisma.trip.findUnique.mockResolvedValueOnce(testTrip as any);

      const result = await PurchaseService.createPurchase(otherUser.id, testTrip.id);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Non puoi acquistare il tuo stesso viaggio');
    });
  });

  describe('Edge Cases', () => {
    it('should not allow purchase of unpublished trip', async () => {
      const unpublishedTrip = {
        ...testTrip,
        status: 'Bozza'
      };

      mockPrisma.trip.findUnique.mockResolvedValueOnce(unpublishedTrip as any);
      mockPrisma.tripPurchase.findUnique.mockResolvedValueOnce(null);

      const result = await PurchaseService.createPurchase(testUser.id, testTrip.id);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Questo viaggio non è disponibile per l\'acquisto');
    });

    it('should handle non-existent trip', async () => {
      mockPrisma.trip.findUnique.mockResolvedValueOnce(null);

      const result = await PurchaseService.createPurchase(testUser.id, 'non-existent-trip');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Viaggio non trovato');
    });

    it('should handle non-existent purchase completion', async () => {
      mockPrisma.tripPurchase.findUnique.mockResolvedValueOnce(null);

      const result = await PurchaseService.completePurchase('non-existent-purchase');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Acquisto non trovato');
    });
  });
});