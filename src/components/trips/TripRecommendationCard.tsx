// src/components/TripRecommendationCard.tsx
"use client";

import { MapPin, Clock, ExternalLink, Route } from 'lucide-react';

interface TripRecommendation {
  id: string;
  title: string;
  destination: string;
  duration_days: number;
  summary: string;
  slug: string;
}

interface TripRecommendationCardProps {
  trip: TripRecommendation;
  className?: string;
}

export default function TripRecommendationCard({ trip, className = '' }: TripRecommendationCardProps) {
  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-colors ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-lg mb-1 flex items-center gap-2">
            <Route className="w-4 h-4" />
            {trip.title}
          </h4>
          <div className="flex items-center gap-4 text-sm opacity-90 mb-2">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {trip.destination}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {trip.duration_days} giorni
            </span>
          </div>
        </div>
      </div>
      
      <p className="text-sm opacity-80 mb-3 line-clamp-2">
        {trip.summary}
      </p>
      
      <div className="flex items-center justify-between">
        <a
          href={`/trips/${trip.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium hover:underline transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Visualizza dettagli
        </a>
      </div>
    </div>
  );
}
