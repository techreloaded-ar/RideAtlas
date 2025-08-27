import { prisma } from '@/lib/core/prisma';
import { TripStatus } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, Tag, User, Clock, Navigation } from 'lucide-react';
import { castToGpxFile, castToMediaItems, MediaItem, GpxFile } from '@/types/trip'; // Importa la funzione helper
import { Prisma } from '@prisma/client';


// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Usa i tipi generati automaticamente da Prisma per le query con include
type TripWithRelations = Prisma.TripGetPayload<{
  include: {
    user: {
      select: {
        name: true;
        email: true;
        image: true;
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

type TripWithProcessedData = TripWithRelations & {
  processedGpxFile: GpxFile | null;
  processedMedia: MediaItem[];
};

// Funzione per ottenere il colore del tema
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

// Funzione per ottenere il colore della stagione
const getSeasonColor = (season: string) => {
  const colors: { [key: string]: string } = {
    'Primavera': 'bg-green-100 text-green-700',
    'Estate': 'bg-yellow-100 text-yellow-700',
    'Autunno': 'bg-orange-100 text-orange-700',
    'Inverno': 'bg-blue-100 text-blue-700',
  };
  return colors[season] || 'bg-gray-100 text-gray-700';
};

// Funzione per formattare la data
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

// Funzione per trovare l'immagine di copertina
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

export default async function TripsPage() {
  // La pagina /trips mostra solo i viaggi pubblicati per tutti gli utenti
  // I viaggi in bozza sono visibili solo in Dashboard ("I miei Viaggi") e nel pannello Admin
  const whereClause = { status: TripStatus.Pubblicato };
  // Recupera i viaggi dal database con filtri basati sui ruoli
  const trips: TripWithRelations[] = await prisma.trip.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true
        }
      },
      stages: {
        select: {
          media: true,
          orderIndex: true
        },
        orderBy: {
          orderIndex: 'asc'
        }
      }
    },
    orderBy: [
      {
        orderIndex: 'asc'
      },
      {
        created_at: 'desc'
      }
    ]
  });

  // Converte i GPX per ogni viaggio per uso interno, manteniamo i tipi Prisma
  const tripsWithProcessedData = trips.map(trip => ({
    ...trip,
    processedGpxFile: castToGpxFile(trip.gpxFile),
    processedMedia: castToMediaItems(trip.media || [])
  }));

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header della pagina */}
      <section className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Tutti i Viaggi
            </h1>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto">
              Scopri tutti gli itinerari creati dalla nostra community di motociclisti appassionati
            </p>
          </div>
        </div>
      </section>

      {/* Contenuto principale */}
      <section className="container mx-auto px-4 py-12">
        {tripsWithProcessedData.length === 0 ? (
          // Stato vuoto
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="mb-8">
                <Navigation className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-600 mb-2">
                  Nessun viaggio disponibile
                </h2>
                <p className="text-gray-500">
                  Non ci sono ancora viaggi pubblicati. Sii il primo a creare un itinerario!
                </p>
              </div>
              <Link 
                href="/create-trip" 
                className="btn-primary inline-flex items-center gap-2"
              >
                <Navigation className="w-5 h-5" />
                Crea il primo itinerario
              </Link>
            </div>
          </div>
        ) : (
          // Griglia dei viaggi
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tripsWithProcessedData.map((trip) => (
              <div 
                key={trip.id} 
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
              >                {/* Media preview or placeholder */}
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
                  
                  {/* Status badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      trip.status === 'Pubblicato' 
                        ? 'bg-green-500 text-white' 
                        : trip.status === 'Bozza'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}>
                      {trip.status}
                    </span>
                  </div>
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
                  )}                  {/* Stagioni consigliate */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {trip.recommended_seasons.map((season, index) => (
                        <span key={index} className={`px-3 py-1 rounded-full text-sm font-medium ${getSeasonColor(season)}`}>
                          📅 {season}
                        </span>
                      ))}
                    </div>
                  </div>

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
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {trip.user.name || 'Utente anonimo'}
                        </p>
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
        )}

        {/* Call to action per creare un nuovo viaggio */}
        {trips.length > 0 && (
          <div className="mt-16 text-center">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Hai un itinerario da condividere?
              </h2>
              <p className="text-gray-600 mb-6">
                Unisciti alla nostra community e condividi i tuoi percorsi preferiti con altri motociclisti
              </p>
              <Link 
                href="/create-trip" 
                className="btn-primary inline-flex items-center gap-2"
              >
                <Navigation className="w-5 h-5" />
                Crea il tuo itinerario
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

// Metadata per SEO
export const metadata = {
  title: 'Tutti i Viaggi | RideAtlas',
  description: 'Esplora tutti gli itinerari in moto creati dalla community di RideAtlas. Trova il tuo prossimo viaggio perfetto.',
};