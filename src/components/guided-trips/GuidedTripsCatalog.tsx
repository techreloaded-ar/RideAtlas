'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Users } from 'lucide-react';
import type { GuidedTripCard } from '@/lib/guided-trips/guidedTripService';
import { durationInDays, formatEuro, formatStoredDay } from '@/lib/guided-trips/guidedTripRules';
import { SeatAvailabilityBadge, SeatOccupancyBar } from './SeatAvailabilityBadge';

function monthKey(isoDay: string): string {
  return isoDay.slice(0, 7);
}

function monthLabel(key: string): string {
  const label = formatStoredDay(`${key}-01T00:00:00.000Z`, { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function dateRangeLabel(startDate: string, endDate: string): string {
  const start = formatStoredDay(startDate, { day: 'numeric', month: 'long' });
  const end = formatStoredDay(endDate, { day: 'numeric', month: 'long' });
  return start === end ? start : `${start} – ${end}`;
}

export default function GuidedTripsCatalog({ guidedTrips }: { guidedTrips: GuidedTripCard[] }) {
  const [searchText, setSearchText] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [onlyWithFreeSeats, setOnlyWithFreeSeats] = useState(false);

  const months = useMemo(() => Array.from(new Set(guidedTrips.map(trip => monthKey(trip.startDate)))), [guidedTrips]);

  const visibleTrips = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    return guidedTrips.filter(trip => {
      if (selectedMonth && monthKey(trip.startDate) !== selectedMonth) return false;
      if (onlyWithFreeSeats && trip.freeSeats === 0) return false;
      if (!normalizedSearch) return true;
      return [trip.title, trip.meetingPoint, trip.description, trip.organizerName, trip.linkedTripTitle ?? '']
        .some(text => text.toLowerCase().includes(normalizedSearch));
    });
  }, [guidedTrips, searchText, selectedMonth, onlyWithFreeSeats]);

  return (
    <>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <label className="relative sm:w-72">
          <span className="sr-only">Cerca destinazione</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            type="search"
            value={searchText}
            onChange={event => setSearchText(event.target.value)}
            placeholder="Cerca destinazione, ritrovo o Ranger…"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </label>
        <label className="sm:w-48">
          <span className="sr-only">Mese di partenza</span>
          <select
            value={selectedMonth}
            onChange={event => setSelectedMonth(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Mese: tutti</option>
            {months.map(month => (
              <option key={month} value={month}>{monthLabel(month)}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={onlyWithFreeSeats}
            onChange={event => setOnlyWithFreeSeats(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          Solo con posti liberi
        </label>
      </div>

      {visibleTrips.length === 0 ? (
        <div className="mt-10 rounded-xl bg-white p-10 text-center shadow-sm">
          <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" aria-hidden />
          <p className="font-medium text-gray-900">
            {guidedTrips.length === 0 ? 'Nessun viaggio guidato in programma al momento' : 'Nessun viaggio corrisponde ai filtri'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {guidedTrips.length === 0 ? 'Torna presto: i Ranger pubblicano nuove partenze durante l\'anno.' : 'Prova a cambiare la ricerca o il mese.'}
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Viaggi guidati">
          {visibleTrips.map(trip => {
            const full = trip.freeSeats === 0;
            return (
              <li key={trip.id} className="flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                <div className="relative h-40 bg-gradient-to-br from-primary-300 via-primary-700 to-primary-900">
                  {trip.coverImageUrl && (
                    <Image src={trip.coverImageUrl} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                  )}
                  <div className="absolute left-3 top-3 rounded-lg bg-white px-2.5 py-1 text-center leading-tight shadow">
                    <span className="block text-xl font-bold text-primary-700">{formatStoredDay(trip.startDate, { day: '2-digit' })}</span>
                    <span className="block text-[11px] font-bold uppercase text-gray-700">{formatStoredDay(trip.startDate, { month: 'short' }).replace('.', '')}</span>
                  </div>
                  <SeatAvailabilityBadge maxParticipants={trip.maxParticipants} occupiedSeats={trip.occupiedSeats} className="absolute right-3 top-3 shadow" />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h2 className="text-lg font-semibold text-gray-900">{trip.title}</h2>
                  <p className="mt-1 text-xs text-gray-500">
                    {dateRangeLabel(trip.startDate, trip.endDate)} · {durationInDays(new Date(trip.startDate), new Date(trip.endDate))} giorni · con{' '}
                    <span className="font-semibold text-gray-700">{trip.organizerName}</span>
                  </p>
                  <p className="mt-1.5 text-xs text-gray-500">Ritrovo: {trip.meetingPoint}</p>
                  <div className="mt-3">
                    <SeatOccupancyBar maxParticipants={trip.maxParticipants} occupiedSeats={trip.occupiedSeats} />
                    <p className="mt-1 text-xs text-gray-500">{trip.occupiedSeats} iscritti su {trip.maxParticipants}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <span className="text-xl font-bold text-gray-900">{formatEuro(trip.pricePerPerson)}</span>
                    <Link
                      href={`/guided-trips/${trip.id}`}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold ${full ? 'bg-gray-200 text-gray-600' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
                    >
                      {full ? 'Esaurito' : 'Scopri e prenota'}
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
