'use client';

import React from 'react';
import Link from 'next/link';
import { Navigation } from 'lucide-react';
import TripSearchBar from '@/components/trips/TripSearchBar';
import TripGrid from '@/components/trips/TripGrid';
import useTripFilters from '@/hooks/useTripFilters';
import { Prisma } from '@prisma/client';
import { MediaItem } from '@/types/trip';

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
}

/**
 * Componente client per la pagina trips che gestisce la ricerca e il filtro
 */
const TripsPageClient: React.FC<TripsPageClientProps> = ({ trips }) => {
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
        <>
          {/* Griglia dei viaggi filtrati */}
          <TripGrid trips={filteredTrips} />

          {/* Call to action per creare un nuovo viaggio - mostrato sempre se ci sono viaggi */}
          {hasResults && (
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

          {/* Suggerimenti quando non ci sono risultati ma ci sono viaggi nel database */}
          {!hasResults && searchTerm && trips.length > 0 && (
            <div className="mt-8 text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Nessun risultato trovato
                </h3>
                <p className="text-blue-700 mb-4">
                  Prova a modificare i termini di ricerca o esplora tutti i viaggi disponibili.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={clearSearch}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Mostra tutti i viaggi
                  </button>
                  <Link 
                    href="/create-trip" 
                    className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Crea un nuovo viaggio
                  </Link>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default TripsPageClient;