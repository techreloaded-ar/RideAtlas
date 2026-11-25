'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MapPin, Users } from 'lucide-react';
import type { GuidedTripListItem } from '@/types/guided-trip';
import {
  durationInDays,
  formatDayOfMonth,
  formatEuro,
  formatMonthAbbreviation,
  formatMonthHeading,
  monthKey,
  remainingSeatsLabel,
} from '@/lib/guided-trips/guidedTripFormat';

interface GuidedTripsAgendaProps {
  guidedTrips: GuidedTripListItem[];
  /** Ranger e Sentinel vedono l'invito a creare un viaggio guidato, come nella pagina «Viaggi». */
  canCreateGuidedTrip?: boolean;
}

const ALL_MONTHS = 'all';
const NEW_GUIDED_TRIP_HREF = '/dashboard/guided-trips/new';

export default function GuidedTripsAgenda({ guidedTrips, canCreateGuidedTrip = false }: GuidedTripsAgendaProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(ALL_MONTHS);

  const months = useMemo(() => {
    const seen = new Map<string, string>();
    for (const trip of guidedTrips) seen.set(monthKey(trip.startDate), formatMonthHeading(trip.startDate));
    return Array.from(seen.entries());
  }, [guidedTrips]);

  const tripsByMonth = useMemo(() => {
    const groups = new Map<string, GuidedTripListItem[]>();
    for (const trip of guidedTrips) {
      const key = monthKey(trip.startDate);
      if (selectedMonth !== ALL_MONTHS && key !== selectedMonth) continue;
      groups.set(key, [...(groups.get(key) ?? []), trip]);
    }
    return Array.from(groups.entries());
  }, [guidedTrips, selectedMonth]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Viaggi guidati in programma</h1>
          <p className="text-gray-600 mt-1">Parti in gruppo con un Ranger. Posti limitati, prenotazione e pagamento online.</p>
        </div>
        {months.length > 1 && (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <span className="sr-only">Filtra per mese</span>
            <select
              aria-label="Filtra per mese"
              value={selectedMonth}
              onChange={event => setSelectedMonth(event.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={ALL_MONTHS}>Tutti i mesi</option>
              {months.map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {guidedTrips.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center mt-6">
          <p className="text-lg font-semibold text-gray-900">Nessun viaggio guidato in programma</p>
          <p className="text-gray-600 mt-1">
            {canCreateGuidedTrip
              ? 'Sii il primo a proporre una partenza di gruppo!'
              : <>Torna presto: i Ranger pubblicano nuove partenze durante l&apos;anno.</>}
          </p>
          {canCreateGuidedTrip && (
            <Link href={NEW_GUIDED_TRIP_HREF} className="btn-primary inline-flex items-center gap-2 mt-6">
              <Users className="w-5 h-5" aria-hidden />
              Crea il primo viaggio guidato
            </Link>
          )}
        </div>
      )}

      {tripsByMonth.map(([key, trips]) => (
        <section key={key} aria-labelledby={`month-${key}`}>
          <h2 id={`month-${key}`} className="text-sm font-extrabold text-gray-700 uppercase tracking-wider mt-6 mb-2">
            {formatMonthHeading(trips[0].startDate)}
          </h2>
          <ul className="space-y-3">
            {trips.map(trip => {
              const soldOut = trip.remainingSeats <= 0;
              const occupiedPercent = Math.round(((trip.maxParticipants - trip.remainingSeats) / trip.maxParticipants) * 100);
              return (
                <li key={trip.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 p-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-16 shrink-0 text-center border-r border-gray-200 pr-4">
                        <div className="text-2xl font-bold text-primary-700">{formatDayOfMonth(trip.startDate)}</div>
                        <div className="text-xs text-gray-500">{formatMonthAbbreviation(trip.startDate)}</div>
                      </div>
                      <div className="min-w-0">
                        <Link href={`/guided-trips/${trip.id}`} className="font-semibold text-gray-900 hover:text-primary-700">
                          {trip.title}
                        </Link>
                        <div className="text-sm text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-1">
                          <span>{durationInDays(trip.startDate, trip.endDate)} giorni · con {trip.organizerName} ·</span>
                          <span className="inline-flex items-center"><MapPin className="w-3.5 h-3.5 mr-0.5 text-gray-400" aria-hidden />{trip.meetingPoint}</span>
                        </div>
                      </div>
                    </div>
                    <div className="md:w-48">
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-gray-400" aria-hidden />
                        {remainingSeatsLabel(trip.remainingSeats, trip.maxParticipants)}
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded mt-1.5" aria-hidden>
                        <div className={`h-1.5 rounded ${soldOut ? 'bg-gray-400' : 'bg-primary-600'}`} style={{ width: `${occupiedPercent}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-4 md:w-60">
                      <span className="text-lg font-extrabold text-primary-700">{formatEuro(trip.pricePerPerson)}</span>
                      {soldOut ? (
                        <span className="w-28 text-center px-4 py-2 rounded-lg bg-gray-200 text-gray-600 font-semibold text-sm">Esaurito</span>
                      ) : (
                        <Link href={`/guided-trips/${trip.id}`} className="w-28 text-center px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm">
                          Prenota
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {/* Invito a organizzare un viaggio guidato, con lo stesso schema della pagina «Viaggi» */}
      {guidedTrips.length > 0 && canCreateGuidedTrip && (
        <div className="mt-16 text-center">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Vuoi accompagnare un gruppo?</h2>
            <p className="text-gray-600 mb-6">
              Organizza un viaggio guidato a numero chiuso: scegli date, prezzo e posti, i partecipanti prenotano e pagano online.
            </p>
            <Link href={NEW_GUIDED_TRIP_HREF} className="btn-primary inline-flex items-center gap-2">
              <Users className="w-5 h-5" aria-hidden />
              Crea un viaggio guidato
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
