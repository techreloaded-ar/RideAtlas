import type { PrismaClient } from '@prisma/client'
import {
  assertDemoSeedAllowed,
  seedDemoData,
  DEMO_GUIDED_TRIP_BOOKINGS,
  DEMO_GUIDED_TRIPS,
  DEMO_PURCHASES,
  DEMO_TRIPS,
  DEMO_USERS,
} from '../../../../prisma/demo-data'
import { stageSchema, tripFormSchema } from '@/schemas/trip'

const LOCAL_URL = 'postgresql://rideatlas:rideatlas-local-only@127.0.0.1:5432/rideatlas'

describe('assertDemoSeedAllowed', () => {
  it('accetta un database locale con consenso esplicito', () => {
    expect(() => assertDemoSeedAllowed({ RIDEATLAS_DEMO_DATA: '1', DATABASE_URL: LOCAL_URL })).not.toThrow()
    expect(() => assertDemoSeedAllowed({ RIDEATLAS_DEMO_DATA: '1', DATABASE_URL: 'postgres://u:p@localhost/db' })).not.toThrow()
  })

  it('rifiuta senza consenso esplicito', () => {
    expect(() => assertDemoSeedAllowed({ DATABASE_URL: LOCAL_URL })).toThrow(/RIDEATLAS_DEMO_DATA=1/)
    expect(() => assertDemoSeedAllowed({ RIDEATLAS_DEMO_DATA: 'true', DATABASE_URL: LOCAL_URL })).toThrow(/RIDEATLAS_DEMO_DATA=1/)
  })

  it('rifiuta in produzione', () => {
    expect(() => assertDemoSeedAllowed({ RIDEATLAS_DEMO_DATA: '1', NODE_ENV: 'production', DATABASE_URL: LOCAL_URL })).toThrow(/production/)
  })

  it('rifiuta un database non locale, assente o non PostgreSQL', () => {
    expect(() => assertDemoSeedAllowed({ RIDEATLAS_DEMO_DATA: '1', DATABASE_URL: 'postgresql://u:p@db.example.com:5432/rideatlas' })).toThrow(/non è locale/)
    expect(() => assertDemoSeedAllowed({ RIDEATLAS_DEMO_DATA: '1', DATABASE_URL: 'postgresql://u:p@127.0.0.1.example.com/rideatlas' })).toThrow(/non è locale/)
    expect(() => assertDemoSeedAllowed({ RIDEATLAS_DEMO_DATA: '1' })).toThrow(/DATABASE_URL/)
    expect(() => assertDemoSeedAllowed({ RIDEATLAS_DEMO_DATA: '1', DATABASE_URL: 'mysql://u:p@127.0.0.1/rideatlas' })).toThrow(/PostgreSQL/)
  })
})

type Row = Record<string, unknown> & { id: string }

// Client finto con sole letture e creazioni: qualsiasi update/upsert/delete fallirebbe.
function fakePrisma() {
  const tables = { user: [] as Row[], trip: [] as Row[], tripPurchase: [] as Row[], guidedTrip: [] as Row[], guidedTripBooking: [] as Row[] }
  const model = (rows: Row[]) => ({
    findUnique: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
      const [key, value] = Object.entries(where)[0]
      return rows.find(r => r[key] === value) ?? null
    }),
    create: jest.fn(async ({ data }: { data: Row }) => {
      rows.push({ ...data })
      return data
    }),
  })
  const client = {
    user: model(tables.user),
    trip: model(tables.trip),
    tripPurchase: model(tables.tripPurchase),
    guidedTrip: model(tables.guidedTrip),
    guidedTripBooking: model(tables.guidedTripBooking),
  }
  return { tables, client, prisma: client as unknown as PrismaClient }
}

describe('seedDemoData', () => {
  const hash = jest.fn(async () => 'hashed')

  beforeEach(() => hash.mockClear())

  it('crea il catalogo completo su un database vuoto', async () => {
    const { tables } = await (async () => {
      const f = fakePrisma()
      await seedDemoData(f.prisma, hash)
      return f
    })()

    expect(tables.user.map(u => u.email)).toEqual(DEMO_USERS.map(u => u.email))
    expect(tables.trip.map(t => t.id)).toEqual(DEMO_TRIPS.map(t => t.id))
    expect(tables.tripPurchase.map(p => p.id)).toEqual(DEMO_PURCHASES.map(p => p.id))
    expect(tables.user.every(u => u.password === 'hashed' && u.emailVerified instanceof Date)).toBe(true)
    expect(hash).toHaveBeenCalledTimes(1)

    const dolomiti = tables.trip.find(t => t.id === 'demo-trip-dolomiti')!
    expect(dolomiti.status).toBe('Pubblicato')
    expect((dolomiti.stages as { create: { orderIndex: number }[] }).create.map(s => s.orderIndex)).toEqual([0, 1, 2, 3])
  })

  it('crea viaggi guidati con date future rispetto alla preparazione e prenotazioni coerenti', async () => {
    const f = fakePrisma()
    const now = new Date('2030-03-10T15:00:00Z')
    await seedDemoData(f.prisma, hash, () => {}, now)

    expect(f.tables.guidedTrip.map(g => g.id)).toEqual(DEMO_GUIDED_TRIPS.map(g => g.id))
    expect(f.tables.guidedTripBooking.map(b => b.id)).toEqual(DEMO_GUIDED_TRIP_BOOKINGS.map(b => b.id))
    const dolomiti = f.tables.guidedTrip.find(g => g.id === 'demo-guided-dolomiti')!
    expect((dolomiti.startDate as Date).toISOString()).toBe('2030-05-09T00:00:00.000Z')
    expect((dolomiti.endDate as Date).toISOString()).toBe('2030-05-12T00:00:00.000Z')
    expect(dolomiti.linkedTrip).toEqual({ connect: { id: 'demo-trip-dolomiti' } })
    expect(new Set(DEMO_GUIDED_TRIPS.map(g => g.status))).toEqual(new Set(['Pubblicato', 'Bozza', 'Annullato']))

    // Un viaggio esaurito e nessun viaggio con più prenotazioni confermate che posti
    for (const guided of DEMO_GUIDED_TRIPS) {
      const confirmed = DEMO_GUIDED_TRIP_BOOKINGS.filter(b => b.guidedTrip === guided.id && b.status === 'CONFIRMED').length
      expect(confirmed).toBeLessThanOrEqual(guided.maxParticipants)
    }
    expect(DEMO_GUIDED_TRIPS.some(g => g.status === 'Pubblicato'
      && DEMO_GUIDED_TRIP_BOOKINGS.filter(b => b.guidedTrip === g.id && b.status === 'CONFIRMED').length === g.maxParticipants)).toBe(true)
    // Nessun organizzatore prenota il proprio viaggio
    for (const booking of DEMO_GUIDED_TRIP_BOOKINGS) {
      expect(DEMO_GUIDED_TRIPS.find(g => g.id === booking.guidedTrip)?.organizer).not.toBe(booking.participant)
    }
  })

  it('copre combinazioni diverse di ruoli, stati e acquisti', () => {
    expect(new Set(DEMO_USERS.map(u => u.role))).toEqual(new Set(['Ranger', 'Explorer', 'Sentinel']))
    expect(new Set(DEMO_TRIPS.map(t => t.status))).toEqual(new Set(['Pubblicato', 'Bozza', 'Pronto_per_revisione', 'Archiviato']))
    expect(DEMO_TRIPS.some(t => t.stages.length === 0)).toBe(true)
    expect(DEMO_TRIPS.some(t => Number(t.price) === 0)).toBe(true)
    expect(new Set(DEMO_PURCHASES.map(p => p.status))).toEqual(new Set(['COMPLETED', 'REFUNDED', 'PENDING']))
    expect(DEMO_PURCHASES.some(p => p.buyer === 'demo-user-paolo')).toBe(false)
    for (const p of DEMO_PURCHASES) {
      expect(DEMO_TRIPS.find(t => t.id === p.trip)?.status).toBe('Pubblicato')
    }
  })

  it('ha media validi per lo schema dell\'app, così i viaggi demo restano modificabili', () => {
    for (const trip of DEMO_TRIPS) {
      expect(tripFormSchema.shape.media.safeParse(trip.media ?? []).success).toBe(true)
      for (const stage of trip.stages) {
        expect(stageSchema.shape.media.safeParse(stage.media ?? []).success).toBe(true)
      }
    }
  })

  it('usa solo immagini di images.unsplash.com, con id unici in ogni viaggio', () => {
    for (const trip of DEMO_TRIPS) {
      const media = [...(trip.media ?? []), ...trip.stages.flatMap(s => s.media ?? [])]
      for (const item of media) {
        expect(item.type).toBe('image')
        expect(new URL(item.url).hostname).toBe('images.unsplash.com')
        expect(item.caption).not.toBe('')
      }
      expect(new Set(media.map(m => m.id)).size).toBe(media.length)
    }
  })

  it('ha viaggi pubblicati con immagini e uno senza, per il caso vuoto', () => {
    const published = DEMO_TRIPS.filter(t => t.status === 'Pubblicato')
    const hasImages = (t: (typeof DEMO_TRIPS)[number]) => (t.media?.length ?? 0) > 0 || t.stages.some(s => (s.media?.length ?? 0) > 0)
    expect(published.some(hasImages)).toBe(true)
    expect(published.some(t => !hasImages(t))).toBe(true)
  })

  it('salva i media del viaggio e delle tappe', async () => {
    const f = fakePrisma()
    await seedDemoData(f.prisma, hash)

    const demo = DEMO_TRIPS.find(t => t.id === 'demo-trip-dolomiti')!
    const dolomiti = f.tables.trip.find(t => t.id === demo.id)!
    expect(dolomiti.media).toEqual(demo.media)
    const stages = (dolomiti.stages as { create: { media?: unknown }[] }).create
    expect(stages.map(s => s.media)).toEqual(demo.stages.map(s => s.media))

    const senzaMedia = DEMO_TRIPS.find(t => !t.media)!
    expect(f.tables.trip.find(t => t.id === senzaMedia.id)!.media).toEqual([])
  })

  it('una seconda esecuzione non duplica e non modifica nulla', async () => {
    const f = fakePrisma()
    await seedDemoData(f.prisma, hash)
    const editedTitle = 'Titolo cambiato a mano'
    f.tables.trip[0].title = editedTitle
    const snapshot = JSON.stringify(f.tables)

    const summary = await seedDemoData(f.prisma, hash)

    expect(summary.created).toEqual([])
    expect(summary.skipped).toEqual([])
    expect(JSON.stringify(f.tables)).toBe(snapshot)
    expect(f.tables.trip[0].title).toBe(editedTitle)
  })

  it('riusa un utente esistente con la stessa email senza modificarlo', async () => {
    const f = fakePrisma()
    f.tables.user.push({ id: 'pre-existing', email: 'ranger.demo@rideatlas.invalid', role: 'Explorer', name: 'Creato a mano' })

    const logs: string[] = []
    await seedDemoData(f.prisma, hash, m => logs.push(m))

    const ranger = f.tables.user.filter(u => u.email === 'ranger.demo@rideatlas.invalid')
    expect(ranger).toEqual([{ id: 'pre-existing', email: 'ranger.demo@rideatlas.invalid', role: 'Explorer', name: 'Creato a mano' }])
    const dolomiti = f.tables.trip.find(t => t.id === 'demo-trip-dolomiti')!
    expect(dolomiti.user).toEqual({ connect: { id: 'pre-existing' } })
    expect(logs.some(l => l.includes('lasciato invariato'))).toBe(true)
  })

  it('salta un viaggio il cui slug appartiene a dati non demo, e i suoi acquisti', async () => {
    const f = fakePrisma()
    f.tables.trip.push({ id: 'real-trip', slug: 'demo-dolomiti-in-4-giorni', title: 'Viaggio reale' })

    const summary = await seedDemoData(f.prisma, hash)

    expect(f.tables.trip.find(t => t.slug === 'demo-dolomiti-in-4-giorni')).toEqual({ id: 'real-trip', slug: 'demo-dolomiti-in-4-giorni', title: 'Viaggio reale' })
    expect(f.tables.tripPurchase.some(p => p.id === 'demo-purchase-explorer-dolomiti')).toBe(false)
    expect(summary.skipped).toHaveLength(2)
  })
})
