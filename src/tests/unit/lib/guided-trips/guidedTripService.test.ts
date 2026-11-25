import { GuidedTripBookingStatus, GuidedTripStatus, Prisma, UserRole } from '@prisma/client';
import { GuidedTripError, GuidedTripService } from '@/lib/guided-trips/guidedTripService';
import { prisma } from '@/lib/core/prisma';
import { sendGuidedTripCancellationEmail } from '@/lib/core/email';
import { GuidedTripPaymentGateway, guidedTripPaymentMode } from '@/lib/guided-trips/guidedTripPaymentGateway';

jest.mock('@/lib/core/prisma', () => {
  const client = {
    guidedTrip: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
    guidedTripBooking: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn(), count: jest.fn() },
    trip: { findUnique: jest.fn(), findMany: jest.fn() },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  };
  // Le transazioni interattive ricevono lo stesso client finto
  client.$transaction.mockImplementation((callback: (tx: typeof client) => unknown) => callback(client));
  return { prisma: client };
});
jest.mock('@/lib/core/email', () => ({ sendGuidedTripCancellationEmail: jest.fn().mockResolvedValue({ success: true }) }));
jest.mock('@/lib/guided-trips/guidedTripPaymentGateway', () => ({
  guidedTripPaymentMode: jest.fn(() => 'simulated'),
  GuidedTripPaymentGateway: { refundInFull: jest.fn(), createStripePaymentIntent: jest.fn(), retrieveStripePaymentIntent: jest.fn() },
}));

const db = prisma as unknown as {
  guidedTrip: Record<string, jest.Mock>;
  guidedTripBooking: Record<string, jest.Mock>;
  trip: Record<string, jest.Mock>;
  $queryRaw: jest.Mock;
  $transaction: jest.Mock;
};
const refundInFull = GuidedTripPaymentGateway.refundInFull as jest.Mock;
const paymentMode = guidedTripPaymentMode as jest.Mock;

const now = new Date('2027-05-20T10:00:00Z');
const explorer = { id: 'user-explorer', role: UserRole.Explorer };
const ranger = { id: 'user-ranger', role: UserRole.Ranger };
const otherRanger = { id: 'user-other-ranger', role: UserRole.Ranger };

function guidedTrip(overrides: Record<string, unknown> = {}) {
  return {
    id: 'gt-1',
    title: 'Dolomiti in gruppo',
    description: 'Quattro giorni sui passi',
    organizerId: ranger.id,
    status: GuidedTripStatus.Pubblicato,
    startDate: new Date('2027-06-12T00:00:00Z'),
    endDate: new Date('2027-06-15T00:00:00Z'),
    meetingPoint: 'Bolzano',
    pricePerPerson: new Prisma.Decimal('450.00'),
    maxParticipants: 2,
    bookings: [],
    ...overrides,
  };
}

function booking(overrides: Record<string, unknown> = {}) {
  return {
    id: 'booking-1',
    guidedTripId: 'gt-1',
    participantId: explorer.id,
    amount: new Prisma.Decimal('450.00'),
    status: GuidedTripBookingStatus.CONFIRMED,
    seatHeldUntil: new Date('2027-03-01T00:00:00Z'),
    paymentMethod: 'simulated',
    stripePaymentIntentId: null,
    paymentReference: 'simulated_payment_booking-1',
    refundedAt: null,
    ...overrides,
  };
}

async function expectGuidedTripError(promise: Promise<unknown>, message: string, httpStatus: number) {
  await expect(promise).rejects.toBeInstanceOf(GuidedTripError);
  await promise.catch((error: GuidedTripError) => {
    expect(error.message).toBe(message);
    expect(error.httpStatus).toBe(httpStatus);
  });
}

beforeEach(() => {
  jest.resetAllMocks();
  paymentMode.mockReturnValue('simulated');
  (sendGuidedTripCancellationEmail as jest.Mock).mockResolvedValue({ success: true });
  db.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => callback(db));
});

describe('GuidedTripService.holdSeat', () => {
  it('riserva un posto disponibile bloccando la riga del viaggio', async () => {
    db.guidedTrip.findUnique.mockResolvedValue(guidedTrip({ bookings: [booking({ participantId: 'someone-else' })] }));
    db.guidedTripBooking.create.mockImplementation(async ({ data }) => ({ id: 'new-booking', ...data }));

    const held = await GuidedTripService.holdSeat('gt-1', explorer, now);

    expect(db.$queryRaw).toHaveBeenCalledTimes(1);
    expect(held).toEqual({ id: 'new-booking', amount: 450, seatHeldUntil: '2027-05-20T10:15:00.000Z' });
    expect(db.guidedTripBooking.create.mock.calls[0][0].data).toMatchObject({ guidedTripId: 'gt-1', participantId: explorer.id });
  });

  it('rifiuta quando i posti sono esauriti (confermati o riservati)', async () => {
    db.guidedTrip.findUnique.mockResolvedValue(guidedTrip({
      bookings: [
        booking({ participantId: 'a' }),
        booking({ participantId: 'b', status: GuidedTripBookingStatus.PENDING_PAYMENT, seatHeldUntil: new Date('2027-05-20T10:05:00Z') }),
      ],
    }));
    await expectGuidedTripError(GuidedTripService.holdSeat('gt-1', explorer, now), 'Posti esauriti', 409);
    expect(db.guidedTripBooking.create).not.toHaveBeenCalled();
  });

  it('libera il posto di una riserva scaduta', async () => {
    db.guidedTrip.findUnique.mockResolvedValue(guidedTrip({
      bookings: [
        booking({ participantId: 'a' }),
        booking({ participantId: 'b', status: GuidedTripBookingStatus.PENDING_PAYMENT, seatHeldUntil: new Date('2027-05-20T09:00:00Z') }),
      ],
    }));
    db.guidedTripBooking.create.mockImplementation(async ({ data }) => ({ id: 'new-booking', ...data }));
    await expect(GuidedTripService.holdSeat('gt-1', explorer, now)).resolves.toMatchObject({ id: 'new-booking' });
  });

  it('non consente al ranger di prenotare il proprio viaggio né di prenotare due volte', async () => {
    db.guidedTrip.findUnique.mockResolvedValue(guidedTrip());
    await expectGuidedTripError(GuidedTripService.holdSeat('gt-1', ranger, now), 'Non puoi prenotare un viaggio che organizzi tu', 400);

    db.guidedTrip.findUnique.mockResolvedValue(guidedTrip({ bookings: [booking()] }));
    await expectGuidedTripError(GuidedTripService.holdSeat('gt-1', explorer, now), 'Hai già un posto prenotato su questo viaggio', 409);
  });

  it('riprende la riserva ancora valida dello stesso utente invece di occupare un altro posto', async () => {
    const hold = booking({ id: 'hold-1', status: GuidedTripBookingStatus.PENDING_PAYMENT, seatHeldUntil: new Date('2027-05-20T10:12:00Z') });
    db.guidedTrip.findUnique.mockResolvedValue(guidedTrip({ bookings: [hold] }));
    await expect(GuidedTripService.holdSeat('gt-1', explorer, now)).resolves.toEqual({ id: 'hold-1', amount: 450, seatHeldUntil: '2027-05-20T10:12:00.000Z' });
    expect(db.guidedTripBooking.create).not.toHaveBeenCalled();
  });

  it('chiude le prenotazioni per bozze, viaggi annullati o già partiti', async () => {
    db.guidedTrip.findUnique.mockResolvedValue(guidedTrip({ status: GuidedTripStatus.Annullato }));
    await expectGuidedTripError(GuidedTripService.holdSeat('gt-1', explorer, now), 'Le prenotazioni per questo viaggio sono chiuse', 409);
    db.guidedTrip.findUnique.mockResolvedValue(guidedTrip({ startDate: new Date('2027-05-20T00:00:00Z') }));
    await expectGuidedTripError(GuidedTripService.holdSeat('gt-1', explorer, now), 'Le prenotazioni per questo viaggio sono chiuse', 409);
  });

  it('in produzione senza Stripe non apre prenotazioni', async () => {
    paymentMode.mockReturnValue('unavailable');
    await expectGuidedTripError(GuidedTripService.holdSeat('gt-1', explorer, now), 'I pagamenti non sono al momento disponibili', 503);
  });
});

describe('GuidedTripService.confirmPaidBooking', () => {
  it('conferma il posto riservato', async () => {
    db.guidedTripBooking.findUnique.mockResolvedValueOnce({ guidedTripId: 'gt-1' }).mockResolvedValueOnce({
      ...booking({ status: GuidedTripBookingStatus.PENDING_PAYMENT, seatHeldUntil: new Date('2027-05-20T10:10:00Z'), paymentReference: null }),
      guidedTrip: guidedTrip(),
    });
    db.guidedTripBooking.findMany.mockResolvedValue([]);

    await expect(GuidedTripService.confirmPaidBooking('booking-1', { method: 'simulated', reference: 'sim-1' }, now)).resolves.toEqual({ confirmed: true });
    expect(db.guidedTripBooking.update).toHaveBeenCalledWith({
      where: { id: 'booking-1' },
      data: expect.objectContaining({ status: GuidedTripBookingStatus.CONFIRMED, paymentReference: 'sim-1', confirmedAt: now }),
    });
    expect(refundInFull).not.toHaveBeenCalled();
  });

  it('rimborsa automaticamente un pagamento arrivato quando il posto non è più disponibile', async () => {
    const lateBooking = booking({ status: GuidedTripBookingStatus.PENDING_PAYMENT, seatHeldUntil: new Date('2027-05-20T09:00:00Z'), paymentReference: null });
    db.guidedTripBooking.findUnique
      .mockResolvedValueOnce({ guidedTripId: 'gt-1' })
      .mockResolvedValueOnce({ ...lateBooking, guidedTrip: guidedTrip({ maxParticipants: 1 }) })
      .mockResolvedValueOnce({ ...lateBooking, status: GuidedTripBookingStatus.EXPIRED, paymentReference: 'sim-1' });
    db.guidedTripBooking.findMany.mockResolvedValue([booking({ id: 'other', participantId: 'a' })]);
    refundInFull.mockResolvedValue({ success: true, reference: 'refund-1' });

    const result = await GuidedTripService.confirmPaidBooking('booking-1', { method: 'simulated', reference: 'sim-1' }, now);

    expect(result).toEqual({ confirmed: false, refunded: true, reason: 'Il posto non è più disponibile' });
    expect(refundInFull).toHaveBeenCalledTimes(1);
    expect(db.guidedTripBooking.update).toHaveBeenLastCalledWith({ where: { id: 'booking-1' }, data: expect.objectContaining({ refundReference: 'refund-1' }) });
  });

  it('è idempotente su una prenotazione già confermata', async () => {
    db.guidedTripBooking.findUnique.mockResolvedValueOnce({ guidedTripId: 'gt-1' }).mockResolvedValueOnce({ ...booking(), guidedTrip: guidedTrip() });
    await expect(GuidedTripService.confirmPaidBooking('booking-1', { method: 'simulated', reference: 'sim-2' }, now)).resolves.toEqual({ confirmed: true });
    expect(db.guidedTripBooking.update).not.toHaveBeenCalled();
  });
});

describe('GuidedTripService.cancelByParticipant', () => {
  it('entro la scadenza rimborsa per intero e libera il posto', async () => {
    db.guidedTripBooking.findUnique.mockResolvedValue({ ...booking(), guidedTrip: { startDate: new Date('2027-06-12T00:00:00Z') } });
    refundInFull.mockResolvedValue({ success: true, reference: 'refund-1' });
    db.guidedTripBooking.updateMany.mockResolvedValue({ count: 1 });

    await expect(GuidedTripService.cancelByParticipant('booking-1', explorer, now)).resolves.toEqual({ refundedAmount: 450 });
    expect(db.guidedTripBooking.updateMany).toHaveBeenCalledWith({
      where: { id: 'booking-1', status: GuidedTripBookingStatus.CONFIRMED },
      data: expect.objectContaining({ status: GuidedTripBookingStatus.CANCELLED_BY_PARTICIPANT, refundReference: 'refund-1' }),
    });
  });

  it('dopo la scadenza dei 14 giorni rifiuta senza rimborsare', async () => {
    db.guidedTripBooking.findUnique.mockResolvedValue({ ...booking(), guidedTrip: { startDate: new Date('2027-06-02T00:00:00Z') } });
    await expectGuidedTripError(GuidedTripService.cancelByParticipant('booking-1', explorer, now), 'Il termine per la disdetta con rimborso è scaduto', 409);
    expect(refundInFull).not.toHaveBeenCalled();
  });

  it('se il rimborso fallisce la prenotazione resta confermata', async () => {
    db.guidedTripBooking.findUnique.mockResolvedValue({ ...booking(), guidedTrip: { startDate: new Date('2027-06-12T00:00:00Z') } });
    refundInFull.mockResolvedValue({ success: false, error: 'card_declined' });
    await expect(GuidedTripService.cancelByParticipant('booking-1', explorer, now)).rejects.toMatchObject({ httpStatus: 502 });
    expect(db.guidedTripBooking.updateMany).not.toHaveBeenCalled();
  });

  it('non permette di disdire la prenotazione di un altro utente', async () => {
    db.guidedTripBooking.findUnique.mockResolvedValue({ ...booking({ participantId: 'someone-else' }), guidedTrip: { startDate: new Date('2027-06-12T00:00:00Z') } });
    await expectGuidedTripError(GuidedTripService.cancelByParticipant('booking-1', explorer, now), 'Prenotazione non trovata', 404);
  });
});

describe('GuidedTripService.cancelByOrganizer', () => {
  it('annulla, rimborsa ogni partecipante confermato e lo avvisa via email', async () => {
    db.guidedTrip.findUnique.mockResolvedValue(guidedTrip());
    db.guidedTripBooking.findMany.mockResolvedValue([
      { ...booking({ id: 'b1' }), participant: { email: 'a@example.test', name: 'A' } },
      { ...booking({ id: 'b2', participantId: 'p2' }), participant: { email: 'b@example.test', name: 'B' } },
    ]);
    refundInFull.mockResolvedValueOnce({ success: true, reference: 'r1' }).mockResolvedValueOnce({ success: false, error: 'stripe down' });

    const result = await GuidedTripService.cancelByOrganizer('gt-1', ranger, '  Allerta meteo  ', now);

    expect(result).toEqual({ refunded: 1, failedRefunds: ['b2'] });
    expect(db.guidedTrip.update).toHaveBeenCalledWith({ where: { id: 'gt-1' }, data: { status: GuidedTripStatus.Annullato, cancelledAt: now, cancellationReason: 'Allerta meteo' } });
    expect(db.guidedTripBooking.updateMany).toHaveBeenCalledWith({
      where: { guidedTripId: 'gt-1', status: GuidedTripBookingStatus.CONFIRMED },
      data: { status: GuidedTripBookingStatus.CANCELLED_BY_ORGANIZER, cancelledAt: now },
    });
    expect(db.guidedTripBooking.update).toHaveBeenCalledWith({ where: { id: 'b2' }, data: { refundError: 'stripe down' } });
    expect(sendGuidedTripCancellationEmail).toHaveBeenCalledTimes(2);
    expect((sendGuidedTripCancellationEmail as jest.Mock).mock.calls[0][0]).toMatchObject({ to: 'a@example.test', reason: 'Allerta meteo', refundCompleted: true });
  });

  it('richiede un motivo e la titolarità del viaggio', async () => {
    await expectGuidedTripError(GuidedTripService.cancelByOrganizer('gt-1', ranger, ' ', now), 'Indica il motivo dell\'annullamento (almeno 3 caratteri)', 400);
    db.guidedTrip.findUnique.mockResolvedValue(guidedTrip());
    await expectGuidedTripError(GuidedTripService.cancelByOrganizer('gt-1', otherRanger, 'Maltempo', now), 'Non puoi annullare questo viaggio guidato', 403);
  });
});

describe('GuidedTripService.create', () => {
  const details = {
    title: 'Dolomiti in gruppo',
    description: 'Quattro giorni sui passi',
    startDate: new Date('2027-06-12T00:00:00Z'),
    endDate: new Date('2027-06-15T00:00:00Z'),
    meetingPoint: 'Bolzano',
    pricePerPerson: 450,
    maxParticipants: 8,
    linkedTripId: null,
  };

  it('solo Ranger e Sentinel organizzano viaggi guidati', async () => {
    await expectGuidedTripError(GuidedTripService.create(explorer, details, false, now), 'Solo i Ranger possono organizzare viaggi guidati', 403);
  });

  it('pubblica direttamente un viaggio completo', async () => {
    db.guidedTrip.create.mockResolvedValue({ id: 'gt-new', status: GuidedTripStatus.Pubblicato });
    await GuidedTripService.create(ranger, details, true, now);
    expect(db.guidedTrip.create.mock.calls[0][0].data).toMatchObject({ organizerId: ranger.id, status: GuidedTripStatus.Pubblicato, publishedAt: now, maxParticipants: 8 });
  });

  it('accetta come collegamento solo un viaggio pubblicato', async () => {
    db.trip.findUnique.mockResolvedValue({ status: 'Bozza' });
    await expectGuidedTripError(GuidedTripService.create(ranger, { ...details, linkedTripId: 'trip-draft' }, false, now), 'Il viaggio collegato deve essere un viaggio pubblicato', 400);
  });
});

describe('GuidedTripService.update', () => {
  const details = {
    title: 'Dolomiti in gruppo',
    description: 'Nuova descrizione',
    startDate: new Date('2027-06-12T00:00:00Z'),
    endDate: new Date('2027-06-15T00:00:00Z'),
    meetingPoint: 'Bolzano, ore 9',
    pricePerPerson: 450,
    maxParticipants: 8,
    linkedTripId: null,
  };

  it('dopo una prenotazione accetta testi ma blocca il cambio di prezzo', async () => {
    db.guidedTrip.findUnique.mockResolvedValue(guidedTrip({ maxParticipants: 8, bookings: [booking()] }));
    db.guidedTrip.update.mockResolvedValue({ id: 'gt-1', status: GuidedTripStatus.Pubblicato });
    await expect(GuidedTripService.update('gt-1', ranger, details, false, now)).resolves.toEqual({ id: 'gt-1', status: GuidedTripStatus.Pubblicato });

    await expect(GuidedTripService.update('gt-1', ranger, { ...details, pricePerPerson: 500 }, false, now))
      .rejects.toMatchObject({ problems: ['Il prezzo non è modificabile dopo la prima prenotazione'] });
  });
});
