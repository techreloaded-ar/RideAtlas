import { prisma } from '@/lib/core/prisma';
import { TripStatus } from '@prisma/client';
import { castToGpxFile, castToMediaItems } from '@/types/trip';
import { Prisma } from '@prisma/client';
import TripsPageClient from './TripsPageClient';


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
          image: true,
          role: true
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

  // Converte i GPX per ogni viaggio per uso interno e serializza i Decimal per il client
  const tripsWithProcessedData = trips.map(trip => ({
    ...trip,
    // Converte Decimal in number per la serializzazione client-side
    price: trip.price ? Number(trip.price) : 0,
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

      {/* Contenuto principale con ricerca integrata */}
      <TripsPageClient trips={tripsWithProcessedData} />
    </main>
  );
}

// Metadata per SEO
export const metadata = {
  title: 'Tutti i Viaggi | RideAtlas',
  description: 'Esplora tutti gli itinerari in moto creati dalla community di RideAtlas. Trova il tuo prossimo viaggio perfetto.',
};