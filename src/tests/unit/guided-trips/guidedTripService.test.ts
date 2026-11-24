// Comportamento del servizio dei viaggi guidati con un client Prisma finto.
// La serializzazione reale dei posti (SELECT … FOR UPDATE) si verifica sul database PostgreSQL.
import { Prisma } from '@prisma/client';

const mockDatabase = {
  $queryRaw: jest.fn(async () => []),
  $transaction: jest.fn(),
  guidedTrip: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), findMany: jest.fn() },
  guidedTripBooking: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  trip: { findUnique: jest.fn(), findMany: jest.fn() },
};

// Getter: il modulo viene richiesto prima che la costante sia inizializzata.
jest.mock('@/lib/core/prisma', () => ({ get prisma() { return mockDatabase; } }));

import {
  GuidedTripError,
  cancelBookingByParticipant,
  cancelGuidedTrip,
  canManageGuidedTrip,
  completeSimulatedPayment,
  createGuidedTrip,
  refundBookingBySentinel,
  startGuidedTripBooking,
  updateGuidedTrip,
} from '@/lib/guided-trips/guidedTripService';

const explorer = { id: 'user-explorer', role: 'Explorer' };
const ranger = { id: 'user-ranger', role: 'Ranger' };
const otherRanger = { id: 'user-other-ranger', role: 'Ranger' };
const sentinel = { id: 'user-sentinel', role: 'Sentinel' };
const now = new Date('2027-03-01T10:00:00Z');

const publishedTrip = {
  id: 'guided-1',
  title: 'Dolomiti: i grandi passi',
  organizerId: ranger.id,
  status: 'Pubblicato',
  startDate: new Date('2027-06-12T00:00:00Z'),
  endDate: new Date('2027-06-15T00:00:00Z'),
  freeCancellationUntil: new Date('2027-05-29T00:00:00Z'),
  maxParticipants: 2,
  pricePerPerson: new Prisma.Decimal('450.00'),
  meetingPoint: 'Bolzano',
};

async function expectGuidedTripError(promise: Promise<unknown>, httpStatus: number, message?: RegExp) {
  const error = await promise.then(() => null, caught => caught);
  expect(error).toBeInstanceOf(GuidedTripError);
  expect(error.httpStatus).toBe(httpStatus);
  if (message) expect(error.message).toMatch(message);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockDatabase.$transaction.mockImplementation(async (callback: (tx: typeof mockDatabase) => unknown) => callback(mockDatabase));
  (process.env as Record<string, string | undefined>).NODE_ENV = 'test';
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
});

describe('permessi', () => {
  it('l\'organizzatore e i Sentinel gestiscono il viaggio, gli altri no', () => {
    expect(canManageGuidedTrip(ranger, publishedTrip)).toBe(true);
    expect(canManageGuidedTrip(sentinel, publishedTrip)).toBe(true);
    expect(canManageGuidedTrip(otherRanger, publishedTrip)).toBe(false);
    expect(canManageGuidedTrip({ id: ranger.id, role: 'Explorer' }, publishedTrip)).toBe(false);
  });

  it('un Explorer non può creare viaggi guidati', async () => {
    await expectGuidedTripError(createGuidedTrip(explorer, {}, now), 403);
    expect(mockDatabase.guidedTrip.create).not.toHaveBeenCalled();
  });

  it('un altro Ranger non può modificare il viaggio', async () => {
    mockDatabase.guidedTrip.findUnique.mockResolvedValue(publishedTrip);
    const input = {
      title: 'Titolo valido',
      description: 'Descrizione abbastanza lunga',
      startDate: '2027-06-12',
      endDate: '2027-06-15',
      meetingPoint: 'Bolzano',
      pricePerPerson: 450,
      maxParticipants: 8,
      freeCancellationUntil: '2027-05-29',
    };
    await expectGuidedTripError(updateGuidedTrip(otherRanger, publishedTrip.id, input, now), 403);
    expect(mockDatabase.guidedTrip.update).not.toHaveBeenCalled();
  });
});

describe('creazione', () => {
  it('salva una bozza con date come giorni e prezzo decimale', async () => {
    mockDatabase.guidedTrip.create.mockResolvedValue({ id: 'new-guided' });
    const created = await createGuidedTrip(
      ranger,
      {
        title: 'Dolomiti: i grandi passi',
        description: 'Quattro giorni sui passi.',
        startDate: '2027-06-12',
        endDate: '2027-06-15',
        meetingPoint: 'Bolzano, ore 8:30',
        pricePerPerson: '450.5',
        maxParticipants: '8',
        freeCancellationUntil: '2027-05-29',
        linkedTripId: '',
      },
      now,
    );
    expect(created).toEqual({ id: 'new-guided' });
    const data = mockDatabase.guidedTrip.create.mock.calls[0][0].data;
    expect(data.organizerId).toBe(ranger.id);
    expect(data.startDate).toEqual(new Date('2027-06-12T00:00:00.000Z'));
    expect(data.pricePerPerson.toString()).toBe('450.5');
    expect(data.linkedTripId).toBeNull();
    expect(data.status).toBeUndefined(); // default dello schema: Bozza
  });

  it('rifiuta un itinerario collegato non pubblicato', async () => {
    mockDatabase.trip.findUnique.mockResolvedValue({ status: 'Bozza' });
    const error = await createGuidedTrip(
      ranger,
      {
        title: 'Dolomiti',
        description: 'Quattro giorni sui passi.',
        startDate: '2027-06-12',
        endDate: '2027-06-15',
        meetingPoint: 'Bolzano',
        pricePerPerson: 450,
        maxParticipants: 8,
        freeCancellationUntil: '2027-05-29',
        linkedTripId: 'trip-draft',
      },
      now,
    ).catch(caught => caught);
    expect(error).toBeInstanceOf(GuidedTripError);
    expect(error.fieldErrors).toHaveProperty('linkedTripId');
  });
});

describe('prenotazione', () => {
  it('trattiene il posto per 15 minuti con il pagamento simulato', async () => {
    mockDatabase.guidedTrip.findUnique.mockResolvedValue(publishedTrip);
    mockDatabase.guidedTripBooking.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{ status: 'CONFIRMED', seatHeldUntil: null }]);
    mockDatabase.guidedTripBooking.create.mockImplementation(async ({ data }) => ({ id: 'booking-1', stripePaymentId: null, ...data }));

    const started = await startGuidedTripBooking(explorer, publishedTrip.id, now);

    expect(mockDatabase.$queryRaw).toHaveBeenCalled(); // blocco della riga del viaggio
    expect(started).toEqual({ bookingId: 'booking-1', amount: 450, paymentMode: 'simulated', seatHeldUntil: '2027-03-01T10:15:00.000Z' });
    expect(mockDatabase.guidedTripBooking.create.mock.calls[0][0].data).toMatchObject({ participantId: explorer.id, status: 'PENDING_PAYMENT', paymentMethod: 'simulated' });
  });

  it('rifiuta quando i posti sono esauriti, contando anche i posti trattenuti', async () => {
    mockDatabase.guidedTrip.findUnique.mockResolvedValue(publishedTrip);
    mockDatabase.guidedTripBooking.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { status: 'CONFIRMED', seatHeldUntil: null },
        { status: 'PENDING_PAYMENT', seatHeldUntil: new Date('2027-03-01T10:05:00Z') },
      ]);
    await expectGuidedTripError(startGuidedTripBooking(explorer, publishedTrip.id, now), 409, /esauriti/);
    expect(mockDatabase.guidedTripBooking.create).not.toHaveBeenCalled();
  });

  it('l\'organizzatore non può prenotare il proprio viaggio', async () => {
    mockDatabase.guidedTrip.findUnique.mockResolvedValue(publishedTrip);
    await expectGuidedTripError(startGuidedTripBooking(ranger, publishedTrip.id, now), 409, /organizzi/);
  });

  it('non si prenota due volte lo stesso viaggio', async () => {
    mockDatabase.guidedTrip.findUnique.mockResolvedValue(publishedTrip);
    mockDatabase.guidedTripBooking.findMany.mockResolvedValueOnce([{ id: 'b', status: 'CONFIRMED', seatHeldUntil: null, paymentMethod: 'simulated' }]);
    await expectGuidedTripError(startGuidedTripBooking(explorer, publishedTrip.id, now), 409, /già un posto/);
  });

  it('riprende il pagamento di un posto ancora trattenuto invece di occuparne un altro', async () => {
    const heldBooking = { id: 'held', status: 'PENDING_PAYMENT', seatHeldUntil: new Date('2027-03-01T10:12:00Z'), paymentMethod: 'simulated', amountPaid: new Prisma.Decimal('450'), stripePaymentId: null };
    mockDatabase.guidedTrip.findUnique.mockResolvedValue(publishedTrip);
    mockDatabase.guidedTripBooking.findMany.mockResolvedValueOnce([heldBooking]);
    const started = await startGuidedTripBooking(explorer, publishedTrip.id, now);
    expect(started.bookingId).toBe('held');
    expect(mockDatabase.guidedTripBooking.create).not.toHaveBeenCalled();
  });

  it('non accetta prenotazioni su viaggi annullati, in bozza o già partiti', async () => {
    mockDatabase.guidedTrip.findUnique.mockResolvedValueOnce({ ...publishedTrip, status: 'Annullato' });
    await expectGuidedTripError(startGuidedTripBooking(explorer, publishedTrip.id, now), 409, /annullato/);
    mockDatabase.guidedTrip.findUnique.mockResolvedValueOnce({ ...publishedTrip, status: 'Bozza' });
    await expectGuidedTripError(startGuidedTripBooking(explorer, publishedTrip.id, now), 404);
    mockDatabase.guidedTrip.findUnique.mockResolvedValueOnce({ ...publishedTrip, startDate: new Date('2027-03-01T00:00:00Z') });
    await expectGuidedTripError(startGuidedTripBooking(explorer, publishedTrip.id, now), 409, /chiuse/);
  });

  it('in produzione senza Stripe la prenotazione non è disponibile', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    await expectGuidedTripError(startGuidedTripBooking(explorer, publishedTrip.id, now), 503);
    expect(mockDatabase.$transaction).not.toHaveBeenCalled();
  });

  it('un pagamento simulato fallito libera il posto', async () => {
    mockDatabase.guidedTripBooking.findUnique.mockResolvedValue({ id: 'booking-1', participantId: explorer.id, paymentMethod: 'simulated', status: 'PENDING_PAYMENT' });
    mockDatabase.guidedTripBooking.updateMany.mockResolvedValue({ count: 1 });
    const outcome = await completeSimulatedPayment(explorer, 'booking-1', false, now);
    expect(outcome).toEqual({ outcome: 'payment_failed' });
    expect(mockDatabase.guidedTripBooking.updateMany).toHaveBeenCalledWith({
      where: { id: 'booking-1', status: 'PENDING_PAYMENT' },
      data: { status: 'EXPIRED', seatHeldUntil: null },
    });
  });

  it('non si può pagare la prenotazione di un altro utente', async () => {
    mockDatabase.guidedTripBooking.findUnique.mockResolvedValue({ id: 'booking-1', participantId: 'someone-else', paymentMethod: 'simulated', status: 'PENDING_PAYMENT' });
    await expectGuidedTripError(completeSimulatedPayment(explorer, 'booking-1', true, now), 404);
  });
});

describe('disdetta dell\'utente', () => {
  const confirmedBooking = {
    id: 'booking-1',
    participantId: explorer.id,
    status: 'CONFIRMED',
    paymentMethod: 'simulated',
    stripePaymentId: null,
    amountPaid: new Prisma.Decimal('450'),
    guidedTrip: publishedTrip,
    participant: { email: 'explorer@example.com', name: 'Elena' },
  };

  it('entro la scadenza rimborsa in automatico e libera il posto', async () => {
    mockDatabase.guidedTripBooking.findUnique.mockResolvedValue(confirmedBooking);
    const result = await cancelBookingByParticipant(explorer, 'booking-1', new Date('2027-05-29T18:00:00Z'));
    expect(result).toMatchObject({ refunded: true, amount: 450, title: publishedTrip.title });
    expect(mockDatabase.guidedTripBooking.update.mock.calls[0][0].data).toMatchObject({
      status: 'REFUNDED',
      refundReference: 'simulated_refund_booking-1',
    });
  });

  it('dopo la scadenza non è possibile disdire', async () => {
    mockDatabase.guidedTripBooking.findUnique.mockResolvedValue(confirmedBooking);
    await expectGuidedTripError(cancelBookingByParticipant(explorer, 'booking-1', new Date('2027-05-30T08:00:00Z')), 409, /scadenza/);
    expect(mockDatabase.guidedTripBooking.update).not.toHaveBeenCalled();
  });

  it('se il rimborso non riesce la prenotazione resta da verificare per il Sentinel', async () => {
    mockDatabase.guidedTripBooking.findUnique.mockResolvedValue({ ...confirmedBooking, paymentMethod: 'stripe', stripePaymentId: null });
    const result = await cancelBookingByParticipant(explorer, 'booking-1', new Date('2027-05-01T08:00:00Z'));
    expect(result.refunded).toBe(false);
    expect(mockDatabase.guidedTripBooking.update.mock.calls[0][0].data.status).toBe('REFUND_FAILED');
  });
});

describe('annullamento del Ranger e rimborsi del Sentinel', () => {
  it('annullando il viaggio le prenotazioni pagate restano da rimborsare', async () => {
    mockDatabase.guidedTrip.findUnique.mockResolvedValue(publishedTrip);
    mockDatabase.guidedTripBooking.findMany.mockResolvedValue([{ participant: { email: 'a@example.com', name: 'A' } }]);
    const result = await cancelGuidedTrip(ranger, publishedTrip.id, now);
    expect(result.participantsToNotify).toEqual([{ email: 'a@example.com', name: 'A' }]);
    expect(mockDatabase.guidedTripBooking.updateMany).toHaveBeenCalledWith({ where: { guidedTripId: publishedTrip.id, status: 'CONFIRMED' }, data: { status: 'REFUND_PENDING' } });
    expect(mockDatabase.guidedTrip.update.mock.calls[0][0].data).toMatchObject({ status: 'Annullato' });
  });

  it('solo un Sentinel esegue il rimborso', async () => {
    await expectGuidedTripError(refundBookingBySentinel(ranger, 'booking-1', now), 403);
  });

  it('il Sentinel rimborsa una prenotazione in attesa', async () => {
    mockDatabase.guidedTripBooking.findUnique.mockResolvedValue({ id: 'booking-1', status: 'REFUND_PENDING', paymentMethod: 'simulated', stripePaymentId: null });
    await expect(refundBookingBySentinel(sentinel, 'booking-1', now)).resolves.toEqual({ refunded: true });
    expect(mockDatabase.guidedTripBooking.update.mock.calls[0][0].data).toMatchObject({ status: 'REFUNDED', refundedById: sentinel.id });
  });

  it('non rimborsa due volte', async () => {
    mockDatabase.guidedTripBooking.findUnique.mockResolvedValue({ id: 'booking-1', status: 'REFUNDED', paymentMethod: 'simulated' });
    await expectGuidedTripError(refundBookingBySentinel(sentinel, 'booking-1', now), 409);
  });
});
