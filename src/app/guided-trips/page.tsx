import { GuidedTripService } from '@/lib/guided-trips/guidedTripService';
import GuidedTripsAgenda from '@/components/guided-trips/GuidedTripsAgenda';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Viaggi guidati in programma | RideAtlas',
  description: 'Parti in gruppo con un Ranger di RideAtlas: posti limitati, prenotazione e pagamento online.',
};

export default async function GuidedTripsPage() {
  const guidedTrips = await GuidedTripService.listUpcomingPublished();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GuidedTripsAgenda guidedTrips={guidedTrips} />
      </div>
    </div>
  );
}
