import type { RangerTripSummary } from '@/types/ranger';
import { RangerTripCard } from './RangerTripCard';

interface RangerTripsListProps {
  trips: RangerTripSummary[];
  rangerName: string;
}

export function RangerTripsList({ trips, rangerName }: RangerTripsListProps) {
  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Viaggi di {rangerName}
      </h2>

      {/* Empty state (FR-015) */}
      {trips.length === 0 ? (
        <p className="text-gray-600 text-center py-8" data-testid="empty-state">
          Nessun viaggio pubblicato ancora.
        </p>
      ) : (
        /* Grid layout - responsive: 1 col mobile, 2 col tablet, 3 col desktop */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map(trip => (
            <RangerTripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </section>
  );
}
