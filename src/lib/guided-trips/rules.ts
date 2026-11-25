import { z } from 'zod';

// Regole di dominio dei viaggi guidati, senza dipendenze dal database.

/** Minuti per cui un posto resta trattenuto mentre l'utente paga. */
export const SEAT_HOLD_MINUTES = 15;
export const MAX_PARTICIPANTS_LIMIT = 50;
/** Sotto questa soglia di posti liberi l'etichetta diventa «Ultimi N posti». */
export const FEW_SEATS_THRESHOLD = 3;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Converte «AAAA-MM-GG» nella mezzanotte UTC di quel giorno. */
export function parseDateOnly(value: string): Date | null {
  if (!DATE_ONLY.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const dateOnly = z.string().refine(v => parseDateOnly(v) !== null, 'Data non valida');

export const guidedTripInputSchema = z
  .object({
    title: z.string().trim().min(3, 'Il titolo deve avere almeno 3 caratteri').max(120, 'Il titolo può avere al massimo 120 caratteri'),
    description: z.string().trim().min(10, 'La descrizione deve avere almeno 10 caratteri').max(5000, 'La descrizione può avere al massimo 5000 caratteri'),
    included: z.string().trim().min(3, 'Indica cosa è compreso nel prezzo').max(3000, 'Il testo può avere al massimo 3000 caratteri'),
    startDate: dateOnly,
    endDate: dateOnly,
    meetingPoint: z.string().trim().min(3, 'Indica luogo e ora di ritrovo').max(200, 'Il ritrovo può avere al massimo 200 caratteri'),
    price: z.coerce.number({ invalid_type_error: 'Prezzo non valido' }).positive('Il prezzo deve essere maggiore di 0').max(100000, 'Prezzo troppo alto')
      .refine(v => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, 'Il prezzo può avere al massimo due decimali'),
    maxParticipants: z.coerce.number({ invalid_type_error: 'Numero di posti non valido' }).int('Il numero di posti deve essere intero')
      .min(1, 'Serve almeno 1 posto').max(MAX_PARTICIPANTS_LIMIT, `Al massimo ${MAX_PARTICIPANTS_LIMIT} posti`),
    linkedTripId: z.string().trim().min(1).nullable().optional(),
  })
  .refine(v => {
    const start = parseDateOnly(v.startDate);
    const end = parseDateOnly(v.endDate);
    return !start || !end || end.getTime() >= start.getTime();
  }, { message: 'La data di rientro non può precedere la partenza', path: ['endDate'] });

export type GuidedTripInput = z.infer<typeof guidedTripInputSchema>;

/** La partenza deve cadere in un giorno successivo a oggi (le prenotazioni chiudono il giorno di partenza). */
export function isFutureDeparture(startDate: Date, now: Date = new Date()): boolean {
  return startDate.getTime() > now.getTime();
}

export type SeatTone = 'free' | 'few' | 'full';

export interface SeatSummary {
  max: number;
  taken: number;
  free: number;
  tone: SeatTone;
  label: string;
  /** Percentuale di riempimento (0–100) per la barra. */
  fill: number;
}

export function summarizeSeats(max: number, taken: number): SeatSummary {
  const free = Math.max(0, max - taken);
  const tone: SeatTone = free === 0 ? 'full' : free <= FEW_SEATS_THRESHOLD ? 'few' : 'free';
  const label =
    tone === 'full' ? 'Completo'
      : tone === 'few' ? (free === 1 ? 'Ultimo posto' : `Ultimi ${free} posti`)
        : `${free} posti liberi`;
  const fill = max > 0 ? Math.min(100, Math.round((Math.min(taken, max) / max) * 100)) : 100;
  return { max, taken, free, tone, label, fill };
}

/** Un posto conta come occupato se confermato o trattenuto da un pagamento ancora in corso. */
export function occupiesSeat(booking: { status: string; holdExpiresAt: Date | null }, now: Date = new Date()): boolean {
  if (booking.status === 'CONFIRMED') return true;
  return booking.status === 'PENDING' && !!booking.holdExpiresAt && booking.holdExpiresAt.getTime() > now.getTime();
}

export function holdExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + SEAT_HOLD_MINUTES * 60_000);
}

/** Il viaggio accetta prenotazioni: pubblicato e con partenza futura. */
export function isOpenForBooking(trip: { status: string; startDate: Date }, now: Date = new Date()): boolean {
  return trip.status === 'Pubblicato' && isFutureDeparture(trip.startDate, now);
}

export function durationDays(startDate: Date, endDate: Date): number {
  return Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;
}

const dateFormatter = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const shortFormatter = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const monthFormatter = new Intl.DateTimeFormat('it-IT', { month: 'short', timeZone: 'UTC' });

export const formatLongDate = (date: Date) => dateFormatter.format(date);
export const formatShortDate = (date: Date) => shortFormatter.format(date);
export const formatMonth = (date: Date) => monthFormatter.format(date).replace('.', '');
export const formatDay = (date: Date) => String(date.getUTCDate()).padStart(2, '0');

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
}

export const GUIDED_TRIP_STATUS_LABELS: Record<string, string> = {
  Bozza: 'Bozza',
  Pubblicato: 'Pubblicato',
  Ritirato: 'Ritirato',
};
