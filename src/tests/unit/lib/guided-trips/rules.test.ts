import {
  guidedTripInputSchema,
  isOpenForBooking,
  occupiesSeat,
  parseDateOnly,
  summarizeSeats,
  holdExpiry,
  SEAT_HOLD_MINUTES,
  durationDays,
} from '@/lib/guided-trips/rules';
import { getPaymentMode } from '@/lib/payment/paymentMode';

const valid = {
  title: 'Dolomiti in 3 giorni',
  description: 'Tre giorni tra i passi dolomitici in gruppo.',
  included: '2 notti in hotel',
  startDate: '2027-05-16',
  endDate: '2027-05-18',
  meetingPoint: 'Bolzano, 8:30',
  price: '590',
  maxParticipants: '12',
  linkedTripId: null,
};

describe('summarizeSeats', () => {
  it('mostra i posti liberi quando ce ne sono molti', () => {
    expect(summarizeSeats(12, 0)).toMatchObject({ free: 12, tone: 'free', label: '12 posti liberi', fill: 0 });
  });
  it('avvisa degli ultimi posti', () => {
    expect(summarizeSeats(12, 10)).toMatchObject({ free: 2, tone: 'few', label: 'Ultimi 2 posti', fill: 83 });
    expect(summarizeSeats(4, 3)).toMatchObject({ free: 1, tone: 'few', label: 'Ultimo posto' });
  });
  it('segnala il viaggio completo e non va mai sotto zero', () => {
    expect(summarizeSeats(8, 8)).toMatchObject({ free: 0, tone: 'full', label: 'Completo', fill: 100 });
    expect(summarizeSeats(2, 3)).toMatchObject({ free: 0, tone: 'full', fill: 100 });
  });
});

describe('guidedTripInputSchema', () => {
  it('accetta un viaggio valido e converte prezzo e posti', () => {
    const parsed = guidedTripInputSchema.parse(valid);
    expect(parsed.price).toBe(590);
    expect(parsed.maxParticipants).toBe(12);
  });
  it.each([
    [{ price: '0' }, 'price'],
    [{ price: '10.555' }, 'price'],
    [{ maxParticipants: '0' }, 'maxParticipants'],
    [{ maxParticipants: '51' }, 'maxParticipants'],
    [{ maxParticipants: '2.5' }, 'maxParticipants'],
    [{ startDate: '2027-02-30' }, 'startDate'],
    [{ endDate: '2027-05-15' }, 'endDate'],
    [{ title: 'ab' }, 'title'],
    [{ meetingPoint: '' }, 'meetingPoint'],
  ])('rifiuta %j', (patch, field) => {
    const result = guidedTripInputSchema.safeParse({ ...valid, ...patch });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map(i => i.path[0])).toContain(field);
  });
  it('accetta rientro nello stesso giorno della partenza', () => {
    expect(guidedTripInputSchema.safeParse({ ...valid, endDate: valid.startDate }).success).toBe(true);
  });
});

describe('posti e apertura delle prenotazioni', () => {
  const now = new Date('2027-01-10T12:00:00Z');

  it('conta i posti confermati e quelli trattenuti non scaduti', () => {
    expect(occupiesSeat({ status: 'CONFIRMED', holdExpiresAt: null }, now)).toBe(true);
    expect(occupiesSeat({ status: 'PENDING', holdExpiresAt: new Date('2027-01-10T12:05:00Z') }, now)).toBe(true);
    expect(occupiesSeat({ status: 'PENDING', holdExpiresAt: new Date('2027-01-10T11:59:00Z') }, now)).toBe(false);
    expect(occupiesSeat({ status: 'FAILED', holdExpiresAt: null }, now)).toBe(false);
  });

  it(`trattiene il posto per ${SEAT_HOLD_MINUTES} minuti`, () => {
    expect(holdExpiry(now).getTime() - now.getTime()).toBe(SEAT_HOLD_MINUTES * 60_000);
  });

  it('chiude le prenotazioni il giorno della partenza e per i viaggi non pubblicati', () => {
    expect(isOpenForBooking({ status: 'Pubblicato', startDate: parseDateOnly('2027-01-11')! }, now)).toBe(true);
    expect(isOpenForBooking({ status: 'Pubblicato', startDate: parseDateOnly('2027-01-10')! }, now)).toBe(false);
    expect(isOpenForBooking({ status: 'Bozza', startDate: parseDateOnly('2027-02-01')! }, now)).toBe(false);
    expect(isOpenForBooking({ status: 'Ritirato', startDate: parseDateOnly('2027-02-01')! }, now)).toBe(false);
  });

  it('calcola la durata inclusiva in giorni', () => {
    expect(durationDays(parseDateOnly('2027-05-16')!, parseDateOnly('2027-05-18')!)).toBe(3);
  });
});

describe('getPaymentMode', () => {
  it('usa Stripe quando entrambe le chiavi sono configurate', () => {
    expect(getPaymentMode({ STRIPE_SECRET_KEY: 'sk', NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk', NODE_ENV: 'production' })).toBe('stripe');
  });
  it('simula il pagamento fuori produzione senza Stripe', () => {
    expect(getPaymentMode({ NODE_ENV: 'development' })).toBe('simulated');
    expect(getPaymentMode({ NODE_ENV: 'test', STRIPE_SECRET_KEY: 'sk' })).toBe('simulated');
  });
  it('disattiva i pagamenti in produzione senza Stripe', () => {
    expect(getPaymentMode({ NODE_ENV: 'production' })).toBe('unavailable');
  });
});
