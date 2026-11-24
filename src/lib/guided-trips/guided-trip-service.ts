import { prisma } from '@/lib/core/prisma'
import {
  GuidedTripCancellationOrigin,
  GuidedTripRegistrationStatus,
  GuidedTripStatus,
  Prisma,
  UserRole,
} from '@prisma/client'
import type { GuidedTripInput } from '@/schemas/guided-trip'
import {
  REGISTRATION_CLOSED_MESSAGES,
  calendarDayFromIsoDate,
  canParticipantSelfCancel,
  computeSeatAvailability,
  guidedTripDisplayStatus,
  guidedTripEditViolation,
  isSeatOccupied,
  registrationClosedReason,
  seatHoldExpiry,
  selfCancellationLastDay,
  slugifyGuidedTripTitle,
  type GuidedTripDisplayStatus,
  type RegistrationClosedReason,
  type SeatAvailability,
} from './guided-trip-rules'

/** Errore applicativo con lo stato HTTP da restituire al client. */
export class GuidedTripServiceError extends Error {
  constructor(message: string, readonly httpStatus: number) {
    super(message)
    this.name = 'GuidedTripServiceError'
  }
}

export interface ActingUser {
  id: string
  role: UserRole
}

type TransactionClient = Prisma.TransactionClient

const organizerSelect = { id: true, name: true, image: true } as const

type GuidedTripRecord = Prisma.GuidedTripGetPayload<{
  include: { organizer: { select: typeof organizerSelect } }
}>

type RegistrationSnapshot = {
  status: GuidedTripRegistrationStatus
  seatHoldExpiresAt: Date | null
}

export interface GuidedTripSummary {
  id: string
  slug: string
  title: string
  description: string
  program: string
  includedServices: string | null
  coverImageUrl: string | null
  departureDate: string
  returnDate: string
  meetingPoint: string
  maxParticipants: number
  pricePerParticipant: number
  registrationDeadline: string
  cancellationNoticeDays: number
  selfCancellationLastDay: string
  status: GuidedTripStatus
  displayStatus: GuidedTripDisplayStatus
  publishedAt: string | null
  cancelledAt: string | null
  organizer: { id: string; name: string | null; image: string | null }
  seats: SeatAvailability
  registrationClosedReason: RegistrationClosedReason | null
  registrationClosedMessage: string | null
}

export interface ViewerRegistration {
  id: string
  status: GuidedTripRegistrationStatus
  canSelfCancel: boolean
}

export interface ParticipantRow {
  registrationId: string
  participantId: string
  name: string | null
  email: string
  status: GuidedTripRegistrationStatus
  cancellationOrigin: GuidedTripCancellationOrigin | null
  registeredAt: string
  confirmedAt: string | null
  cancelledAt: string | null
  refundedAt: string | null
}

function toNumber(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : value.toNumber()
}

export function summarizeGuidedTrip(
  trip: GuidedTripRecord,
  registrations: RegistrationSnapshot[],
  now: Date,
): GuidedTripSummary {
  const seats = computeSeatAvailability(trip.maxParticipants, registrations, now)
  const closedReason = registrationClosedReason(
    {
      status: trip.status,
      departureDate: trip.departureDate,
      registrationDeadline: trip.registrationDeadline,
      availableSeats: seats.availableSeats,
    },
    now,
  )
  return {
    id: trip.id,
    slug: trip.slug,
    title: trip.title,
    description: trip.description,
    program: trip.program,
    includedServices: trip.includedServices,
    coverImageUrl: trip.coverImageUrl,
    departureDate: trip.departureDate.toISOString(),
    returnDate: trip.returnDate.toISOString(),
    meetingPoint: trip.meetingPoint,
    maxParticipants: trip.maxParticipants,
    pricePerParticipant: toNumber(trip.pricePerParticipant),
    registrationDeadline: trip.registrationDeadline.toISOString(),
    cancellationNoticeDays: trip.cancellationNoticeDays,
    selfCancellationLastDay: selfCancellationLastDay(trip.departureDate, trip.cancellationNoticeDays).toISOString(),
    status: trip.status,
    displayStatus: guidedTripDisplayStatus(trip.status, trip.returnDate, now),
    publishedAt: trip.publishedAt?.toISOString() ?? null,
    cancelledAt: trip.cancelledAt?.toISOString() ?? null,
    organizer: { id: trip.organizer.id, name: trip.organizer.name, image: trip.organizer.image },
    seats,
    registrationClosedReason: closedReason,
    registrationClosedMessage: closedReason ? REGISTRATION_CLOSED_MESSAGES[closedReason] : null,
  }
}

function canManage(trip: { organizerId: string }, user: ActingUser): boolean {
  return trip.organizerId === user.id || user.role === UserRole.Sentinel
}

function canOrganize(user: ActingUser): boolean {
  return user.role === UserRole.Ranger || user.role === UserRole.Sentinel
}

function tripDataFromInput(input: GuidedTripInput) {
  return {
    title: input.title,
    description: input.description,
    program: input.program,
    includedServices: input.includedServices ?? null,
    coverImageUrl: input.coverImageUrl ?? null,
    departureDate: calendarDayFromIsoDate(input.departureDate),
    returnDate: calendarDayFromIsoDate(input.returnDate),
    meetingPoint: input.meetingPoint,
    maxParticipants: input.maxParticipants,
    pricePerParticipant: new Prisma.Decimal(input.pricePerParticipant.toFixed(2)),
    registrationDeadline: calendarDayFromIsoDate(input.registrationDeadline),
    cancellationNoticeDays: input.cancellationNoticeDays,
  }
}

async function uniqueSlug(title: string): Promise<string> {
  const base = slugifyGuidedTripTitle(title)
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 7)}`
    const taken = await prisma.guidedTrip.findUnique({ where: { slug: candidate }, select: { id: true } })
    if (!taken) return candidate
  }
  throw new GuidedTripServiceError('Impossibile generare un indirizzo univoco per il viaggio', 500)
}

/** Blocca la riga del viaggio per serializzare le operazioni che contano i posti. */
async function lockGuidedTrip(tx: TransactionClient, guidedTripId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM "guided_trips" WHERE id = ${guidedTripId} FOR UPDATE`
}

async function loadTripForUpdate(tx: TransactionClient, guidedTripId: string) {
  await lockGuidedTrip(tx, guidedTripId)
  const trip = await tx.guidedTrip.findUnique({
    where: { id: guidedTripId },
    include: { registrations: { select: { id: true, participantId: true, status: true, seatHoldExpiresAt: true } } },
  })
  if (!trip) throw new GuidedTripServiceError('Viaggio guidato non trovato', 404)
  return trip
}

export const GuidedTripService = {
  // ---------------------------------------------------------------- lettura pubblica

  async listPublishedUpcoming(now: Date = new Date()): Promise<GuidedTripSummary[]> {
    const trips = await prisma.guidedTrip.findMany({
      where: { status: GuidedTripStatus.Pubblicato, departureDate: { gt: now } },
      include: {
        organizer: { select: organizerSelect },
        registrations: { select: { status: true, seatHoldExpiresAt: true } },
      },
      orderBy: { departureDate: 'asc' },
    })
    return trips.map(trip => summarizeGuidedTrip(trip, trip.registrations, now))
  },

  /** Scheda pubblica: visibile se pubblicata o annullata; in bozza solo a organizzatore e Sentinel. */
  async getPublicBySlug(
    slug: string,
    viewer: ActingUser | null,
    now: Date = new Date(),
  ): Promise<{ trip: GuidedTripSummary; viewerRegistration: ViewerRegistration | null; viewerIsOrganizer: boolean } | null> {
    const trip = await prisma.guidedTrip.findUnique({
      where: { slug },
      include: {
        organizer: { select: organizerSelect },
        registrations: { select: { id: true, participantId: true, status: true, seatHoldExpiresAt: true, createdAt: true } },
      },
    })
    if (!trip) return null
    const viewerIsOrganizer = viewer !== null && canManage(trip, viewer)
    if (trip.status === GuidedTripStatus.Bozza && !viewerIsOrganizer) return null

    const summary = summarizeGuidedTrip(trip, trip.registrations, now)
    let viewerRegistration: ViewerRegistration | null = null
    if (viewer) {
      const own = trip.registrations
        .filter(r => r.participantId === viewer.id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .find(r => r.status === GuidedTripRegistrationStatus.CONFIRMED || isSeatOccupied(r, now))
      if (own) {
        viewerRegistration = {
          id: own.id,
          status: own.status,
          canSelfCancel:
            own.status === GuidedTripRegistrationStatus.CONFIRMED &&
            trip.status === GuidedTripStatus.Pubblicato &&
            canParticipantSelfCancel(trip.departureDate, trip.cancellationNoticeDays, now),
        }
      }
    }
    return { trip: summary, viewerRegistration, viewerIsOrganizer: trip.organizerId === viewer?.id }
  },

  // ---------------------------------------------------------------- area Ranger

  async listByOrganizer(organizerId: string, now: Date = new Date()): Promise<GuidedTripSummary[]> {
    const trips = await prisma.guidedTrip.findMany({
      where: { organizerId },
      include: {
        organizer: { select: organizerSelect },
        registrations: { select: { status: true, seatHoldExpiresAt: true } },
      },
      orderBy: { departureDate: 'asc' },
    })
    return trips.map(trip => summarizeGuidedTrip(trip, trip.registrations, now))
  },

  async getForManagement(
    guidedTripId: string,
    user: ActingUser,
    now: Date = new Date(),
  ): Promise<{ trip: GuidedTripSummary; participants: ParticipantRow[] }> {
    const trip = await prisma.guidedTrip.findUnique({
      where: { id: guidedTripId },
      include: {
        organizer: { select: organizerSelect },
        registrations: {
          include: { participant: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    if (!trip) throw new GuidedTripServiceError('Viaggio guidato non trovato', 404)
    if (!canManage(trip, user)) throw new GuidedTripServiceError('Non puoi gestire questo viaggio guidato', 403)

    const participants: ParticipantRow[] = trip.registrations
      .filter(r => r.status !== GuidedTripRegistrationStatus.PAYMENT_FAILED && r.status !== GuidedTripRegistrationStatus.PENDING_PAYMENT)
      .map(r => ({
        registrationId: r.id,
        participantId: r.participant.id,
        name: r.participant.name,
        email: r.participant.email,
        status: r.status,
        cancellationOrigin: r.cancellationOrigin,
        registeredAt: r.createdAt.toISOString(),
        confirmedAt: r.confirmedAt?.toISOString() ?? null,
        cancelledAt: r.cancelledAt?.toISOString() ?? null,
        refundedAt: r.refundedAt?.toISOString() ?? null,
      }))
    return { trip: summarizeGuidedTrip(trip, trip.registrations, now), participants }
  },

  async create(user: ActingUser, input: GuidedTripInput): Promise<{ id: string; slug: string }> {
    if (!canOrganize(user)) throw new GuidedTripServiceError('Solo i Ranger possono organizzare viaggi guidati', 403)
    const slug = await uniqueSlug(input.title)
    const created = await prisma.guidedTrip.create({
      data: { ...tripDataFromInput(input), slug, organizerId: user.id, status: GuidedTripStatus.Bozza },
      select: { id: true, slug: true },
    })
    return created
  },

  async update(guidedTripId: string, user: ActingUser, input: GuidedTripInput, now: Date = new Date()): Promise<void> {
    await prisma.$transaction(async tx => {
      const trip = await loadTripForUpdate(tx, guidedTripId)
      if (!canManage(trip, user)) throw new GuidedTripServiceError('Non puoi modificare questo viaggio guidato', 403)
      if (trip.status === GuidedTripStatus.Annullato) {
        throw new GuidedTripServiceError('Un viaggio annullato non può essere modificato', 409)
      }
      const occupied = computeSeatAvailability(trip.maxParticipants, trip.registrations, now).occupiedSeats
      const hasAnyRegistration = trip.registrations.some(r => r.status !== GuidedTripRegistrationStatus.PAYMENT_FAILED)
      const violation = guidedTripEditViolation({
        confirmedParticipants: occupied,
        hasAnyRegistration,
        currentPrice: toNumber(trip.pricePerParticipant),
        requestedPrice: input.pricePerParticipant,
        requestedMaxParticipants: input.maxParticipants,
      })
      if (violation) throw new GuidedTripServiceError(violation, 409)
      await tx.guidedTrip.update({ where: { id: guidedTripId }, data: tripDataFromInput(input) })
    })
  },

  async publish(guidedTripId: string, user: ActingUser, now: Date = new Date()): Promise<void> {
    const trip = await prisma.guidedTrip.findUnique({ where: { id: guidedTripId } })
    if (!trip) throw new GuidedTripServiceError('Viaggio guidato non trovato', 404)
    if (!canManage(trip, user)) throw new GuidedTripServiceError('Non puoi pubblicare questo viaggio guidato', 403)
    if (trip.status !== GuidedTripStatus.Bozza) throw new GuidedTripServiceError('Solo una bozza può essere pubblicata', 409)
    if (trip.departureDate.getTime() <= now.getTime()) {
      throw new GuidedTripServiceError('La data di partenza deve essere futura per pubblicare il viaggio', 409)
    }
    await prisma.guidedTrip.update({
      where: { id: guidedTripId },
      data: { status: GuidedTripStatus.Pubblicato, publishedAt: now },
    })
  },

  /** Annullamento da parte dell'organizzatore: le iscrizioni confermate diventano da rimborsare. */
  async cancelTrip(guidedTripId: string, user: ActingUser, now: Date = new Date()): Promise<{ refundDueCount: number }> {
    return prisma.$transaction(async tx => {
      const trip = await loadTripForUpdate(tx, guidedTripId)
      if (!canManage(trip, user)) throw new GuidedTripServiceError('Non puoi annullare questo viaggio guidato', 403)
      if (trip.status === GuidedTripStatus.Annullato) throw new GuidedTripServiceError('Il viaggio è già annullato', 409)

      await tx.guidedTrip.update({
        where: { id: guidedTripId },
        data: { status: GuidedTripStatus.Annullato, cancelledAt: now },
      })
      const refundDue = await tx.guidedTripRegistration.updateMany({
        where: { guidedTripId, status: GuidedTripRegistrationStatus.CONFIRMED },
        data: {
          status: GuidedTripRegistrationStatus.REFUND_DUE,
          cancellationOrigin: GuidedTripCancellationOrigin.ORGANIZER,
          cancelledAt: now,
        },
      })
      await tx.guidedTripRegistration.updateMany({
        where: { guidedTripId, status: GuidedTripRegistrationStatus.PENDING_PAYMENT },
        data: { status: GuidedTripRegistrationStatus.PAYMENT_FAILED, seatHoldExpiresAt: null, refundNote: 'Viaggio annullato durante il pagamento' },
      })
      return { refundDueCount: refundDue.count }
    })
  },

  // ---------------------------------------------------------------- iscrizione e pagamento

  /**
   * Avvia l'iscrizione trattenendo un posto per la durata del pagamento.
   * La riga del viaggio è bloccata: due richieste contemporanee non possono superare il massimo.
   */
  async startRegistration(
    guidedTripId: string,
    user: ActingUser,
    now: Date = new Date(),
  ): Promise<{ registrationId: string; amount: number; seatHoldExpiresAt: string }> {
    return prisma.$transaction(async tx => {
      const trip = await loadTripForUpdate(tx, guidedTripId)
      if (trip.organizerId === user.id) {
        throw new GuidedTripServiceError('Non puoi iscriverti al viaggio che organizzi', 409)
      }

      const own = trip.registrations.filter(r => r.participantId === user.id)
      if (own.some(r => r.status === GuidedTripRegistrationStatus.CONFIRMED)) {
        throw new GuidedTripServiceError('Sei già iscritto a questo viaggio', 409)
      }
      const heldByUser = own.find(r => r.status === GuidedTripRegistrationStatus.PENDING_PAYMENT && isSeatOccupied(r, now))

      const seats = computeSeatAvailability(trip.maxParticipants, trip.registrations, now)
      const closed = registrationClosedReason(
        {
          status: trip.status,
          departureDate: trip.departureDate,
          registrationDeadline: trip.registrationDeadline,
          // Il posto già trattenuto da questo utente resta suo.
          availableSeats: seats.availableSeats + (heldByUser ? 1 : 0),
        },
        now,
      )
      if (closed) throw new GuidedTripServiceError(REGISTRATION_CLOSED_MESSAGES[closed], 409)

      const holdUntil = seatHoldExpiry(now)
      if (heldByUser) {
        const renewed = await tx.guidedTripRegistration.update({
          where: { id: heldByUser.id },
          data: { seatHoldExpiresAt: holdUntil },
        })
        return { registrationId: renewed.id, amount: toNumber(renewed.amount), seatHoldExpiresAt: holdUntil.toISOString() }
      }

      // Pagamenti in sospeso scaduti di questo utente: non trattengono più posti.
      await tx.guidedTripRegistration.updateMany({
        where: { guidedTripId, participantId: user.id, status: GuidedTripRegistrationStatus.PENDING_PAYMENT },
        data: { status: GuidedTripRegistrationStatus.PAYMENT_FAILED, seatHoldExpiresAt: null, refundNote: 'Pagamento non completato in tempo' },
      })

      const registration = await tx.guidedTripRegistration.create({
        data: {
          guidedTripId,
          participantId: user.id,
          amount: trip.pricePerParticipant,
          status: GuidedTripRegistrationStatus.PENDING_PAYMENT,
          seatHoldExpiresAt: holdUntil,
        },
      })
      return { registrationId: registration.id, amount: toNumber(registration.amount), seatHoldExpiresAt: holdUntil.toISOString() }
    })
  },

  /** Dati di un'iscrizione in pagamento, solo per il suo partecipante. */
  async getRegistrationForPayment(registrationId: string, userId: string) {
    const registration = await prisma.guidedTripRegistration.findUnique({
      where: { id: registrationId },
      include: { guidedTrip: { select: { id: true, slug: true, title: true } } },
    })
    if (!registration) throw new GuidedTripServiceError('Iscrizione non trovata', 404)
    if (registration.participantId !== userId) throw new GuidedTripServiceError('Questa iscrizione appartiene a un altro utente', 403)
    return registration
  },

  /**
   * Conferma l'iscrizione a pagamento riuscito. Idempotente: una seconda conferma
   * (es. webhook dopo la conferma dal browser) non cambia nulla.
   * Se il posto trattenuto è scaduto e nel frattempo il viaggio si è riempito, il pagamento
   * incassato diventa da rimborsare e l'utente riceve "Posti esauriti".
   */
  async completeRegistrationPayment(
    registrationId: string,
    payment: { method: 'stripe' | 'simulated'; stripePaymentId?: string },
    now: Date = new Date(),
  ): Promise<{ confirmed: true; slug: string }> {
    const registration = await prisma.guidedTripRegistration.findUnique({ where: { id: registrationId }, select: { guidedTripId: true } })
    if (!registration) throw new GuidedTripServiceError('Iscrizione non trovata', 404)

    const outcome = await prisma.$transaction(async tx => {
      const trip = await loadTripForUpdate(tx, registration.guidedTripId)
      const current = await tx.guidedTripRegistration.findUniqueOrThrow({ where: { id: registrationId } })
      if (current.status === GuidedTripRegistrationStatus.CONFIRMED) return { confirmed: true as const }
      if (current.status === GuidedTripRegistrationStatus.REFUND_DUE || current.status === GuidedTripRegistrationStatus.REFUNDED) {
        throw new GuidedTripServiceError('Questa iscrizione non è più attiva', 409)
      }

      const holdStillValid = current.status === GuidedTripRegistrationStatus.PENDING_PAYMENT && isSeatOccupied(current, now)
      const others = trip.registrations.filter(r => r.id !== registrationId)
      const seatsForOthers = computeSeatAvailability(trip.maxParticipants, others, now)
      const seatAvailable = holdStillValid || seatsForOthers.availableSeats > 0
      const tripOpen = trip.status === GuidedTripStatus.Pubblicato && now.getTime() < trip.departureDate.getTime()

      if (seatAvailable && tripOpen) {
        await tx.guidedTripRegistration.update({
          where: { id: registrationId },
          data: {
            status: GuidedTripRegistrationStatus.CONFIRMED,
            confirmedAt: now,
            seatHoldExpiresAt: null,
            paymentMethod: payment.method,
            stripePaymentId: payment.stripePaymentId ?? null,
          },
        })
        return { confirmed: true as const }
      }

      // Pagamento riuscito ma posto non più disponibile: l'importo incassato va rimborsato.
      await tx.guidedTripRegistration.update({
        where: { id: registrationId },
        data: {
          status: GuidedTripRegistrationStatus.REFUND_DUE,
          seatHoldExpiresAt: null,
          paymentMethod: payment.method,
          stripePaymentId: payment.stripePaymentId ?? null,
          cancelledAt: now,
          refundNote: tripOpen ? 'Pagamento arrivato dopo l\'esaurimento dei posti' : 'Pagamento arrivato con iscrizioni chiuse',
        },
      })
      return { confirmed: false as const, message: tripOpen ? REGISTRATION_CLOSED_MESSAGES.sold_out : 'Le iscrizioni a questo viaggio sono chiuse' }
    })

    if (!outcome.confirmed) {
      throw new GuidedTripServiceError(`${outcome.message}: il pagamento ti verrà rimborsato dallo staff RideAtlas`, 409)
    }
    const trip = await prisma.guidedTrip.findUniqueOrThrow({ where: { id: registration.guidedTripId }, select: { slug: true } })
    return { confirmed: true, slug: trip.slug }
  },

  /** Memorizza il Payment Intent creato, così un nuovo tentativo lo riusa invece di crearne un altro. */
  async attachStripePaymentIntent(registrationId: string, paymentIntentId: string): Promise<void> {
    await prisma.guidedTripRegistration.updateMany({
      where: { id: registrationId, status: GuidedTripRegistrationStatus.PENDING_PAYMENT },
      data: { stripePaymentId: paymentIntentId, paymentMethod: 'stripe' },
    })
  },

  /** Pagamento fallito o annullato: libera il posto trattenuto. */
  async failRegistrationPayment(registrationId: string, reason: string): Promise<void> {
    await prisma.guidedTripRegistration.updateMany({
      where: { id: registrationId, status: GuidedTripRegistrationStatus.PENDING_PAYMENT },
      data: { status: GuidedTripRegistrationStatus.PAYMENT_FAILED, seatHoldExpiresAt: null, refundNote: reason },
    })
  },

  // ---------------------------------------------------------------- disdetta e rimborsi

  /** Disdetta autonoma entro N giorni dalla partenza: posto liberato, rimborso dovuto. */
  async cancelByParticipant(registrationId: string, userId: string, now: Date = new Date()): Promise<void> {
    const registration = await prisma.guidedTripRegistration.findUnique({ where: { id: registrationId }, select: { guidedTripId: true, participantId: true } })
    if (!registration) throw new GuidedTripServiceError('Iscrizione non trovata', 404)
    if (registration.participantId !== userId) throw new GuidedTripServiceError('Questa iscrizione appartiene a un altro utente', 403)

    await prisma.$transaction(async tx => {
      const trip = await loadTripForUpdate(tx, registration.guidedTripId)
      const current = await tx.guidedTripRegistration.findUniqueOrThrow({ where: { id: registrationId } })
      if (current.status !== GuidedTripRegistrationStatus.CONFIRMED) {
        throw new GuidedTripServiceError('Puoi disdire solo un\'iscrizione confermata', 409)
      }
      if (trip.status !== GuidedTripStatus.Pubblicato) {
        throw new GuidedTripServiceError('Il viaggio non accetta più disdette', 409)
      }
      if (!canParticipantSelfCancel(trip.departureDate, trip.cancellationNoticeDays, now)) {
        throw new GuidedTripServiceError(`La disdetta era possibile fino a ${trip.cancellationNoticeDays} giorni prima della partenza`, 409)
      }
      await tx.guidedTripRegistration.update({
        where: { id: registrationId },
        data: {
          status: GuidedTripRegistrationStatus.REFUND_DUE,
          cancellationOrigin: GuidedTripCancellationOrigin.PARTICIPANT,
          cancelledAt: now,
        },
      })
    })
  },

  async listForParticipant(userId: string, now: Date = new Date()) {
    const registrations = await prisma.guidedTripRegistration.findMany({
      where: {
        participantId: userId,
        status: { in: [GuidedTripRegistrationStatus.CONFIRMED, GuidedTripRegistrationStatus.REFUND_DUE, GuidedTripRegistrationStatus.REFUNDED] },
      },
      include: { guidedTrip: { include: { organizer: { select: organizerSelect } } } },
      orderBy: { createdAt: 'desc' },
    })
    return registrations.map(r => ({
      registrationId: r.id,
      status: r.status,
      cancellationOrigin: r.cancellationOrigin,
      amount: toNumber(r.amount),
      registeredAt: r.createdAt.toISOString(),
      canSelfCancel:
        r.status === GuidedTripRegistrationStatus.CONFIRMED &&
        r.guidedTrip.status === GuidedTripStatus.Pubblicato &&
        canParticipantSelfCancel(r.guidedTrip.departureDate, r.guidedTrip.cancellationNoticeDays, now),
      trip: {
        id: r.guidedTrip.id,
        slug: r.guidedTrip.slug,
        title: r.guidedTrip.title,
        departureDate: r.guidedTrip.departureDate.toISOString(),
        returnDate: r.guidedTrip.returnDate.toISOString(),
        meetingPoint: r.guidedTrip.meetingPoint,
        status: r.guidedTrip.status,
        displayStatus: guidedTripDisplayStatus(r.guidedTrip.status, r.guidedTrip.returnDate, now),
        cancellationNoticeDays: r.guidedTrip.cancellationNoticeDays,
        selfCancellationLastDay: selfCancellationLastDay(r.guidedTrip.departureDate, r.guidedTrip.cancellationNoticeDays).toISOString(),
        organizerName: r.guidedTrip.organizer.name,
      },
    }))
  },

  /** Iscrizioni per il pannello del Sentinel (predefinito: da rimborsare). */
  async listRegistrationsForAdmin(status: GuidedTripRegistrationStatus = GuidedTripRegistrationStatus.REFUND_DUE) {
    const registrations = await prisma.guidedTripRegistration.findMany({
      where: { status },
      include: {
        participant: { select: { id: true, name: true, email: true } },
        guidedTrip: { select: { id: true, slug: true, title: true, departureDate: true, organizer: { select: { name: true } } } },
        refundedBy: { select: { name: true, email: true } },
      },
      orderBy: [{ cancelledAt: 'asc' }, { createdAt: 'asc' }],
    })
    return registrations.map(r => ({
      registrationId: r.id,
      status: r.status,
      amount: toNumber(r.amount),
      paymentMethod: r.paymentMethod,
      cancellationOrigin: r.cancellationOrigin,
      cancelledAt: r.cancelledAt?.toISOString() ?? null,
      refundedAt: r.refundedAt?.toISOString() ?? null,
      refundNote: r.refundNote,
      refundedBy: r.refundedBy ? r.refundedBy.name ?? r.refundedBy.email : null,
      participant: r.participant,
      trip: {
        id: r.guidedTrip.id,
        slug: r.guidedTrip.slug,
        title: r.guidedTrip.title,
        departureDate: r.guidedTrip.departureDate.toISOString(),
        organizerName: r.guidedTrip.organizer.name,
      },
    }))
  },

  /** Il Sentinel registra di aver eseguito il rimborso. */
  async markRefunded(registrationId: string, admin: ActingUser, note: string | undefined, now: Date = new Date()): Promise<void> {
    if (admin.role !== UserRole.Sentinel) throw new GuidedTripServiceError('Solo un Sentinel può registrare i rimborsi', 403)
    const updated = await prisma.guidedTripRegistration.updateMany({
      where: { id: registrationId, status: GuidedTripRegistrationStatus.REFUND_DUE },
      data: {
        status: GuidedTripRegistrationStatus.REFUNDED,
        refundedAt: now,
        refundedById: admin.id,
        ...(note ? { refundNote: note } : {}),
      },
    })
    if (updated.count === 0) {
      const exists = await prisma.guidedTripRegistration.findUnique({ where: { id: registrationId }, select: { id: true } })
      if (!exists) throw new GuidedTripServiceError('Iscrizione non trovata', 404)
      throw new GuidedTripServiceError('Solo le iscrizioni da rimborsare possono essere segnate come rimborsate', 409)
    }
  },
}
