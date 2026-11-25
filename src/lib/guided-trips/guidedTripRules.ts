// Regole di dominio dei viaggi guidati a numero chiuso.
// Modulo puro (nessun accesso a database o rete) per poterle verificare in isolamento.

import { GuidedTripBookingStatus, GuidedTripStatus } from '@prisma/client';
import { PARTICIPANT_CANCELLATION_DAYS_BEFORE_START, SEAT_HOLD_MINUTES } from './guidedTripPolicy';

export { PARTICIPANT_CANCELLATION_DAYS_BEFORE_START, SEAT_HOLD_MINUTES };

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export interface BookingSeatSnapshot {
  status: GuidedTripBookingStatus;
  seatHeldUntil: Date;
}

/** Una prenotazione occupa un posto se è confermata o se la riserva durante il pagamento non è scaduta. */
export function bookingOccupiesSeat(booking: BookingSeatSnapshot, now: Date): boolean {
  if (booking.status === GuidedTripBookingStatus.CONFIRMED) return true;
  return booking.status === GuidedTripBookingStatus.PENDING_PAYMENT && booking.seatHeldUntil.getTime() > now.getTime();
}

export function countOccupiedSeats(bookings: BookingSeatSnapshot[], now: Date): number {
  return bookings.filter(booking => bookingOccupiesSeat(booking, now)).length;
}

export function countRemainingSeats(maxParticipants: number, bookings: BookingSeatSnapshot[], now: Date): number {
  return Math.max(0, maxParticipants - countOccupiedSeats(bookings, now));
}

export function seatHoldExpiry(now: Date): Date {
  return new Date(now.getTime() + SEAT_HOLD_MINUTES * 60 * 1000);
}

/** Converte una data "AAAA-MM-GG" nella mezzanotte UTC di quel giorno. */
export function parseCalendarDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toISOString().slice(0, 10) === value ? date : null;
}

export function formatCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Ultimo giorno (incluso) in cui l'Explorer può disdire con rimborso. */
export function participantCancellationDeadline(startDate: Date): Date {
  return new Date(startOfUtcDay(startDate).getTime() - PARTICIPANT_CANCELLATION_DAYS_BEFORE_START * MILLISECONDS_PER_DAY);
}

export function isParticipantCancellationAllowed(startDate: Date, now: Date): boolean {
  return startOfUtcDay(now).getTime() <= participantCancellationDeadline(startDate).getTime();
}

/** Il viaggio non è ancora partito: oggi è prima del giorno di partenza. */
export function hasNotStartedYet(startDate: Date, now: Date): boolean {
  return startOfUtcDay(now).getTime() < startOfUtcDay(startDate).getTime();
}

export function isBookable(trip: { status: GuidedTripStatus; startDate: Date }, now: Date): boolean {
  return trip.status === GuidedTripStatus.Pubblicato && hasNotStartedYet(trip.startDate, now);
}

export interface GuidedTripDetailsInput {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  meetingPoint: string;
  pricePerPerson: number;
  maxParticipants: number;
}

/** Problemi che impediscono di pubblicare (o di mantenere pubblicato) un viaggio guidato. */
export function publicationProblems(details: GuidedTripDetailsInput, now: Date): string[] {
  const problems: string[] = [];
  if (!details.title.trim()) problems.push('Il titolo è obbligatorio');
  if (!details.description.trim()) problems.push('La descrizione è obbligatoria');
  if (!details.meetingPoint.trim()) problems.push('Il punto di ritrovo è obbligatorio');
  if (!(details.pricePerPerson > 0)) problems.push('Il prezzo a persona deve essere maggiore di zero');
  if (!Number.isInteger(details.maxParticipants) || details.maxParticipants < 1) problems.push('Serve almeno un posto disponibile');
  if (details.endDate.getTime() < details.startDate.getTime()) problems.push('La data di rientro non può precedere la partenza');
  if (!hasNotStartedYet(details.startDate, now)) problems.push('La data di partenza deve essere futura');
  return problems;
}

export interface GuidedTripChange {
  pricePerPerson?: number;
  startDate?: Date;
  endDate?: Date;
  maxParticipants?: number;
}

/**
 * Dopo la prima prenotazione prezzo e date restano bloccati e i posti massimi
 * non possono scendere sotto quelli già occupati.
 */
export function changeProblemsWithBookings(
  current: { pricePerPerson: number; startDate: Date; endDate: Date },
  change: GuidedTripChange,
  occupiedSeats: number,
): string[] {
  const problems: string[] = [];
  if (occupiedSeats > 0) {
    if (change.pricePerPerson !== undefined && change.pricePerPerson !== current.pricePerPerson) {
      problems.push('Il prezzo non è modificabile dopo la prima prenotazione');
    }
    if (change.startDate && change.startDate.getTime() !== current.startDate.getTime()) {
      problems.push('La data di partenza non è modificabile dopo la prima prenotazione');
    }
    if (change.endDate && change.endDate.getTime() !== current.endDate.getTime()) {
      problems.push('La data di rientro non è modificabile dopo la prima prenotazione');
    }
  }
  if (change.maxParticipants !== undefined && change.maxParticipants < occupiedSeats) {
    problems.push(`I posti massimi non possono essere meno dei ${occupiedSeats} già prenotati`);
  }
  return problems;
}

export function sanitizeCancellationReason(reason: unknown): string | null {
  if (typeof reason !== 'string') return null;
  const trimmed = reason.trim();
  return trimmed.length >= 3 && trimmed.length <= 1000 ? trimmed : null;
}
