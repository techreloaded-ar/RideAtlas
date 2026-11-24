import type { GuidedTripDisplayStatus } from '@/lib/guided-trips/guided-trip-rules'

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function seatsLeftLabel(availableSeats: number, maxParticipants: number): string {
  if (availableSeats <= 0) return 'Posti esauriti'
  if (availableSeats === 1) return `Resta 1 posto su ${maxParticipants}`
  return `Restano ${availableSeats} posti su ${maxParticipants}`
}

export const GUIDED_TRIP_STATUS_LABELS: Record<GuidedTripDisplayStatus, string> = {
  Bozza: 'Bozza',
  Pubblicato: 'Pubblicato',
  Annullato: 'Annullato',
  Concluso: 'Concluso',
}

export const GUIDED_TRIP_STATUS_BADGE_CLASSES: Record<GuidedTripDisplayStatus, string> = {
  Bozza: 'bg-gray-100 text-gray-800',
  Pubblicato: 'bg-green-100 text-green-800',
  Annullato: 'bg-red-100 text-red-800',
  Concluso: 'bg-blue-100 text-blue-800',
}

export type RegistrationStatusCode = 'PENDING_PAYMENT' | 'CONFIRMED' | 'PAYMENT_FAILED' | 'REFUND_DUE' | 'REFUNDED'
export type CancellationOriginCode = 'PARTICIPANT' | 'ORGANIZER' | null

/** Etichetta dello stato di un'iscrizione, distinguendo disdetta del partecipante e annullamento del viaggio. */
export function registrationStatusLabel(status: RegistrationStatusCode, origin: CancellationOriginCode): string {
  switch (status) {
    case 'CONFIRMED':
      return 'Confermato'
    case 'PENDING_PAYMENT':
      return 'Pagamento in corso'
    case 'PAYMENT_FAILED':
      return 'Pagamento non riuscito'
    case 'REFUND_DUE':
      if (origin === 'PARTICIPANT') return 'Disdetto · da rimborsare'
      if (origin === 'ORGANIZER') return 'Viaggio annullato · da rimborsare'
      return 'Da rimborsare'
    case 'REFUNDED':
      return origin === 'ORGANIZER' ? 'Viaggio annullato · rimborsato' : 'Rimborsato'
  }
}

export const REGISTRATION_STATUS_BADGE_CLASSES: Record<RegistrationStatusCode, string> = {
  CONFIRMED: 'bg-green-100 text-green-800',
  PENDING_PAYMENT: 'bg-gray-100 text-gray-700',
  PAYMENT_FAILED: 'bg-gray-100 text-gray-700',
  REFUND_DUE: 'bg-amber-100 text-amber-800',
  REFUNDED: 'bg-blue-100 text-blue-800',
}
