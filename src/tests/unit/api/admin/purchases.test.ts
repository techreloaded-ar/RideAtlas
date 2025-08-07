import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/purchases/route';
import { auth } from '@/auth';
import { UserRole } from '@/types/profile';
import { PurchaseService } from '@/lib/purchaseService';

jest.mock('@/auth');
jest.mock('@/lib/purchaseService');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPurchaseService = PurchaseService as jest.Mocked<typeof PurchaseService>;

const createMockRequest = (searchParams?: Record<string, string>, body?: any) => {
  const url = new URL('http://localhost/api/admin/purchases');
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return {
    nextUrl: url,
    json: jest.fn().mockResolvedValue(body || {})
  } as any as NextRequest;
};

describe('/api/admin/purchases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return purchases for authenticated Sentinel', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'admin-1', role: UserRole.Sentinel }
      } as any);

      const mockResult = {
        purchases: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 }
      };
      mockPurchaseService.getAllPurchases.mockResolvedValue(mockResult);

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPurchaseService.getAllPurchases).toHaveBeenCalledWith(1, 10, {});
    });

    it('should apply query parameters as filters', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'admin-1', role: UserRole.Sentinel }
      } as any);

      mockPurchaseService.getAllPurchases.mockResolvedValue({
        purchases: [],
        pagination: { page: 2, limit: 5, total: 0, pages: 0 }
      });

      const request = createMockRequest({
        page: '2',
        limit: '5',
        userId: 'user-1',
        status: 'COMPLETED',
        search: 'test'
      });

      await GET(request);

      expect(mockPurchaseService.getAllPurchases).toHaveBeenCalledWith(2, 5, {
        userId: 'user-1',
        tripId: undefined,
        status: 'COMPLETED',
        search: 'test'
      });
    });

    it('should return 401 for unauthenticated users', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-Sentinel users', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', role: UserRole.Explorer }
      } as any);

      const request = createMockRequest();
      const response = await GET(request);

      expect(response.status).toBe(403);
    });
  });

  describe('POST', () => {
    const giftData = {
      userId: 'user-1',
      tripId: 'trip-1',
      reason: 'Holiday gift'
    };

    it('should successfully gift a trip', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'admin-1', role: UserRole.Sentinel }
      } as any);

      mockPurchaseService.giftTrip.mockResolvedValue({ success: true });

      const request = createMockRequest({}, giftData);
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockPurchaseService.giftTrip).toHaveBeenCalledWith(
        'user-1',
        'trip-1',
        'admin-1',
        'Holiday gift'
      );
    });

    it('should return 400 for invalid data', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'admin-1', role: UserRole.Sentinel }
      } as any);

      const invalidData = { userId: '', tripId: 'trip-1' };
      const request = createMockRequest({}, invalidData);
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 400 when giftTrip fails', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'admin-1', role: UserRole.Sentinel }
      } as any);

      mockPurchaseService.giftTrip.mockResolvedValue({
        success: false,
        error: 'Trip not found'
      });

      const request = createMockRequest({}, giftData);
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should return 401 for unauthenticated users', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createMockRequest({}, giftData);
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-Sentinel users', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', role: UserRole.Explorer }
      } as any);

      const request = createMockRequest({}, giftData);
      const response = await POST(request);

      expect(response.status).toBe(403);
    });
  });
});