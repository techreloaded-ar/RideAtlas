// Servizio applicativo dei viaggi guidati a numero chiuso: organizzazione da parte del
// Ranger, prenotazione con pagamento, disdetta dell'Explorer e annullamento con rimborso.

import { GuidedTripBookingStatus, GuidedTripStatus, Prisma, UserRole } from '@prisma/client';
import { prisma } from '@/lib/core/prisma';
import { sendGuidedTripCancellationEmail } from '@/lib/core/email';
import {
  GuidedTripDetailsInput,
  changeProblemsWithBookings,
  countOccupiedSeats,
  countRemainingSeats,
  isBookable,
  isParticipantCancellationAllowed,
  participantCancellationDeadline,
  publicationProblems,
  sanitizeCancellationReason,
  seatHoldExpiry,
} from './guidedTripRules';
import { GuidedTripPaymentGateway, guidedTripPaymentMode } from './guidedTripPaymentGateway';
import type {
  GuidedTripBookingSummary,
  GuidedTripDetail,
  GuidedTripListItem,
  GuidedTripOrganizerView,
  LinkableTripOption,
} from '@/types/guided-trip';

export class GuidedTripError extends Error {
  constructor(message: string, public readonly httpStatus: number, public readonly problems: string[] = []) {
    super(message);
    this.name = 'GuidedTripError';
  }
}

export interface GuidedTripActor {
  id: string;
  role: UserRole;
}

export interface GuidedTripDetailsPayload extends GuidedTripDetailsInput {
  linkedTripId: string | null;
}

type TransactionClient = Prisma.TransactionClient;

const seatBookingSelect = { status: true, seatHeldUntil: true } as const;

function canOrganize(role: UserRole): boolean {
  return role === UserRole.Ranger || role === UserRole.Sentinel;
}

function canManage(actor: GuidedTripActor, organizerId: string): boolean {
  return actor.id === organizerId || actor.role === UserRole.Sentinel;
}

/** Serializza le operazioni sui posti dello stesso viaggio guidato (nessun overbooking). */
async function lockGuidedTrip(tx: TransactionClient, guidedTripId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM guided_trips WHERE id = ${guidedTripId} FOR UPDATE`;
}

async function assertLinkableTrip(linkedTripId: string | null): Promise<void> {
  if (!linkedTripId) return;
  const trip = await prisma.trip.findUnique({ where: { id: linkedTripId }, select: { status: true } });
  if (!trip || trip.status !== 'Pubblicato') {
    throw new GuidedTripError('Il viaggio collegato deve essere un viaggio pubblicato', 400);
  }
}

function toNumber(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : Number(value);
}

export const GuidedTripService = {
  // ---------------------------------------------------------------- consultazione

  async listUpcomingPublished(now: Date = new Date()): Promise<GuidedTripListItem[]> {
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const trips = await prisma.guidedTrip.findMany({
      where: { status: GuidedTripStatus.Pubblicato, startDate: { gt: todayStart } },
      orderBy: [{ startDate: 'asc' }, { title: 'asc' }],
      include: {
        organizer: { select: { name: true } },
        bookings: { where: { status: { in: [GuidedTripBookingStatus.CONFIRMED, GuidedTripBookingStatus.PENDING_PAYMENT] } }, select: seatBookingSelect },
      },
    });
    return trips.map(trip => ({
      id: trip.id,
      title: trip.title,
      startDate: trip.startDate.toISOString(),
      endDate: trip.endDate.toISOString(),
      meetingPoint: trip.meetingPoint,
      pricePerPerson: toNumber(trip.pricePerPerson),
      maxParticipants: trip.maxParticipants,
      remainingSeats: countRemainingSeats(trip.maxParticipants, trip.bookings, now),
      organizerName: trip.organizer.name ?? 'Ranger',
    }));
  },

  async getDetail(guidedTripId: string, viewer: GuidedTripActor | null, now: Date = new Date()): Promise<GuidedTripDetail | null> {
    const trip = await prisma.guidedTrip.findUnique({
      where: { id: guidedTripId },
      include: {
        organizer: { select: { id: true, name: true } },
        linkedTrip: { select: { title: true, slug: true, status: true } },
        bookings: { where: { status: { in: [GuidedTripBookingStatus.CONFIRMED, GuidedTripBookingStatus.PENDING_PAYMENT] } }, select: { ...seatBookingSelect, participantId: true, id: true } },
      },
    });
    if (!trip) return null;
    const viewerCanManage = viewer ? canManage(viewer, trip.organizerId) : false;
    const viewerHasBooking = viewer ? trip.bookings.some(b => b.participantId === viewer.id && b.status === GuidedTripBookingStatus.CONFIRMED) : false;
    if (trip.status === GuidedTripStatus.Bozza && !viewerCanManage) return null;
    if (trip.status === GuidedTripStatus.Annullato && !viewerCanManage) {
      const hadBooking = viewer ? await prisma.guidedTripBooking.count({ where: { guidedTripId, participantId: viewer.id } }) : 0;
      if (!hadBooking) return null;
    }
    return {
      id: trip.id,
      title: trip.title,
      description: trip.description,
      startDate: trip.startDate.toISOString(),
      endDate: trip.endDate.toISOString(),
      meetingPoint: trip.meetingPoint,
      pricePerPerson: toNumber(trip.pricePerPerson),
      maxParticipants: trip.maxParticipants,
      remainingSeats: countRemainingSeats(trip.maxParticipants, trip.bookings, now),
      status: trip.status,
      cancellationReason: trip.cancellationReason,
      organizerId: trip.organizer.id,
      organizerName: trip.organizer.name ?? 'Ranger',
      linkedTrip: trip.linkedTrip && trip.linkedTrip.status === 'Pubblicato' ? { title: trip.linkedTrip.title, slug: trip.linkedTrip.slug } : null,
      linkedTripId: trip.linkedTripId,
      participantCancellationDeadline: participantCancellationDeadline(trip.startDate).toISOString(),
      bookable: isBookable(trip, now),
      viewerIsOrganizer: viewer?.id === trip.organizerId,
      viewerCanManage,
      viewerHasConfirmedBooking: viewerHasBooking,
    };
  },

  async listLinkableTrips(): Promise<LinkableTripOption[]> {
    const trips = await prisma.trip.findMany({
      where: { status: 'Pubblicato' },
      orderBy: { title: 'asc' },
      select: { id: true, title: true, user: { select: { name: true } } },
      take: 500,
    });
    return trips.map(trip => ({ id: trip.id, title: trip.title, authorName: trip.user.name ?? '' }));
  },

  // ---------------------------------------------------------------- organizzazione (Ranger)

  async create(actor: GuidedTripActor, details: GuidedTripDetailsPayload, publish: boolean, now: Date = new Date()) {
    if (!canOrganize(actor.role)) throw new GuidedTripError('Solo i Ranger possono organizzare viaggi guidati', 403);
    await assertLinkableTrip(details.linkedTripId);
    if (publish) {
      const problems = publicationProblems(details, now);
      if (problems.length) throw new GuidedTripError('Il viaggio guidato non può essere pubblicato', 400, problems);
    }
    return prisma.guidedTrip.create({
      data: {
        title: details.title.trim(),
        description: details.description.trim(),
        startDate: details.startDate,
        endDate: details.endDate,
        meetingPoint: details.meetingPoint.trim(),
        pricePerPerson: new Prisma.Decimal(details.pricePerPerson.toFixed(2)),
        maxParticipants: details.maxParticipants,
        linkedTripId: details.linkedTripId,
        organizerId: actor.id,
        status: publish ? GuidedTripStatus.Pubblicato : GuidedTripStatus.Bozza,
        publishedAt: publish ? now : null,
      },
      select: { id: true, status: true },
    });
  },

  async update(guidedTripId: string, actor: GuidedTripActor, details: GuidedTripDetailsPayload, publish: boolean, now: Date = new Date()) {
    await assertLinkableTrip(details.linkedTripId);
    return prisma.$transaction(async tx => {
      await lockGuidedTrip(tx, guidedTripId);
      const trip = await tx.guidedTrip.findUnique({
        where: { id: guidedTripId },
        include: { bookings: { where: { status: { in: [GuidedTripBookingStatus.CONFIRMED, GuidedTripBookingStatus.PENDING_PAYMENT] } }, select: seatBookingSelect } },
      });
      if (!trip) throw new GuidedTripError('Viaggio guidato non trovato', 404);
      if (!canManage(actor, trip.organizerId)) throw new GuidedTripError('Non puoi modificare questo viaggio guidato', 403);
      if (trip.status === GuidedTripStatus.Annullato) throw new GuidedTripError('Un viaggio guidato annullato non è modificabile', 409);

      const occupiedSeats = countOccupiedSeats(trip.bookings, now);
      const problems = changeProblemsWithBookings(
        { pricePerPerson: toNumber(trip.pricePerPerson), startDate: trip.startDate, endDate: trip.endDate },
        { pricePerPerson: details.pricePerPerson, startDate: details.startDate, endDate: details.endDate, maxParticipants: details.maxParticipants },
        occupiedSeats,
      );
      const willBePublished = publish || trip.status === GuidedTripStatus.Pubblicato;
      if (willBePublished) {
        const datesUnchanged = details.startDate.getTime() === trip.startDate.getTime();
        // Un viaggio già pubblicato e già partito resta modificabile nei testi, senza ricontrollare la data.
        const publicationCheck = publicationProblems(details, now).filter(p => !(datesUnchanged && trip.status === GuidedTripStatus.Pubblicato && p.startsWith('La data di partenza')));
        problems.push(...publicationCheck);
      }
      if (problems.length) throw new GuidedTripError('Modifica non consentita', 400, problems);

      return tx.guidedTrip.update({
        where: { id: guidedTripId },
        data: {
          title: details.title.trim(),
          description: details.description.trim(),
          startDate: details.startDate,
          endDate: details.endDate,
          meetingPoint: details.meetingPoint.trim(),
          pricePerPerson: new Prisma.Decimal(details.pricePerPerson.toFixed(2)),
          maxParticipants: details.maxParticipants,
          linkedTripId: details.linkedTripId,
          ...(trip.status === GuidedTripStatus.Bozza && publish ? { status: GuidedTripStatus.Pubblicato, publishedAt: now } : {}),
        },
        select: { id: true, status: true },
      });
    });
  },

  async getForEditing(guidedTripId: string, actor: GuidedTripActor, now: Date = new Date()) {
    const trip = await prisma.guidedTrip.findUnique({
      where: { id: guidedTripId },
      include: { bookings: { where: { status: { in: [GuidedTripBookingStatus.CONFIRMED, GuidedTripBookingStatus.PENDING_PAYMENT] } }, select: seatBookingSelect } },
    });
    if (!trip || !canManage(actor, trip.organizerId)) return null;
    return {
      id: trip.id,
      title: trip.title,
      description: trip.description,
      startDate: trip.startDate.toISOString().slice(0, 10),
      endDate: trip.endDate.toISOString().slice(0, 10),
      meetingPoint: trip.meetingPoint,
      pricePerPerson: toNumber(trip.pricePerPerson),
      maxParticipants: trip.maxParticipants,
      linkedTripId: trip.linkedTripId,
      status: trip.status,
      occupiedSeats: countOccupiedSeats(trip.bookings, now),
    };
  },

  async listOrganizedBy(organizerId: string, now: Date = new Date()): Promise<GuidedTripOrganizerView[]> {
    const trips = await prisma.guidedTrip.findMany({
      where: { organizerId },
      orderBy: [{ startDate: 'asc' }],
      include: {
        bookings: {
          orderBy: { confirmedAt: 'asc' },
          include: { participant: { select: { name: true, email: true } } },
        },
      },
    });
    return trips.map(trip => {
      const confirmed = trip.bookings.filter(b => b.status === GuidedTripBookingStatus.CONFIRMED);
      return {
        id: trip.id,
        title: trip.title,
        startDate: trip.startDate.toISOString(),
        endDate: trip.endDate.toISOString(),
        status: trip.status,
        pricePerPerson: toNumber(trip.pricePerPerson),
        maxParticipants: trip.maxParticipants,
        occupiedSeats: countOccupiedSeats(trip.bookings, now),
        confirmedRevenue: confirmed.reduce((sum, b) => sum + toNumber(b.amount), 0),
        cancellationReason: trip.cancellationReason,
        canBeCancelled: trip.status === GuidedTripStatus.Pubblicato,
        participants: confirmed.map(b => ({
          bookingId: b.id,
          name: b.participant.name ?? '',
          email: b.participant.email,
          confirmedAt: (b.confirmedAt ?? b.createdAt).toISOString(),
        })),
      };
    });
  },

  /** Annullamento da parte del ranger: tutte le prenotazioni confermate vengono rimborsate per intero. */
  async cancelByOrganizer(guidedTripId: string, actor: GuidedTripActor, rawReason: unknown, now: Date = new Date()) {
    const reason = sanitizeCancellationReason(rawReason);
    if (!reason) throw new GuidedTripError('Indica il motivo dell\'annullamento (almeno 3 caratteri)', 400);

    const { trip, bookingsToRefund } = await prisma.$transaction(async tx => {
      await lockGuidedTrip(tx, guidedTripId);
      const trip = await tx.guidedTrip.findUnique({ where: { id: guidedTripId } });
      if (!trip) throw new GuidedTripError('Viaggio guidato non trovato', 404);
      if (!canManage(actor, trip.organizerId)) throw new GuidedTripError('Non puoi annullare questo viaggio guidato', 403);
      if (trip.status !== GuidedTripStatus.Pubblicato) throw new GuidedTripError('Si può annullare solo un viaggio guidato pubblicato', 409);

      const bookingsToRefund = await tx.guidedTripBooking.findMany({
        where: { guidedTripId, status: GuidedTripBookingStatus.CONFIRMED },
        include: { participant: { select: { email: true, name: true } } },
      });
      await tx.guidedTrip.update({ where: { id: guidedTripId }, data: { status: GuidedTripStatus.Annullato, cancelledAt: now, cancellationReason: reason } });
      await tx.guidedTripBooking.updateMany({ where: { guidedTripId, status: GuidedTripBookingStatus.CONFIRMED }, data: { status: GuidedTripBookingStatus.CANCELLED_BY_ORGANIZER, cancelledAt: now } });
      await tx.guidedTripBooking.updateMany({ where: { guidedTripId, status: GuidedTripBookingStatus.PENDING_PAYMENT }, data: { status: GuidedTripBookingStatus.EXPIRED } });
      return { trip, bookingsToRefund };
    });

    let refunded = 0;
    const failedRefunds: string[] = [];
    for (const booking of bookingsToRefund) {
      const refund = await GuidedTripPaymentGateway.refundInFull({ ...booking, amount: toNumber(booking.amount) });
      await prisma.guidedTripBooking.update({
        where: { id: booking.id },
        data: refund.success
          ? { refundedAt: new Date(), refundReference: refund.reference, refundError: null }
          : { refundError: refund.error ?? 'Rimborso non riuscito' },
      });
      if (refund.success) refunded++;
      else failedRefunds.push(booking.id);
      await sendGuidedTripCancellationEmail({
        to: booking.participant.email,
        participantName: booking.participant.name ?? '',
        guidedTripTitle: trip.title,
        reason,
        refundedAmount: toNumber(booking.amount),
        refundCompleted: refund.success,
      }).catch(error => console.error('Email di annullamento viaggio guidato non inviata:', error));
    }
    return { refunded, failedRefunds };
  },

  // ---------------------------------------------------------------- prenotazione (Explorer)

  /** Riserva un posto per il tempo del pagamento. Restituisce la prenotazione da pagare. */
  async holdSeat(guidedTripId: string, actor: GuidedTripActor, now: Date = new Date()) {
    if (guidedTripPaymentMode() === 'unavailable') throw new GuidedTripError('I pagamenti non sono al momento disponibili', 503);
    return prisma.$transaction(async tx => {
      await lockGuidedTrip(tx, guidedTripId);
      const trip = await tx.guidedTrip.findUnique({
        where: { id: guidedTripId },
        include: { bookings: { where: { status: { in: [GuidedTripBookingStatus.CONFIRMED, GuidedTripBookingStatus.PENDING_PAYMENT] } } } },
      });
      if (!trip) throw new GuidedTripError('Viaggio guidato non trovato', 404);
      if (!isBookable(trip, now)) throw new GuidedTripError('Le prenotazioni per questo viaggio sono chiuse', 409);
      if (trip.organizerId === actor.id) throw new GuidedTripError('Non puoi prenotare un viaggio che organizzi tu', 400);

      const ownBookings = trip.bookings.filter(b => b.participantId === actor.id);
      if (ownBookings.some(b => b.status === GuidedTripBookingStatus.CONFIRMED)) {
        throw new GuidedTripError('Hai già un posto prenotato su questo viaggio', 409);
      }
      const activeHold = ownBookings.find(b => b.status === GuidedTripBookingStatus.PENDING_PAYMENT && b.seatHeldUntil > now);
      if (activeHold) {
        return { id: activeHold.id, amount: toNumber(activeHold.amount), seatHeldUntil: activeHold.seatHeldUntil.toISOString() };
      }
      const staleHolds = ownBookings.filter(b => b.status === GuidedTripBookingStatus.PENDING_PAYMENT).map(b => b.id);
      if (staleHolds.length) {
        await tx.guidedTripBooking.updateMany({ where: { id: { in: staleHolds } }, data: { status: GuidedTripBookingStatus.EXPIRED } });
      }

      if (countRemainingSeats(trip.maxParticipants, trip.bookings, now) <= 0) {
        throw new GuidedTripError('Posti esauriti', 409);
      }
      const booking = await tx.guidedTripBooking.create({
        data: {
          guidedTripId,
          participantId: actor.id,
          amount: trip.pricePerPerson,
          seatHeldUntil: seatHoldExpiry(now),
        },
      });
      return { id: booking.id, amount: toNumber(booking.amount), seatHeldUntil: booking.seatHeldUntil.toISOString() };
    });
  },

  /**
   * Conferma una prenotazione pagata. Se nel frattempo il posto non è più disponibile
   * (riserva scaduta e posti esauriti, viaggio annullato) il pagamento viene rimborsato.
   */
  async confirmPaidBooking(
    bookingId: string,
    payment: { method: 'stripe' | 'simulated'; reference: string; stripePaymentIntentId?: string },
    now: Date = new Date(),
  ): Promise<{ confirmed: boolean; refunded?: boolean; reason?: string }> {
    const booking = await prisma.guidedTripBooking.findUnique({ where: { id: bookingId }, select: { guidedTripId: true } });
    if (!booking) throw new GuidedTripError('Prenotazione non trovata', 404);

    const outcome = await prisma.$transaction(async tx => {
      await lockGuidedTrip(tx, booking.guidedTripId);
      const current = await tx.guidedTripBooking.findUnique({ where: { id: bookingId }, include: { guidedTrip: true } });
      if (!current) throw new GuidedTripError('Prenotazione non trovata', 404);
      if (current.status === GuidedTripBookingStatus.CONFIRMED) return { confirmed: true } as const;
      if (current.paymentReference) return { confirmed: false, reason: 'Pagamento già registrato per una prenotazione non più valida' } as const;

      const paymentData = { paymentMethod: payment.method, paymentReference: payment.reference, stripePaymentIntentId: payment.stripePaymentIntentId ?? current.stripePaymentIntentId };
      const trip = current.guidedTrip;
      const others = await tx.guidedTripBooking.findMany({
        where: { guidedTripId: trip.id, id: { not: bookingId }, status: { in: [GuidedTripBookingStatus.CONFIRMED, GuidedTripBookingStatus.PENDING_PAYMENT] } },
        select: seatBookingSelect,
      });
      const stillAvailable = trip.status === GuidedTripStatus.Pubblicato
        && (current.status === GuidedTripBookingStatus.PENDING_PAYMENT || current.status === GuidedTripBookingStatus.EXPIRED)
        && countOccupiedSeats(others, now) < trip.maxParticipants;

      if (!stillAvailable) {
        await tx.guidedTripBooking.update({
          where: { id: bookingId },
          data: { ...paymentData, status: current.status === GuidedTripBookingStatus.PENDING_PAYMENT ? GuidedTripBookingStatus.EXPIRED : current.status },
        });
        return { confirmed: false, reason: trip.status === GuidedTripStatus.Annullato ? 'Il viaggio è stato annullato' : 'Il posto non è più disponibile' } as const;
      }
      await tx.guidedTripBooking.update({
        where: { id: bookingId },
        data: { ...paymentData, status: GuidedTripBookingStatus.CONFIRMED, confirmedAt: now },
      });
      return { confirmed: true } as const;
    });

    if (outcome.confirmed) return { confirmed: true };

    // Pagamento arrivato quando il posto non era più disponibile: rimborso automatico.
    const paid = await prisma.guidedTripBooking.findUnique({ where: { id: bookingId } });
    if (paid && paid.paymentReference && !paid.refundedAt) {
      const refund = await GuidedTripPaymentGateway.refundInFull({ ...paid, amount: toNumber(paid.amount) });
      await prisma.guidedTripBooking.update({
        where: { id: bookingId },
        data: refund.success ? { refundedAt: new Date(), refundReference: refund.reference } : { refundError: refund.error ?? 'Rimborso non riuscito' },
      });
      return { confirmed: false, refunded: refund.success, reason: outcome.reason };
    }
    return { confirmed: false, refunded: Boolean(paid?.refundedAt), reason: outcome.reason };
  },

  async payWithSimulation(bookingId: string, actor: GuidedTripActor) {
    if (guidedTripPaymentMode() !== 'simulated') throw new GuidedTripError('Il pagamento simulato non è disponibile', 403);
    const booking = await prisma.guidedTripBooking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.participantId !== actor.id) throw new GuidedTripError('Prenotazione non trovata', 404);
    return this.confirmPaidBooking(bookingId, { method: 'simulated', reference: `simulated_payment_${bookingId}` });
  },

  async createStripePayment(bookingId: string, actor: GuidedTripActor, now: Date = new Date()) {
    if (guidedTripPaymentMode() !== 'stripe') throw new GuidedTripError('Pagamento con carta non configurato', 503);
    const booking = await prisma.guidedTripBooking.findUnique({ where: { id: bookingId }, include: { guidedTrip: { select: { title: true } } } });
    if (!booking || booking.participantId !== actor.id) throw new GuidedTripError('Prenotazione non trovata', 404);
    if (booking.status !== GuidedTripBookingStatus.PENDING_PAYMENT || booking.seatHeldUntil <= now) {
      throw new GuidedTripError('La riserva del posto è scaduta: ricomincia la prenotazione', 409);
    }
    const paymentIntent = await GuidedTripPaymentGateway.createStripePaymentIntent({
      bookingId,
      guidedTripId: booking.guidedTripId,
      participantId: actor.id,
      amount: toNumber(booking.amount),
      title: booking.guidedTrip.title,
    });
    await prisma.guidedTripBooking.update({ where: { id: bookingId }, data: { stripePaymentIntentId: paymentIntent.id } });
    return { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id };
  },

  /** Verifica lato server l'esito Stripe (stato, prenotazione e importo) prima di confermare. */
  async confirmStripePayment(bookingId: string, paymentIntentId: string, actor: GuidedTripActor | null) {
    const booking = await prisma.guidedTripBooking.findUnique({ where: { id: bookingId } });
    if (!booking || (actor && booking.participantId !== actor.id)) throw new GuidedTripError('Prenotazione non trovata', 404);
    const paymentIntent = await GuidedTripPaymentGateway.retrieveStripePaymentIntent(paymentIntentId);
    if (paymentIntent.metadata?.guidedTripBookingId !== bookingId) throw new GuidedTripError('Il pagamento non corrisponde alla prenotazione', 400);
    if (paymentIntent.status !== 'succeeded') throw new GuidedTripError('Pagamento non completato', 402);
    if (paymentIntent.amount_received !== Math.round(toNumber(booking.amount) * 100)) throw new GuidedTripError('Importo pagato non corrispondente', 400);
    return this.confirmPaidBooking(bookingId, { method: 'stripe', reference: paymentIntent.id, stripePaymentIntentId: paymentIntent.id });
  },

  async listBookingsOf(participantId: string, now: Date = new Date()): Promise<GuidedTripBookingSummary[]> {
    const bookings = await prisma.guidedTripBooking.findMany({
      where: { participantId, status: { in: [GuidedTripBookingStatus.CONFIRMED, GuidedTripBookingStatus.CANCELLED_BY_PARTICIPANT, GuidedTripBookingStatus.CANCELLED_BY_ORGANIZER] } },
      include: { guidedTrip: { include: { organizer: { select: { name: true } } } } },
    });
    return bookings
      .map(booking => ({
        id: booking.id,
        status: booking.status,
        amount: toNumber(booking.amount),
        confirmedAt: booking.confirmedAt?.toISOString() ?? null,
        cancelledAt: booking.cancelledAt?.toISOString() ?? null,
        refundedAt: booking.refundedAt?.toISOString() ?? null,
        refundPending: Boolean(booking.refundError) && !booking.refundedAt,
        guidedTripId: booking.guidedTripId,
        title: booking.guidedTrip.title,
        startDate: booking.guidedTrip.startDate.toISOString(),
        endDate: booking.guidedTrip.endDate.toISOString(),
        meetingPoint: booking.guidedTrip.meetingPoint,
        organizerName: booking.guidedTrip.organizer.name ?? 'Ranger',
        cancellationReason: booking.guidedTrip.cancellationReason,
        cancellationDeadline: participantCancellationDeadline(booking.guidedTrip.startDate).toISOString(),
        canCancel: booking.status === GuidedTripBookingStatus.CONFIRMED && isParticipantCancellationAllowed(booking.guidedTrip.startDate, now),
      }))
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  },

  /** Disdetta dell'Explorer entro la scadenza: rimborso totale e posto di nuovo disponibile. */
  async cancelByParticipant(bookingId: string, actor: GuidedTripActor, now: Date = new Date()) {
    const booking = await prisma.guidedTripBooking.findUnique({ where: { id: bookingId }, include: { guidedTrip: { select: { startDate: true } } } });
    if (!booking || booking.participantId !== actor.id) throw new GuidedTripError('Prenotazione non trovata', 404);
    if (booking.status !== GuidedTripBookingStatus.CONFIRMED) throw new GuidedTripError('Questa prenotazione non è disdicibile', 409);
    if (!isParticipantCancellationAllowed(booking.guidedTrip.startDate, now)) {
      throw new GuidedTripError('Il termine per la disdetta con rimborso è scaduto', 409);
    }

    // Prima il rimborso: se non riesce la prenotazione resta confermata e il posto resta tuo.
    const refund = await GuidedTripPaymentGateway.refundInFull({ ...booking, amount: toNumber(booking.amount) });
    if (!refund.success) throw new GuidedTripError('Il rimborso non è riuscito: la prenotazione resta confermata. Riprova più tardi.', 502);

    const updated = await prisma.guidedTripBooking.updateMany({
      where: { id: bookingId, status: GuidedTripBookingStatus.CONFIRMED },
      data: { status: GuidedTripBookingStatus.CANCELLED_BY_PARTICIPANT, cancelledAt: now, refundedAt: now, refundReference: refund.reference, refundError: null },
    });
    if (updated.count === 0) throw new GuidedTripError('La prenotazione è già stata modificata', 409);
    return { refundedAmount: toNumber(booking.amount) };
  },
};
