/**
 * API recensioni e commenti: /api/trips/[id]/reviews e /api/trips/[id]/comments
 */
import { NextRequest } from 'next/server';
import { TripStatus, UserRole } from '@prisma/client';
import { auth } from '@/auth';
import { PurchaseService } from '@/lib/payment/purchaseService';
import { GET as getReviews, POST as postReview } from '@/app/api/trips/[id]/reviews/route';
import { DELETE as deleteReview } from '@/app/api/trips/[id]/reviews/[reviewId]/route';
import { GET as getComments, POST as postComment } from '@/app/api/trips/[id]/comments/route';
import { DELETE as deleteComment } from '@/app/api/trips/[id]/comments/[commentId]/route';

jest.mock('@/lib/payment/purchaseService', () => ({
  PurchaseService: { hasPurchasedTrip: jest.fn() },
}));

const mockPrisma = (global as any).mockPrisma;
const mockAuth = auth as jest.Mock;
const mockHasPurchased = PurchaseService.hasPurchasedTrip as jest.Mock;

const params = { params: Promise.resolve({ id: 'trip-1' }) };
const session = (id: string, role: UserRole) => ({ user: { id, role, email: `${id}@example.com` } });

function jsonRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('API recensioni e commenti', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue(null);
    mockPrisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', status: TripStatus.Pubblicato, user_id: 'ranger-1' });
    mockPrisma.tripReview.groupBy.mockResolvedValue([]);
    mockPrisma.tripReview.findMany.mockResolvedValue([]);
    mockPrisma.tripComment.findMany.mockResolvedValue([]);
    mockPrisma.tripComment.count.mockResolvedValue(0);
    mockHasPurchased.mockResolvedValue(false);
  });

  describe('POST /reviews', () => {
    const url = 'http://localhost/api/trips/trip-1/reviews';

    it('risponde 401 senza login', async () => {
      const response = await postReview(jsonRequest(url, 'POST', { rating: 5 }), params);
      expect(response.status).toBe(401);
    });

    it('risponde 403 a chi non ha acquistato il viaggio', async () => {
      mockAuth.mockResolvedValue(session('user-1', UserRole.Explorer));
      const response = await postReview(jsonRequest(url, 'POST', { rating: 5 }), params);
      expect(response.status).toBe(403);
      expect((await response.json()).error).toContain('solo da chi ha acquistato');
      expect(mockPrisma.tripReview.upsert).not.toHaveBeenCalled();
    });

    it('crea la recensione di chi ha acquistato (201)', async () => {
      mockAuth.mockResolvedValue(session('user-1', UserRole.Explorer));
      mockHasPurchased.mockResolvedValue(true);
      mockPrisma.tripReview.findUnique.mockResolvedValue(null);
      mockPrisma.tripReview.upsert.mockResolvedValue({ id: 'review-1' });

      const response = await postReview(jsonRequest(url, 'POST', { rating: 4, content: '  Ottimo  ' }), params);

      expect(response.status).toBe(201);
      expect(mockPrisma.tripReview.upsert).toHaveBeenCalledWith(expect.objectContaining({
        create: { tripId: 'trip-1', userId: 'user-1', rating: 4, content: 'Ottimo' },
      }));
    });

    it.each([
      [{ rating: 0 }, 'minimo'],
      [{ rating: 6 }, 'massimo'],
      [{ rating: 3.5 }, 'intero'],
      [{}, 'Seleziona un voto'],
      [{ rating: 5, content: 'x'.repeat(1001) }, '1000 caratteri'],
    ])('valida il corpo (caso %#)', async (body, message) => {
      mockAuth.mockResolvedValue(session('user-1', UserRole.Explorer));
      const response = await postReview(jsonRequest(url, 'POST', body), params);
      expect(response.status).toBe(400);
      expect((await response.json()).error).toContain(message);
    });

    it('rifiuta JSON non valido', async () => {
      mockAuth.mockResolvedValue(session('user-1', UserRole.Explorer));
      const response = await postReview(jsonRequest(url, 'POST', '{'), params);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /reviews', () => {
    it('restituisce riepilogo e stato della persona', async () => {
      const response = await getReviews(jsonRequest('http://localhost/api/trips/trip-1/reviews', 'GET'), params);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.summary).toEqual({ average: null, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
      expect(data.viewer).toEqual({ isAuthenticated: false, canReview: false, ownReview: null });
    });

    it('risponde 404 per viaggi non pubblicati', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({ id: 'trip-1', status: TripStatus.Bozza, user_id: 'ranger-1' });
      const response = await getReviews(jsonRequest('http://localhost/api/trips/trip-1/reviews', 'GET'), params);
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /reviews/[reviewId]', () => {
    const deleteParams = { params: Promise.resolve({ id: 'trip-1', reviewId: 'r-1' }) };

    it('impedisce al Ranger di eliminare una recensione altrui', async () => {
      mockAuth.mockResolvedValue(session('ranger-1', UserRole.Ranger));
      mockPrisma.tripReview.findUnique.mockResolvedValue({ id: 'r-1', tripId: 'trip-1', userId: 'user-1' });
      const response = await deleteReview(jsonRequest('http://localhost/x', 'DELETE'), deleteParams);
      expect(response.status).toBe(403);
    });

    it('permette al Sentinel di eliminarla', async () => {
      mockAuth.mockResolvedValue(session('sentinel-1', UserRole.Sentinel));
      mockPrisma.tripReview.findUnique.mockResolvedValue({ id: 'r-1', tripId: 'trip-1', userId: 'user-1' });
      const response = await deleteReview(jsonRequest('http://localhost/x', 'DELETE'), deleteParams);
      expect(response.status).toBe(200);
      expect(mockPrisma.tripReview.delete).toHaveBeenCalledWith({ where: { id: 'r-1' } });
    });
  });

  describe('commenti', () => {
    const url = 'http://localhost/api/trips/trip-1/comments';

    it('risponde 401 a chi non ha effettuato l\'accesso', async () => {
      const response = await postComment(jsonRequest(url, 'POST', { content: 'Ciao' }), params);
      expect(response.status).toBe(401);
    });

    it('permette di commentare senza acquisto (201)', async () => {
      mockAuth.mockResolvedValue(session('user-2', UserRole.Explorer));
      mockPrisma.tripComment.create.mockResolvedValue({ id: 'c-1' });
      const response = await postComment(jsonRequest(url, 'POST', { content: 'Passo Giau chiuso' }), params);
      expect(response.status).toBe(201);
      expect(mockHasPurchased).not.toHaveBeenCalled();
    });

    it('rifiuta un commento vuoto', async () => {
      mockAuth.mockResolvedValue(session('user-2', UserRole.Explorer));
      const response = await postComment(jsonRequest(url, 'POST', { content: '   ' }), params);
      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe('Scrivi il testo del commento');
    });

    it('passa il cursore della paginazione', async () => {
      const response = await getComments(jsonRequest(`${url}?cursor=c-19`, 'GET'), params);
      expect(response.status).toBe(200);
      expect(mockPrisma.tripComment.findMany).toHaveBeenCalledWith(expect.objectContaining({ cursor: { id: 'c-19' } }));
    });

    it('permette all\'autore di eliminare il proprio commento', async () => {
      mockAuth.mockResolvedValue(session('user-2', UserRole.Explorer));
      mockPrisma.tripComment.findUnique.mockResolvedValue({ id: 'c-1', tripId: 'trip-1', userId: 'user-2' });
      const response = await deleteComment(jsonRequest('http://localhost/x', 'DELETE'), { params: Promise.resolve({ id: 'trip-1', commentId: 'c-1' }) });
      expect(response.status).toBe(200);
    });
  });
});
