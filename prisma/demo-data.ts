// Dati demo locali di RideAtlas.
//
// Usati da `prisma/seed.ts` (`RIDEATLAS_DEMO_DATA=1 npm run db:seed`) e dalla
// preparazione ARchetipo. Regole:
// - partono solo con consenso esplicito, fuori da produzione e su un database locale;
// - creano ogni record solo se manca, con identificatori deterministici;
// - non aggiornano né cancellano mai record esistenti, demo compresi.
import type { PrismaClient } from '@prisma/client'

export const DEMO_OPT_IN_VARIABLE = 'RIDEATLAS_DEMO_DATA'
// Password sintetica, valida solo sui database locali creati da questo seed.
export const DEMO_PASSWORD = 'RideAtlasDemo1'

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

/**
 * Blocca il seed quando potrebbe scrivere su un database reale: `sentinel.demo`
 * è un amministratore con password nota.
 */
export function assertDemoSeedAllowed(env: Record<string, string | undefined>): void {
  if (env[DEMO_OPT_IN_VARIABLE] !== '1') {
    throw new Error(`Dati demo non creati: imposta ${DEMO_OPT_IN_VARIABLE}=1 per confermare che il database è locale e di prova.`)
  }
  if (env.NODE_ENV === 'production') {
    throw new Error('Dati demo non creati: NODE_ENV=production.')
  }
  const raw = env.DATABASE_URL
  if (!raw) {
    throw new Error('Dati demo non creati: DATABASE_URL non è impostata nell\'ambiente del processo.')
  }
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error('Dati demo non creati: DATABASE_URL non è un URL valido.')
  }
  if (!/^postgres(ql)?:$/.test(url.protocol)) {
    throw new Error('Dati demo non creati: DATABASE_URL non è PostgreSQL.')
  }
  if (!LOOPBACK_HOSTS.has(url.hostname)) {
    throw new Error(`Dati demo non creati: l'host del database "${url.hostname || '(vuoto)'}" non è locale.`)
  }
}

type Role = 'Explorer' | 'Ranger' | 'Sentinel'
type Season = 'Primavera' | 'Estate' | 'Autunno' | 'Inverno'
type TripState = 'Bozza' | 'Pronto_per_revisione' | 'Pubblicato' | 'Archiviato'
type PurchaseState = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'

export interface DemoUser {
  id: string
  email: string
  name: string
  role: Role
  bio?: string
  bikeDescription?: string
}

export interface DemoStage {
  title: string
  description: string
  routeType: string
  duration: string
}

export interface DemoTrip {
  id: string
  slug: string
  title: string
  author: string // id di DemoUser
  status: TripState
  summary: string
  destination: string
  theme: string
  duration_days: number
  duration_nights: number
  recommended_seasons: Season[]
  characteristics: string[]
  tags: string[]
  price: string
  travelDate?: string
  insights?: string
  stages: DemoStage[]
}

export interface DemoPurchase {
  id: string
  buyer: string // id di DemoUser
  trip: string // id di DemoTrip
  status: PurchaseState
  purchasedAt?: string
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'demo-user-ranger',
    email: 'ranger.demo@rideatlas.invalid',
    name: 'Marco Ranger (demo)',
    role: 'Ranger',
    bio: 'Ranger demo: viaggio in moto da quindici anni tra Alpi e Appennini.',
    bikeDescription: 'Crossover bicilindrica da 900 cc con borse laterali.',
  },
  {
    id: 'demo-user-giulia',
    email: 'giulia.demo@rideatlas.invalid',
    name: 'Giulia Ranger (demo)',
    role: 'Ranger',
    bio: 'Ranger demo: itinerari lenti, isole e strade di costa.',
    bikeDescription: 'Naked media cilindrata, ideale per le curve strette.',
  },
  { id: 'demo-user-explorer', email: 'explorer.demo@rideatlas.invalid', name: 'Elena Explorer (demo)', role: 'Explorer' },
  { id: 'demo-user-paolo', email: 'paolo.demo@rideatlas.invalid', name: 'Paolo Explorer (demo)', role: 'Explorer' },
  { id: 'demo-user-sentinel', email: 'sentinel.demo@rideatlas.invalid', name: 'Sara Sentinel (demo)', role: 'Sentinel' },
]

export const DEMO_TRIPS: DemoTrip[] = [
  {
    id: 'demo-trip-dolomiti',
    slug: 'demo-dolomiti-in-4-giorni',
    title: 'Dolomiti in 4 giorni',
    author: 'demo-user-ranger',
    status: 'Pubblicato',
    summary: 'Un anello tra i passi dolomitici più famosi: Sella, Pordoi, Giau e Falzarego, con soste nei rifugi e panorami sulle Tre Cime.',
    destination: 'Dolomiti, Trentino-Alto Adige',
    theme: 'Montagna',
    duration_days: 4,
    duration_nights: 3,
    recommended_seasons: ['Estate', 'Autunno'],
    characteristics: ['Curve strette', 'Bel paesaggio', 'Interesse gastronomico'],
    tags: ['passi alpini', 'dolomiti', 'rifugi'],
    price: '12.00',
    travelDate: '2025-07-12',
    insights: 'Partire presto la mattina: dalle 10 i passi si riempiono di traffico turistico.',
    stages: [
      { title: 'Bolzano – Canazei', description: 'Salita al Passo Costalunga con vista sul Catinaccio.', routeType: 'Strada di montagna', duration: '3 ore' },
      { title: 'Giro dei quattro passi', description: 'Sella, Gardena, Campolongo e Pordoi in un unico anello.', routeType: 'Passi alpini', duration: '5 ore' },
      { title: 'Canazei – Cortina', description: 'Passo Giau e Falzarego, pranzo al rifugio.', routeType: 'Passi alpini', duration: '4 ore' },
      { title: 'Cortina – Tre Cime – Dobbiaco', description: 'Giro panoramico intorno alle Tre Cime di Lavaredo.', routeType: 'Strada panoramica', duration: '3 ore' },
    ],
  },
  {
    id: 'demo-trip-amalfi',
    slug: 'demo-costa-amalfitana',
    title: 'Costa Amalfitana',
    author: 'demo-user-ranger',
    status: 'Pubblicato',
    summary: 'La statale 163 da Vietri a Positano: tornanti sul mare, borghi verticali e limoncelli, con una deviazione verso Ravello.',
    destination: 'Costiera Amalfitana, Campania',
    theme: 'Mare',
    duration_days: 3,
    duration_nights: 2,
    recommended_seasons: ['Primavera', 'Estate'],
    characteristics: ['Curve strette', 'Bel paesaggio', 'Interesse storico-culturale'],
    tags: ['costa', 'mare', 'borghi'],
    price: '9.00',
    travelDate: '2025-05-03',
    stages: [
      { title: 'Salerno – Amalfi', description: 'Vietri sul Mare, Cetara e Maiori lungo la costa.', routeType: 'Strada costiera', duration: '2 ore' },
      { title: 'Amalfi – Ravello – Positano', description: 'Salita a Ravello e discesa verso Positano.', routeType: 'Strada costiera', duration: '3 ore' },
      { title: 'Positano – Sorrento', description: 'Il Nastro Azzurro fino alla penisola sorrentina.', routeType: 'Strada panoramica', duration: '2 ore' },
    ],
  },
  {
    id: 'demo-trip-toscana',
    slug: 'demo-colline-toscane',
    title: 'Colline toscane',
    author: 'demo-user-giulia',
    status: 'Pubblicato',
    summary: 'Weekend tra Val d\'Orcia e Chianti su strade bianche e provinciali morbide, con cantine e borghi medievali.',
    destination: 'Val d\'Orcia e Chianti, Toscana',
    theme: 'Enogastronomia',
    duration_days: 2,
    duration_nights: 1,
    recommended_seasons: ['Primavera', 'Autunno'],
    characteristics: ['Strade sterrate', 'Bel paesaggio', 'Interesse gastronomico'],
    tags: ['vino', 'borghi', 'weekend'],
    price: '5.00',
    stages: [
      { title: 'Siena – Pienza', description: 'Crete senesi e Val d\'Orcia fino a Pienza.', routeType: 'Provinciale', duration: '3 ore' },
      { title: 'Pienza – Greve in Chianti', description: 'Montalcino e la Chiantigiana verso nord.', routeType: 'Strade bianche e provinciali', duration: '4 ore' },
    ],
  },
  {
    id: 'demo-trip-sardegna',
    slug: 'demo-sardegna-da-costa-a-costa',
    title: 'Sardegna da costa a costa',
    author: 'demo-user-giulia',
    status: 'Pubblicato',
    summary: 'Una settimana da Olbia a Cagliari passando per la Barbagia: traghetto, costa orientale, interno selvaggio e spiagge del sud.',
    destination: 'Sardegna',
    theme: 'Avventura',
    duration_days: 7,
    duration_nights: 6,
    recommended_seasons: ['Estate'],
    characteristics: ['Presenza traghetti', 'Curve strette', 'Bel paesaggio', 'Visita prolungata'],
    tags: ['isola', 'traghetto', 'lungo viaggio'],
    price: '19.90',
    travelDate: '2025-06-20',
    stages: [
      { title: 'Olbia – Cala Gonone', description: 'Lungo la costa orientale fino al golfo di Orosei.', routeType: 'Statale costiera', duration: '4 ore' },
      { title: 'Cala Gonone – Fonni', description: 'Salita nel cuore della Barbagia.', routeType: 'Strada di montagna', duration: '3 ore' },
      { title: 'Fonni – Oristano', description: 'Altopiani e nuraghi verso la costa occidentale.', routeType: 'Provinciale', duration: '4 ore' },
      { title: 'Oristano – Teulada', description: 'Costa del Sulcis e miniere abbandonate.', routeType: 'Strada costiera', duration: '5 ore' },
      { title: 'Teulada – Cagliari', description: 'Chia e la costa sud fino a Cagliari.', routeType: 'Strada costiera', duration: '3 ore' },
    ],
  },
  {
    id: 'demo-trip-etna',
    slug: 'demo-etna-in-giornata',
    title: 'Etna in giornata',
    author: 'demo-user-giulia',
    status: 'Pubblicato',
    summary: 'Gita gratuita di un giorno sui versanti dell\'Etna, da Nicolosi al Rifugio Sapienza e ritorno da Zafferana.',
    destination: 'Etna, Sicilia',
    theme: 'Vulcani',
    duration_days: 1,
    duration_nights: 0,
    recommended_seasons: ['Inverno', 'Primavera'],
    characteristics: ['Bel paesaggio'],
    tags: ['gratuito', 'giornata', 'vulcano'],
    price: '0.00',
    stages: [],
  },
  {
    id: 'demo-trip-laghi',
    slug: 'demo-laghi-lombardi',
    title: 'Laghi lombardi',
    author: 'demo-user-ranger',
    status: 'Bozza',
    summary: 'Bozza di un giro tra Lago di Como e Lago d\'Iseo, ancora da completare con le soste.',
    destination: 'Lombardia',
    theme: 'Laghi',
    duration_days: 2,
    duration_nights: 1,
    recommended_seasons: ['Primavera'],
    characteristics: ['Bel paesaggio', 'Presenza pedaggi'],
    tags: ['laghi', 'bozza'],
    price: '5.00',
    stages: [
      { title: 'Como – Bellagio', description: 'Lungolago occidentale fino a Bellagio.', routeType: 'Strada lacustre', duration: '2 ore' },
      { title: 'Lecco – Iseo', description: 'Valle San Martino e discesa sul Sebino.', routeType: 'Provinciale', duration: '3 ore' },
    ],
  },
  {
    id: 'demo-trip-svizzera',
    slug: 'demo-passi-alpini-svizzeri',
    title: 'Passi alpini svizzeri',
    author: 'demo-user-giulia',
    status: 'Pronto_per_revisione',
    summary: 'Furka, Grimsel e Susten in tre giorni: viaggio in attesa di revisione da parte di un Sentinel.',
    destination: 'Alpi svizzere',
    theme: 'Montagna',
    duration_days: 3,
    duration_nights: 2,
    recommended_seasons: ['Estate'],
    characteristics: ['Curve strette', 'Bel paesaggio', 'Presenza pedaggi'],
    tags: ['svizzera', 'passi alpini'],
    price: '14.00',
    stages: [
      { title: 'Domodossola – Andermatt', description: 'Passo del Sempione e Passo della Novena.', routeType: 'Passi alpini', duration: '4 ore' },
      { title: 'Anello Furka – Grimsel – Susten', description: 'I tre passi più famosi in un giorno.', routeType: 'Passi alpini', duration: '6 ore' },
      { title: 'Andermatt – Lugano', description: 'San Gottardo sulla vecchia Tremola.', routeType: 'Strada storica', duration: '3 ore' },
    ],
  },
  {
    id: 'demo-trip-appennino',
    slug: 'demo-appennino-d-inverno',
    title: 'Appennino d\'inverno',
    author: 'demo-user-ranger',
    status: 'Archiviato',
    summary: 'Viaggio archiviato: traversata invernale dell\'Appennino tosco-emiliano, non più proposto.',
    destination: 'Appennino tosco-emiliano',
    theme: 'Montagna',
    duration_days: 2,
    duration_nights: 1,
    recommended_seasons: ['Inverno'],
    characteristics: ['Curve strette', 'Strade sterrate'],
    tags: ['inverno', 'archiviato'],
    price: '6.00',
    stages: [
      { title: 'Bologna – Abetone', description: 'Porrettana e salita all\'Abetone.', routeType: 'Strada di montagna', duration: '3 ore' },
      { title: 'Abetone – Lucca', description: 'Discesa in Garfagnana fino a Lucca.', routeType: 'Provinciale', duration: '3 ore' },
    ],
  },
]

export const DEMO_PURCHASES: DemoPurchase[] = [
  { id: 'demo-purchase-explorer-dolomiti', buyer: 'demo-user-explorer', trip: 'demo-trip-dolomiti', status: 'COMPLETED', purchasedAt: '2025-08-01T10:00:00Z' },
  { id: 'demo-purchase-explorer-toscana', buyer: 'demo-user-explorer', trip: 'demo-trip-toscana', status: 'REFUNDED', purchasedAt: '2025-09-10T18:30:00Z' },
  { id: 'demo-purchase-explorer-amalfi', buyer: 'demo-user-explorer', trip: 'demo-trip-amalfi', status: 'PENDING' },
]

type GuidedTripState = 'Bozza' | 'Pubblicato' | 'Annullato'
type GuidedRegistrationState = 'CONFIRMED' | 'REFUND_DUE'

export interface DemoGuidedTrip {
  id: string
  slug: string
  title: string
  organizer: string // id di DemoUser
  status: GuidedTripState
  description: string
  program: string[]
  includedServices?: string
  meetingPoint: string
  // Date relative al giorno del seed, così i viaggi demo risultano futuri appena creati.
  departureInDays: number
  durationDays: number
  registrationClosesDaysBeforeDeparture: number
  cancellationNoticeDays: number
  maxParticipants: number
  pricePerParticipant: string
}

export interface DemoGuidedTripRegistration {
  id: string
  participant: string // id di DemoUser
  guidedTrip: string // id di DemoGuidedTrip
  status: GuidedRegistrationState
  cancellationOrigin?: 'PARTICIPANT' | 'ORGANIZER'
}

export const DEMO_GUIDED_TRIPS: DemoGuidedTrip[] = [
  {
    id: 'demo-guided-dolomiti',
    slug: 'demo-guidato-dolomiti-passi-e-rifugi',
    title: 'Dolomiti, passi e rifugi',
    organizer: 'demo-user-ranger',
    status: 'Pubblicato',
    description: 'Tre giorni sui passi dolomitici con andatura tranquilla, soste fotografiche e pernottamenti in rifugio. Adatto a chi ha qualche anno di esperienza su strade di montagna.',
    program: [
      'Bassano → Passo Rolle → San Martino di Castrozza (180 km)',
      'Giro dei quattro passi: Pordoi, Sella, Gardena, Campolongo (160 km)',
      'Passo Giau → Cortina → rientro a Bassano (210 km)',
    ],
    includedServices: 'Guida del Ranger · 2 notti in mezza pensione · Traccia GPX del percorso',
    meetingPoint: 'Bassano del Grappa, piazza Libertà, ore 8:30',
    departureInDays: 60,
    durationDays: 3,
    registrationClosesDaysBeforeDeparture: 14,
    cancellationNoticeDays: 14,
    maxParticipants: 8,
    pricePerParticipant: '450.00',
  },
  {
    id: 'demo-guided-costiera',
    slug: 'demo-guidato-costiera-all-alba',
    title: 'Costiera all\'alba',
    organizer: 'demo-user-giulia',
    status: 'Pubblicato',
    description: 'Una giornata lunga sulla Costiera Amalfitana partendo prima dell\'alba, per trovare la statale libera dal traffico.',
    program: ['Salerno → Amalfi → Positano → Sorrento, rientro nel pomeriggio (150 km)'],
    includedServices: 'Guida della Ranger · colazione a Positano',
    meetingPoint: 'Salerno, piazza della Concordia, ore 5:30',
    departureInDays: 30,
    durationDays: 1,
    registrationClosesDaysBeforeDeparture: 3,
    cancellationNoticeDays: 7,
    maxParticipants: 2,
    pricePerParticipant: '120.00',
  },
  {
    id: 'demo-guided-langhe',
    slug: 'demo-guidato-langhe-d-autunno',
    title: 'Langhe d\'autunno',
    organizer: 'demo-user-ranger',
    status: 'Bozza',
    description: 'Bozza: weekend tra vigneti e castelli delle Langhe nel periodo della vendemmia.',
    program: ['Alba → Barolo → La Morra', 'Monforte → Dogliani → rientro ad Alba'],
    meetingPoint: 'Alba, piazza Duomo, ore 9:00',
    departureInDays: 90,
    durationDays: 2,
    registrationClosesDaysBeforeDeparture: 10,
    cancellationNoticeDays: 14,
    maxParticipants: 6,
    pricePerParticipant: '280.00',
  },
]

export const DEMO_GUIDED_TRIP_REGISTRATIONS: DemoGuidedTripRegistration[] = [
  { id: 'demo-guided-reg-giulia-dolomiti', participant: 'demo-user-giulia', guidedTrip: 'demo-guided-dolomiti', status: 'CONFIRMED' },
  { id: 'demo-guided-reg-paolo-dolomiti', participant: 'demo-user-paolo', guidedTrip: 'demo-guided-dolomiti', status: 'CONFIRMED' },
  { id: 'demo-guided-reg-explorer-dolomiti', participant: 'demo-user-explorer', guidedTrip: 'demo-guided-dolomiti', status: 'REFUND_DUE', cancellationOrigin: 'PARTICIPANT' },
  { id: 'demo-guided-reg-ranger-costiera', participant: 'demo-user-ranger', guidedTrip: 'demo-guided-costiera', status: 'CONFIRMED' },
  { id: 'demo-guided-reg-paolo-costiera', participant: 'demo-user-paolo', guidedTrip: 'demo-guided-costiera', status: 'CONFIRMED' },
]

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000

/** Giorno di calendario (mezzanotte UTC) a N giorni da oggi. */
function calendarDayFromToday(today: Date, days: number): Date {
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  return new Date(start + days * DAY_IN_MILLISECONDS)
}

export interface DemoSeedSummary {
  created: string[]
  kept: string[]
  skipped: string[]
}

type Log = (message: string) => void

/**
 * Crea i dati demo mancanti. Non usa mai update, upsert o delete: un record già
 * presente (anche se modificato a mano) resta com'è.
 */
export async function seedDemoData(
  prisma: PrismaClient,
  hashPassword: (password: string) => Promise<string>,
  log: Log = () => {},
): Promise<DemoSeedSummary> {
  const summary: DemoSeedSummary = { created: [], kept: [], skipped: [] }
  const userIds = new Map<string, string>()
  const tripIds = new Set<string>()
  let passwordHash: string | undefined

  for (const user of DEMO_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true, role: true } })
    if (existing) {
      userIds.set(user.id, existing.id)
      summary.kept.push(`utente ${user.email}`)
      if (existing.role !== user.role) log(`nota: ${user.email} esiste già con ruolo ${existing.role} (atteso ${user.role}); lasciato invariato`)
      continue
    }
    passwordHash ??= await hashPassword(DEMO_PASSWORD)
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        bio: user.bio,
        bikeDescription: user.bikeDescription,
        password: passwordHash,
        emailVerified: new Date(),
      },
    })
    userIds.set(user.id, user.id)
    summary.created.push(`utente ${user.email}`)
  }

  for (const trip of DEMO_TRIPS) {
    const label = `viaggio «${trip.title}»`
    if (await prisma.trip.findUnique({ where: { id: trip.id }, select: { id: true } })) {
      tripIds.add(trip.id)
      summary.kept.push(label)
      continue
    }
    if (await prisma.trip.findUnique({ where: { slug: trip.slug }, select: { id: true } })) {
      summary.skipped.push(`${label}: lo slug ${trip.slug} è già usato da un altro viaggio`)
      continue
    }
    const authorId = userIds.get(trip.author)
    if (!authorId) {
      summary.skipped.push(`${label}: autore non disponibile`)
      continue
    }
    await prisma.trip.create({
      data: {
        id: trip.id,
        slug: trip.slug,
        title: trip.title,
        summary: trip.summary,
        destination: trip.destination,
        theme: trip.theme,
        duration_days: trip.duration_days,
        duration_nights: trip.duration_nights,
        recommended_seasons: trip.recommended_seasons,
        characteristics: trip.characteristics,
        tags: trip.tags,
        price: trip.price,
        status: trip.status,
        insights: trip.insights,
        travelDate: trip.travelDate ? new Date(trip.travelDate) : undefined,
        user: { connect: { id: authorId } },
        stages: { create: trip.stages.map((stage, orderIndex) => ({ ...stage, orderIndex })) },
      },
    })
    tripIds.add(trip.id)
    summary.created.push(label)
  }

  for (const purchase of DEMO_PURCHASES) {
    const trip = DEMO_TRIPS.find(t => t.id === purchase.trip)
    const label = `acquisto ${purchase.status} di «${trip?.title ?? purchase.trip}»`
    if (await prisma.tripPurchase.findUnique({ where: { id: purchase.id }, select: { id: true } })) {
      summary.kept.push(label)
      continue
    }
    const buyerId = userIds.get(purchase.buyer)
    if (!trip || !buyerId || !tripIds.has(trip.id)) {
      summary.skipped.push(`${label}: acquirente o viaggio non disponibile`)
      continue
    }
    const purchasedAt = purchase.purchasedAt ? new Date(purchase.purchasedAt) : undefined
    const transactions: { amount: string; status: PurchaseState; paymentMethod: string | null }[] =
      purchase.status === 'PENDING'
        ? [{ amount: trip.price, status: 'PENDING', paymentMethod: null }]
        : purchase.status === 'REFUNDED'
          ? [{ amount: trip.price, status: 'COMPLETED', paymentMethod: 'mock' }, { amount: trip.price, status: 'REFUNDED', paymentMethod: 'mock' }]
          : [{ amount: trip.price, status: purchase.status, paymentMethod: 'mock' }]
    await prisma.tripPurchase.create({
      data: {
        id: purchase.id,
        amount: trip.price,
        status: purchase.status,
        paymentMethod: purchase.status === 'PENDING' ? null : 'mock',
        purchasedAt,
        user: { connect: { id: buyerId } },
        trip: { connect: { id: trip.id } },
        transactions: { create: transactions },
      },
    })
    summary.created.push(label)
  }

  const guidedTripIds = new Set<string>()
  const today = new Date()
  for (const guidedTrip of DEMO_GUIDED_TRIPS) {
    const label = `viaggio guidato «${guidedTrip.title}»`
    if (await prisma.guidedTrip.findUnique({ where: { id: guidedTrip.id }, select: { id: true } })) {
      guidedTripIds.add(guidedTrip.id)
      summary.kept.push(label)
      continue
    }
    if (await prisma.guidedTrip.findUnique({ where: { slug: guidedTrip.slug }, select: { id: true } })) {
      summary.skipped.push(`${label}: lo slug ${guidedTrip.slug} è già usato da un altro viaggio guidato`)
      continue
    }
    const organizerId = userIds.get(guidedTrip.organizer)
    if (!organizerId) {
      summary.skipped.push(`${label}: organizzatore non disponibile`)
      continue
    }
    await prisma.guidedTrip.create({
      data: {
        id: guidedTrip.id,
        slug: guidedTrip.slug,
        title: guidedTrip.title,
        description: guidedTrip.description,
        program: guidedTrip.program.join('\n'),
        includedServices: guidedTrip.includedServices,
        meetingPoint: guidedTrip.meetingPoint,
        departureDate: calendarDayFromToday(today, guidedTrip.departureInDays),
        returnDate: calendarDayFromToday(today, guidedTrip.departureInDays + guidedTrip.durationDays - 1),
        registrationDeadline: calendarDayFromToday(today, guidedTrip.departureInDays - guidedTrip.registrationClosesDaysBeforeDeparture),
        cancellationNoticeDays: guidedTrip.cancellationNoticeDays,
        maxParticipants: guidedTrip.maxParticipants,
        pricePerParticipant: guidedTrip.pricePerParticipant,
        status: guidedTrip.status,
        publishedAt: guidedTrip.status === 'Pubblicato' ? today : undefined,
        organizer: { connect: { id: organizerId } },
      },
    })
    guidedTripIds.add(guidedTrip.id)
    summary.created.push(label)
  }

  for (const registration of DEMO_GUIDED_TRIP_REGISTRATIONS) {
    const guidedTrip = DEMO_GUIDED_TRIPS.find(t => t.id === registration.guidedTrip)
    const label = `iscrizione ${registration.status} a «${guidedTrip?.title ?? registration.guidedTrip}»`
    if (await prisma.guidedTripRegistration.findUnique({ where: { id: registration.id }, select: { id: true } })) {
      summary.kept.push(label)
      continue
    }
    const participantId = userIds.get(registration.participant)
    if (!guidedTrip || !participantId || !guidedTripIds.has(guidedTrip.id)) {
      summary.skipped.push(`${label}: partecipante o viaggio guidato non disponibile`)
      continue
    }
    await prisma.guidedTripRegistration.create({
      data: {
        id: registration.id,
        amount: guidedTrip.pricePerParticipant,
        status: registration.status,
        paymentMethod: 'simulated',
        confirmedAt: today,
        cancelledAt: registration.status === 'REFUND_DUE' ? today : undefined,
        cancellationOrigin: registration.cancellationOrigin,
        participant: { connect: { id: participantId } },
        guidedTrip: { connect: { id: guidedTrip.id } },
      },
    })
    summary.created.push(label)
  }

  log(`Dati demo: ${summary.created.length} creati, ${summary.kept.length} già presenti e lasciati invariati, ${summary.skipped.length} saltati`)
  for (const item of summary.created) log(`  creato: ${item}`)
  for (const item of summary.skipped) log(`  saltato: ${item}`)
  return summary
}
