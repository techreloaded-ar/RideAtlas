import { NextRequest } from 'next/server';
import { deleteTripReview } from '@/lib/trips/trip-community';
import { communityResponse, communityServerError, getCommunityActor } from '@/lib/trips/trip-community-http';

export const dynamic = 'force-dynamic';

// Elimina una recensione: autore o Sentinel
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string; reviewId: string }> }) {
  try {
    const { id, reviewId } = await params;
    const actor = await getCommunityActor();
    return communityResponse(await deleteTripReview(id, reviewId, actor));
  } catch (error) {
    return communityServerError('REVIEWS API', error);
  }
}
