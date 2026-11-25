import Link from 'next/link';
import { GuidedTripService, canOrganize } from '@/lib/guided-trips/service';
import GuidedTripCard from '@/components/guided-trips/GuidedTripCard';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Viaggi guidati | RideAtlas',
};

export default async function GuidedTripsPage() {
  const [session, trips] = await Promise.all([auth(), GuidedTripService.listUpcoming()]);
  const organizer = canOrganize(session?.user?.role);
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Viaggi guidati in programma</h1>
            <p className="mt-1 text-gray-600">Parti in gruppo con un Ranger. Posti limitati: prenoti e paghi il tuo posto online.</p>
          </div>
          {organizer && (
            <Link href="/guided-trips/new" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
              Organizza un viaggio guidato
            </Link>
          )}
        </div>
        {trips.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center text-gray-600 shadow-sm">
            Al momento non ci sono viaggi guidati in programma. Torna a trovarci presto!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {trips.map(trip => <GuidedTripCard key={trip.id} trip={trip} />)}
          </div>
        )}
      </div>
    </div>
  );
}
