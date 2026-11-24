/**
 * Servizio dei viaggi guidati su un database in memoria.
 * Le transazioni del finto client sono serializzate come fa PostgreSQL con
 * SELECT … FOR UPDATE sulla riga del viaggio; il blocco reale è verificato a parte sul database.
 */
import { Prisma } from '@prisma/client'

type Row = Record<string, unknown> & { id: string }

const db = {
  users: [] as Row[],
  guidedTrips: [] as Row[],
  registrations: [] as Row[],
}

let idCounter = 0
let transactionQueue: Promise<unknown> = Promise.resolve()

function matches(row: Row, where: Record<string, unknown> = {}): boolean {
  return Object.entries(where).every(([key, condition]) => {
    const value = row[key]
    if (condition && typeof condition === 'object' && !(condition instanceof Date)) {
      const c = condition as { in?: unknown[]; gt?: Date }
      if (c.in) return c.in.includes(value)
      if (c.gt) return (value as Date).getTime() > c.gt.getTime()
    }
    return value === condition
  })
}

function withRelations(trip: Row) {
  const organizer = db.users.find(u => u.id === trip.organizerId)!
  const registrations = db.registrations
    .filter(r => r.guidedTripId === trip.id)
    .map(r => ({ ...r, participant: db.users.find(u => u.id === r.participantId) }))
  return { ...trip, organizer, registrations }
}

const mockPrismaClient: Record<string, unknown> = {
  guidedTrip: {
    findUnique: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
      const trip = db.guidedTrips.find(t => matches(t, where))
      return trip ? withRelations(trip) : null
    }),
    findUniqueOrThrow: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
      const trip = db.guidedTrips.find(t => matches(t, where))
      if (!trip) throw new Error('not found')
      return withRelations(trip)
    }),
    findMany: jest.fn(async ({ where }: { where?: Record<string, unknown> }) => db.guidedTrips.filter(t => matches(t, where)).map(withRelations)),
    create: jest.fn(async ({ data }: { data: Row }) => {
      const row = { ...data, id: `trip-${++idCounter}` }
      db.guidedTrips.push(row)
      return row
    }),
    update: jest.fn(async ({ where, data }: { where: { id: string }; data: Row }) => {
      const row = db.guidedTrips.find(t => t.id === where.id)!
      Object.assign(row, data)
      return row
    }),
  },
  guidedTripRegistration: {
    findUnique: jest.fn(async ({ where }: { where: { id: string } }) => db.registrations.find(r => r.id === where.id) ?? null),
    findUniqueOrThrow: jest.fn(async ({ where }: { where: { id: string } }) => {
      const row = db.registrations.find(r => r.id === where.id)
      if (!row) throw new Error('not found')
      return row
    }),
    create: jest.fn(async ({ data }: { data: Row }) => {
      const row = { cancellationOrigin: null, createdAt: new Date(), ...data, id: `reg-${++idCounter}` }
      db.registrations.push(row)
      return row
    }),
    update: jest.fn(async ({ where, data }: { where: { id: string }; data: Row }) => {
      const row = db.registrations.find(r => r.id === where.id)!
      Object.assign(row, data)
      return row
    }),
    updateMany: jest.fn(async ({ where, data }: { where: Record<string, unknown>; data: Row }) => {
      const rows = db.registrations.filter(r => matches(r, where))
      rows.forEach(r => Object.assign(r, data))
      return { count: rows.length }
    }),
  },
  $queryRaw: jest.fn(async () => []),
  $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>): Promise<unknown> => {
    const run: Promise<unknown> = transactionQueue.then(() => fn(mockPrismaClient))
    transactionQueue = run.catch(() => undefined)
    return run
  }),
}

jest.mock('@/lib/core/prisma', () => ({
  get prisma() {
    return mockPrismaClient
  },
}))

import { GuidedTripService, GuidedTripServiceError } from '@/lib/guided-trips/guided-trip-service'

const NOW = new Date('2027-03-01T10:00:00Z')
const ranger = { id: 'ranger', role: 'Ranger' as const }
const sentinel = { id: 'sentinel', role: 'Sentinel' as const }
const franco = { id: 'franco', role: 'Explorer' as const }
const lucia = { id: 'lucia', role: 'Explorer' as const }
const explorerAsUser = (id: string) => ({ id, role: 'Explorer' as const })

function addTrip(overrides: Partial<Row> = {}): Row {
  const trip: Row = {
    id: `trip-${++idCounter}`,
    slug: `viaggio-${idCounter}`,
    title: 'Dolomiti, passi e rifugi',
    description: 'Descrizione',
    program: 'Giorno 1\nGiorno 2',
    includedServices: null,
    coverImageUrl: null,
    departureDate: new Date('2027-06-14T00:00:00Z'),
    returnDate: new Date('2027-06-16T00:00:00Z'),
    meetingPoint: 'Bassano',
    maxParticipants: 8,
    pricePerParticipant: new Prisma.Decimal('450.00'),
    registrationDeadline: new Date('2027-05-31T00:00:00Z'),
    cancellationNoticeDays: 14,
    status: 'Pubblicato',
    publishedAt: NOW,
    cancelledAt: null,
    organizerId: ranger.id,
    ...overrides,
  }
  db.guidedTrips.push(trip)
  return trip
}

async function expectServiceError(promise: Promise<unknown>, status: number, message?: RegExp) {
  const error = await promise.then(() => null, e => e)
  expect(error).toBeInstanceOf(GuidedTripServiceError)
  expect((error as GuidedTripServiceError).httpStatus).toBe(status)
  if (message) expect((error as Error).message).toMatch(message)
}

beforeEach(() => {
  db.users = ['ranger', 'sentinel', 'franco', 'lucia', 'anna', 'giorgio'].map(id => ({ id, name: id, email: `${id}@example.com`, image: null }))
  db.guidedTrips = []
  db.registrations = []
  transactionQueue = Promise.resolve()
})

describe('creazione e pubblicazione', () => {
  const input = {
    title: 'Dolomiti, passi e rifugi',
    description: 'Tre giorni sui passi',
    program: 'Giorno 1',
    departureDate: '2027-06-14',
    returnDate: '2027-06-16',
    meetingPoint: 'Bassano',
    maxParticipants: 8,
    pricePerParticipant: 450,
    registrationDeadline: '2027-05-31',
    cancellationNoticeDays: 14,
  }

  it('il Ranger crea una bozza e la pubblica direttamente', async () => {
    const created = await GuidedTripService.create(ranger, input)
    expect(created.slug).toBe('dolomiti-passi-e-rifugi')
    expect(db.guidedTrips[0].status).toBe('Bozza')

    await GuidedTripService.publish(created.id, ranger, NOW)
    expect(db.guidedTrips[0].status).toBe('Pubblicato')
    expect(db.guidedTrips[0].publishedAt).toBe(NOW)
  })

  it('un Explorer non può organizzare né pubblicare viaggi altrui', async () => {
    await expectServiceError(GuidedTripService.create(franco, input), 403)
    const trip = addTrip({ status: 'Bozza' })
    await expectServiceError(GuidedTripService.publish(trip.id, franco, NOW), 403)
  })

  it('la bozza è visibile solo all\'organizzatore e al Sentinel', async () => {
    const trip = addTrip({ status: 'Bozza' })
    expect(await GuidedTripService.getPublicBySlug(trip.slug as string, franco, NOW)).toBeNull()
    expect(await GuidedTripService.getPublicBySlug(trip.slug as string, null, NOW)).toBeNull()
    expect((await GuidedTripService.getPublicBySlug(trip.slug as string, ranger, NOW))?.viewerIsOrganizer).toBe(true)
    expect(await GuidedTripService.getPublicBySlug(trip.slug as string, sentinel, NOW)).not.toBeNull()
  })
})

describe('iscrizione a numero chiuso', () => {
  it('iscrizione e pagamento: il posto viene confermato e i posti rimasti scendono', async () => {
    const trip = addTrip()
    const started = await GuidedTripService.startRegistration(trip.id, franco, NOW)
    expect(started.amount).toBe(450)

    const before = await GuidedTripService.getPublicBySlug(trip.slug as string, franco, NOW)
    expect(before?.trip.seats.availableSeats).toBe(7)
    expect(before?.viewerRegistration?.status).toBe('PENDING_PAYMENT')

    await GuidedTripService.completeRegistrationPayment(started.registrationId, { method: 'simulated' }, NOW)
    const after = await GuidedTripService.getPublicBySlug(trip.slug as string, franco, NOW)
    expect(after?.trip.seats).toMatchObject({ confirmedParticipants: 1, availableSeats: 7 })
    expect(after?.viewerRegistration).toMatchObject({ status: 'CONFIRMED', canSelfCancel: true })
  })

  it('con un solo posto e due richieste contemporanee, solo una ottiene il posto', async () => {
    const trip = addTrip({ maxParticipants: 1 })
    const results = await Promise.allSettled([
      GuidedTripService.startRegistration(trip.id, franco, NOW),
      GuidedTripService.startRegistration(trip.id, lucia, NOW),
    ])
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1)
    const rejected = results.find(r => r.status === 'rejected') as PromiseRejectedResult
    expect(rejected.reason.message).toBe('Posti esauriti')
  })

  it('non si superano mai i posti massimi con molte richieste contemporanee', async () => {
    const trip = addTrip({ maxParticipants: 3 })
    db.users.push(...['u1', 'u2', 'u3', 'u4', 'u5', 'u6'].map(id => ({ id, name: id, email: `${id}@example.com`, image: null })))
    const results = await Promise.allSettled(['u1', 'u2', 'u3', 'u4', 'u5', 'u6'].map(id => GuidedTripService.startRegistration(trip.id, explorerAsUser(id), NOW)))
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(3)
  })

  it('un posto trattenuto e non pagato torna libero dopo 15 minuti', async () => {
    const trip = addTrip({ maxParticipants: 1 })
    await GuidedTripService.startRegistration(trip.id, franco, NOW)
    await expectServiceError(GuidedTripService.startRegistration(trip.id, lucia, new Date('2027-03-01T10:10:00Z')), 409, /Posti esauriti/)
    await expect(GuidedTripService.startRegistration(trip.id, lucia, new Date('2027-03-01T10:16:00Z'))).resolves.toBeDefined()
  })

  it('riprendere il pagamento riusa lo stesso posto trattenuto', async () => {
    const trip = addTrip({ maxParticipants: 1 })
    const first = await GuidedTripService.startRegistration(trip.id, franco, NOW)
    const second = await GuidedTripService.startRegistration(trip.id, franco, new Date('2027-03-01T10:05:00Z'))
    expect(second.registrationId).toBe(first.registrationId)
    expect(db.registrations).toHaveLength(1)
  })

  it('l\'organizzatore non può iscriversi e non ci si iscrive due volte', async () => {
    const trip = addTrip()
    await expectServiceError(GuidedTripService.startRegistration(trip.id, ranger, NOW), 409, /organizzi/)
    const started = await GuidedTripService.startRegistration(trip.id, franco, NOW)
    await GuidedTripService.completeRegistrationPayment(started.registrationId, { method: 'simulated' }, NOW)
    await expectServiceError(GuidedTripService.startRegistration(trip.id, franco, NOW), 409, /già iscritto/)
  })

  it('le iscrizioni sono chiuse dopo la scadenza, in bozza e per viaggi annullati', async () => {
    const trip = addTrip()
    await expectServiceError(GuidedTripService.startRegistration(trip.id, franco, new Date('2027-06-02T10:00:00Z')), 409, /Iscrizioni chiuse/)
    const draft = addTrip({ status: 'Bozza' })
    await expectServiceError(GuidedTripService.startRegistration(draft.id, franco, NOW), 409)
    const cancelled = addTrip({ status: 'Annullato' })
    await expectServiceError(GuidedTripService.startRegistration(cancelled.id, franco, NOW), 409, /annullato/)
  })

  it('un pagamento arrivato dopo che il posto è stato preso da altri diventa da rimborsare', async () => {
    const trip = addTrip({ maxParticipants: 1 })
    const late = await GuidedTripService.startRegistration(trip.id, franco, NOW)
    const later = new Date('2027-03-01T10:20:00Z')
    const other = await GuidedTripService.startRegistration(trip.id, lucia, later)
    await GuidedTripService.completeRegistrationPayment(other.registrationId, { method: 'simulated' }, later)

    await expectServiceError(
      GuidedTripService.completeRegistrationPayment(late.registrationId, { method: 'stripe', stripePaymentId: 'pi_1' }, later),
      409,
      /Posti esauriti.*rimborsato/,
    )
    expect(db.registrations.find(r => r.id === late.registrationId)).toMatchObject({ status: 'REFUND_DUE', stripePaymentId: 'pi_1' })
  })

  it('la conferma del pagamento è idempotente (browser + webhook)', async () => {
    const trip = addTrip()
    const started = await GuidedTripService.startRegistration(trip.id, franco, NOW)
    await GuidedTripService.completeRegistrationPayment(started.registrationId, { method: 'stripe', stripePaymentId: 'pi_1' }, NOW)
    await GuidedTripService.completeRegistrationPayment(started.registrationId, { method: 'stripe', stripePaymentId: 'pi_1' }, NOW)
    expect(db.registrations.filter(r => r.status === 'CONFIRMED')).toHaveLength(1)
  })
})

describe('disdetta, annullamento e rimborsi', () => {
  async function confirmed(tripId: string, user: { id: string; role: 'Explorer' }) {
    const started = await GuidedTripService.startRegistration(tripId, user, NOW)
    await GuidedTripService.completeRegistrationPayment(started.registrationId, { method: 'simulated' }, NOW)
    return started.registrationId
  }

  it('il partecipante disdice entro il preavviso: posto libero e rimborso dovuto', async () => {
    const trip = addTrip({ maxParticipants: 1 })
    const registrationId = await confirmed(trip.id, franco)

    await GuidedTripService.cancelByParticipant(registrationId, franco.id, new Date('2027-05-20T10:00:00Z'))
    expect(db.registrations[0]).toMatchObject({ status: 'REFUND_DUE', cancellationOrigin: 'PARTICIPANT' })
    await expect(GuidedTripService.startRegistration(trip.id, lucia, new Date('2027-05-20T11:00:00Z'))).resolves.toBeDefined()
  })

  it('oltre il preavviso la disdetta non è possibile; nessuno può disdire per altri', async () => {
    const trip = addTrip()
    const registrationId = await confirmed(trip.id, franco)
    await expectServiceError(GuidedTripService.cancelByParticipant(registrationId, lucia.id, NOW), 403)
    await expectServiceError(GuidedTripService.cancelByParticipant(registrationId, franco.id, new Date('2027-06-05T10:00:00Z')), 409, /14 giorni/)
    expect(db.registrations[0].status).toBe('CONFIRMED')
  })

  it('l\'annullamento del Ranger rende da rimborsare tutte le iscrizioni confermate', async () => {
    const trip = addTrip()
    await confirmed(trip.id, franco)
    await confirmed(trip.id, lucia)

    const result = await GuidedTripService.cancelTrip(trip.id, ranger, NOW)
    expect(result.refundDueCount).toBe(2)
    expect(db.guidedTrips[0].status).toBe('Annullato')
    expect(db.registrations.every(r => r.status === 'REFUND_DUE' && r.cancellationOrigin === 'ORGANIZER')).toBe(true)
    await expectServiceError(GuidedTripService.cancelTrip(trip.id, franco, NOW), 403)
  })

  it('solo il Sentinel segna come rimborsate le iscrizioni da rimborsare', async () => {
    const trip = addTrip()
    const registrationId = await confirmed(trip.id, franco)
    await expectServiceError(GuidedTripService.markRefunded(registrationId, ranger, undefined, NOW), 403)
    await expectServiceError(GuidedTripService.markRefunded(registrationId, sentinel, undefined, NOW), 409)

    await GuidedTripService.cancelByParticipant(registrationId, franco.id, NOW)
    await GuidedTripService.markRefunded(registrationId, sentinel, 'Bonifico del 2 marzo', NOW)
    expect(db.registrations[0]).toMatchObject({ status: 'REFUNDED', refundedById: 'sentinel', refundNote: 'Bonifico del 2 marzo' })
  })
})

describe('gestione da parte del Ranger', () => {
  it('mostra i partecipanti solo a organizzatore e Sentinel, senza i pagamenti in corso', async () => {
    const trip = addTrip()
    const started = await GuidedTripService.startRegistration(trip.id, franco, NOW)
    await GuidedTripService.completeRegistrationPayment(started.registrationId, { method: 'simulated' }, NOW)
    await GuidedTripService.startRegistration(trip.id, lucia, NOW)

    const management = await GuidedTripService.getForManagement(trip.id, ranger, NOW)
    expect(management.participants.map(p => p.email)).toEqual(['franco@example.com'])
    expect(management.trip.seats).toMatchObject({ confirmedParticipants: 1, occupiedSeats: 2 })
    await expectServiceError(GuidedTripService.getForManagement(trip.id, franco, NOW), 403)
  })

  it('non permette di ridurre i posti sotto gli iscritti né di cambiare prezzo con iscrizioni', async () => {
    const trip = addTrip()
    const registrationId = (await GuidedTripService.startRegistration(trip.id, franco, NOW)).registrationId
    await GuidedTripService.completeRegistrationPayment(registrationId, { method: 'simulated' }, NOW)
    const input = {
      title: 'Nuovo titolo',
      description: 'Descrizione aggiornata',
      program: 'Giorno 1',
      departureDate: '2027-06-14',
      returnDate: '2027-06-16',
      meetingPoint: 'Bassano, ore 9',
      maxParticipants: 8,
      pricePerParticipant: 450,
      registrationDeadline: '2027-05-31',
      cancellationNoticeDays: 14,
    }
    await expectServiceError(GuidedTripService.update(trip.id, ranger, { ...input, pricePerParticipant: 300 }, NOW), 409, /prezzo/)
    await expectServiceError(GuidedTripService.update(trip.id, ranger, { ...input, maxParticipants: 0 }, NOW), 409, /posti massimi/)
    await GuidedTripService.update(trip.id, ranger, input, NOW)
    expect(db.guidedTrips[0]).toMatchObject({ title: 'Nuovo titolo', meetingPoint: 'Bassano, ore 9' })
  })
})
