import { GuidedTripBookingStatus, GuidedTripStatus } from '@prisma/client';
import {
  bookingOccupiesSeat,
  changeProblemsWithBookings,
  countRemainingSeats,
  isBookable,
  isParticipantCancellationAllowed,
  parseCalendarDate,
  participantCancellationDeadline,
  publicationProblems,
  sanitizeCancellationReason,
  seatHoldExpiry,
} from '@/lib/guided-trips/guidedTripRules';

const day = (iso: string) => parseCalendarDate(iso) as Date;
const now = new Date('2027-05-20T10:00:00Z');

describe('posti occupati', () => {
  const confirmed = { status: GuidedTripBookingStatus.CONFIRMED, seatHeldUntil: new Date('2027-01-01T00:00:00Z') };
  const activeHold = { status: GuidedTripBookingStatus.PENDING_PAYMENT, seatHeldUntil: new Date('2027-05-20T10:10:00Z') };
  const expiredHold = { status: GuidedTripBookingStatus.PENDING_PAYMENT, seatHeldUntil: new Date('2027-05-20T09:59:59Z') };
  const cancelled = { status: GuidedTripBookingStatus.CANCELLED_BY_PARTICIPANT, seatHeldUntil: new Date('2027-06-01T00:00:00Z') };

  it('conta le prenotazioni confermate e le riserve non scadute, non le altre', () => {
    expect(bookingOccupiesSeat(confirmed, now)).toBe(true);
    expect(bookingOccupiesSeat(activeHold, now)).toBe(true);
    expect(bookingOccupiesSeat(expiredHold, now)).toBe(false);
    expect(bookingOccupiesSeat(cancelled, now)).toBe(false);
    expect(countRemainingSeats(8, [confirmed, activeHold, expiredHold, cancelled], now)).toBe(6);
  });

  it('non scende mai sotto zero posti rimasti', () => {
    expect(countRemainingSeats(1, [confirmed, activeHold], now)).toBe(0);
  });

  it('riserva il posto per 15 minuti', () => {
    expect(seatHoldExpiry(now).toISOString()).toBe('2027-05-20T10:15:00.000Z');
  });
});

describe('disdetta del partecipante: 14 giorni prima della partenza', () => {
  const startDate = day('2027-06-12');

  it('la scadenza è il 29 maggio per una partenza il 12 giugno', () => {
    expect(participantCancellationDeadline(startDate).toISOString()).toBe('2027-05-29T00:00:00.000Z');
  });

  it('consente la disdetta fino al giorno di scadenza incluso', () => {
    expect(isParticipantCancellationAllowed(startDate, new Date('2027-05-20T10:00:00Z'))).toBe(true);
    expect(isParticipantCancellationAllowed(startDate, new Date('2027-05-29T23:59:00Z'))).toBe(true);
    expect(isParticipantCancellationAllowed(startDate, new Date('2027-05-30T00:00:00Z'))).toBe(false);
    expect(isParticipantCancellationAllowed(startDate, new Date('2027-06-05T08:00:00Z'))).toBe(false);
  });
});

describe('prenotabilità', () => {
  it('solo un viaggio pubblicato e non ancora partito è prenotabile', () => {
    expect(isBookable({ status: GuidedTripStatus.Pubblicato, startDate: day('2027-05-21') }, now)).toBe(true);
    expect(isBookable({ status: GuidedTripStatus.Pubblicato, startDate: day('2027-05-20') }, now)).toBe(false);
    expect(isBookable({ status: GuidedTripStatus.Bozza, startDate: day('2027-06-12') }, now)).toBe(false);
    expect(isBookable({ status: GuidedTripStatus.Annullato, startDate: day('2027-06-12') }, now)).toBe(false);
  });
});

describe('pubblicazione', () => {
  const valid = {
    title: 'Dolomiti in gruppo',
    description: 'Quattro giorni sui passi',
    startDate: day('2027-06-12'),
    endDate: day('2027-06-15'),
    meetingPoint: 'Bolzano',
    pricePerPerson: 450,
    maxParticipants: 8,
  };

  it('accetta un viaggio completo con partenza futura', () => {
    expect(publicationProblems(valid, now)).toEqual([]);
  });

  it('segnala date incoerenti, prezzo nullo, posti mancanti e partenza passata', () => {
    expect(publicationProblems({ ...valid, endDate: day('2027-06-11') }, now)).toContain('La data di rientro non può precedere la partenza');
    expect(publicationProblems({ ...valid, pricePerPerson: 0 }, now)).toContain('Il prezzo a persona deve essere maggiore di zero');
    expect(publicationProblems({ ...valid, maxParticipants: 0 }, now)).toContain('Serve almeno un posto disponibile');
    expect(publicationProblems({ ...valid, startDate: day('2027-05-20'), endDate: day('2027-05-22') }, now)).toContain('La data di partenza deve essere futura');
  });
});

describe('modifiche dopo le prenotazioni', () => {
  const current = { pricePerPerson: 450, startDate: day('2027-06-12'), endDate: day('2027-06-15') };

  it('senza prenotazioni prezzo e date sono liberi', () => {
    expect(changeProblemsWithBookings(current, { pricePerPerson: 500, startDate: day('2027-06-13'), endDate: day('2027-06-16') }, 0)).toEqual([]);
  });

  it('dopo la prima prenotazione blocca prezzo e date', () => {
    const problems = changeProblemsWithBookings(current, { pricePerPerson: 500, startDate: day('2027-06-13'), endDate: day('2027-06-16') }, 1);
    expect(problems).toEqual([
      'Il prezzo non è modificabile dopo la prima prenotazione',
      'La data di partenza non è modificabile dopo la prima prenotazione',
      'La data di rientro non è modificabile dopo la prima prenotazione',
    ]);
    expect(changeProblemsWithBookings(current, { ...current, maxParticipants: 10 }, 3)).toEqual([]);
  });

  it('i posti massimi non scendono sotto quelli occupati', () => {
    expect(changeProblemsWithBookings(current, { maxParticipants: 2 }, 3)).toEqual(['I posti massimi non possono essere meno dei 3 già prenotati']);
    expect(changeProblemsWithBookings(current, { maxParticipants: 3 }, 3)).toEqual([]);
  });
});

describe('date di calendario e motivo di annullamento', () => {
  it('accetta solo date reali AAAA-MM-GG', () => {
    expect(parseCalendarDate('2027-06-12')?.toISOString()).toBe('2027-06-12T00:00:00.000Z');
    expect(parseCalendarDate('2027-02-30')).toBeNull();
    expect(parseCalendarDate('12/06/2027')).toBeNull();
  });

  it('richiede un motivo di almeno 3 caratteri', () => {
    expect(sanitizeCancellationReason('  Allerta meteo  ')).toBe('Allerta meteo');
    expect(sanitizeCancellationReason('  ')).toBeNull();
    expect(sanitizeCancellationReason(undefined)).toBeNull();
  });
});
