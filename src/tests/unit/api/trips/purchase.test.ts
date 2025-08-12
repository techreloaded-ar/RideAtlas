import { POST, GET } from '@/app/api/trips/[id]/purchase/route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { PurchaseService } from '@/lib/payment/purchaseService';

jest.mock('@/auth');
jest.mock('@/lib/payment/purchaseService');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPurchaseService = PurchaseService as jest.Mocked<typeof PurchaseService>;

describe('/api/trips/[id]/purchase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should create purchase successfully', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' }
      } as any);

      mockPurchaseService.createPurchase.mockResolvedValue({
        success: true,
        purchaseId: 'purchase-1'
      });

      const request = new NextRequest('http://localhost/api/trips/trip-1/purchase', {
        method: 'POST'
      });

      const response = await POST(request, { params: { id: 'trip-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.purchaseId).toBe('purchase-1');
      expect(mockPurchaseService.createPurchase).toHaveBeenCalledWith('user-1', 'trip-1');
    });

    it('should return 401 if user not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/trips/trip-1/purchase', {
        method: 'POST'
      });

      const response = await POST(request, { params: { id: 'trip-1' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('login');
    });

    it('should return 400 if purchase creation fails', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' }
      } as any);

      mockPurchaseService.createPurchase.mockResolvedValue({
        success: false,
        error: 'Viaggio non trovato'
      });

      const request = new NextRequest('http://localhost/api/trips/trip-1/purchase', {
        method: 'POST'
      });

      const response = await POST(request, { params: { id: 'trip-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Viaggio non trovato');
    });
  });

  describe('GET', () => {
    it('should return purchase status successfully', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' }
      } as any);

      mockPurchaseService.getTripWithPurchaseInfo.mockResolvedValue({
        id: 'trip-1',
        title: 'Test Trip',
        price: 5.00,
        hasPurchased: true,
        isOwner: false,
        purchase: {
          id: 'purchase-1',
          userId: 'user-1',
          tripId: 'trip-1',
          amount: 5.00,
          status: 'COMPLETED' as any,
          purchasedAt: new Date(),
          createdAt: new Date()
        }
      });

      const request = new NextRequest('http://localhost/api/trips/trip-1/purchase');

      const response = await GET(request, { params: { id: 'trip-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.purchased).toBe(true);
      expect(data.isOwner).toBe(false);
      expect(data.price).toBe(5.00);
      expect(data.purchase).toBeDefined();
    });

    it('should return 401 if user not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/trips/trip-1/purchase');

      const response = await GET(request, { params: { id: 'trip-1' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.purchased).toBe(false);
      expect(data.reason).toBe('not_authenticated');
    });

    it('should return 404 if trip not found', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' }
      } as any);

      mockPurchaseService.getTripWithPurchaseInfo.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/trips/trip-1/purchase');

      const response = await GET(request, { params: { id: 'trip-1' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Viaggio non trovato');
    });
  });
});