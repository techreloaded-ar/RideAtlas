// Regole di dominio dei viaggi guidati a numero chiuso.
// Funzioni pure: nessun accesso al database, così restano verificabili in isolamento.
import { z } from 'zod';

export const SEAT_HOLD_MINUTES = 15;
export const FEW_SEATS_THRESHOLD = 2;
export const GUIDED_TRIP_TIME_ZONE = 'Europe/Rome';

/** Giorno di calendario 'YYYY-MM-DD' di un istante, nel fuso orario italiano. */
export function calendarDayInItaly(instant: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: GUIDED_TRIP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/** Giorno di calendario 'YYYY-MM-DD' di una data salvata come giorno (mezzanotte UTC). */
export function storedCalendarDay(storedDay: Date): string {
  return storedDay.toISOString().slice(0, 10);
}

/** Converte 'YYYY-MM-DD' nella data da salvare (mezzanotte UTC). */
export function calendarDayToStoredDate(calendarDay: string): Date {
  return new Date(`${calendarDay}T00:00:00.000Z`);
}

export function formatStoredDay(storedDay: Date | string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }): string {
  const date = typeof storedDay === 'string' ? new Date(storedDay) : storedDay;
  return new Intl.DateTimeFormat('it-IT', { ...options, timeZone: 'UTC' }).format(date);
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function durationInDays(startDate: Date, endDate: Date): number {
  return Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;
}

/** La partenza è futura: si parte da domani in poi (ora italiana). */
export function hasFutureDeparture(startDate: Date, now: Date = new Date()): boolean {
  return storedCalendarDay(startDate) > calendarDayInItaly(now);
}

/** La disdetta gratuita è possibile fino al giorno indicato, incluso. */
export function isWithinFreeCancellation(freeCancellationUntil: Date, now: Date = new Date()): boolean {
  return calendarDayInItaly(now) <= storedCalendarDay(freeCancellationUntil);
}

interface SeatHoldingBooking {
  status: string;
  seatHeldUntil: Date | null;
}

/** Una prenotazione occupa un posto se è pagata o se il posto è ancora trattenuto per il pagamento. */
export function bookingOccupiesSeat(booking: SeatHoldingBooking, now: Date = new Date()): boolean {
  if (booking.status === 'CONFIRMED') return true;
  return booking.status === 'PENDING_PAYMENT' && booking.seatHeldUntil !== null && booking.seatHeldUntil > now;
}

export function countOccupiedSeats(bookings: SeatHoldingBooking[], now: Date = new Date()): number {
  return bookings.filter(booking => bookingOccupiesSeat(booking, now)).length;
}

export type SeatAvailabilityLabel = 'available' | 'few' | 'full';

export function seatAvailability(maxParticipants: number, occupiedSeats: number): { freeSeats: number; label: SeatAvailabilityLabel } {
  const freeSeats = Math.max(0, maxParticipants - occupiedSeats);
  if (freeSeats === 0) return { freeSeats, label: 'full' };
  if (freeSeats <= FEW_SEATS_THRESHOLD) return { freeSeats, label: 'few' };
  return { freeSeats, label: 'available' };
}

export function seatAvailabilityText(freeSeats: number): string {
  if (freeSeats === 0) return 'Completo';
  if (freeSeats <= FEW_SEATS_THRESHOLD) return freeSeats === 1 ? 'Ultimo posto' : `Ultimi ${freeSeats} posti`;
  return `${freeSeats} posti liberi`;
}

const calendarDaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data non valida');

export const guidedTripFormSchema = z.object({
  title: z.string().trim().min(3, 'Il titolo deve avere almeno 3 caratteri').max(120, 'Il titolo può avere al massimo 120 caratteri'),
  description: z.string().trim().min(10, 'Descrivi il programma con almeno 10 caratteri').max(5000, 'La descrizione può avere al massimo 5000 caratteri'),
  startDate: calendarDaySchema,
  endDate: calendarDaySchema,
  meetingPoint: z.string().trim().min(3, 'Indica il luogo e l\'orario di ritrovo').max(200, 'Il ritrovo può avere al massimo 200 caratteri'),
  pricePerPerson: z.coerce.number({ invalid_type_error: 'Prezzo non valido' }).positive('Il prezzo deve essere maggiore di zero').max(100000, 'Prezzo troppo alto'),
  maxParticipants: z.coerce.number({ invalid_type_error: 'Numero non valido' }).int('Il numero di partecipanti deve essere intero').min(1, 'Serve almeno un partecipante').max(500, 'Massimo 500 partecipanti'),
  freeCancellationUntil: calendarDaySchema,
  // Campo facoltativo: stringa vuota, null o assente significano «nessun itinerario».
  linkedTripId: z.preprocess(value => (typeof value === 'string' && value.trim() === '' ? null : value), z.string().trim().min(1).nullable().optional()),
});

export type GuidedTripFormInput = z.infer<typeof guidedTripFormSchema>;

/**
 * Regole che dipendono da più campi o dallo stato attuale del viaggio.
 * Restituisce un messaggio per ogni campo non valido.
 */
export function validateGuidedTripSchedule(
  input: Pick<GuidedTripFormInput, 'startDate' | 'endDate' | 'freeCancellationUntil' | 'maxParticipants'>,
  context: { now?: Date; confirmedBookings?: number; startDateUnchanged?: boolean } = {},
): Record<string, string> {
  const errors: Record<string, string> = {};
  const today = calendarDayInItaly(context.now ?? new Date());
  if (!context.startDateUnchanged && input.startDate <= today) errors.startDate = 'La partenza deve essere successiva a oggi';
  if (input.endDate < input.startDate) errors.endDate = 'Il rientro non può precedere la partenza';
  if (input.freeCancellationUntil > input.startDate) errors.freeCancellationUntil = 'La scadenza per la disdetta non può superare la data di partenza';
  const confirmedBookings = context.confirmedBookings ?? 0;
  if (input.maxParticipants < confirmedBookings) {
    errors.maxParticipants = `Ci sono già ${confirmedBookings} prenotazioni confermate: il massimo non può essere inferiore`;
  }
  return errors;
}

export type GuidedTripBookingStatusValue =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'EXPIRED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'REFUND_FAILED';

/** Etichetta mostrata all'utente per la propria prenotazione. */
export function bookingStatusLabel(booking: { status: GuidedTripBookingStatusValue; cancelledByUserAt: Date | string | null }): string {
  switch (booking.status) {
    case 'PENDING_PAYMENT':
      return 'In attesa di pagamento';
    case 'CONFIRMED':
      return 'Confermata';
    case 'EXPIRED':
      return 'Pagamento non completato';
    case 'REFUND_PENDING':
      return 'Viaggio annullato · rimborso in corso';
    case 'REFUNDED':
      return booking.cancelledByUserAt ? 'Disdetta · rimborsata' : 'Viaggio annullato · rimborsata';
    case 'REFUND_FAILED':
      return 'Rimborso in verifica';
  }
}
