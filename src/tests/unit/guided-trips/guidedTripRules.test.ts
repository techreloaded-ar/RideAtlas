import {
  bookingOccupiesSeat,
  bookingStatusLabel,
  calendarDayInItaly,
  countOccupiedSeats,
  guidedTripFormSchema,
  hasFutureDeparture,
  isWithinFreeCancellation,
  seatAvailability,
  seatAvailabilityText,
  validateGuidedTripSchedule,
} from '@/lib/guided-trips/guidedTripRules';
import { guidedTripPaymentMode } from '@/lib/guided-trips/guidedTripPayments';

const day = (calendarDay: string) => new Date(`${calendarDay}T00:00:00.000Z`);

describe('posti di un viaggio guidato', () => {
  const now = new Date('2027-03-01T10:00:00Z');

  it('conta le prenotazioni pagate e i posti trattenuti non scaduti', () => {
    const bookings = [
      { status: 'CONFIRMED', seatHeldUntil: null },
      { status: 'PENDING_PAYMENT', seatHeldUntil: new Date('2027-03-01T10:10:00Z') },
      { status: 'PENDING_PAYMENT', seatHeldUntil: new Date('2027-03-01T09:59:00Z') },
      { status: 'EXPIRED', seatHeldUntil: null },
      { status: 'REFUNDED', seatHeldUntil: null },
      { status: 'REFUND_PENDING', seatHeldUntil: null },
    ];
    expect(countOccupiedSeats(bookings, now)).toBe(2);
    expect(bookingOccupiesSeat(bookings[2], now)).toBe(false);
  });

  it('indica posti liberi, ultimi posti e completo', () => {
    expect(seatAvailability(8, 3)).toEqual({ freeSeats: 5, label: 'available' });
    expect(seatAvailability(8, 6)).toEqual({ freeSeats: 2, label: 'few' });
    expect(seatAvailability(8, 8)).toEqual({ freeSeats: 0, label: 'full' });
    expect(seatAvailability(8, 9)).toEqual({ freeSeats: 0, label: 'full' });
    expect(seatAvailabilityText(5)).toBe('5 posti liberi');
    expect(seatAvailabilityText(2)).toBe('Ultimi 2 posti');
    expect(seatAvailabilityText(1)).toBe('Ultimo posto');
    expect(seatAvailabilityText(0)).toBe('Completo');
  });
});

describe('date nel fuso orario italiano', () => {
  it('usa il giorno italiano anche a cavallo della mezzanotte UTC', () => {
    // 23:30 UTC del 28 maggio = 01:30 del 29 maggio in Italia (ora legale)
    expect(calendarDayInItaly(new Date('2027-05-28T23:30:00Z'))).toBe('2027-05-29');
  });

  it('consente la disdetta gratuita fino al giorno indicato incluso', () => {
    const deadline = day('2027-05-29');
    expect(isWithinFreeCancellation(deadline, new Date('2027-05-29T20:00:00Z'))).toBe(true);
    expect(isWithinFreeCancellation(deadline, new Date('2027-05-29T22:30:00Z'))).toBe(false); // 00:30 del 30 in Italia
    expect(isWithinFreeCancellation(deadline, new Date('2027-05-20T08:00:00Z'))).toBe(true);
  });

  it('considera futura una partenza da domani in poi', () => {
    const start = day('2027-06-12');
    expect(hasFutureDeparture(start, new Date('2027-06-11T12:00:00Z'))).toBe(true);
    expect(hasFutureDeparture(start, new Date('2027-06-12T06:00:00Z'))).toBe(false);
  });
});

describe('validazione del viaggio guidato', () => {
  const validInput = {
    title: 'Dolomiti: i grandi passi',
    description: 'Quattro giorni sui passi dolomitici.',
    startDate: '2027-06-12',
    endDate: '2027-06-15',
    meetingPoint: 'Bolzano, ore 8:30',
    pricePerPerson: '450',
    maxParticipants: '8',
    freeCancellationUntil: '2027-05-29',
    linkedTripId: null,
  };
  const now = new Date('2027-03-01T10:00:00Z');

  it('accetta un viaggio valido convertendo prezzo e posti in numeri', () => {
    const parsed = guidedTripFormSchema.parse(validInput);
    expect(parsed.pricePerPerson).toBe(450);
    expect(parsed.maxParticipants).toBe(8);
    expect(validateGuidedTripSchedule(parsed, { now })).toEqual({});
  });

  it('rifiuta prezzo non positivo e partecipanti non interi', () => {
    const result = guidedTripFormSchema.safeParse({ ...validInput, pricePerPerson: '0', maxParticipants: '2.5' });
    expect(result.success).toBe(false);
    const fields = result.success ? [] : result.error.issues.map(issue => issue.path[0]);
    expect(fields).toEqual(expect.arrayContaining(['pricePerPerson', 'maxParticipants']));
  });

  it('segnala partenza passata, rientro prima della partenza e scadenza oltre la partenza', () => {
    const errors = validateGuidedTripSchedule(
      { startDate: '2027-03-01', endDate: '2027-02-28', freeCancellationUntil: '2027-03-02', maxParticipants: 8 },
      { now },
    );
    expect(Object.keys(errors).sort()).toEqual(['endDate', 'freeCancellationUntil', 'startDate']);
  });

  it('non permette di scendere sotto i posti già occupati', () => {
    const errors = validateGuidedTripSchedule(
      { startDate: '2027-06-12', endDate: '2027-06-15', freeCancellationUntil: '2027-05-29', maxParticipants: 2 },
      { now, confirmedBookings: 3 },
    );
    expect(errors.maxParticipants).toMatch(/3 prenotazioni confermate/);
  });

  it('non blocca la modifica di un viaggio già partito se la data di partenza resta la stessa', () => {
    const errors = validateGuidedTripSchedule(
      { startDate: '2027-02-10', endDate: '2027-02-12', freeCancellationUntil: '2027-02-01', maxParticipants: 8 },
      { now, startDateUnchanged: true },
    );
    expect(errors).toEqual({});
  });
});

describe('stato della prenotazione mostrato all\'utente', () => {
  it('distingue la disdetta dell\'utente dall\'annullamento del viaggio', () => {
    expect(bookingStatusLabel({ status: 'REFUNDED', cancelledByUserAt: '2027-05-01T10:00:00Z' })).toBe('Disdetta · rimborsata');
    expect(bookingStatusLabel({ status: 'REFUNDED', cancelledByUserAt: null })).toBe('Viaggio annullato · rimborsata');
    expect(bookingStatusLabel({ status: 'REFUND_PENDING', cancelledByUserAt: null })).toBe('Viaggio annullato · rimborso in corso');
    expect(bookingStatusLabel({ status: 'CONFIRMED', cancelledByUserAt: null })).toBe('Confermata');
  });
});

describe('modalità di pagamento', () => {
  it('usa Stripe solo con entrambe le chiavi configurate', () => {
    expect(guidedTripPaymentMode({ STRIPE_SECRET_KEY: 'sk', NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk', NODE_ENV: 'production' })).toBe('stripe');
  });

  it('simula il pagamento solo fuori produzione e senza Stripe', () => {
    expect(guidedTripPaymentMode({ NODE_ENV: 'development' })).toBe('simulated');
    expect(guidedTripPaymentMode({ STRIPE_SECRET_KEY: 'sk', NODE_ENV: 'development' })).toBe('simulated');
  });

  it('non permette pagamenti simulati in produzione', () => {
    expect(guidedTripPaymentMode({ NODE_ENV: 'production' })).toBe('unavailable');
  });
});
