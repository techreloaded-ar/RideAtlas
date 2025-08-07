import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/admin/purchases/[id]/route';
import { auth } from '@/auth';
import { UserRole } from '@/types/profile';
import { PurchaseService } from '@/lib/purchaseService';

jest.mock('@/auth');
jest.mock('@/lib/purchaseService');

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPurchaseService = PurchaseService as jest.Mocked<typeof PurchaseService>;

const createMockRequest = (body?: any) => ({
  json: jest.fn().mockResolvedValue(body || {})
} as any as NextRequest);

describe('/api/admin/purchases/[id] - PATCH', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully refund a purchase', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', role: UserRole.Sentinel }
    } as any);

    mockPurchaseService.refundPurchase.mockResolvedValue({ success: true });

    const request = createMockRequest({ reason: 'Customer request' });
    const response = await PATCH(request, { params: { id: 'purchase-1' } });

    expect(response.status).toBe(200);
    expect(mockPurchaseService.refundPurchase).toHaveBeenCalledWith(
      'purchase-1',
      'admin-1',
      'Customer request'
    );

    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.message).toBe('Acquisto rimborsato con successo');
  });

  it('should handle refund without reason', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', role: UserRole.Sentinel }
    } as any);

    mockPurchaseService.refundPurchase.mockResolvedValue({ success: true });

    const request = createMockRequest({});
    const response = await PATCH(request, { params: { id: 'purchase-1' } });

    expect(response.status).toBe(200);
    expect(mockPurchaseService.refundPurchase).toHaveBeenCalledWith(
      'purchase-1',
      'admin-1',
      undefined
    );
  });

  it('should return 400 when refund fails', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', role: UserRole.Sentinel }
    } as any);

    mockPurchaseService.refundPurchase.mockResolvedValue({
      success: false,
      error: 'Purchase not found'
    });

    const request = createMockRequest({ reason: 'Test' });
    const response = await PATCH(request, { params: { id: 'purchase-1' } });

    expect(response.status).toBe(400);
    const responseData = await response.json();
    expect(responseData.error).toBe('Purchase not found');
  });

  it('should return 401 for unauthenticated users', async () => {
    mockAuth.mockResolvedValue(null);

    const request = createMockRequest({ reason: 'Test' });
    const response = await PATCH(request, { params: { id: 'purchase-1' } });

    expect(response.status).toBe(401);
    const responseData = await response.json();
    expect(responseData.error).toBe('Non autorizzato');
  });

  it('should return 403 for non-Sentinel users', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', role: UserRole.Explorer }
    } as any);

    const request = createMockRequest({ reason: 'Test' });
    const response = await PATCH(request, { params: { id: 'purchase-1' } });

    expect(response.status).toBe(403);
    const responseData = await response.json();
    expect(responseData.error).toBe('Permessi insufficienti');
  });

  it('should handle invalid request data', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', role: UserRole.Sentinel }
    } as any);

    const request = {
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
    } as any as NextRequest;

    const response = await PATCH(request, { params: { id: 'purchase-1' } });

    expect(response.status).toBe(500);
  });
});