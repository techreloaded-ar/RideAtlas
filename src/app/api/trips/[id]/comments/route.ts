import { NextRequest } from 'next/server';
import { createTripComment, listTripComments } from '@/lib/trips/trip-community';
import { communityResponse, communityServerError, getCommunityActor, parseCommunityBody } from '@/lib/trips/trip-community-http';
import { tripCommentSchema } from '@/schemas/trip-community';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

// Elenco commenti (più recenti per primi, paginato con ?cursor=)
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const actor = await getCommunityActor();
    const cursor = request.nextUrl.searchParams.get('cursor');
    return communityResponse(await listTripComments(id, actor, cursor));
  } catch (error) {
    return communityServerError('COMMENTS API', error);
  }
}

// Nuovo commento: qualunque utente autenticato
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const actor = await getCommunityActor();
    if (!actor) return communityResponse({ ok: false, status: 401, error: 'È necessario effettuare il login' });
    const body = await parseCommunityBody(request, tripCommentSchema);
    if (!body.ok) return body.response;
    return communityResponse(await createTripComment(id, actor, body.data), 201);
  } catch (error) {
    return communityServerError('COMMENTS API', error);
  }
}
