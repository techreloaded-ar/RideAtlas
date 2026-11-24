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

// Alias e non interface: Prisma accetta nei campi Json solo tipi con index signature implicita.
export type DemoMedia = {
  id: string
  type: 'image'
  url: string
  caption: string
}

// Le foto demo sono hotlink a Unsplash (licenza Unsplash, uso libero): `images.unsplash.com`
// è già in `images.remotePatterns` e gli URL assoluti superano la validazione Zod dei media.
// Ritaglio 3:2 fisso, così anche le foto verticali rendono bene come copertina.
function unsplashImage(photoId: string, caption: string): DemoMedia {
  return {
    id: `demo-media-${photoId}`,
    type: 'image',
    url: `https://images.unsplash.com/photo-${photoId}?w=1600&h=1067&fit=crop&q=80`,
    caption,
  }
}

export interface DemoStage {
  title: string
  description: string
  routeType: string
  duration: string
  media?: DemoMedia[]
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
  media?: DemoMedia[]
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
    media: [
      unsplashImage('1753978103194-56aebd721785', 'Tornanti tra le cime dolomitiche'),
      unsplashImage('1629014568959-f8260cbe6cd8', 'Boschi di abeti ai piedi delle pareti rocciose'),
    ],
    stages: [
      { title: 'Bolzano – Canazei', description: 'Salita al Passo Costalunga con vista sul Catinaccio.', routeType: 'Strada di montagna', duration: '3 ore' },
      {
        title: 'Giro dei quattro passi',
        description: 'Sella, Gardena, Campolongo e Pordoi in un unico anello.',
        routeType: 'Passi alpini',
        duration: '5 ore',
        media: [unsplashImage('1753978103194-1e02e091039a', 'In salita verso il passo')],
      },
      {
        title: 'Canazei – Cortina',
        description: 'Passo Giau e Falzarego, pranzo al rifugio.',
        routeType: 'Passi alpini',
        duration: '4 ore',
        media: [unsplashImage('1723808877139-da1dbc2647f3', 'La strada che sale al Passo Giau')],
      },
      {
        title: 'Cortina – Tre Cime – Dobbiaco',
        description: 'Giro panoramico intorno alle Tre Cime di Lavaredo.',
        routeType: 'Strada panoramica',
        duration: '3 ore',
        media: [unsplashImage('1597221863553-d5fc0a67679a', 'Le pareti delle Tre Cime di Lavaredo')],
      },
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
    media: [
      unsplashImage('1612698093158-e07ac200d44e', 'Case colorate a picco sul mare di Amalfi'),
      unsplashImage('1561956021-947f09ae0101', 'Positano vista dalla statale 163'),
    ],
    stages: [
      { title: 'Salerno – Amalfi', description: 'Vietri sul Mare, Cetara e Maiori lungo la costa.', routeType: 'Strada costiera', duration: '2 ore' },
      {
        title: 'Amalfi – Ravello – Positano',
        description: 'Salita a Ravello e discesa verso Positano.',
        routeType: 'Strada costiera',
        duration: '3 ore',
        media: [unsplashImage('1782056094486-ee96fdaff0eb', 'La costiera vista dai giardini di Ravello')],
      },
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
    media: [
      unsplashImage('1518098268026-4e89f1a2cd8e', 'Strada tra i cipressi delle colline toscane'),
      unsplashImage('1636545191544-90e0d6d1202d', 'Colline della Val d\'Orcia'),
    ],
    stages: [
      {
        title: 'Siena – Pienza',
        description: 'Crete senesi e Val d\'Orcia fino a Pienza.',
        routeType: 'Provinciale',
        duration: '3 ore',
        media: [unsplashImage('1632660967293-ec569f27dfd0', 'Un vicolo fiorito di Pienza')],
      },
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
    media: [
      unsplashImage('1688141307717-63cff4415a4f', 'Scogliere e acqua turchese sulla costa sarda'),
      unsplashImage('1571831693821-352cc8c08241', 'Rocce bianche e macchia mediterranea'),
    ],
    stages: [
      {
        title: 'Olbia – Cala Gonone',
        description: 'Lungo la costa orientale fino al golfo di Orosei.',
        routeType: 'Statale costiera',
        duration: '4 ore',
        media: [unsplashImage('1642960681498-9b80acd6a983', 'Il golfo di Orosei')],
      },
      {
        title: 'Cala Gonone – Fonni',
        description: 'Salita nel cuore della Barbagia.',
        routeType: 'Strada di montagna',
        duration: '3 ore',
        media: [unsplashImage('1700572659067-89778088803c', 'Un paese della Barbagia tra le montagne')],
      },
      { title: 'Fonni – Oristano', description: 'Altopiani e nuraghi verso la costa occidentale.', routeType: 'Provinciale', duration: '4 ore' },
      { title: 'Oristano – Teulada', description: 'Costa del Sulcis e miniere abbandonate.', routeType: 'Strada costiera', duration: '5 ore' },
      {
        title: 'Teulada – Cagliari',
        description: 'Chia e la costa sud fino a Cagliari.',
        routeType: 'Strada costiera',
        duration: '3 ore',
        media: [unsplashImage('1646865043257-3767188963f1', 'Spiaggia e costa del sud dall\'alto')],
      },
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
    media: [
      unsplashImage('1586974726316-c6302de6a160', 'Ville affacciate sul Lago di Como'),
      unsplashImage('1664433451451-11337deef597', 'Villa del Balbianello sul Lago di Como'),
    ],
    stages: [
      { title: 'Como – Bellagio', description: 'Lungolago occidentale fino a Bellagio.', routeType: 'Strada lacustre', duration: '2 ore' },
      {
        title: 'Lecco – Iseo',
        description: 'Valle San Martino e discesa sul Sebino.',
        routeType: 'Provinciale',
        duration: '3 ore',
        media: [unsplashImage('1695634929711-1e37053f262a', 'Un paese sulle rive del Lago d\'Iseo')],
      },
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
    media: [
      unsplashImage('1677333434008-635e27acb4f4', 'Tornanti del Passo della Furka'),
      unsplashImage('1690187190441-c760b2b93c3a', 'Motociclisti in sosta al passo'),
    ],
    stages: [
      { title: 'Domodossola – Andermatt', description: 'Passo del Sempione e Passo della Novena.', routeType: 'Passi alpini', duration: '4 ore' },
      {
        title: 'Anello Furka – Grimsel – Susten',
        description: 'I tre passi più famosi in un giorno.',
        routeType: 'Passi alpini',
        duration: '6 ore',
        media: [unsplashImage('1577711128545-e7c9c31ad092', 'La strada del Susten tra prati e montagne')],
      },
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
    media: [unsplashImage('1588788087412-ac02f75e6d4b', 'Crinale appenninico innevato')],
    stages: [
      { title: 'Bologna – Abetone', description: 'Porrettana e salita all\'Abetone.', routeType: 'Strada di montagna', duration: '3 ore' },
      {
        title: 'Abetone – Lucca',
        description: 'Discesa in Garfagnana fino a Lucca.',
        routeType: 'Provinciale',
        duration: '3 ore',
        media: [unsplashImage('1707401100280-b40d51f1846a', 'Lucca con le Apuane sullo sfondo')],
      },
    ],
  },
]

export const DEMO_PURCHASES: DemoPurchase[] = [
  { id: 'demo-purchase-explorer-dolomiti', buyer: 'demo-user-explorer', trip: 'demo-trip-dolomiti', status: 'COMPLETED', purchasedAt: '2025-08-01T10:00:00Z' },
  { id: 'demo-purchase-explorer-toscana', buyer: 'demo-user-explorer', trip: 'demo-trip-toscana', status: 'REFUNDED', purchasedAt: '2025-09-10T18:30:00Z' },
  { id: 'demo-purchase-explorer-amalfi', buyer: 'demo-user-explorer', trip: 'demo-trip-amalfi', status: 'PENDING' },
]

type GuidedTripState = 'Bozza' | 'Pubblicato' | 'Annullato'
type GuidedTripBookingState = 'CONFIRMED' | 'REFUND_PENDING'

export interface DemoGuidedTrip {
  id: string
  organizer: string // id di DemoUser
  linkedTrip?: string // id di DemoTrip (collegato solo se presente)
  title: string
  description: string
  startDate: string // 'YYYY-MM-DD'
  endDate: string
  meetingPoint: string
  pricePerPerson: string
  maxParticipants: number
  freeCancellationUntil: string
  status: GuidedTripState
}

export interface DemoGuidedTripBooking {
  id: string
  participant: string // id di DemoUser
  guidedTrip: string // id di DemoGuidedTrip
  status: GuidedTripBookingState
  confirmedAt: string
}

// Date fisse nel 2027: partenze future per il catalogo dimostrativo.
export const DEMO_GUIDED_TRIPS: DemoGuidedTrip[] = [
  {
    id: 'demo-guided-dolomiti',
    organizer: 'demo-user-ranger',
    linkedTrip: 'demo-trip-dolomiti',
    title: 'Dolomiti: i grandi passi',
    description: 'Quattro giorni sui passi Sella, Pordoi, Giau e Falzarego in gruppo con Marco. Pernottamenti in hotel inclusi, cena del primo giorno insieme.\nLivello: intermedio. Moto propria.',
    startDate: '2027-06-12',
    endDate: '2027-06-15',
    meetingPoint: 'Bolzano, piazza Walther · ore 8:30',
    pricePerPerson: '450.00',
    maxParticipants: 8,
    freeCancellationUntil: '2027-05-29',
    status: 'Pubblicato',
  },
  {
    id: 'demo-guided-amalfi',
    organizer: 'demo-user-giulia',
    linkedTrip: 'demo-trip-amalfi',
    title: 'Costa Amalfitana slow',
    description: 'Tre giorni lenti tra Positano, Amalfi e Ravello, con soste nei borghi e una cena vista mare. Ritmo tranquillo, adatto anche a chi guida da poco.',
    startDate: '2027-06-28',
    endDate: '2027-06-30',
    meetingPoint: 'Salerno, lungomare Trieste · ore 9:00',
    pricePerPerson: '320.00',
    maxParticipants: 3,
    freeCancellationUntil: '2027-06-14',
    status: 'Pubblicato',
  },
  {
    id: 'demo-guided-sardegna',
    organizer: 'demo-user-giulia',
    linkedTrip: 'demo-trip-sardegna',
    title: "Sardegna dell'interno",
    description: 'Sei giorni dal Gennargentu al Supramonte, lontano dalle spiagge affollate. Traghetto escluso.',
    startDate: '2027-07-05',
    endDate: '2027-07-10',
    meetingPoint: 'Olbia, porto Isola Bianca · ore 10:00',
    pricePerPerson: '780.00',
    maxParticipants: 2,
    freeCancellationUntil: '2027-06-05',
    status: 'Pubblicato',
  },
  {
    id: 'demo-guided-appennino',
    organizer: 'demo-user-ranger',
    title: 'Appennino tosco-emiliano',
    description: "Due giorni tra Abetone, passo delle Radici e Cerreto. Annullato dal Ranger: esempio per i rimborsi del Sentinel.",
    startDate: '2027-07-19',
    endDate: '2027-07-20',
    meetingPoint: 'Modena, piazza Grande · ore 8:00',
    pricePerPerson: '190.00',
    maxParticipants: 10,
    freeCancellationUntil: '2027-07-05',
    status: 'Annullato',
  },
  {
    id: 'demo-guided-langhe',
    organizer: 'demo-user-ranger',
    title: "Langhe d'autunno",
    description: 'Un fine settimana tra vigne e noccioleti nel periodo della vendemmia. Bozza non ancora pubblicata.',
    startDate: '2027-10-10',
    endDate: '2027-10-11',
    meetingPoint: 'Alba, piazza Risorgimento · ore 9:30',
    pricePerPerson: '210.00',
    maxParticipants: 10,
    freeCancellationUntil: '2027-09-26',
    status: 'Bozza',
  },
]

export const DEMO_GUIDED_TRIP_BOOKINGS: DemoGuidedTripBooking[] = [
  { id: 'demo-booking-paolo-dolomiti', participant: 'demo-user-paolo', guidedTrip: 'demo-guided-dolomiti', status: 'CONFIRMED', confirmedAt: '2026-11-02T10:00:00Z' },
  { id: 'demo-booking-paolo-amalfi', participant: 'demo-user-paolo', guidedTrip: 'demo-guided-amalfi', status: 'CONFIRMED', confirmedAt: '2026-11-03T11:00:00Z' },
  { id: 'demo-booking-sentinel-amalfi', participant: 'demo-user-sentinel', guidedTrip: 'demo-guided-amalfi', status: 'CONFIRMED', confirmedAt: '2026-11-04T12:00:00Z' },
  { id: 'demo-booking-paolo-sardegna', participant: 'demo-user-paolo', guidedTrip: 'demo-guided-sardegna', status: 'CONFIRMED', confirmedAt: '2026-11-05T09:00:00Z' },
  { id: 'demo-booking-sentinel-sardegna', participant: 'demo-user-sentinel', guidedTrip: 'demo-guided-sardegna', status: 'CONFIRMED', confirmedAt: '2026-11-05T09:30:00Z' },
  { id: 'demo-booking-paolo-appennino', participant: 'demo-user-paolo', guidedTrip: 'demo-guided-appennino', status: 'REFUND_PENDING', confirmedAt: '2026-11-06T15:00:00Z' },
]

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
        media: trip.media ?? [],
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
  for (const guidedTrip of DEMO_GUIDED_TRIPS) {
    const label = `viaggio guidato «${guidedTrip.title}»`
    if (await prisma.guidedTrip.findUnique({ where: { id: guidedTrip.id }, select: { id: true } })) {
      guidedTripIds.add(guidedTrip.id)
      summary.kept.push(label)
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
        title: guidedTrip.title,
        description: guidedTrip.description,
        startDate: new Date(`${guidedTrip.startDate}T00:00:00.000Z`),
        endDate: new Date(`${guidedTrip.endDate}T00:00:00.000Z`),
        meetingPoint: guidedTrip.meetingPoint,
        pricePerPerson: guidedTrip.pricePerPerson,
        maxParticipants: guidedTrip.maxParticipants,
        freeCancellationUntil: new Date(`${guidedTrip.freeCancellationUntil}T00:00:00.000Z`),
        status: guidedTrip.status,
        publishedAt: guidedTrip.status === 'Bozza' ? undefined : new Date('2026-11-01T09:00:00Z'),
        cancelledAt: guidedTrip.status === 'Annullato' ? new Date('2026-11-20T09:00:00Z') : undefined,
        organizer: { connect: { id: organizerId } },
        // L'itinerario è facoltativo: se non è disponibile il viaggio guidato nasce senza collegamento.
        linkedTrip: guidedTrip.linkedTrip && tripIds.has(guidedTrip.linkedTrip) ? { connect: { id: guidedTrip.linkedTrip } } : undefined,
      },
    })
    guidedTripIds.add(guidedTrip.id)
    summary.created.push(label)
  }

  for (const booking of DEMO_GUIDED_TRIP_BOOKINGS) {
    const guidedTrip = DEMO_GUIDED_TRIPS.find(g => g.id === booking.guidedTrip)
    const label = `prenotazione ${booking.status} di «${guidedTrip?.title ?? booking.guidedTrip}»`
    if (await prisma.guidedTripBooking.findUnique({ where: { id: booking.id }, select: { id: true } })) {
      summary.kept.push(label)
      continue
    }
    const participantId = userIds.get(booking.participant)
    if (!guidedTrip || !participantId || !guidedTripIds.has(guidedTrip.id)) {
      summary.skipped.push(`${label}: partecipante o viaggio guidato non disponibile`)
      continue
    }
    await prisma.guidedTripBooking.create({
      data: {
        id: booking.id,
        amountPaid: guidedTrip.pricePerPerson,
        status: booking.status,
        paymentMethod: 'simulated',
        confirmedAt: new Date(booking.confirmedAt),
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
