import { NextRequest } from 'next/server';
import { listTripReviews, saveTripReview } from '@/lib/trips/trip-community';
import { communityResponse, communityServerError, getCommunityActor, parseCommunityBody } from '@/lib/trips/trip-community-http';
import { tripReviewSchema } from '@/schemas/trip-community';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

// Elenco recensioni con riepilogo e stato della persona corrente
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const actor = await getCommunityActor();
    return communityResponse(await listTripReviews(id, actor));
  } catch (error) {
    return communityServerError('REVIEWS API', error);
  }
}

// Crea o aggiorna la recensione della persona (solo con acquisto completato)
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const actor = await getCommunityActor();
    if (!actor) return communityResponse({ ok: false, status: 401, error: 'È necessario effettuare il login' });
    const body = await parseCommunityBody(request, tripReviewSchema);
    if (!body.ok) return body.response;
    const result = await saveTripReview(id, actor, body.data);
    return communityResponse(result, result.ok && result.data.created ? 201 : 200);
  } catch (error) {
    return communityServerError('REVIEWS API', error);
  }
}
