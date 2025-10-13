import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import type { RangerTripSummary } from '@/types/ranger';

interface RangerTripCardProps {
  trip: RangerTripSummary;
}

export function RangerTripCard({ trip }: RangerTripCardProps) {
  return (
    <Link
      href={`/trips/${trip.slug}`}
      className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
      data-testid="ranger-trip-card"
    >
      {/* Thumbnail */}
      <div className="relative w-full h-48">
        {trip.thumbnailUrl ? (
          <Image
            src={trip.thumbnailUrl}
            alt={trip.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">Nessuna immagine</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title with line-clamp */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {trip.title}
        </h3>

        {/* Meta info */}
        <div className="flex flex-col gap-1 text-sm text-gray-600">
          {/* Duration - singular/plural handling */}
          <div className="flex items-center gap-1">
            <Clock size={16} aria-hidden="true" />
            <span>
              {trip.durationDays === 1
                ? '1 giorno'
                : `${trip.durationDays} giorni`}
            </span>
          </div>

          {/* Distance - MVP: always null, hide when null */}
          {trip.distanceKm !== null && (
            <div className="flex items-center gap-1">
              <span aria-label="Distanza">📏</span>
              <span>{trip.distanceKm} km</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
