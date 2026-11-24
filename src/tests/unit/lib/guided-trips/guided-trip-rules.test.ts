import {
  calendarDayFromIsoDate,
  canParticipantSelfCancel,
  computeSeatAvailability,
  formatCalendarRange,
  guidedTripDisplayStatus,
  guidedTripEditViolation,
  isSeatOccupied,
  programDays,
  registrationClosedReason,
  seatHoldExpiry,
  selfCancellationLastDay,
  slugifyGuidedTripTitle,
} from '@/lib/guided-trips/guided-trip-rules'

const day = calendarDayFromIsoDate
const at = (iso: string) => new Date(iso)

describe('posti di un viaggio guidato', () => {
  const now = at('2027-03-01T10:00:00Z')

  it('conta come occupati i confermati e i pagamenti in corso non scaduti', () => {
    expect(isSeatOccupied({ status: 'CONFIRMED', seatHoldExpiresAt: null }, now)).toBe(true)
    expect(isSeatOccupied({ status: 'PENDING_PAYMENT', seatHoldExpiresAt: at('2027-03-01T10:05:00Z') }, now)).toBe(true)
    expect(isSeatOccupied({ status: 'PENDING_PAYMENT', seatHoldExpiresAt: at('2027-03-01T09:59:00Z') }, now)).toBe(false)
    expect(isSeatOccupied({ status: 'REFUND_DUE', seatHoldExpiresAt: null }, now)).toBe(false)
    expect(isSeatOccupied({ status: 'REFUNDED', seatHoldExpiresAt: null }, now)).toBe(false)
    expect(isSeatOccupied({ status: 'PAYMENT_FAILED', seatHoldExpiresAt: null }, now)).toBe(false)
  })

  it('calcola i posti rimasti: una disdetta libera il posto', () => {
    const seats = computeSeatAvailability(
      8,
      [
        { status: 'CONFIRMED', seatHoldExpiresAt: null },
        { status: 'CONFIRMED', seatHoldExpiresAt: null },
        { status: 'PENDING_PAYMENT', seatHoldExpiresAt: at('2027-03-01T10:10:00Z') },
        { status: 'REFUND_DUE', seatHoldExpiresAt: null },
      ],
      now,
    )
    expect(seats).toEqual({ maxParticipants: 8, confirmedParticipants: 2, occupiedSeats: 3, availableSeats: 5 })
  })

  it('non scende mai sotto zero posti disponibili', () => {
    const seats = computeSeatAvailability(1, [
      { status: 'CONFIRMED', seatHoldExpiresAt: null },
      { status: 'CONFIRMED', seatHoldExpiresAt: null },
    ], now)
    expect(seats.availableSeats).toBe(0)
  })

  it('trattiene il posto per 15 minuti durante il pagamento', () => {
    expect(seatHoldExpiry(now).toISOString()).toBe('2027-03-01T10:15:00.000Z')
  })
})

describe('apertura delle iscrizioni', () => {
  const base = { status: 'Pubblicato' as const, departureDate: day('2027-06-14'), registrationDeadline: day('2027-05-31'), availableSeats: 3 }

  it('è aperta per un viaggio pubblicato, con posti, entro la scadenza (inclusa l\'intera giornata)', () => {
    expect(registrationClosedReason(base, at('2027-05-31T22:00:00Z'))).toBeNull()
  })

  it('si chiude dopo la scadenza, alla partenza, a posti esauriti, in bozza o se annullato', () => {
    expect(registrationClosedReason(base, at('2027-06-01T00:00:01Z'))).toBe('deadline_passed')
    expect(registrationClosedReason({ ...base, registrationDeadline: day('2027-06-14') }, at('2027-06-14T08:00:00Z'))).toBe('departed')
    expect(registrationClosedReason({ ...base, availableSeats: 0 }, at('2027-05-01T08:00:00Z'))).toBe('sold_out')
    expect(registrationClosedReason({ ...base, status: 'Bozza' }, at('2027-05-01T08:00:00Z'))).toBe('not_published')
    expect(registrationClosedReason({ ...base, status: 'Annullato' }, at('2027-05-01T08:00:00Z'))).toBe('cancelled')
  })
})

describe('disdetta autonoma', () => {
  const departure = day('2027-06-14')

  it('è consentita fino all\'intera giornata che cade N giorni prima della partenza', () => {
    expect(selfCancellationLastDay(departure, 14).toISOString().slice(0, 10)).toBe('2027-05-31')
    expect(canParticipantSelfCancel(departure, 14, at('2027-05-20T10:00:00Z'))).toBe(true)
    expect(canParticipantSelfCancel(departure, 14, at('2027-05-31T23:00:00Z'))).toBe(true)
    expect(canParticipantSelfCancel(departure, 14, at('2027-06-01T00:00:01Z'))).toBe(false)
    expect(canParticipantSelfCancel(departure, 14, at('2027-06-05T10:00:00Z'))).toBe(false)
  })

  it('con preavviso zero è consentita fino al giorno della partenza', () => {
    expect(canParticipantSelfCancel(departure, 0, at('2027-06-14T12:00:00Z'))).toBe(true)
    expect(canParticipantSelfCancel(departure, 0, at('2027-06-15T00:00:01Z'))).toBe(false)
  })
})

describe('modifiche dopo le iscrizioni', () => {
  it('impedisce di scendere sotto gli iscritti e di cambiare prezzo se ci sono iscrizioni', () => {
    expect(guidedTripEditViolation({ confirmedParticipants: 3, hasAnyRegistration: true, currentPrice: 450, requestedMaxParticipants: 2, requestedPrice: 450 })).toMatch(/sotto i 3/)
    expect(guidedTripEditViolation({ confirmedParticipants: 3, hasAnyRegistration: true, currentPrice: 450, requestedMaxParticipants: 3, requestedPrice: 400 })).toMatch(/prezzo/)
    expect(guidedTripEditViolation({ confirmedParticipants: 3, hasAnyRegistration: true, currentPrice: 450, requestedMaxParticipants: 10, requestedPrice: 450 })).toBeNull()
    expect(guidedTripEditViolation({ confirmedParticipants: 0, hasAnyRegistration: false, currentPrice: 450, requestedMaxParticipants: 1, requestedPrice: 300 })).toBeNull()
  })
})

describe('stato mostrato e formattazione', () => {
  it('un viaggio pubblicato il cui rientro è passato risulta concluso', () => {
    expect(guidedTripDisplayStatus('Pubblicato', day('2027-06-16'), at('2027-06-16T20:00:00Z'))).toBe('Pubblicato')
    expect(guidedTripDisplayStatus('Pubblicato', day('2027-06-16'), at('2027-06-17T08:00:00Z'))).toBe('Concluso')
    expect(guidedTripDisplayStatus('Annullato', day('2027-06-16'), at('2027-07-01T08:00:00Z'))).toBe('Annullato')
  })

  it('formatta l\'intervallo di date in italiano', () => {
    expect(formatCalendarRange(day('2027-06-14'), day('2027-06-16'))).toBe('14 – 16 giugno 2027')
    expect(formatCalendarRange(day('2027-06-30'), day('2027-07-02'))).toBe('30 giugno – 2 luglio 2027')
    expect(formatCalendarRange(day('2027-06-14'), day('2027-06-14'))).toBe('14 giugno 2027')
  })

  it('crea slug leggibili e divide il programma per giorno', () => {
    expect(slugifyGuidedTripTitle('Costiera all\'alba: è bellissima!')).toBe('costiera-all-alba-e-bellissima')
    expect(slugifyGuidedTripTitle('!!!')).toBe('viaggio-guidato')
    expect(programDays('Giorno uno\n\n  Giorno due  \r\nGiorno tre')).toEqual(['Giorno uno', 'Giorno due', 'Giorno tre'])
  })
})
