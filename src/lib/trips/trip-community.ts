import { prisma } from '@/lib/core/prisma';
import { PurchaseService } from '@/lib/payment/purchaseService';
import { TripStatus, UserRole } from '@prisma/client';
import { COMMENTS_PAGE_SIZE, TripCommentInput, TripReviewInput } from '@/schemas/trip-community';
import type {
  CommunityAuthor,
  ReviewSummary,
  ReviewSummaryWithDistribution,
  TripCommentItem,
  TripCommentsResponse,
  TripReviewItem,
  TripReviewsResponse,
} from '@/types/trip-community';

/**
 * Recensioni e commenti dei viaggi.
 * - Recensioni: solo chi ha un acquisto COMPLETED può crearle o modificarle (una per viaggio).
 * - Commenti: qualunque utente autenticato.
 * - Eliminazione: autore del contenuto o Sentinel.
 * - Disponibili solo per i viaggi pubblicati.
 */

export type CommunityActor = { id: string; role?: UserRole | string | null } | null;

export type CommunityResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

const TRIP_NOT_AVAILABLE = { ok: false as const, status: 404, error: 'Viaggio non trovato o non pubblicato' };
const LOGIN_REQUIRED = { ok: false as const, status: 401, error: 'È necessario effettuare il login' };

const authorSelect = { select: { id: true, name: true } } as const;

function toAuthor(user: { id: string; name: string | null }): CommunityAuthor {
  // Mai esporre l'email: se manca il nome usiamo un'etichetta generica
  return { id: user.id, name: user.name?.trim() || 'Motociclista' };
}

function isSentinel(actor: CommunityActor): boolean {
  return actor?.role === UserRole.Sentinel;
}

function roundAverage(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Math.round(value * 10) / 10;
}

async function findPublishedTrip(tripId: string) {
  if (!tripId) return null;
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, status: true, user_id: true },
  });
  if (!trip || trip.status !== TripStatus.Pubblicato) return null;
  return trip;
}

// ---------------------------------------------------------------------------
// Riepiloghi delle valutazioni
// ---------------------------------------------------------------------------

/** Media e numero di recensioni per più viaggi (catalogo). */
export async function getReviewSummaries(tripIds: string[]): Promise<Record<string, ReviewSummary>> {
  const summaries: Record<string, ReviewSummary> = {};
  if (tripIds.length === 0) return summaries;

  const groups = await prisma.tripReview.groupBy({
    by: ['tripId'],
    where: { tripId: { in: tripIds } },
    _avg: { rating: true },
    _count: { _all: true },
  });

  for (const id of tripIds) summaries[id] = { average: null, count: 0 };
  for (const group of groups) {
    summaries[group.tripId] = {
      average: roundAverage(group._avg.rating),
      count: group._count._all,
    };
  }
  return summaries;
}

export async function getReviewSummary(tripId: string): Promise<ReviewSummaryWithDistribution> {
  const groups = await prisma.tripReview.groupBy({
    by: ['rating'],
    where: { tripId },
    _count: { _all: true },
  });

  const distribution: ReviewSummaryWithDistribution['distribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let count = 0;
  let total = 0;
  for (const group of groups) {
    const rating = group.rating as 1 | 2 | 3 | 4 | 5;
    if (!(rating in distribution)) continue;
    distribution[rating] = group._count._all;
    count += group._count._all;
    total += rating * group._count._all;
  }

  return { average: count > 0 ? roundAverage(total / count) : null, count, distribution };
}

// ---------------------------------------------------------------------------
// Recensioni
// ---------------------------------------------------------------------------

export async function listTripReviews(tripId: string, actor: CommunityActor): Promise<CommunityResult<TripReviewsResponse>> {
  const trip = await findPublishedTrip(tripId);
  if (!trip) return TRIP_NOT_AVAILABLE;

  const [summary, reviews, canReview] = await Promise.all([
    getReviewSummary(tripId),
    prisma.tripReview.findMany({
      where: { tripId },
      include: { user: authorSelect },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    }),
    actor ? PurchaseService.hasPurchasedTrip(actor.id, tripId) : Promise.resolve(false),
  ]);

  const own = actor ? reviews.find(review => review.userId === actor.id) : undefined;

  const items: TripReviewItem[] = reviews.map(review => ({
    id: review.id,
    rating: review.rating,
    content: review.content,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    author: toAuthor(review.user),
    canDelete: !!actor && (review.userId === actor.id || isSentinel(actor)),
  }));

  return {
    ok: true,
    data: {
      summary,
      reviews: items,
      viewer: {
        isAuthenticated: !!actor,
        canReview,
        ownReview: own ? { id: own.id, rating: own.rating, content: own.content } : null,
      },
    },
  };
}

/** Crea o aggiorna la recensione della persona: richiede un acquisto completato. */
export async function saveTripReview(
  tripId: string,
  actor: CommunityActor,
  input: TripReviewInput,
): Promise<CommunityResult<{ id: string; created: boolean }>> {
  if (!actor) return LOGIN_REQUIRED;
  const trip = await findPublishedTrip(tripId);
  if (!trip) return TRIP_NOT_AVAILABLE;

  const hasPurchased = await PurchaseService.hasPurchasedTrip(actor.id, tripId);
  if (!hasPurchased) {
    return { ok: false, status: 403, error: 'Le recensioni possono essere lasciate solo da chi ha acquistato questo viaggio' };
  }

  const existing = await prisma.tripReview.findUnique({
    where: { tripId_userId: { tripId, userId: actor.id } },
    select: { id: true },
  });

  const review = await prisma.tripReview.upsert({
    where: { tripId_userId: { tripId, userId: actor.id } },
    create: { tripId, userId: actor.id, rating: input.rating, content: input.content ?? null },
    update: { rating: input.rating, content: input.content ?? null },
    select: { id: true },
  });

  return { ok: true, data: { id: review.id, created: !existing } };
}

export async function deleteTripReview(
  tripId: string,
  reviewId: string,
  actor: CommunityActor,
): Promise<CommunityResult<{ id: string }>> {
  if (!actor) return LOGIN_REQUIRED;
  const review = await prisma.tripReview.findUnique({
    where: { id: reviewId },
    select: { id: true, tripId: true, userId: true },
  });
  if (!review || review.tripId !== tripId) return { ok: false, status: 404, error: 'Recensione non trovata' };
  if (review.userId !== actor.id && !isSentinel(actor)) {
    return { ok: false, status: 403, error: 'Non hai i permessi per eliminare questa recensione' };
  }
  await prisma.tripReview.delete({ where: { id: review.id } });
  return { ok: true, data: { id: review.id } };
}

// ---------------------------------------------------------------------------
// Commenti
// ---------------------------------------------------------------------------

export async function listTripComments(
  tripId: string,
  actor: CommunityActor,
  cursor?: string | null,
): Promise<CommunityResult<TripCommentsResponse>> {
  const trip = await findPublishedTrip(tripId);
  if (!trip) return TRIP_NOT_AVAILABLE;

  const [rows, total] = await Promise.all([
    prisma.tripComment.findMany({
      where: { tripId },
      include: { user: authorSelect },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: COMMENTS_PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
    prisma.tripComment.count({ where: { tripId } }),
  ]);

  const hasMore = rows.length > COMMENTS_PAGE_SIZE;
  const page = hasMore ? rows.slice(0, COMMENTS_PAGE_SIZE) : rows;

  const comments: TripCommentItem[] = page.map(comment => ({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    author: toAuthor(comment.user),
    isTripAuthor: comment.userId === trip.user_id,
    canDelete: !!actor && (comment.userId === actor.id || isSentinel(actor)),
  }));

  return {
    ok: true,
    data: {
      comments,
      total,
      nextCursor: hasMore ? page[page.length - 1].id : null,
      viewer: { isAuthenticated: !!actor, canComment: !!actor },
    },
  };
}

export async function createTripComment(
  tripId: string,
  actor: CommunityActor,
  input: TripCommentInput,
): Promise<CommunityResult<{ id: string }>> {
  if (!actor) return LOGIN_REQUIRED;
  const trip = await findPublishedTrip(tripId);
  if (!trip) return TRIP_NOT_AVAILABLE;

  const comment = await prisma.tripComment.create({
    data: { tripId, userId: actor.id, content: input.content },
    select: { id: true },
  });
  return { ok: true, data: { id: comment.id } };
}

export async function deleteTripComment(
  tripId: string,
  commentId: string,
  actor: CommunityActor,
): Promise<CommunityResult<{ id: string }>> {
  if (!actor) return LOGIN_REQUIRED;
  const comment = await prisma.tripComment.findUnique({
    where: { id: commentId },
    select: { id: true, tripId: true, userId: true },
  });
  if (!comment || comment.tripId !== tripId) return { ok: false, status: 404, error: 'Commento non trovato' };
  if (comment.userId !== actor.id && !isSentinel(actor)) {
    return { ok: false, status: 403, error: 'Non hai i permessi per eliminare questo commento' };
  }
  await prisma.tripComment.delete({ where: { id: comment.id } });
  return { ok: true, data: { id: comment.id } };
}
