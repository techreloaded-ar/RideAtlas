import { GuidedTripStatus, Prisma, UserRole } from '@prisma/client';
import { prisma } from '@/lib/core/prisma';
import { castToMediaItems } from '@/types/trip';
import {
  GuidedTripInput,
  holdExpiry,
  isFutureDeparture,
  isOpenForBooking,
  occupiesSeat,
  parseDateOnly,
  summarizeSeats,
  SeatSummary,
} from './rules';

export class GuidedTripError extends Error {
  constructor(message: string, public readonly status: number = 400) {
    super(message);
    this.name = 'GuidedTripError';
  }
}

export interface Actor {
  id: string;
  role: UserRole;
}

export const canOrganize = (role: UserRole | string | null | undefined) =>
  role === UserRole.Ranger || role === UserRole.Sentinel;

/** Prenotazioni che occupano un posto: confermate o trattenute da un pagamento in corso. */
export function activeSeatWhere(now: Date = new Date()): Prisma.GuidedTripBookingWhereInput {
  return { OR: [{ status: 'CONFIRMED' }, { status: 'PENDING', holdExpiresAt: { gt: now } }] };
}

const linkedTripSelect = {
  select: {
    id: true,
    slug: true,
    title: true,
    media: true,
    stages: { select: { media: true }, orderBy: { orderIndex: 'asc' as const } },
  },
} satisfies Prisma.TripDefaultArgs;

function guidedTripInclude(now: Date) {
  return {
    organizer: { select: { id: true, name: true } },
    linkedTrip: linkedTripSelect,
    _count: { select: { bookings: { where: activeSeatWhere(now) } } },
  } satisfies Prisma.GuidedTripInclude;
}

type GuidedTripRow = Prisma.GuidedTripGetPayload<{ include: ReturnType<typeof guidedTripInclude> }>;

export interface GuidedTripView {
  id: string;
  title: string;
  description: string;
  included: string;
  startDate: string;
  endDate: string;
  meetingPoint: string;
  price: number;
  maxParticipants: number;
  status: GuidedTripStatus;
  organizer: { id: string; name: string };
  linkedTrip: { id: string; slug: string; title: string } | null;
  coverUrl: string | null;
  seats: SeatSummary;
  openForBooking: boolean;
}

function coverFrom(linked: GuidedTripRow['linkedTrip']): string | null {
  if (!linked) return null;
  const sources = [linked.media, ...linked.stages.map(s => s.media)];
  for (const media of sources) {
    const image = castToMediaItems(media || []).find(m => m.type === 'image' && m.url);
    if (image) return image.url;
  }
  return null;
}

export function toView(row: GuidedTripRow, now: Date = new Date()): GuidedTripView {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    included: row.included,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    meetingPoint: row.meetingPoint,
    price: Number(row.price),
    maxParticipants: row.maxParticipants,
    status: row.status,
    organizer: { id: row.organizer.id, name: row.organizer.name || 'Ranger' },
    linkedTrip: row.linkedTrip ? { id: row.linkedTrip.id, slug: row.linkedTrip.slug, title: row.linkedTrip.title } : null,
    coverUrl: coverFrom(row.linkedTrip),
    seats: summarizeSeats(row.maxParticipants, row._count.bookings),
    openForBooking: isOpenForBooking(row, now),
  };
}

async function validateLinkedTrip(organizerId: string, linkedTripId: string | null | undefined) {
  if (!linkedTripId) return null;
  const trip = await prisma.trip.findUnique({ where: { id: linkedTripId }, select: { id: true, user_id: true, status: true } });
  if (!trip || trip.user_id !== organizerId || trip.status !== 'Pubblicato') {
    throw new GuidedTripError('Puoi collegare solo uno dei tuoi itinerari pubblicati');
  }
  return trip.id;
}

function toData(input: GuidedTripInput) {
  return {
    title: input.title,
    description: input.description,
    included: input.included,
    startDate: parseDateOnly(input.startDate)!,
    endDate: parseDateOnly(input.endDate)!,
    meetingPoint: input.meetingPoint,
    price: new Prisma.Decimal(input.price.toFixed(2)),
    maxParticipants: input.maxParticipants,
  };
}

async function lockGuidedTrip(tx: Prisma.TransactionClient, id: string) {
  // Serializza le operazioni sui posti dello stesso viaggio guidato.
  await tx.$queryRaw`SELECT id FROM guided_trips WHERE id = ${id} FOR UPDATE`;
}

export const GuidedTripService = {
  async listUpcoming(now: Date = new Date()): Promise<GuidedTripView[]> {
    const rows = await prisma.guidedTrip.findMany({
      where: { status: 'Pubblicato', startDate: { gt: now } },
      include: guidedTripInclude(now),
      orderBy: { startDate: 'asc' },
    });
    return rows.map(r => toView(r, now));
  },

  async getView(id: string, now: Date = new Date()): Promise<GuidedTripView | null> {
    const row = await prisma.guidedTrip.findUnique({ where: { id }, include: guidedTripInclude(now) });
    return row ? toView(row, now) : null;
  },

  /** Un viaggio in bozza o ritirato è visibile solo all'organizzatore e ai Sentinel. */
  canView(view: Pick<GuidedTripView, 'status' | 'organizer'>, actor: Actor | null): boolean {
    if (view.status === 'Pubblicato') return true;
    return !!actor && (actor.role === UserRole.Sentinel || actor.id === view.organizer.id);
  },

  async listByOrganizer(organizerId: string, now: Date = new Date()): Promise<GuidedTripView[]> {
    const rows = await prisma.guidedTrip.findMany({
      where: { organizerId },
      include: guidedTripInclude(now),
      orderBy: { startDate: 'asc' },
    });
    return rows.map(r => toView(r, now));
  },

  async listAll(now: Date = new Date()): Promise<GuidedTripView[]> {
    const rows = await prisma.guidedTrip.findMany({ include: guidedTripInclude(now), orderBy: { startDate: 'asc' } });
    return rows.map(r => toView(r, now));
  },

  /** Itinerari pubblicati dell'organizzatore, collegabili a un viaggio guidato. */
  async linkableTrips(organizerId: string) {
    return prisma.trip.findMany({
      where: { user_id: organizerId, status: 'Pubblicato' },
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    });
  },

  async create(actor: Actor, input: GuidedTripInput, status: 'Bozza' | 'Pubblicato', now: Date = new Date()) {
    if (!canOrganize(actor.role)) throw new GuidedTripError('Solo i Ranger possono organizzare viaggi guidati', 403);
    const data = toData(input);
    if (!isFutureDeparture(data.startDate, now)) throw new GuidedTripError('La data di partenza deve essere futura');
    const linkedTripId = await validateLinkedTrip(actor.id, input.linkedTripId);
    return prisma.guidedTrip.create({ data: { ...data, status, organizerId: actor.id, linkedTripId } });
  },

  async update(actor: Actor, id: string, input: GuidedTripInput, status: 'Bozza' | 'Pubblicato', now: Date = new Date()) {
    const data = toData(input);
    return prisma.$transaction(async tx => {
      await lockGuidedTrip(tx, id);
      const current = await tx.guidedTrip.findUnique({ where: { id } });
      if (!current) throw new GuidedTripError('Viaggio guidato non trovato', 404);
      if (current.organizerId !== actor.id) throw new GuidedTripError('Puoi modificare solo i viaggi guidati che organizzi', 403);
      if (current.status === 'Ritirato') throw new GuidedTripError('Questo viaggio guidato è stato ritirato e non è più modificabile');
      if (data.startDate.getTime() !== current.startDate.getTime() && !isFutureDeparture(data.startDate, now)) {
        throw new GuidedTripError('La data di partenza deve essere futura');
      }
      const occupied = await tx.guidedTripBooking.count({ where: { guidedTripId: id, ...activeSeatWhere(now) } });
      if (data.maxParticipants < occupied) {
        throw new GuidedTripError(`I posti massimi non possono scendere sotto i ${occupied} già prenotati`);
      }
      if (status === 'Bozza' && current.status === 'Pubblicato' && occupied > 0) {
        throw new GuidedTripError('Non puoi riportare in bozza un viaggio con prenotazioni');
      }
      const linkedTripId = await validateLinkedTrip(actor.id, input.linkedTripId);
      return tx.guidedTrip.update({ where: { id }, data: { ...data, status, linkedTripId } });
    });
  },

  /** Il Sentinel ritira un viaggio: non è più visibile né prenotabile. Le prenotazioni restano registrate. */
  async withdraw(actor: Actor, id: string) {
    if (actor.role !== UserRole.Sentinel) throw new GuidedTripError('Solo un Sentinel può ritirare un viaggio guidato', 403);
    const current = await prisma.guidedTrip.findUnique({ where: { id }, select: { id: true } });
    if (!current) throw new GuidedTripError('Viaggio guidato non trovato', 404);
    return prisma.guidedTrip.update({ where: { id }, data: { status: 'Ritirato' } });
  },

  async participants(actor: Actor, id: string) {
    const trip = await prisma.guidedTrip.findUnique({ where: { id }, select: { organizerId: true } });
    if (!trip) throw new GuidedTripError('Viaggio guidato non trovato', 404);
    if (trip.organizerId !== actor.id && actor.role !== UserRole.Sentinel) {
      throw new GuidedTripError('Puoi vedere solo i partecipanti dei viaggi che organizzi', 403);
    }
    return prisma.guidedTripBooking.findMany({
      where: { guidedTripId: id, status: 'CONFIRMED' },
      select: { id: true, confirmedAt: true, amount: true, user: { select: { name: true, email: true } } },
      orderBy: { confirmedAt: 'asc' },
    });
  },
};

export interface StartedBooking {
  id: string;
  amount: number;
  holdExpiresAt: string;
}

export const GuidedTripBookingService = {
  /** Trattiene un posto per il pagamento. Mai oltre i posti massimi, anche con richieste simultanee. */
  async startBooking(userId: string, guidedTripId: string, now: Date = new Date()): Promise<StartedBooking> {
    const booking = await prisma.$transaction(async tx => {
      await lockGuidedTrip(tx, guidedTripId);
      const trip = await tx.guidedTrip.findUnique({ where: { id: guidedTripId } });
      if (!trip) throw new GuidedTripError('Viaggio guidato non trovato', 404);
      if (!isOpenForBooking(trip, now)) throw new GuidedTripError('Le prenotazioni per questo viaggio sono chiuse');
      if (trip.organizerId === userId) throw new GuidedTripError('Non puoi prenotare un posto nel viaggio che organizzi');

      const existing = await tx.guidedTripBooking.findUnique({ where: { guidedTripId_userId: { guidedTripId, userId } } });
      if (existing?.status === 'CONFIRMED') throw new GuidedTripError('Hai già un posto confermato in questo viaggio', 409);
      if (existing && occupiesSeat(existing, now)) return existing;

      const taken = await tx.guidedTripBooking.count({ where: { guidedTripId, ...activeSeatWhere(now) } });
      if (taken >= trip.maxParticipants) throw new GuidedTripError('Posti esauriti', 409);

      const data = {
        status: 'PENDING' as const,
        amount: trip.price,
        holdExpiresAt: holdExpiry(now),
        paymentMethod: null,
        stripePaymentId: null,
        failureReason: null,
        confirmedAt: null,
      };
      return existing
        ? tx.guidedTripBooking.update({ where: { id: existing.id }, data })
        : tx.guidedTripBooking.create({ data: { ...data, guidedTripId, userId } });
    });
    return { id: booking.id, amount: Number(booking.amount), holdExpiresAt: booking.holdExpiresAt!.toISOString() };
  },

  async getOwned(bookingId: string, userId: string) {
    const booking = await prisma.guidedTripBooking.findUnique({
      where: { id: bookingId },
      include: { guidedTrip: { select: { id: true, title: true } } },
    });
    if (!booking) throw new GuidedTripError('Prenotazione non trovata', 404);
    if (booking.userId !== userId) throw new GuidedTripError('Questa prenotazione appartiene a un altro utente', 403);
    return booking;
  },

  /**
   * Registra un pagamento riuscito. Idempotente. Se il posto trattenuto è scaduto e nel frattempo
   * i posti sono finiti, la prenotazione non viene confermata e resta da rimborsare manualmente.
   */
  async confirmPaid(bookingId: string, paymentMethod: string, stripePaymentId: string | null, now: Date = new Date()) {
    const current = await prisma.guidedTripBooking.findUnique({ where: { id: bookingId }, select: { guidedTripId: true } });
    if (!current) throw new GuidedTripError('Prenotazione non trovata', 404);
    return prisma.$transaction(async tx => {
      await lockGuidedTrip(tx, current.guidedTripId);
      const booking = await tx.guidedTripBooking.findUnique({ where: { id: bookingId }, include: { guidedTrip: true } });
      if (!booking) throw new GuidedTripError('Prenotazione non trovata', 404);
      if (booking.status === 'CONFIRMED') return { confirmed: true as const, booking };
      if (!occupiesSeat(booking, now)) {
        const taken = await tx.guidedTripBooking.count({
          where: { guidedTripId: booking.guidedTripId, id: { not: booking.id }, ...activeSeatWhere(now) },
        });
        if (taken >= booking.guidedTrip.maxParticipants) {
          const failed = await tx.guidedTripBooking.update({
            where: { id: booking.id },
            data: { status: 'FAILED', holdExpiresAt: null, paymentMethod, stripePaymentId, failureReason: 'Pagamento arrivato dopo la scadenza del posto: posti esauriti, da rimborsare' },
          });
          return { confirmed: false as const, booking: failed };
        }
      }
      const confirmed = await tx.guidedTripBooking.update({
        where: { id: booking.id },
        data: { status: 'CONFIRMED', confirmedAt: now, holdExpiresAt: null, paymentMethod, stripePaymentId, failureReason: null },
      });
      return { confirmed: true as const, booking: confirmed };
    });
  },

  /** Libera il posto trattenuto quando il pagamento fallisce o viene annullato. */
  async fail(bookingId: string, reason: string) {
    return prisma.guidedTripBooking.updateMany({
      where: { id: bookingId, status: 'PENDING' },
      data: { status: 'FAILED', holdExpiresAt: null, failureReason: reason },
    });
  },

  async setStripePaymentId(bookingId: string, stripePaymentId: string) {
    return prisma.guidedTripBooking.update({ where: { id: bookingId }, data: { stripePaymentId } });
  },

  async listForUser(userId: string) {
    const rows = await prisma.guidedTripBooking.findMany({
      where: { userId, status: 'CONFIRMED' },
      include: { guidedTrip: { select: { id: true, title: true, startDate: true, endDate: true, meetingPoint: true, status: true } } },
      orderBy: { guidedTrip: { startDate: 'asc' } },
    });
    return rows.map(r => ({
      id: r.id,
      amount: Number(r.amount),
      confirmedAt: r.confirmedAt?.toISOString() ?? null,
      guidedTrip: { ...r.guidedTrip, startDate: r.guidedTrip.startDate.toISOString(), endDate: r.guidedTrip.endDate.toISOString() },
    }));
  },

  async statusForUser(userId: string, guidedTripId: string, now: Date = new Date()) {
    const booking = await prisma.guidedTripBooking.findUnique({ where: { guidedTripId_userId: { guidedTripId, userId } } });
    if (!booking) return null;
    if (booking.status === 'CONFIRMED') return 'CONFIRMED' as const;
    return occupiesSeat(booking, now) ? ('PENDING' as const) : null;
  },
};
