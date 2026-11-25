import { GuidedTripBookingService, GuidedTripService, GuidedTripError } from '@/lib/guided-trips/service';
import { parseDateOnly } from '@/lib/guided-trips/rules';

type Booking = { id: string; guidedTripId: string; userId: string; status: string; holdExpiresAt: Date | null; amount: number; confirmedAt?: Date | null };

// Database finto in memoria: basta per le regole sui posti; il blocco FOR UPDATE è verificato a parte sul database reale.
const db = {
  trips: [] as Record<string, any>[],
  bookings: [] as Booking[],
  locks: [] as string[],
};

function matches(b: Booking, where: any): boolean {
  if (where.guidedTripId && b.guidedTripId !== where.guidedTripId) return false;
  if (where.id?.not && b.id === where.id.not) return false;
  if (where.OR) {
    return where.OR.some((c: any) => b.status === c.status && (!c.holdExpiresAt || (b.holdExpiresAt && b.holdExpiresAt > c.holdExpiresAt.gt)));
  }
  return true;
}

let queue: Promise<unknown> = Promise.resolve();

const mockFake: any = {
  $queryRaw: jest.fn(async (strings: TemplateStringsArray, id: string) => { db.locks.push(id); return []; }),
  guidedTrip: {
    findUnique: jest.fn(async ({ where }: any) => db.trips.find(t => t.id === where.id) ?? null),
    update: jest.fn(async ({ where, data }: any) => Object.assign(db.trips.find(t => t.id === where.id)!, data)),
    create: jest.fn(async ({ data }: any) => { const row = { id: `gt-${db.trips.length + 1}`, ...data }; db.trips.push(row); return row; }),
  },
  guidedTripBooking: {
    findUnique: jest.fn(async ({ where, include }: any) => {
      const b = where.id
        ? db.bookings.find(x => x.id === where.id)
        : db.bookings.find(x => x.guidedTripId === where.guidedTripId_userId.guidedTripId && x.userId === where.guidedTripId_userId.userId);
      if (!b) return null;
      return include?.guidedTrip ? { ...b, guidedTrip: db.trips.find(t => t.id === b.guidedTripId) } : b;
    }),
    count: jest.fn(async ({ where }: any) => db.bookings.filter(b => matches(b, where)).length),
    create: jest.fn(async ({ data }: any) => { const row = { id: `b-${db.bookings.length + 1}`, ...data }; db.bookings.push(row); return row; }),
    update: jest.fn(async ({ where, data }: any) => Object.assign(db.bookings.find(b => b.id === where.id)!, data)),
  },
  trip: { findUnique: jest.fn(async () => null) },
  // Come il blocco FOR UPDATE, le transazioni sullo stesso viaggio procedono una alla volta.
  $transaction: jest.fn((fn: any) => { const run = queue.then(() => fn(mockFake)); queue = run.catch(() => undefined); return run; }),
};

jest.mock('@/lib/core/prisma', () => ({ get prisma() { return mockFake; } }));

const now = new Date('2027-01-10T12:00:00Z');
const later = (minutes: number) => new Date(now.getTime() + minutes * 60_000);

function trip(overrides: Record<string, any> = {}) {
  const row = { id: 'gt-1', organizerId: 'ranger', status: 'Pubblicato', startDate: parseDateOnly('2027-05-16')!, maxParticipants: 2, price: 590, ...overrides };
  db.trips.push(row);
  return row;
}

beforeEach(() => {
  db.trips = [];
  db.bookings = [];
  db.locks = [];
  jest.clearAllMocks();
});

describe('GuidedTripBookingService.startBooking', () => {
  it('trattiene un posto per 15 minuti al prezzo corrente, bloccando il viaggio', async () => {
    trip();
    const booking = await GuidedTripBookingService.startBooking('marco', 'gt-1', now);
    expect(booking).toMatchObject({ amount: 590, holdExpiresAt: later(15).toISOString() });
    expect(db.locks).toEqual(['gt-1']);
    expect(db.bookings[0]).toMatchObject({ userId: 'marco', status: 'PENDING' });
  });

  it('rifiuta quando i posti confermati e trattenuti hanno raggiunto il massimo', async () => {
    trip();
    db.bookings.push({ id: 'a', guidedTripId: 'gt-1', userId: 'u1', status: 'CONFIRMED', holdExpiresAt: null, amount: 590 });
    db.bookings.push({ id: 'b', guidedTripId: 'gt-1', userId: 'u2', status: 'PENDING', holdExpiresAt: later(5), amount: 590 });
    await expect(GuidedTripBookingService.startBooking('marco', 'gt-1', now)).rejects.toThrow('Posti esauriti');
  });

  it('libera il posto di un pagamento scaduto', async () => {
    trip();
    db.bookings.push({ id: 'a', guidedTripId: 'gt-1', userId: 'u1', status: 'CONFIRMED', holdExpiresAt: null, amount: 590 });
    db.bookings.push({ id: 'b', guidedTripId: 'gt-1', userId: 'u2', status: 'PENDING', holdExpiresAt: later(-1), amount: 590 });
    await expect(GuidedTripBookingService.startBooking('marco', 'gt-1', now)).resolves.toMatchObject({ amount: 590 });
  });

  it('due richieste per l\'ultimo posto: una sola passa', async () => {
    trip({ maxParticipants: 1 });
    const results = await Promise.allSettled([
      GuidedTripBookingService.startBooking('marco', 'gt-1', now),
      GuidedTripBookingService.startBooking('elena', 'gt-1', now),
    ]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(r => r.status === 'rejected')).toHaveLength(1);
  });

  it('non permette all\'organizzatore di prenotare né un secondo posto alla stessa persona', async () => {
    trip();
    await expect(GuidedTripBookingService.startBooking('ranger', 'gt-1', now)).rejects.toThrow('organizzi');
    db.bookings.push({ id: 'a', guidedTripId: 'gt-1', userId: 'marco', status: 'CONFIRMED', holdExpiresAt: null, amount: 590 });
    await expect(GuidedTripBookingService.startBooking('marco', 'gt-1', now)).rejects.toThrow('già un posto confermato');
  });

  it('riusa il posto già trattenuto dalla stessa persona', async () => {
    trip();
    const first = await GuidedTripBookingService.startBooking('marco', 'gt-1', now);
    const second = await GuidedTripBookingService.startBooking('marco', 'gt-1', later(1));
    expect(second.id).toBe(first.id);
    expect(db.bookings).toHaveLength(1);
  });

  it('rifiuta viaggi chiusi: bozza, ritirati o in partenza oggi', async () => {
    trip({ status: 'Ritirato' });
    await expect(GuidedTripBookingService.startBooking('marco', 'gt-1', now)).rejects.toThrow('chiuse');
    db.trips = [];
    trip({ startDate: parseDateOnly('2027-01-10')! });
    await expect(GuidedTripBookingService.startBooking('marco', 'gt-1', now)).rejects.toThrow('chiuse');
  });
});

describe('GuidedTripBookingService.confirmPaid', () => {
  it('conferma il posto trattenuto ed è idempotente', async () => {
    trip();
    db.bookings.push({ id: 'b', guidedTripId: 'gt-1', userId: 'marco', status: 'PENDING', holdExpiresAt: later(10), amount: 590 });
    const first = await GuidedTripBookingService.confirmPaid('b', 'simulated', null, now);
    expect(first.confirmed).toBe(true);
    expect(db.bookings[0]).toMatchObject({ status: 'CONFIRMED', holdExpiresAt: null, paymentMethod: 'simulated' });
    const again = await GuidedTripBookingService.confirmPaid('b', 'simulated', null, later(30));
    expect(again.confirmed).toBe(true);
  });

  it('con posto scaduto conferma solo se resta un posto libero', async () => {
    trip({ maxParticipants: 1 });
    db.bookings.push({ id: 'b', guidedTripId: 'gt-1', userId: 'marco', status: 'PENDING', holdExpiresAt: later(-1), amount: 590 });
    db.bookings.push({ id: 'c', guidedTripId: 'gt-1', userId: 'elena', status: 'CONFIRMED', holdExpiresAt: null, amount: 590 });
    const result = await GuidedTripBookingService.confirmPaid('b', 'stripe', 'pi_1', now);
    expect(result.confirmed).toBe(false);
    expect(db.bookings[0]).toMatchObject({ status: 'FAILED', stripePaymentId: 'pi_1' });
  });
});

describe('GuidedTripService.update', () => {
  const input = {
    title: 'Dolomiti', description: 'Descrizione lunga abbastanza', included: 'Hotel', startDate: '2027-05-16', endDate: '2027-05-18',
    meetingPoint: 'Bolzano', price: 650, maxParticipants: 1, linkedTripId: null,
  };

  it('non abbassa i posti sotto quelli già prenotati', async () => {
    trip({ maxParticipants: 4 });
    db.bookings.push({ id: 'a', guidedTripId: 'gt-1', userId: 'u1', status: 'CONFIRMED', holdExpiresAt: null, amount: 590 });
    db.bookings.push({ id: 'b', guidedTripId: 'gt-1', userId: 'u2', status: 'CONFIRMED', holdExpiresAt: null, amount: 590 });
    await expect(GuidedTripService.update({ id: 'ranger', role: 'Ranger' }, 'gt-1', input, 'Pubblicato', now)).rejects.toThrow('sotto i 2');
  });

  it('non riporta in bozza un viaggio con prenotazioni, e solo l\'organizzatore modifica', async () => {
    trip({ maxParticipants: 4 });
    db.bookings.push({ id: 'a', guidedTripId: 'gt-1', userId: 'u1', status: 'CONFIRMED', holdExpiresAt: null, amount: 590 });
    await expect(GuidedTripService.update({ id: 'ranger', role: 'Ranger' }, 'gt-1', { ...input, maxParticipants: 4 }, 'Bozza', now)).rejects.toThrow('bozza');
    await expect(GuidedTripService.update({ id: 'altro', role: 'Ranger' }, 'gt-1', { ...input, maxParticipants: 4 }, 'Pubblicato', now)).rejects.toMatchObject({ status: 403 });
  });

  it('applica il nuovo prezzo al viaggio senza toccare le prenotazioni esistenti', async () => {
    trip({ maxParticipants: 4 });
    db.bookings.push({ id: 'a', guidedTripId: 'gt-1', userId: 'u1', status: 'CONFIRMED', holdExpiresAt: null, amount: 590 });
    await GuidedTripService.update({ id: 'ranger', role: 'Ranger' }, 'gt-1', { ...input, maxParticipants: 4 }, 'Pubblicato', now);
    expect(Number(db.trips[0].price)).toBe(650);
    expect(db.bookings[0].amount).toBe(590);
  });
});

describe('GuidedTripService.create e withdraw', () => {
  const input = {
    title: 'Dolomiti', description: 'Descrizione lunga abbastanza', included: 'Hotel', startDate: '2027-05-16', endDate: '2027-05-18',
    meetingPoint: 'Bolzano', price: 590, maxParticipants: 12, linkedTripId: null,
  };

  it('solo Ranger e Sentinel organizzano, con partenza futura', async () => {
    await expect(GuidedTripService.create({ id: 'e', role: 'Explorer' }, input, 'Pubblicato', now)).rejects.toMatchObject({ status: 403 });
    await expect(GuidedTripService.create({ id: 'r', role: 'Ranger' }, { ...input, startDate: '2027-01-09', endDate: '2027-01-09' }, 'Pubblicato', now)).rejects.toThrow('futura');
    const created = await GuidedTripService.create({ id: 'r', role: 'Ranger' }, input, 'Pubblicato', now);
    expect(created).toMatchObject({ status: 'Pubblicato', organizerId: 'r', maxParticipants: 12 });
  });

  it('rifiuta un itinerario collegato che non è del Ranger o non è pubblicato', async () => {
    await expect(GuidedTripService.create({ id: 'r', role: 'Ranger' }, { ...input, linkedTripId: 'altrui' }, 'Bozza', now)).rejects.toBeInstanceOf(GuidedTripError);
  });

  it('solo un Sentinel ritira', async () => {
    trip();
    await expect(GuidedTripService.withdraw({ id: 'ranger', role: 'Ranger' }, 'gt-1')).rejects.toMatchObject({ status: 403 });
    await GuidedTripService.withdraw({ id: 's', role: 'Sentinel' }, 'gt-1');
    expect(db.trips[0].status).toBe('Ritirato');
  });
});
