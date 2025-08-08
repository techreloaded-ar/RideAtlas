// src/app/trips/[slug]/page.tsx
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import Link from 'next/link';
import { UserRole } from '@/types/profile';
import { isMultiStageTrip, transformPrismaStages, RecommendedSeason } from '@/types/trip';
import { TripChips } from '@/components/trips/TripChips';
import { TripMeta } from '@/components/trips/TripMeta';
import { ImageGallery } from '@/components/ui/ImageGallery';
import StageTimeline from '@/components/stages/StageTimeline';
import AccessGate from '@/components/auth/AccessGate';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Funzione per formattare la data
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

export default async function TripDetailPage({ params }: { params: { slug: string } }) {
  const session = await auth();
  const trip = await prisma.trip.findUnique({
    where: { slug: params.slug },
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
  const isMultiStage = isMultiStageTrip(tripWithStages);

  // Controlla se l'utente è il creatore o un Sentinel
  const isOwner = session?.user?.id === trip.user_id;
  const isSentinel = session?.user?.role === UserRole.Sentinel;
  const canEdit = isOwner || isSentinel;

  // Aggrega solo le immagini (non video) delle tappe per il carosello principale
  const allStageImages = tripWithStages.stages.flatMap(stage => 
    stage.media
      .filter(media => media.type === 'image')
      .map(media => ({
        src: media.url,
        alt: media.caption || `Immagine da ${stage.title}`
      }))
  );

  // Se non ci sono immagini dalle tappe, usa quelle del trip principale (solo immagini)
  const tripMedia = (trip.media || []) as unknown as { type: 'image' | 'video'; url: string; caption?: string }[];
  const galleryImages = allStageImages.length > 0 ? allStageImages : 
    tripMedia
      .filter(media => media.type === 'image')
      .map(media => ({
        src: media.url,
        alt: media.caption || trip.title
      }));

  // Mappa le stagioni per il formato chip
  const seasonMapping: Record<RecommendedSeason, string> = {
    Primavera: 'Primavera',
    Estate: 'Estate', 
    Autunno: 'Autunno',
    Inverno: 'Inverno'
  };
  const mappedSeasons = trip.recommended_seasons.map(season => seasonMapping[season]);


  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
          <h1 className="text-4xl font-medium mb-4">{trip.title}</h1>
          {canEdit && (
            <Link
              href={`/edit-trip/${trip.id}`}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              Modifica
            </Link>
          )}
        </div>
        
        <TripChips 
          duration={isMultiStage 
            ? `${tripWithStages.stages.length} giorni / ${Math.max(0, tripWithStages.stages.length - 1)} notti`
            : `${trip.duration_days} giorni / ${trip.duration_nights} notti`
          }
          location={trip.destination}
          terrain={trip.theme}
          seasons={mappedSeasons}
        />
        
        <TripMeta 
          author={trip.user.name || trip.user.email}
          publishDate={formatDate(trip.created_at)}
        />
      </div>

      {/* Image Gallery */}
      {galleryImages.length > 0 && (
        <ImageGallery images={galleryImages} />
      )}

      {/* Description */}
      <div className="mb-8">
        <p className="leading-relaxed mb-4 text-[14px]">
          {trip.summary}
        </p>
      </div>

      {/* Caratteristiche e Tags */}
      {(trip.characteristics.length > 0 || trip.tags.length > 0) && (
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trip.characteristics.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Caratteristiche</h4>
                <div className="flex flex-wrap gap-2">
                  {trip.characteristics.map((characteristic, index) => (
                    <span 
                      key={index} 
                      className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                    >
                      {characteristic}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {trip.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {trip.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trip Stages Section - Solo per viaggi multi-tappa */}
      {isMultiStage && tripWithStages.stages.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tappe del viaggio</h2>

          <AccessGate 
            tripId={trip.id} 
            premiumContentType="le tappe dettagliate del viaggio"
            showPreview={true}
          >
            <StageTimeline
              stages={tripWithStages.stages}
              isEditable={false}
            />
          </AccessGate>
        </div>
      )}
      
      {/* Insights - Approfondimenti */}
      {trip.insights && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3">Approfondimenti</h3>
          <p className="text-gray-700 leading-relaxed">{trip.insights}</p>
        </div>
      )}
    </div>
  );
}