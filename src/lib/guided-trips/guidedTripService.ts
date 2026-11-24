// Operazioni sui viaggi guidati e sulle prenotazioni.
// Ogni modifica che incide sui posti blocca la riga del viaggio (SELECT … FOR UPDATE):
// le prenotazioni concorrenti dello stesso viaggio vengono così serializzate e i posti
// non possono mai superare il massimo.
import { Prisma, UserRole } from '@prisma/client';
import { prisma } from '@/lib/core/prisma';
import {
  SEAT_HOLD_MINUTES,
  bookingOccupiesSeat,
  calendarDayInItaly,
  calendarDayToStoredDate,
  countOccupiedSeats,
  guidedTripFormSchema,
  hasFutureDeparture,
  isWithinFreeCancellation,
  seatAvailability,
  storedCalendarDay,
  validateGuidedTripSchedule,
  type GuidedTripFormInput,
} from './guidedTripRules';
import {
  SIMULATED_PAYMENT_METHOD,
  STRIPE_PAYMENT_METHOD,
  createGuidedTripPaymentIntent,
  guidedTripPaymentMode,
  hasStripePaymentSucceeded,
  refundGuidedTripPayment,
  type GuidedTripPaymentMode,
} from './guidedTripPayments';

export class GuidedTripError extends Error {
  constructor(
    message: string,
    public readonly httpStatus: number = 400,
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'GuidedTripError';
  }
}

export interface ActingUser {
  id: string;
  role: UserRole | string;
}

type TransactionClient = Prisma.TransactionClient;

const TRANSACTION_OPTIONS = { timeout: 20_000, maxWait: 10_000 };

export function canOrganizeGuidedTrips(user: ActingUser): boolean {
  return user.role === UserRole.Ranger || user.role === UserRole.Sentinel;
}

export function canManageGuidedTrip(user: ActingUser, guidedTrip: { organizerId: string }): boolean {
  return user.role === UserRole.Sentinel || (user.role === UserRole.Ranger && guidedTrip.organizerId === user.id);
}

async function lockGuidedTrip(tx: TransactionClient, guidedTripId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM guided_trips WHERE id = ${guidedTripId} FOR UPDATE`;
}

async function lockBooking(tx: TransactionClient, bookingId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM guided_trip_bookings WHERE id = ${bookingId} FOR UPDATE`;
}

const occupyingBookingsFilter = { status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] } } satisfies Prisma.GuidedTripBookingWhereInput;

function firstImageUrl(media: Prisma.JsonValue[] | undefined | null): string | null {
  for (const item of media ?? []) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const record = item as Record<string, unknown>;
      if (record.type === 'image' && typeof record.url === 'string') return record.url;
    }
  }
  return null;
}

// ---------- Lettura pubblica ----------

export interface GuidedTripCard {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  meetingPoint: string;
  description: string;
  pricePerPerson: number;
  maxParticipants: number;
  occupiedSeats: number;
  freeSeats: number;
  organizerName: string;
  coverImageUrl: string | null;
  linkedTripTitle: string | null;
}

export async function listUpcomingGuidedTrips(now: Date = new Date()): Promise<GuidedTripCard[]> {
  const today = calendarDayToStoredDate(calendarDayInItaly(now));
  const guidedTrips = await prisma.guidedTrip.findMany({
    where: { status: 'Pubblicato', startDate: { gt: today } },
    orderBy: [{ startDate: 'asc' }, { createdAt: 'asc' }],
    include: {
      organizer: { select: { name: true } },
      linkedTrip: { select: { title: true, media: true, status: true } },
      bookings: { where: occupyingBookingsFilter, select: { status: true, seatHeldUntil: true } },
    },
  });
  return guidedTrips.map(guidedTrip => {
    const occupiedSeats = countOccupiedSeats(guidedTrip.bookings, now);
    const linkedTripVisible = guidedTrip.linkedTrip?.status === 'Pubblicato';
    return {
      id: guidedTrip.id,
      title: guidedTrip.title,
      startDate: guidedTrip.startDate.toISOString(),
      endDate: guidedTrip.endDate.toISOString(),
      meetingPoint: guidedTrip.meetingPoint,
      description: guidedTrip.description,
      pricePerPerson: Number(guidedTrip.pricePerPerson),
      maxParticipants: guidedTrip.maxParticipants,
      occupiedSeats,
      freeSeats: seatAvailability(guidedTrip.maxParticipants, occupiedSeats).freeSeats,
      organizerName: guidedTrip.organizer.name ?? 'Ranger',
      coverImageUrl: linkedTripVisible ? firstImageUrl(guidedTrip.linkedTrip?.media) : null,
      linkedTripTitle: linkedTripVisible ? guidedTrip.linkedTrip!.title : null,
    };
  });
}

export interface ViewerBooking {
  id: string;
  status: string;
  amountPaid: number;
  confirmedAt: string | null;
  seatHeldUntil: string | null;
  paymentMethod: string | null;
  cancelledByUserAt: string | null;
}

export interface GuidedTripDetail {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  meetingPoint: string;
  pricePerPerson: number;
  maxParticipants: number;
  occupiedSeats: number;
  freeSeats: number;
  freeCancellationUntil: string;
  status: 'Bozza' | 'Pubblicato' | 'Annullato';
  organizer: { id: string; name: string };
  coverImageUrl: string | null;
  linkedTrip: { title: string; slug: string; durationDays: number; stagesCount: number } | null;
  bookable: boolean;
  departed: boolean;
  withinFreeCancellation: boolean;
  viewerCanManage: boolean;
  viewerIsOrganizer: boolean;
  viewerBooking: ViewerBooking | null;
  paymentMode: GuidedTripPaymentMode;
}

function serializeViewerBooking(booking: {
  id: string;
  status: string;
  amountPaid: Prisma.Decimal;
  confirmedAt: Date | null;
  seatHeldUntil: Date | null;
  paymentMethod: string | null;
  cancelledByUserAt: Date | null;
}): ViewerBooking {
  return {
    id: booking.id,
    status: booking.status,
    amountPaid: Number(booking.amountPaid),
    confirmedAt: booking.confirmedAt?.toISOString() ?? null,
    seatHeldUntil: booking.seatHeldUntil?.toISOString() ?? null,
    paymentMethod: booking.paymentMethod,
    cancelledByUserAt: booking.cancelledByUserAt?.toISOString() ?? null,
  };
}

/** Dettaglio visibile a chiunque se pubblicato o annullato; le bozze solo a chi le gestisce. */
export async function getGuidedTripDetail(guidedTripId: string, viewer: ActingUser | null, now: Date = new Date()): Promise<GuidedTripDetail | null> {
  const guidedTrip = await prisma.guidedTrip.findUnique({
    where: { id: guidedTripId },
    include: {
      organizer: { select: { id: true, name: true } },
      linkedTrip: { select: { title: true, slug: true, media: true, status: true, duration_days: true, _count: { select: { stages: true } } } },
      bookings: { where: occupyingBookingsFilter, select: { status: true, seatHeldUntil: true } },
    },
  });
  if (!guidedTrip) return null;
  const viewerCanManage = viewer ? canManageGuidedTrip(viewer, guidedTrip) : false;
  if (guidedTrip.status === 'Bozza' && !viewerCanManage) return null;

  const viewerBookingRecord = viewer
    ? await prisma.guidedTripBooking.findFirst({
        where: { guidedTripId, participantId: viewer.id, status: { not: 'EXPIRED' } },
        orderBy: { createdAt: 'desc' },
      })
    : null;
  const viewerBooking =
    viewerBookingRecord && (viewerBookingRecord.status !== 'PENDING_PAYMENT' || bookingOccupiesSeat(viewerBookingRecord, now))
      ? serializeViewerBooking(viewerBookingRecord)
      : null;

  const occupiedSeats = countOccupiedSeats(guidedTrip.bookings, now);
  const freeSeats = seatAvailability(guidedTrip.maxParticipants, occupiedSeats).freeSeats;
  const departed = !hasFutureDeparture(guidedTrip.startDate, now);
  const paymentMode = guidedTripPaymentMode();
  const linkedTripVisible = guidedTrip.linkedTrip?.status === 'Pubblicato';

  return {
    id: guidedTrip.id,
    title: guidedTrip.title,
    description: guidedTrip.description,
    startDate: guidedTrip.startDate.toISOString(),
    endDate: guidedTrip.endDate.toISOString(),
    meetingPoint: guidedTrip.meetingPoint,
    pricePerPerson: Number(guidedTrip.pricePerPerson),
    maxParticipants: guidedTrip.maxParticipants,
    occupiedSeats,
    freeSeats,
    freeCancellationUntil: guidedTrip.freeCancellationUntil.toISOString(),
    status: guidedTrip.status,
    organizer: { id: guidedTrip.organizer.id, name: guidedTrip.organizer.name ?? 'Ranger' },
    coverImageUrl: linkedTripVisible ? firstImageUrl(guidedTrip.linkedTrip?.media) : null,
    linkedTrip: linkedTripVisible
      ? {
          title: guidedTrip.linkedTrip!.title,
          slug: guidedTrip.linkedTrip!.slug,
          durationDays: guidedTrip.linkedTrip!.duration_days,
          stagesCount: guidedTrip.linkedTrip!._count.stages,
        }
      : null,
    bookable: guidedTrip.status === 'Pubblicato' && !departed && freeSeats > 0 && paymentMode !== 'unavailable',
    departed,
    withinFreeCancellation: isWithinFreeCancellation(guidedTrip.freeCancellationUntil, now),
    viewerCanManage,
    viewerIsOrganizer: viewer?.id === guidedTrip.organizerId,
    viewerBooking,
    paymentMode,
  };
}

// ---------- Gestione da parte del Ranger ----------

function parseForm(raw: unknown): GuidedTripFormInput {
  const parsed = guidedTripFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? 'form');
      fieldErrors[field] ??= issue.message;
    }
    throw new GuidedTripError('Alcuni campi non sono validi', 400, fieldErrors);
  }
  return { ...parsed.data, linkedTripId: parsed.data.linkedTripId || null };
}

async function assertLinkableTrip(tx: TransactionClient, linkedTripId: string | null | undefined): Promise<void> {
  if (!linkedTripId) return;
  const trip = await tx.trip.findUnique({ where: { id: linkedTripId }, select: { status: true } });
  if (!trip || trip.status !== 'Pubblicato') {
    throw new GuidedTripError('Alcuni campi non sono validi', 400, { linkedTripId: 'Puoi collegare solo un itinerario pubblicato' });
  }
}

function formToData(input: GuidedTripFormInput) {
  return {
    title: input.title,
    description: input.description,
    startDate: calendarDayToStoredDate(input.startDate),
    endDate: calendarDayToStoredDate(input.endDate),
    meetingPoint: input.meetingPoint,
    pricePerPerson: new Prisma.Decimal(input.pricePerPerson.toFixed(2)),
    maxParticipants: input.maxParticipants,
    freeCancellationUntil: calendarDayToStoredDate(input.freeCancellationUntil),
    linkedTripId: input.linkedTripId ?? null,
  };
}

export async function createGuidedTrip(user: ActingUser, raw: unknown, now: Date = new Date()): Promise<{ id: string }> {
  if (!canOrganizeGuidedTrips(user)) throw new GuidedTripError('Solo i Ranger possono organizzare viaggi guidati', 403);
  const input = parseForm(raw);
  const scheduleErrors = validateGuidedTripSchedule(input, { now });
  if (Object.keys(scheduleErrors).length) throw new GuidedTripError('Alcuni campi non sono validi', 400, scheduleErrors);
  return prisma.$transaction(async tx => {
    await assertLinkableTrip(tx, input.linkedTripId);
    const created = await tx.guidedTrip.create({ data: { ...formToData(input), organizerId: user.id }, select: { id: true } });
    return created;
  });
}

async function loadManageableGuidedTrip(tx: TransactionClient, user: ActingUser, guidedTripId: string) {
  const guidedTrip = await tx.guidedTrip.findUnique({ where: { id: guidedTripId } });
  if (!guidedTrip) throw new GuidedTripError('Viaggio guidato non trovato', 404);
  if (!canManageGuidedTrip(user, guidedTrip)) throw new GuidedTripError('Non puoi gestire questo viaggio guidato', 403);
  return guidedTrip;
}

export async function updateGuidedTrip(user: ActingUser, guidedTripId: string, raw: unknown, now: Date = new Date()): Promise<void> {
  const input = parseForm(raw);
  await prisma.$transaction(async tx => {
    await lockGuidedTrip(tx, guidedTripId);
    const guidedTrip = await loadManageableGuidedTrip(tx, user, guidedTripId);
    if (guidedTrip.status === 'Annullato') throw new GuidedTripError('Un viaggio annullato non può essere modificato', 409);
    const bookings = await tx.guidedTripBooking.findMany({ where: { guidedTripId, ...occupyingBookingsFilter }, select: { status: true, seatHeldUntil: true } });
    const scheduleErrors = validateGuidedTripSchedule(input, {
      now,
      confirmedBookings: countOccupiedSeats(bookings, now),
      startDateUnchanged: storedCalendarDay(guidedTrip.startDate) === input.startDate,
    });
    if (Object.keys(scheduleErrors).length) throw new GuidedTripError('Alcuni campi non sono validi', 400, scheduleErrors);
    await assertLinkableTrip(tx, input.linkedTripId);
    await tx.guidedTrip.update({ where: { id: guidedTripId }, data: formToData(input) });
  }, TRANSACTION_OPTIONS);
}

export async function publishGuidedTrip(user: ActingUser, guidedTripId: string, now: Date = new Date()): Promise<void> {
  await prisma.$transaction(async tx => {
    await lockGuidedTrip(tx, guidedTripId);
    const guidedTrip = await loadManageableGuidedTrip(tx, user, guidedTripId);
    if (guidedTrip.status !== 'Bozza') throw new GuidedTripError('Solo una bozza può essere pubblicata', 409);
    if (!hasFutureDeparture(guidedTrip.startDate, now)) {
      throw new GuidedTripError('La data di partenza è già passata: aggiornala prima di pubblicare', 400, { startDate: 'La partenza deve essere successiva a oggi' });
    }
    await tx.guidedTrip.update({ where: { id: guidedTripId }, data: { status: 'Pubblicato', publishedAt: now } });
  }, TRANSACTION_OPTIONS);
}

export interface NotifiableParticipant {
  email: string;
  name: string | null;
}

/** Annulla il viaggio: le prenotazioni pagate restano in attesa di rimborso da parte di un Sentinel. */
export async function cancelGuidedTrip(user: ActingUser, guidedTripId: string, now: Date = new Date()): Promise<{ title: string; participantsToNotify: NotifiableParticipant[] }> {
  return prisma.$transaction(async tx => {
    await lockGuidedTrip(tx, guidedTripId);
    const guidedTrip = await loadManageableGuidedTrip(tx, user, guidedTripId);
    if (guidedTrip.status !== 'Pubblicato') throw new GuidedTripError('Si può annullare solo un viaggio pubblicato', 409);
    const confirmed = await tx.guidedTripBooking.findMany({
      where: { guidedTripId, status: 'CONFIRMED' },
      select: { participant: { select: { email: true, name: true } } },
    });
    await tx.guidedTrip.update({ where: { id: guidedTripId }, data: { status: 'Annullato', cancelledAt: now } });
    await tx.guidedTripBooking.updateMany({ where: { guidedTripId, status: 'CONFIRMED' }, data: { status: 'REFUND_PENDING' } });
    await tx.guidedTripBooking.updateMany({ where: { guidedTripId, status: 'PENDING_PAYMENT' }, data: { status: 'EXPIRED', seatHeldUntil: null } });
    return { title: guidedTrip.title, participantsToNotify: confirmed.map(booking => booking.participant) };
  }, TRANSACTION_OPTIONS);
}

export interface OrganizerGuidedTripRow {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  pricePerPerson: number;
  maxParticipants: number;
  confirmedBookings: number;
  status: 'Bozza' | 'Pubblicato' | 'Annullato';
  departed: boolean;
}

export async function listOrganizerGuidedTrips(user: ActingUser, now: Date = new Date()): Promise<OrganizerGuidedTripRow[]> {
  const guidedTrips = await prisma.guidedTrip.findMany({
    where: { organizerId: user.id },
    orderBy: [{ startDate: 'asc' }],
    include: { bookings: { where: { status: 'CONFIRMED' }, select: { id: true } } },
  });
  return guidedTrips.map(guidedTrip => ({
    id: guidedTrip.id,
    title: guidedTrip.title,
    startDate: guidedTrip.startDate.toISOString(),
    endDate: guidedTrip.endDate.toISOString(),
    pricePerPerson: Number(guidedTrip.pricePerPerson),
    maxParticipants: guidedTrip.maxParticipants,
    confirmedBookings: guidedTrip.bookings.length,
    status: guidedTrip.status,
    departed: !hasFutureDeparture(guidedTrip.startDate, now),
  }));
}

export interface GuidedTripManagementView {
  guidedTrip: {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    meetingPoint: string;
    pricePerPerson: number;
    maxParticipants: number;
    freeCancellationUntil: string;
    linkedTripId: string | null;
    status: 'Bozza' | 'Pubblicato' | 'Annullato';
    organizerName: string;
  };
  participants: {
    bookingId: string;
    name: string;
    email: string;
    bookedAt: string;
    status: string;
    cancelledByUserAt: string | null;
  }[];
  confirmedCount: number;
  collectedAmount: number;
  userCancellations: number;
}

export async function getGuidedTripManagementView(user: ActingUser, guidedTripId: string): Promise<GuidedTripManagementView | null> {
  const guidedTrip = await prisma.guidedTrip.findUnique({
    where: { id: guidedTripId },
    include: {
      organizer: { select: { name: true } },
      bookings: {
        where: { status: { in: ['CONFIRMED', 'REFUND_PENDING', 'REFUNDED', 'REFUND_FAILED'] } },
        orderBy: { createdAt: 'asc' },
        include: { participant: { select: { name: true, email: true } } },
      },
    },
  });
  if (!guidedTrip) return null;
  if (!canManageGuidedTrip(user, guidedTrip)) throw new GuidedTripError('Non puoi gestire questo viaggio guidato', 403);
  const confirmed = guidedTrip.bookings.filter(booking => booking.status === 'CONFIRMED');
  return {
    guidedTrip: {
      id: guidedTrip.id,
      title: guidedTrip.title,
      description: guidedTrip.description,
      startDate: storedCalendarDay(guidedTrip.startDate),
      endDate: storedCalendarDay(guidedTrip.endDate),
      meetingPoint: guidedTrip.meetingPoint,
      pricePerPerson: Number(guidedTrip.pricePerPerson),
      maxParticipants: guidedTrip.maxParticipants,
      freeCancellationUntil: storedCalendarDay(guidedTrip.freeCancellationUntil),
      linkedTripId: guidedTrip.linkedTripId,
      status: guidedTrip.status,
      organizerName: guidedTrip.organizer.name ?? 'Ranger',
    },
    participants: guidedTrip.bookings.map(booking => ({
      bookingId: booking.id,
      name: booking.participant.name ?? booking.participant.email,
      email: booking.participant.email,
      bookedAt: (booking.confirmedAt ?? booking.createdAt).toISOString(),
      status: booking.status,
      cancelledByUserAt: booking.cancelledByUserAt?.toISOString() ?? null,
    })),
    confirmedCount: confirmed.length,
    collectedAmount: confirmed.reduce((total, booking) => total + Number(booking.amountPaid), 0),
    userCancellations: guidedTrip.bookings.filter(booking => booking.cancelledByUserAt !== null).length,
  };
}

/** Itinerari pubblicati che si possono collegare a un viaggio guidato. */
export async function listLinkableTrips(): Promise<{ id: string; title: string }[]> {
  return prisma.trip.findMany({ where: { status: 'Pubblicato' }, orderBy: { title: 'asc' }, select: { id: true, title: true } });
}

// ---------- Prenotazione e pagamento ----------

export interface BookingStart {
  bookingId: string;
  amount: number;
  paymentMode: Exclude<GuidedTripPaymentMode, 'unavailable'>;
  seatHeldUntil: string;
  clientSecret?: string;
}

export async function startGuidedTripBooking(user: ActingUser, guidedTripId: string, now: Date = new Date()): Promise<BookingStart> {
  const paymentMode = guidedTripPaymentMode();
  if (paymentMode === 'unavailable') throw new GuidedTripError('I pagamenti non sono al momento disponibili', 503);

  const { booking, title } = await prisma.$transaction(async tx => {
    await lockGuidedTrip(tx, guidedTripId);
    const guidedTrip = await tx.guidedTrip.findUnique({ where: { id: guidedTripId } });
    if (!guidedTrip || guidedTrip.status === 'Bozza') throw new GuidedTripError('Viaggio guidato non trovato', 404);
    if (guidedTrip.status === 'Annullato') throw new GuidedTripError('Questo viaggio è stato annullato', 409);
    if (!hasFutureDeparture(guidedTrip.startDate, now)) throw new GuidedTripError('Le prenotazioni per questo viaggio sono chiuse', 409);
    if (guidedTrip.organizerId === user.id) throw new GuidedTripError('Non puoi prenotare un viaggio che organizzi tu', 409);

    const ownBookings = await tx.guidedTripBooking.findMany({
      where: { guidedTripId, participantId: user.id, status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] } },
    });
    if (ownBookings.some(existing => existing.status === 'CONFIRMED')) throw new GuidedTripError('Hai già un posto prenotato su questo viaggio', 409);
    const resumable = ownBookings.find(existing => bookingOccupiesSeat(existing, now) && existing.paymentMethod === (paymentMode === 'stripe' ? STRIPE_PAYMENT_METHOD : SIMULATED_PAYMENT_METHOD));
    if (resumable) return { booking: resumable, title: guidedTrip.title };
    const staleHolds = ownBookings.filter(existing => existing.status === 'PENDING_PAYMENT').map(existing => existing.id);
    if (staleHolds.length) {
      await tx.guidedTripBooking.updateMany({ where: { id: { in: staleHolds } }, data: { status: 'EXPIRED', seatHeldUntil: null } });
    }

    const occupying = await tx.guidedTripBooking.findMany({ where: { guidedTripId, ...occupyingBookingsFilter }, select: { status: true, seatHeldUntil: true } });
    if (countOccupiedSeats(occupying, now) >= guidedTrip.maxParticipants) throw new GuidedTripError('I posti per questo viaggio sono esauriti', 409);

    const created = await tx.guidedTripBooking.create({
      data: {
        guidedTripId,
        participantId: user.id,
        amountPaid: guidedTrip.pricePerPerson,
        status: 'PENDING_PAYMENT',
        paymentMethod: paymentMode === 'stripe' ? STRIPE_PAYMENT_METHOD : SIMULATED_PAYMENT_METHOD,
        seatHeldUntil: new Date(now.getTime() + SEAT_HOLD_MINUTES * 60_000),
      },
    });
    return { booking: created, title: guidedTrip.title };
  }, TRANSACTION_OPTIONS);

  const result: BookingStart = {
    bookingId: booking.id,
    amount: Number(booking.amountPaid),
    paymentMode,
    seatHeldUntil: booking.seatHeldUntil!.toISOString(),
  };
  if (paymentMode === 'stripe') {
    const intent = await createGuidedTripPaymentIntent({
      bookingId: booking.id,
      guidedTripId,
      participantId: user.id,
      amount: Number(booking.amountPaid),
      title,
    });
    if (booking.stripePaymentId !== intent.paymentIntentId) {
      await prisma.guidedTripBooking.update({ where: { id: booking.id }, data: { stripePaymentId: intent.paymentIntentId } });
    }
    result.clientSecret = intent.clientSecret;
  }
  return result;
}

export type PaymentConfirmationOutcome =
  | { outcome: 'confirmed'; participant: NotifiableParticipant; guidedTrip: ConfirmedGuidedTripSummary }
  | { outcome: 'already_confirmed' }
  | { outcome: 'refunded_no_seats' }
  | { outcome: 'refund_pending_trip_cancelled' };

export interface ConfirmedGuidedTripSummary {
  id: string;
  title: string;
  startDate: Date;
  meetingPoint: string;
  freeCancellationUntil: Date;
  amountPaid: number;
}

/**
 * Registra un pagamento riuscito. Se nel frattempo il posto trattenuto è scaduto e
 * il viaggio si è riempito, il pagamento viene rimborsato invece di superare il massimo.
 */
export async function confirmGuidedTripBookingPayment(bookingId: string, now: Date = new Date()): Promise<PaymentConfirmationOutcome> {
  const booking = await prisma.guidedTripBooking.findUnique({ where: { id: bookingId }, select: { guidedTripId: true } });
  if (!booking) throw new GuidedTripError('Prenotazione non trovata', 404);

  const decision = await prisma.$transaction(async tx => {
    await lockGuidedTrip(tx, booking.guidedTripId);
    const current = await tx.guidedTripBooking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { guidedTrip: true, participant: { select: { email: true, name: true } } },
    });
    if (current.status === 'CONFIRMED') return { outcome: 'already_confirmed' as const };
    if (current.status !== 'PENDING_PAYMENT' && current.status !== 'EXPIRED') {
      throw new GuidedTripError('Questa prenotazione non è in attesa di pagamento', 409);
    }
    if (current.guidedTrip.status === 'Annullato') {
      await tx.guidedTripBooking.update({ where: { id: bookingId }, data: { status: 'REFUND_PENDING', seatHeldUntil: null, confirmedAt: now } });
      return { outcome: 'refund_pending_trip_cancelled' as const };
    }
    if (!bookingOccupiesSeat(current, now)) {
      const others = await tx.guidedTripBooking.findMany({
        where: { guidedTripId: current.guidedTripId, id: { not: bookingId }, ...occupyingBookingsFilter },
        select: { status: true, seatHeldUntil: true },
      });
      if (countOccupiedSeats(others, now) >= current.guidedTrip.maxParticipants) {
        return { outcome: 'refund_no_seats' as const, booking: current };
      }
    }
    await tx.guidedTripBooking.update({ where: { id: bookingId }, data: { status: 'CONFIRMED', confirmedAt: now, seatHeldUntil: null } });
    return {
      outcome: 'confirmed' as const,
      participant: current.participant,
      guidedTrip: {
        id: current.guidedTrip.id,
        title: current.guidedTrip.title,
        startDate: current.guidedTrip.startDate,
        meetingPoint: current.guidedTrip.meetingPoint,
        freeCancellationUntil: current.guidedTrip.freeCancellationUntil,
        amountPaid: Number(current.amountPaid),
      },
    };
  }, TRANSACTION_OPTIONS);

  if (decision.outcome === 'refund_no_seats') {
    const refund = await refundGuidedTripPayment(decision.booking);
    await prisma.guidedTripBooking.update({
      where: { id: bookingId },
      data: refund.success
        ? { status: 'REFUNDED', refundedAt: now, refundReference: refund.reference, seatHeldUntil: null, refundFailureReason: 'Posti esauriti alla conferma del pagamento' }
        : { status: 'REFUND_FAILED', seatHeldUntil: null, refundFailureReason: `Posti esauriti alla conferma del pagamento; ${refund.error}` },
    });
    return { outcome: 'refunded_no_seats' };
  }
  return decision;
}

async function loadOwnBooking(user: ActingUser, bookingId: string) {
  const booking = await prisma.guidedTripBooking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.participantId !== user.id) throw new GuidedTripError('Prenotazione non trovata', 404);
  return booking;
}

export async function completeSimulatedPayment(user: ActingUser, bookingId: string, succeeded: boolean, now: Date = new Date()): Promise<PaymentConfirmationOutcome | { outcome: 'payment_failed' }> {
  if (guidedTripPaymentMode() !== 'simulated') throw new GuidedTripError('Il pagamento simulato non è disponibile', 403);
  const booking = await loadOwnBooking(user, bookingId);
  if (booking.paymentMethod !== SIMULATED_PAYMENT_METHOD) throw new GuidedTripError('Questa prenotazione non usa il pagamento simulato', 409);
  if (booking.status === 'CONFIRMED') return { outcome: 'already_confirmed' };
  if (booking.status !== 'PENDING_PAYMENT') throw new GuidedTripError('Questa prenotazione non è più in attesa di pagamento: riprova a prenotare', 409);
  if (!succeeded) {
    const released = await prisma.guidedTripBooking.updateMany({
      where: { id: bookingId, status: 'PENDING_PAYMENT' },
      data: { status: 'EXPIRED', seatHeldUntil: null },
    });
    if (released.count === 0) throw new GuidedTripError('Questa prenotazione non è in attesa di pagamento', 409);
    return { outcome: 'payment_failed' };
  }
  return confirmGuidedTripBookingPayment(bookingId, now);
}

export async function confirmStripeBookingPayment(user: ActingUser, bookingId: string, now: Date = new Date()): Promise<PaymentConfirmationOutcome> {
  const booking = await loadOwnBooking(user, bookingId);
  if (booking.status === 'CONFIRMED') return { outcome: 'already_confirmed' };
  if (booking.paymentMethod !== STRIPE_PAYMENT_METHOD || !booking.stripePaymentId) throw new GuidedTripError('Pagamento Stripe non trovato per questa prenotazione', 409);
  if (!(await hasStripePaymentSucceeded(booking.stripePaymentId))) throw new GuidedTripError('Il pagamento non risulta completato', 402);
  return confirmGuidedTripBookingPayment(bookingId, now);
}

/** Disdetta dell'utente entro la scadenza: il posto torna libero e il rimborso parte in automatico. */
export async function cancelBookingByParticipant(user: ActingUser, bookingId: string, now: Date = new Date()) {
  return prisma.$transaction(async tx => {
    await lockBooking(tx, bookingId);
    const booking = await tx.guidedTripBooking.findUnique({
      where: { id: bookingId },
      include: { guidedTrip: true, participant: { select: { email: true, name: true } } },
    });
    if (!booking || booking.participantId !== user.id) throw new GuidedTripError('Prenotazione non trovata', 404);
    if (booking.status !== 'CONFIRMED') throw new GuidedTripError('Solo una prenotazione confermata può essere disdetta', 409);
    if (booking.guidedTrip.status === 'Annullato') throw new GuidedTripError('Il viaggio è stato annullato: il rimborso è già in corso', 409);
    if (!isWithinFreeCancellation(booking.guidedTrip.freeCancellationUntil, now)) {
      throw new GuidedTripError('La scadenza per la disdetta gratuita è passata', 409);
    }
    const refund = await refundGuidedTripPayment(booking);
    await tx.guidedTripBooking.update({
      where: { id: bookingId },
      data: refund.success
        ? { status: 'REFUNDED', cancelledByUserAt: now, refundedAt: now, refundReference: refund.reference, refundFailureReason: null }
        : { status: 'REFUND_FAILED', cancelledByUserAt: now, refundFailureReason: refund.error },
    });
    return {
      refunded: refund.success,
      participant: booking.participant,
      title: booking.guidedTrip.title,
      amount: Number(booking.amountPaid),
    };
  }, TRANSACTION_OPTIONS);
}

export interface UserBookingRow {
  id: string;
  status: string;
  amountPaid: number;
  cancelledByUserAt: string | null;
  canCancel: boolean;
  guidedTrip: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    freeCancellationUntil: string;
    organizerName: string;
    status: string;
  };
}

export async function listParticipantBookings(user: ActingUser, now: Date = new Date()): Promise<UserBookingRow[]> {
  const bookings = await prisma.guidedTripBooking.findMany({
    where: { participantId: user.id, status: { not: 'EXPIRED' } },
    orderBy: { createdAt: 'desc' },
    include: { guidedTrip: { include: { organizer: { select: { name: true } } } } },
  });
  return bookings
    .filter(booking => booking.status !== 'PENDING_PAYMENT' || bookingOccupiesSeat(booking, now))
    .map(booking => ({
      id: booking.id,
      status: booking.status,
      amountPaid: Number(booking.amountPaid),
      cancelledByUserAt: booking.cancelledByUserAt?.toISOString() ?? null,
      canCancel:
        booking.status === 'CONFIRMED' &&
        booking.guidedTrip.status !== 'Annullato' &&
        isWithinFreeCancellation(booking.guidedTrip.freeCancellationUntil, now),
      guidedTrip: {
        id: booking.guidedTrip.id,
        title: booking.guidedTrip.title,
        startDate: booking.guidedTrip.startDate.toISOString(),
        endDate: booking.guidedTrip.endDate.toISOString(),
        freeCancellationUntil: booking.guidedTrip.freeCancellationUntil.toISOString(),
        organizerName: booking.guidedTrip.organizer.name ?? 'Ranger',
        status: booking.guidedTrip.status,
      },
    }));
}

// ---------- Rimborsi da parte del Sentinel ----------

export interface RefundQueueRow {
  bookingId: string;
  status: string;
  amountPaid: number;
  participantName: string;
  participantEmail: string;
  refundFailureReason: string | null;
  refundedAt: string | null;
  userCancellation: boolean;
  guidedTrip: { id: string; title: string; startDate: string; endDate: string; cancelledAt: string | null; organizerName: string };
}

export async function listGuidedTripRefundQueue(): Promise<RefundQueueRow[]> {
  const bookings = await prisma.guidedTripBooking.findMany({
    where: {
      OR: [
        { status: { in: ['REFUND_PENDING', 'REFUND_FAILED'] } },
        { status: 'REFUNDED', guidedTrip: { status: 'Annullato' }, cancelledByUserAt: null },
      ],
    },
    orderBy: [{ updatedAt: 'desc' }],
    include: {
      participant: { select: { name: true, email: true } },
      guidedTrip: { include: { organizer: { select: { name: true } } } },
    },
  });
  const order: Record<string, number> = { REFUND_FAILED: 0, REFUND_PENDING: 1, REFUNDED: 2 };
  return bookings
    .sort((first, second) => order[first.status] - order[second.status])
    .map(booking => ({
      bookingId: booking.id,
      status: booking.status,
      amountPaid: Number(booking.amountPaid),
      participantName: booking.participant.name ?? booking.participant.email,
      participantEmail: booking.participant.email,
      refundFailureReason: booking.refundFailureReason,
      refundedAt: booking.refundedAt?.toISOString() ?? null,
      userCancellation: booking.cancelledByUserAt !== null,
      guidedTrip: {
        id: booking.guidedTrip.id,
        title: booking.guidedTrip.title,
        startDate: booking.guidedTrip.startDate.toISOString(),
        endDate: booking.guidedTrip.endDate.toISOString(),
        cancelledAt: booking.guidedTrip.cancelledAt?.toISOString() ?? null,
        organizerName: booking.guidedTrip.organizer.name ?? 'Ranger',
      },
    }));
}

export async function refundBookingBySentinel(user: ActingUser, bookingId: string, now: Date = new Date()): Promise<{ refunded: boolean; error?: string }> {
  if (user.role !== UserRole.Sentinel) throw new GuidedTripError('Solo un Sentinel può eseguire i rimborsi', 403);
  return prisma.$transaction(async tx => {
    await lockBooking(tx, bookingId);
    const booking = await tx.guidedTripBooking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new GuidedTripError('Prenotazione non trovata', 404);
    if (booking.status !== 'REFUND_PENDING' && booking.status !== 'REFUND_FAILED') {
      throw new GuidedTripError('Questa prenotazione non è in attesa di rimborso', 409);
    }
    const refund = await refundGuidedTripPayment(booking);
    await tx.guidedTripBooking.update({
      where: { id: bookingId },
      data: refund.success
        ? { status: 'REFUNDED', refundedAt: now, refundReference: refund.reference, refundedById: user.id, refundFailureReason: null }
        : { status: 'REFUND_FAILED', refundFailureReason: refund.error },
    });
    return refund.success ? { refunded: true } : { refunded: false, error: refund.error };
  }, TRANSACTION_OPTIONS);
}
