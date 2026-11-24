// Regole di dominio dei viaggi guidati a numero chiuso.
// Funzioni pure: nessun accesso al database, così da poterle verificare con test unitari
// e riusarle identiche lato server e lato interfaccia.

export const SEAT_HOLD_MINUTES = 15
export const DEFAULT_CANCELLATION_NOTICE_DAYS = 14

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

export type GuidedTripLifecycleStatus = 'Bozza' | 'Pubblicato' | 'Annullato'

export type RegistrationStatusForSeats =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'PAYMENT_FAILED'
  | 'REFUND_DUE'
  | 'REFUNDED'

export interface RegistrationSeatSnapshot {
  status: RegistrationStatusForSeats
  seatHoldExpiresAt: Date | null
}

/** Un'iscrizione occupa un posto se è confermata o se il pagamento è in corso entro il tempo di trattenuta. */
export function isSeatOccupied(registration: RegistrationSeatSnapshot, now: Date): boolean {
  if (registration.status === 'CONFIRMED') return true
  if (registration.status === 'PENDING_PAYMENT') {
    return registration.seatHoldExpiresAt !== null && registration.seatHoldExpiresAt.getTime() > now.getTime()
  }
  return false
}

export interface SeatAvailability {
  maxParticipants: number
  confirmedParticipants: number
  occupiedSeats: number
  availableSeats: number
}

export function computeSeatAvailability(
  maxParticipants: number,
  registrations: RegistrationSeatSnapshot[],
  now: Date,
): SeatAvailability {
  const confirmedParticipants = registrations.filter(r => r.status === 'CONFIRMED').length
  const occupiedSeats = registrations.filter(r => isSeatOccupied(r, now)).length
  return {
    maxParticipants,
    confirmedParticipants,
    occupiedSeats,
    availableSeats: Math.max(0, maxParticipants - occupiedSeats),
  }
}

export function seatHoldExpiry(now: Date): Date {
  return new Date(now.getTime() + SEAT_HOLD_MINUTES * 60 * 1000)
}

/**
 * Le date dei viaggi guidati sono giorni di calendario memorizzati a mezzanotte UTC
 * (es. "2027-06-14" → 2027-06-14T00:00:00Z). Fine della stessa giornata di calendario.
 */
export function endOfDay(date: Date): Date {
  const end = new Date(date)
  end.setUTCHours(23, 59, 59, 999)
  return end
}

/** Converte "AAAA-MM-GG" nel giorno di calendario memorizzato (mezzanotte UTC). */
export function calendarDayFromIsoDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`)
}

/** Converte un giorno di calendario memorizzato in "AAAA-MM-GG" per i campi data dei form. */
export function isoDateFromCalendarDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Formatta un giorno di calendario in italiano (es. "14 giugno 2027"). */
export function formatCalendarDay(date: Date, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }): string {
  return new Intl.DateTimeFormat('it-IT', { ...options, timeZone: 'UTC' }).format(date)
}

/** Formatta l'intervallo di date del viaggio (es. "14 – 16 giugno 2027"). */
export function formatCalendarRange(start: Date, end: Date): string {
  const sameMonth = start.getUTCFullYear() === end.getUTCFullYear() && start.getUTCMonth() === end.getUTCMonth()
  if (start.getTime() === end.getTime()) return formatCalendarDay(start)
  if (sameMonth) return `${start.getUTCDate()} – ${formatCalendarDay(end)}`
  return `${formatCalendarDay(start, { day: 'numeric', month: 'long' })} – ${formatCalendarDay(end)}`
}

/** Ultimo giorno di calendario in cui il partecipante può disdire autonomamente: N giorni prima della partenza. */
export function selfCancellationLastDay(departureDate: Date, cancellationNoticeDays: number): Date {
  return new Date(departureDate.getTime() - cancellationNoticeDays * MILLISECONDS_PER_DAY)
}

/** Ultimo istante utile per la disdetta autonoma (fine dell'ultimo giorno utile). */
export function selfCancellationDeadline(departureDate: Date, cancellationNoticeDays: number): Date {
  return endOfDay(selfCancellationLastDay(departureDate, cancellationNoticeDays))
}

export function canParticipantSelfCancel(
  departureDate: Date,
  cancellationNoticeDays: number,
  now: Date,
): boolean {
  return now.getTime() <= selfCancellationDeadline(departureDate, cancellationNoticeDays).getTime()
}

export type RegistrationClosedReason =
  | 'not_published'
  | 'cancelled'
  | 'departed'
  | 'deadline_passed'
  | 'sold_out'

export interface RegistrationWindowInput {
  status: GuidedTripLifecycleStatus
  departureDate: Date
  registrationDeadline: Date
  availableSeats: number
}

/** Motivo per cui non ci si può iscrivere, oppure null se le iscrizioni sono aperte. */
export function registrationClosedReason(input: RegistrationWindowInput, now: Date): RegistrationClosedReason | null {
  if (input.status === 'Annullato') return 'cancelled'
  if (input.status !== 'Pubblicato') return 'not_published'
  if (now.getTime() >= input.departureDate.getTime()) return 'departed'
  if (now.getTime() > endOfDay(input.registrationDeadline).getTime()) return 'deadline_passed'
  if (input.availableSeats <= 0) return 'sold_out'
  return null
}

export const REGISTRATION_CLOSED_MESSAGES: Record<RegistrationClosedReason, string> = {
  not_published: 'Questo viaggio guidato non è ancora pubblicato',
  cancelled: 'Viaggio annullato',
  departed: 'Il viaggio è già partito',
  deadline_passed: 'Iscrizioni chiuse',
  sold_out: 'Posti esauriti',
}

/** Stato mostrato: un viaggio pubblicato il cui rientro è passato risulta concluso. */
export type GuidedTripDisplayStatus = GuidedTripLifecycleStatus | 'Concluso'

export function guidedTripDisplayStatus(
  status: GuidedTripLifecycleStatus,
  returnDate: Date,
  now: Date,
): GuidedTripDisplayStatus {
  if (status === 'Pubblicato' && now.getTime() > endOfDay(returnDate).getTime()) return 'Concluso'
  return status
}

export interface GuidedTripEditGuardInput {
  confirmedParticipants: number
  hasAnyRegistration: boolean
  currentPrice: number
  requestedPrice?: number
  requestedMaxParticipants?: number
}

/** Vincoli sulle modifiche dopo le prime iscrizioni; restituisce il messaggio di errore o null. */
export function guidedTripEditViolation(input: GuidedTripEditGuardInput): string | null {
  if (
    input.requestedMaxParticipants !== undefined &&
    input.requestedMaxParticipants < input.confirmedParticipants
  ) {
    return `I posti massimi non possono scendere sotto i ${input.confirmedParticipants} iscritti confermati`
  }
  if (
    input.hasAnyRegistration &&
    input.requestedPrice !== undefined &&
    Math.round(input.requestedPrice * 100) !== Math.round(input.currentPrice * 100)
  ) {
    return 'Il prezzo non può essere modificato dopo le prime iscrizioni'
  }
  return null
}

export function slugifyGuidedTripTitle(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'viaggio-guidato'
}

/** Righe del programma: una per giorno, ignorando quelle vuote. */
export function programDays(program: string): string[] {
  return program
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
}
