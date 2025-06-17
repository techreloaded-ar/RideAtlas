// src/components/ItineraryDisplay.tsx
"use client";

import { Route, MapPin, Clock, Calendar, AlertTriangle, Navigation } from 'lucide-react';

interface TripRecommendation {
  id: string;
  title: string;
  destination: string;
  duration_days: number;
  summary: string;
  slug: string;
}

interface DistanceWarning {
  fromTrip: string;
  toTrip: string;
  distance: number;
  message: string;
}

interface ItineraryDisplayProps {
  trips: TripRecommendation[];
  distanceWarnings?: DistanceWarning[];
  className?: string;
}

export default function ItineraryDisplay({ trips, distanceWarnings = [], className = '' }: ItineraryDisplayProps) {
  if (trips.length === 0) return null;

  const totalDays = trips.reduce((sum, trip) => sum + trip.duration_days, 0);
  
  const getWarningForTrips = (trip1: string, trip2: string) => {
    return distanceWarnings.find(w => 
      (w.fromTrip === trip1 && w.toTrip === trip2) ||
      (w.fromTrip === trip2 && w.toTrip === trip1)
    );
  };

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Route className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h4 className="font-semibold text-blue-900">Itinerario Completo</h4>
          <p className="text-sm text-blue-700">
            {trips.length} viaggi • {totalDays} giorni totali
          </p>
        </div>
      </div>

      {/* Trip Timeline */}
      <div className="space-y-4">
        {trips.map((trip, index) => {
          const nextTrip = trips[index + 1];
          const warning = nextTrip ? getWarningForTrips(trip.title, nextTrip.title) : null;
          
          return (
            <div key={trip.id}>
              {/* Trip Card */}
              <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {index + 1}
                      </span>
                      <h5 className="font-medium text-gray-900">{trip.title}</h5>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {trip.destination}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {trip.duration_days} giorni
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{trip.summary}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <a
                    href={`/trips/${trip.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Visualizza dettagli →
                  </a>
                  {index === 0 && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                      Partenza
                    </span>
                  )}
                  {index === trips.length - 1 && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                      Arrivo
                    </span>
                  )}
                </div>
              </div>

              {/* Connection/Warning between trips */}
              {nextTrip && (
                <div className="flex items-center justify-center py-2">
                  <div className="flex items-center gap-2">
                    {warning ? (
                      <div className="bg-orange-100 border border-orange-200 rounded-lg px-3 py-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-orange-800 font-medium">
                          {warning.distance}km di trasferimento
                        </span>
                      </div>
                    ) : (
                      <div className="bg-green-100 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-800 font-medium">
                          Trasferimento breve
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-blue-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-blue-900">
              <strong>Durata totale:</strong> {totalDays} giorni
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Route className="w-4 h-4 text-blue-600" />
            <span className="text-blue-900">
              <strong>Tappe:</strong> {trips.length} viaggi
            </span>
          </div>
        </div>
        
        {distanceWarnings.length > 0 && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                Avvisi di trasferimento
              </span>
            </div>
            <ul className="text-xs text-orange-700 space-y-1">
              {distanceWarnings.map((warning, index) => (
                <li key={index}>• {warning.message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
