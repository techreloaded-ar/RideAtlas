/**
 * Regole di recensioni e commenti dei viaggi
 */
import { TripStatus, UserRole } from '@prisma/client';
import {
  createTripComment,
  deleteTripComment,
  deleteTripReview,
  getReviewSummaries,
  getReviewSummary,
  listTripComments,
  listTripReviews,
  saveTripReview,
} from '@/lib/trips/trip-community';
import { PurchaseService } from '@/lib/payment/purchaseService';

jest.mock('@/lib/payment/purchaseService', () => ({
  PurchaseService: { hasPurchasedTrip: jest.fn() },
}));

const mockPrisma = (global as any).mockPrisma;
const mockHasPurchased = PurchaseService.hasPurchasedTrip as jest.Mock;

const publishedTrip = { id: 'trip-1', status: TripStatus.Pubblicato, user_id: 'ranger-1' };
const explorer = { id: 'user-1', role: UserRole.Explorer };
const otherExplorer = { id: 'user-2', role: UserRole.Explorer };
const ranger = { id: 'ranger-1', role: UserRole.Ranger };
const sentinel = { id: 'sentinel-1', role: UserRole.Sentinel };

const date = new Date('2026-11-03T10:00:00Z');

describe('trip-community', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.trip.findUnique.mockResolvedValue(publishedTrip);
    mockPrisma.tripReview.groupBy.mockResolvedValue([]);
    mockPrisma.tripReview.findMany.mockResolvedValue([]);
    mockPrisma.tripComment.findMany.mockResolvedValue([]);
    mockPrisma.tripComment.count.mockResolvedValue(0);
    mockHasPurchased.mockResolvedValue(false);
  });

  describe('riepiloghi', () => {
    it('calcola media arrotondata a un decimale e distribuzione', async () => {
      mockPrisma.tripReview.groupBy.mockResolvedValue([
        { rating: 5, _count: { _all: 2 } },
        { rating: 4, _count: { _all: 1 } },
      ]);
      const summary = await getReviewSummary('trip-1');
      expect(summary).toEqual({ average: 4.7, count: 3, distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 2 } });
    });

    it('restituisce media nulla senza recensioni', async () => {
      const summary = await getReviewSummary('trip-1');
      expect(summary.average).toBeNull();
      expect(summary.count).toBe(0);
    });

    it('riepiloga più viaggi includendo quelli senza recensioni', async () => {
      mockPrisma.tripReview.groupBy.mockResolvedValue([
        { tripId: 'trip-1', _avg: { rating: 4.4444 }, _count: { _all: 9 } },
      ]);
      const summaries = await getReviewSummaries(['trip-1', 'trip-2']);
      expect(summaries).toEqual({
        'trip-1': { average: 4.4, count: 9 },
        'trip-2': { average: null, count: 0 },
      });
    });

    it('non interroga il database senza viaggi', async () => {
      expect(await getReviewSummaries([])).toEqual({});
      expect(mockPrisma.tripReview.groupBy).not.toHaveBeenCalled();
    });
  });

  describe('recensioni', () => {
    it('permette la recensione a chi ha un acquisto completato', async () => {
      mockHasPurchased.mockResolvedValue(true);
      mockPrisma.tripReview.findUnique.mockResolvedValue(null);
      mockPrisma.tripReview.upsert.mockResolvedValue({ id: 'review-1' });

      const result = await saveTripReview('trip-1', explorer, { rating: 4, content: 'Bello' });

      expect(result).toEqual({ ok: true, data: { id: 'review-1', created: true } });
      expect(mockHasPurchased).toHaveBeenCalledWith('user-1', 'trip-1');
      expect(mockPrisma.tripReview.upsert).toHaveBeenCalledWith(expect.objectContaining({
        where: { tripId_userId: { tripId: 'trip-1', userId: 'user-1' } },
        create: { tripId: 'trip-1', userId: 'user-1', rating: 4, content: 'Bello' },
        update: { rating: 4, content: 'Bello' },
      }));
    });

    it('aggiorna la recensione esistente invece di crearne una seconda', async () => {
      mockHasPurchased.mockResolvedValue(true);
      mockPrisma.tripReview.findUnique.mockResolvedValue({ id: 'review-1' });
      mockPrisma.tripReview.upsert.mockResolvedValue({ id: 'review-1' });

      const result = await saveTripReview('trip-1', explorer, { rating: 2, content: null });

      expect(result).toEqual({ ok: true, data: { id: 'review-1', created: false } });
    });

    it('rifiuta la recensione di chi non ha acquistato (anche rimborsato o in attesa)', async () => {
      mockHasPurchased.mockResolvedValue(false);
      const result = await saveTripReview('trip-1', explorer, { rating: 5 });
      expect(result).toEqual({ ok: false, status: 403, error: expect.stringContaining('solo da chi ha acquistato') });
      expect(mockPrisma.tripReview.upsert).not.toHaveBeenCalled();
    });

    it('richiede il login', async () => {
      const result = await saveTripReview('trip-1', null, { rating: 5 });
      expect(result).toMatchObject({ ok: false, status: 401 });
    });

    it('rifiuta recensioni su viaggi non pubblicati', async () => {
      mockHasPurchased.mockResolvedValue(true);
      mockPrisma.trip.findUnique.mockResolvedValue({ ...publishedTrip, status: TripStatus.Bozza });
      const result = await saveTripReview('trip-1', explorer, { rating: 5 });
      expect(result).toMatchObject({ ok: false, status: 404 });
    });

    it('elenca le recensioni senza esporre email e con i permessi della persona', async () => {
      mockHasPurchased.mockResolvedValue(true);
      mockPrisma.tripReview.findMany.mockResolvedValue([
        { id: 'r-1', userId: 'user-1', rating: 5, content: 'Top', createdAt: date, updatedAt: date, user: { id: 'user-1', name: 'Marco' } },
        { id: 'r-2', userId: 'user-2', rating: 3, content: null, createdAt: date, updatedAt: date, user: { id: 'user-2', name: null } },
      ]);

      const result = await listTripReviews('trip-1', explorer);
      if (!result.ok) throw new Error('expected ok');

      expect(result.data.viewer).toEqual({ isAuthenticated: true, canReview: true, ownReview: { id: 'r-1', rating: 5, content: 'Top' } });
      expect(result.data.reviews.map(r => r.canDelete)).toEqual([true, false]);
      expect(result.data.reviews[1].author).toEqual({ id: 'user-2', name: 'Motociclista' });
      expect(JSON.stringify(result.data)).not.toContain('@');
    });

    it('mostra le recensioni anche a chi non ha effettuato l\'accesso', async () => {
      const result = await listTripReviews('trip-1', null);
      expect(result).toMatchObject({ ok: true, data: { viewer: { isAuthenticated: false, canReview: false, ownReview: null } } });
      expect(mockHasPurchased).not.toHaveBeenCalled();
    });

    it('permette all\'autore di eliminare la propria recensione', async () => {
      mockPrisma.tripReview.findUnique.mockResolvedValue({ id: 'r-1', tripId: 'trip-1', userId: 'user-1' });
      const result = await deleteTripReview('trip-1', 'r-1', explorer);
      expect(result).toEqual({ ok: true, data: { id: 'r-1' } });
      expect(mockPrisma.tripReview.delete).toHaveBeenCalledWith({ where: { id: 'r-1' } });
    });

    it('permette al Sentinel di eliminare qualunque recensione', async () => {
      mockPrisma.tripReview.findUnique.mockResolvedValue({ id: 'r-1', tripId: 'trip-1', userId: 'user-1' });
      expect(await deleteTripReview('trip-1', 'r-1', sentinel)).toMatchObject({ ok: true });
    });

    it('impedisce al Ranger del viaggio e ad altri utenti di eliminare recensioni altrui', async () => {
      mockPrisma.tripReview.findUnique.mockResolvedValue({ id: 'r-1', tripId: 'trip-1', userId: 'user-1' });
      expect(await deleteTripReview('trip-1', 'r-1', ranger)).toMatchObject({ ok: false, status: 403 });
      expect(await deleteTripReview('trip-1', 'r-1', otherExplorer)).toMatchObject({ ok: false, status: 403 });
      expect(mockPrisma.tripReview.delete).not.toHaveBeenCalled();
    });

    it('restituisce 404 se la recensione appartiene a un altro viaggio', async () => {
      mockPrisma.tripReview.findUnique.mockResolvedValue({ id: 'r-1', tripId: 'trip-9', userId: 'user-1' });
      expect(await deleteTripReview('trip-1', 'r-1', explorer)).toMatchObject({ ok: false, status: 404 });
    });
  });

  describe('commenti', () => {
    it('permette a qualunque utente autenticato di commentare', async () => {
      mockPrisma.tripComment.create.mockResolvedValue({ id: 'c-1' });
      const result = await createTripComment('trip-1', otherExplorer, { content: 'Passo chiuso' });
      expect(result).toEqual({ ok: true, data: { id: 'c-1' } });
      expect(mockHasPurchased).not.toHaveBeenCalled();
      expect(mockPrisma.tripComment.create).toHaveBeenCalledWith({
        data: { tripId: 'trip-1', userId: 'user-2', content: 'Passo chiuso' },
        select: { id: true },
      });
    });

    it('richiede il login per commentare', async () => {
      expect(await createTripComment('trip-1', null, { content: 'x' })).toMatchObject({ ok: false, status: 401 });
    });

    it('rifiuta commenti su viaggi inesistenti o non pubblicati', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(null);
      expect(await createTripComment('trip-1', explorer, { content: 'x' })).toMatchObject({ ok: false, status: 404 });
    });

    it('elenca i commenti segnando l\'autore del viaggio e paginando di 20 in 20', async () => {
      const rows = Array.from({ length: 21 }, (_, i) => ({
        id: `c-${i}`,
        userId: i === 0 ? 'ranger-1' : 'user-2',
        content: `commento ${i}`,
        createdAt: date,
        user: { id: i === 0 ? 'ranger-1' : 'user-2', name: i === 0 ? 'Giulia' : 'Paolo' },
      }));
      mockPrisma.tripComment.findMany.mockResolvedValue(rows);
      mockPrisma.tripComment.count.mockResolvedValue(25);

      const result = await listTripComments('trip-1', otherExplorer);
      if (!result.ok) throw new Error('expected ok');

      expect(result.data.comments).toHaveLength(20);
      expect(result.data.total).toBe(25);
      expect(result.data.nextCursor).toBe('c-19');
      expect(result.data.comments[0]).toMatchObject({ isTripAuthor: true, canDelete: false });
      expect(result.data.comments[1]).toMatchObject({ isTripAuthor: false, canDelete: true });
      expect(mockPrisma.tripComment.findMany).toHaveBeenCalledWith(expect.objectContaining({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 21,
      }));
    });

    it('usa il cursore per caricare altri commenti', async () => {
      await listTripComments('trip-1', null, 'c-19');
      expect(mockPrisma.tripComment.findMany).toHaveBeenCalledWith(expect.objectContaining({ cursor: { id: 'c-19' }, skip: 1 }));
    });

    it('permette ad autore e Sentinel di eliminare un commento, non al Ranger', async () => {
      mockPrisma.tripComment.findUnique.mockResolvedValue({ id: 'c-1', tripId: 'trip-1', userId: 'user-2' });
      expect(await deleteTripComment('trip-1', 'c-1', ranger)).toMatchObject({ ok: false, status: 403 });
      expect(await deleteTripComment('trip-1', 'c-1', otherExplorer)).toMatchObject({ ok: true });
      expect(await deleteTripComment('trip-1', 'c-1', sentinel)).toMatchObject({ ok: true });
      expect(mockPrisma.tripComment.delete).toHaveBeenCalledTimes(2);
    });
  });
});
