// src/app/trips/[slug]/page.tsx
import { prisma } from '@/lib/core/prisma';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { UserRole } from '@/types/profile';
import { transformPrismaStages, RecommendedSeason } from '@/types/trip';
import { TripDetailClient } from '@/components/trips/TripDetailClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function TripDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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

  // Mappa le stagioni per il formato chip
  const seasonMapping: Record<RecommendedSeason, string> = {
    Primavera: 'Primavera',
    Estate: 'Estate', 
    Autunno: 'Autunno',
    Inverno: 'Inverno'
  };
  const mappedSeasons = trip.recommended_seasons.map(season => seasonMapping[season]);


  return (
    <TripDetailClient
      trip={trip}
      tripWithStages={tripWithStages}
      isOwner={isOwner}
      isSentinel={isSentinel}
      canEdit={canEdit}
      tripMediaItems={tripMediaItems}
      allStageMediaItems={allStageMediaItems}
      mappedSeasons={mappedSeasons}
    />
  );
}