import { seatAvailability, seatAvailabilityText } from '@/lib/guided-trips/guidedTripRules';

const BADGE_STYLES = {
  available: 'bg-green-100 text-green-800',
  few: 'bg-amber-100 text-amber-800',
  full: 'bg-red-100 text-red-800',
} as const;

export function SeatAvailabilityBadge({ maxParticipants, occupiedSeats, className = '' }: { maxParticipants: number; occupiedSeats: number; className?: string }) {
  const { freeSeats, label } = seatAvailability(maxParticipants, occupiedSeats);
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_STYLES[label]} ${className}`}>
      {seatAvailabilityText(freeSeats)}
    </span>
  );
}

export function SeatOccupancyBar({ maxParticipants, occupiedSeats }: { maxParticipants: number; occupiedSeats: number }) {
  const percentage = maxParticipants > 0 ? Math.min(100, Math.round((occupiedSeats / maxParticipants) * 100)) : 0;
  const full = occupiedSeats >= maxParticipants;
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded bg-gray-200"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={maxParticipants}
      aria-valuenow={occupiedSeats}
      aria-label={`${occupiedSeats} iscritti su ${maxParticipants}`}
    >
      <div className={`h-full ${full ? 'bg-gray-400' : 'bg-primary-600'}`} style={{ width: `${percentage}%` }} />
    </div>
  );
}
