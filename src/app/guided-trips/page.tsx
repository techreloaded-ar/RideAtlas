import type { Metadata } from 'next';
import { listUpcomingGuidedTrips } from '@/lib/guided-trips/guidedTripService';
import GuidedTripsCatalog from '@/components/guided-trips/GuidedTripsCatalog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Viaggi guidati in programma | RideAtlas',
  description: 'Parti in gruppo con un Ranger: viaggi guidati a numero chiuso da prenotare e pagare online.',
};

export default async function GuidedTripsPage() {
  const guidedTrips = await listUpcomingGuidedTrips();
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Viaggi guidati in programma</h1>
        <p className="mt-2 text-gray-600">Parti in gruppo con un Ranger. Posti limitati: prenota e paga online.</p>
        <GuidedTripsCatalog guidedTrips={guidedTrips} />
      </div>
    </div>
  );
}
