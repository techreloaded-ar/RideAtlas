import Link from 'next/link';
import type { GuidedTripView } from '@/lib/guided-trips/service';
import { durationDays, formatDay, formatMonth, formatPrice } from '@/lib/guided-trips/rules';
import SeatIndicator from './SeatIndicator';

export function GuidedTripCover({ url, className }: { url: string | null; className: string }) {
  return url ? (
    <img src={url} alt="" className={`${className} object-cover`} />
  ) : (
    <div className={`${className} bg-gradient-to-br from-nature-700 to-road-800`} aria-hidden="true" />
  );
}

export default function GuidedTripCard({ trip }: { trip: GuidedTripView }) {
  const start = new Date(trip.startDate);
  const days = durationDays(start, new Date(trip.endDate));
  const full = trip.seats.tone === 'full';
  return (
    <article className="flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100" data-testid="guided-trip-card">
      <div className="relative h-40">
        <GuidedTripCover url={trip.coverUrl} className="h-40 w-full" />
        <div className="absolute left-3 top-3 rounded-lg bg-white px-2.5 py-1 text-center font-bold leading-tight shadow">
          <span className="block text-[11px] uppercase text-primary-600">{formatMonth(start)}</span>
          <span className="text-lg">{formatDay(start)}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold text-gray-900">{trip.title}</h3>
        <p className="mb-3 mt-1 text-sm text-gray-500">
          Guidato da <span className="font-semibold text-gray-700">{trip.organizer.name}</span> · Ritrovo {trip.meetingPoint} · {days} {days === 1 ? 'giorno' : 'giorni'}
        </p>
        <div className="mt-auto">
          <SeatIndicator seats={trip.seats} />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900">{formatPrice(trip.price)}</span>
            {full ? (
              <Link href={`/guided-trips/${trip.id}`} className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-600">
                Posti esauriti
              </Link>
            ) : (
              <Link href={`/guided-trips/${trip.id}`} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
                Vedi e prenota
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
