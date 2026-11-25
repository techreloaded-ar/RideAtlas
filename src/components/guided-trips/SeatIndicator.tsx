import type { SeatSummary } from '@/lib/guided-trips/rules';

const TONE_BADGE: Record<SeatSummary['tone'], string> = {
  free: 'bg-green-100 text-green-800',
  few: 'bg-amber-100 text-amber-800',
  full: 'bg-red-100 text-red-800',
};

export function SeatBadge({ seats }: { seats: SeatSummary }) {
  return (
    <span data-testid="seat-badge" className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE_BADGE[seats.tone]}`}>
      {seats.label}
    </span>
  );
}

/** Etichetta dei posti, conteggio «N su M prenotati» e barra di riempimento. */
export default function SeatIndicator({ seats, compact = false }: { seats: SeatSummary; compact?: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <SeatBadge seats={seats} />
        <span className="text-xs text-gray-500">{compact ? `${seats.taken} su ${seats.max}` : `${seats.taken} su ${seats.max} prenotati`}</span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded bg-gray-200"
        role="progressbar"
        aria-label="Posti prenotati"
        aria-valuemin={0}
        aria-valuemax={seats.max}
        aria-valuenow={Math.min(seats.taken, seats.max)}
      >
        <div className={`h-full ${seats.tone === 'full' ? 'bg-gray-400' : 'bg-primary-600'}`} style={{ width: `${seats.fill}%` }} />
      </div>
    </div>
  );
}
