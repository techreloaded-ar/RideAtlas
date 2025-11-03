'use client';

import React from 'react';
import Link from 'next/link';
import { Navigation } from 'lucide-react';
import TripSearchBar from '@/components/trips/TripSearchBar';
import TripGrid from '@/components/trips/TripGrid';
import useTripFilters from '@/hooks/useTripFilters';
import { Prisma, UserRole } from '@prisma/client';
import { MediaItem } from '@/types/trip';
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

interface TripsPageClientProps {
  trips: TripWithProcessedData[];
  userRole: UserRole | null;
}

/**
 * Componente client per la pagina trips che gestisce la ricerca e il filtro
 */
const TripsPageClient: React.FC<TripsPageClientProps> = ({ trips, userRole }) => {
  // Determina se l'utente può creare viaggi usando l'helper centralizzato
  const canCreateTrip = userRole ? UserPermissions.canCreateTrips(userRole) : false;

  // Usa l'hook personalizzato per gestire i filtri
  const {
    filteredTrips,
    searchTerm,
    setSearchTerm,
    hasResults,
    isSearching,
    isValidSearch,
    searchError,
    resultsCount,
    clearSearch,
  } = useTripFilters(trips);

  return (
    <section className="container mx-auto px-4 py-12">
      {/* Barra di ricerca */}
      <div className="mb-8">
        <TripSearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClear={clearSearch}
          isSearching={isSearching}
          isValid={isValidSearch}
          errorMessage={searchError}
          resultsCount={resultsCount}
        />
      </div>

      {/* Contenuto principale */}
      {trips.length === 0 ? (
        // Stato vuoto - nessun viaggio nel database
        <div className="text-center py-20">
          <div className="max-w-md mx-auto">
            <div className="mb-8">
              <Navigation className="w-24 h-24 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-600 mb-2">
                Nessun viaggio disponibile
              </h2>
              <p className="text-gray-500">
                Non ci sono ancora viaggi pubblicati.{canCreateTrip && ' Sii il primo a creare un itinerario!'}
              </p>
            </div>
            {canCreateTrip && (
              <Link
                href="/create-trip"
                className="btn-primary inline-flex items-center gap-2"
              >
                <Navigation className="w-5 h-5" />
                Crea il primo itinerario
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Griglia dei viaggi filtrati */}
          <TripGrid trips={filteredTrips} userRole={userRole} />

          {/* Call to action per creare un nuovo viaggio - mostrato sempre se ci sono viaggi */}
          {hasResults && canCreateTrip && (
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
        </>
      )}
    </section>
  );
};

export default TripsPageClient;