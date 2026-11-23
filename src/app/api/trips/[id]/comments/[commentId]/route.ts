import { NextRequest } from 'next/server';
import { deleteTripComment } from '@/lib/trips/trip-community';
import { communityResponse, communityServerError, getCommunityActor } from '@/lib/trips/trip-community-http';

export const dynamic = 'force-dynamic';

// Elimina un commento: autore o Sentinel
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  try {
    const { id, commentId } = await params;
    const actor = await getCommunityActor();
    return communityResponse(await deleteTripComment(id, commentId, actor));
  } catch (error) {
    return communityServerError('COMMENTS API', error);
  }
}
