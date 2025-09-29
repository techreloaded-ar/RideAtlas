// src/app/trips/[slug]/page.tsx
import { prisma } from '@/lib/core/prisma';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { UserRole } from '@/types/profile';
import { transformPrismaStages } from '@/types/trip';
import { TripDetailClient } from '@/components/trips/TripDetailClient';
import { checkTripAccess } from '@/lib/auth/trip-access';
import { DraftAccessRestricted } from '@/components/trips/DraftAccessRestricted';
import { TripAccessErrorBoundary } from '@/components/trips/TripAccessErrorBoundary';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function TripDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    
    // Validate slug parameter
    if (!slug || typeof slug !== 'string') {
      console.error('Invalid slug parameter:', slug);
      notFound();
    }

    const session = await auth();
    const trip = await prisma.trip.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        stages: {
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    });

    if (!trip) {
      notFound();
    }

    // Check access control
    const accessResult = await checkTripAccess(
      {
        id: trip.id,
        status: trip.status,
        user_id: trip.user_id
      },
      session
    );

    // If access is denied, handle different denial reasons
    if (!accessResult.hasAccess) {
      if (accessResult.reason === 'not-found') {
        notFound();
      }
      
      if (accessResult.reason === 'database-error' || accessResult.reason === 'session-invalid') {
        // For system errors, throw to trigger error boundary
        throw new Error(`Access control error: ${accessResult.reason}`);
      }
      
      // For not-authenticated or draft-unauthorized, show the informational component
      if (accessResult.reason === 'not-authenticated' || accessResult.reason === 'draft-unauthorized') {
        return (
          <TripAccessErrorBoundary>
            <DraftAccessRestricted />
          </TripAccessErrorBoundary>
        );
      }
    }

  // Trasforma le stages di Prisma nel formato corretto per l'interfaccia
  const tripWithStages = {
    ...trip,
    stages: trip.stages ? transformPrismaStages(trip.stages) : []
  };

  // Controlla se l'utente è il creatore o un Sentinel
  const isOwner = session?.user?.id === trip.user_id;
  const isSentinel = session?.user?.role === UserRole.Sentinel;
  const canEdit = isOwner || isSentinel;

  // Cast dei media del viaggio principale (include immagini e video)
  const tripMedia = (trip.media || []) as unknown as { type: 'image' | 'video'; url: string; caption?: string; thumbnailUrl?: string; id?: string }[];
  const tripMediaItems = tripMedia.map((media, index) => ({
    id: media.id || `trip-media-${index}`,
    type: media.type,
    url: media.url,
    caption: media.caption,
    thumbnailUrl: media.thumbnailUrl
  }));

  // Aggrega tutti i media delle tappe (immagini e video)
  const allStageMediaItems = tripWithStages.stages.flatMap(stage => 
    stage.media.map(media => ({
      ...media,
      caption: media.caption || `Media da ${stage.title}`
    }))
  );

  // Combina media del viaggio + media delle tappe (viaggio prima, poi tappe in ordine)
  // const galleryMediaItems = [...tripMediaItems, ...allStageMediaItems];

  // Usa direttamente le stagioni tipizzate
  const mappedSeasons = trip.recommended_seasons;

  
  const serializedTripWithStages = {
    ...tripWithStages,
    price: tripWithStages.price.toNumber() // Converte Decimal in number per serializzare oggetto Server -> Client
  }

    return (
      <TripAccessErrorBoundary>
        <TripDetailClient
          trip={serializedTripWithStages}
          isOwner={isOwner}
          isSentinel={isSentinel}
          canEdit={canEdit}
          tripMediaItems={tripMediaItems}
          allStageMediaItems={allStageMediaItems}
          mappedSeasons={mappedSeasons}
        />
      </TripAccessErrorBoundary>
    );
  } catch (error) {
    console.error('Error in TripDetailPage:', error);
    
    // For database connection errors or other system errors, show error boundary
    throw error;
  }
}