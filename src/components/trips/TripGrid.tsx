import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, Tag, User, Clock, Navigation } from 'lucide-react';
import { castToMediaItems, MediaItem } from '@/types/trip';
import { SeasonIcon } from '@/components/ui/SeasonIcon';
import { getTripStatusColor, getTripStatusLabel, shouldShowStatusBadge } from '@/lib/utils/tripStatusUtils';
import { Prisma, UserRole } from '@prisma/client';
import { UserPermissions } from '@/types/profile';

// Tipi per i dati del viaggio (copiati dalla pagina originale)
type TripWithRelations = Prisma.TripGetPayload<{
  include: {
    user: {
      select: {
        name: true;
        email: true;
        image: true;
        role: true;
      };
    };
    stages: {
      select: {
        media: true;
        orderIndex: true;
      };
    };
  };
}>;

type TripWithProcessedData = Omit<TripWithRelations, 'price'> & {
  price: number; // Convertito da Decimal a number per serializzazione client
  processedGpxFile: unknown;
  processedMedia: MediaItem[];
};

interface TripGridProps {
  trips: TripWithProcessedData[];
  userRole: UserRole | null;
}

// Funzioni helper (copiate dalla pagina originale)
const getThemeColor = (theme: string) => {
  const colors: { [key: string]: string } = {
    'Avventura': 'bg-orange-100 text-orange-800',
    'Relax': 'bg-green-100 text-green-800',
    'Culturale': 'bg-purple-100 text-purple-800',
    'Gastronomico': 'bg-red-100 text-red-800',
    'Natura': 'bg-emerald-100 text-emerald-800',
    'Storia': 'bg-amber-100 text-amber-800',
  };
  return colors[theme] || 'bg-gray-100 text-gray-800';
};

const getSeasonColor = (season: string) => {
  const colors: { [key: string]: string } = {
    'Primavera': 'bg-green-100 text-green-700',
    'Estate': 'bg-yellow-100 text-yellow-700',
    'Autunno': 'bg-orange-100 text-orange-700',
    'Inverno': 'bg-blue-100 text-blue-700',
  };
  return colors[season] || 'bg-gray-100 text-gray-700';
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

const getCoverImage = (trip: TripWithProcessedData): MediaItem | null => {
  // Prima cerca nelle stages (ordinate per orderIndex)
  const stageImage = trip.stages
    ?.find((stage) => {
      const media = castToMediaItems(stage.media || []);
      return media.some((m: MediaItem) => m.type === 'image');
    })
    ?.media;
  
  if (stageImage) {
    const mediaItems = castToMediaItems(stageImage);
    const imageItem = mediaItems.find((m: MediaItem) => m.type === 'image');
    if (imageItem) return imageItem;
  }
  
  // Poi cerca in trip.media come fallback usando i dati processati
  const tripImage = trip.processedMedia.find((m: MediaItem) => m.type === 'image');
  
  // Restituisce la prima immagine trovata
  return tripImage || null;
};

/**
 * Componente per visualizzare la griglia dei viaggi
 * Estratto dalla pagina trips per migliorare la riusabilità
 */
const TripGrid: React.FC<TripGridProps> = React.memo(({ trips, userRole }) => {
  // Determina se l'utente può creare viaggi usando l'helper centralizzato
  const canCreateTrip = userRole ? UserPermissions.canCreateTrips(userRole) : false;

  if (trips.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <Navigation className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">
              Nessun viaggio trovato
            </h2>
            <p className="text-gray-500">
              Prova a modificare i criteri di ricerca o esplora tutti i viaggi disponibili.
            </p>
          </div>
          {canCreateTrip && (
            <Link
              href="/create-trip"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Navigation className="w-5 h-5" />
              Crea un nuovo itinerario
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {trips.map((trip) => (
        <div 
          key={trip.id} 
          className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
        >
          {/* Media preview or placeholder */}
          <div className="relative h-48 bg-gradient-to-br from-primary-400 to-secondary-500">
            {(() => {
              const coverImage = getCoverImage(trip);
              
              if (coverImage && coverImage.type === 'image') {
                return (
                  <img 
                    src={coverImage.url} 
                    alt={coverImage.caption || trip.title}
                    className="w-full h-full object-cover"
                  />
                );
              }
              
              if (coverImage && coverImage.type === 'video' && coverImage.thumbnailUrl) {
                return (
                  <img 
                    src={coverImage.thumbnailUrl} 
                    alt={coverImage.caption || trip.title}
                    className="w-full h-full object-cover"
                  />
                );
              }
              
              // Fallback: mostra placeholder
              return (
                <>
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Navigation className="w-16 h-16 text-white/70" />
                  </div>
                </>
              );
            })()}
            
            {/* Status badge - Show only for non-published trips */}
            {shouldShowStatusBadge(trip.status, true) && (
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTripStatusColor(trip.status)}`}>
                  {getTripStatusLabel(trip.status)}
                </span>
              </div>
            )}
          </div>

          {/* Contenuto della card */}
          <div className="p-6">
            {/* Titolo */}
            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
              {trip.title}
            </h3>

            {/* Destinazione */}
            <div className="flex items-center gap-2 text-gray-600 mb-3">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{trip.destination}</span>
            </div>

            {/* Durata */}
            <div className="flex items-center gap-2 text-gray-600 mb-4">
              <Clock className="w-4 h-4" />
              <span>{trip.duration_days} giorni</span>
            </div>

            {/* Tema */}
            <div className="mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getThemeColor(trip.theme)}`}>
                {trip.theme}
              </span>
            </div>

            {/* Caratteristiche del viaggio */}
            {trip.characteristics.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Caratteristiche:</h4>
                <div className="flex flex-wrap gap-1">
                  {trip.characteristics.slice(0, 3).map((characteristic, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                    >
                      {characteristic}
                    </span>
                  ))}
                  {trip.characteristics.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                      +{trip.characteristics.length - 3} altre
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {trip.tags.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {trip.tags.slice(0, 3).map((tag, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-md"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                  {trip.tags.length > 3 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-700 text-xs rounded-md">
                      +{trip.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Stagioni consigliate */}
            {trip.recommended_seasons.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {trip.recommended_seasons.slice(0, 3).map((season, index) => (
                    <span 
                      key={index} 
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getSeasonColor(season)}`}
                    >
                      <SeasonIcon season={season} size="w-3 h-3" />
                      {season}
                    </span>
                  ))}
                  {trip.recommended_seasons.length > 3 && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                      +{trip.recommended_seasons.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Creatore del viaggio */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-3 mb-2">
                {trip.user.image ? (
                  <Image
                    src={trip.user.image}
                    alt={trip.user.name || 'Utente'}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {trip.user.role === 'Ranger' || trip.user.role === 'Sentinel' ? (
                    <Link
                      href={`/ranger/${encodeURIComponent(trip.user.name || '')}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline transition-colors truncate block"
                    >
                      {trip.user.name || 'Utente anonimo'}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {trip.user.name || 'Utente anonimo'}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Data del viaggio - solo se disponibile */}
              {trip.travelDate && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>Viaggio del {formatDate(trip.travelDate)}</span>
                </div>
              )}
            </div>

            {/* Azioni */}
            <div className="mt-6 pt-4 border-t">
              <Link 
                href={`/trips/${trip.slug}`}
                className="w-full btn-primary text-center block"
              >
                Visualizza Dettagli
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

TripGrid.displayName = 'TripGrid';

export default TripGrid;