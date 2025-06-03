import { POST } from '@/app/api/trips/route'
import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ensureUserExists } from '@/lib/user-sync'
import { RecommendedSeason } from '@/types/trip'

// Mock delle dipendenze
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    trip: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/user-sync', () => ({
  ensureUserExists: jest.fn(),
}))

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockEnsureUserExists = ensureUserExists as jest.MockedFunction<typeof ensureUserExists>

describe('POST /api/trips - Creazione Viaggi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (body: unknown): NextRequest => {
    return new NextRequest('http://localhost/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  const validTripData = {
    title: 'Viaggio in Toscana',
    summary: 'Un bellissimo viaggio attraverso le colline toscane con panorami mozzafiato',
    destination: 'Toscana, Italia',
    duration_days: 3,
    duration_nights: 2,
    tags: ['natura', 'panorami', 'cultura'],
    theme: 'Turismo naturalistico',
    characteristics: ['Strade sterrate', 'Bel paesaggio'],
    recommended_season: RecommendedSeason.Primavera,
  }

  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'Explorer',
  }

  const mockCreatedTrip = {
    id: 'trip-123',
    title: 'Viaggio in Toscana',
    slug: 'viaggio-in-toscana',
    ...validTripData,
    user_id: 'user-123',
    status: 'Bozza',
    created_at: new Date(),
    updated_at: new Date(),
  }

  describe('Scenari di successo', () => {
    it('should create a new trip successfully', async () => {
      mockAuth.mockResolvedValue({
        user: mockUser,
        expires: '2024-12-31T23:59:59.999Z',
      })
      mockEnsureUserExists.mockResolvedValue(mockUser)
      ;(prisma.trip.create as jest.Mock).mockResolvedValue(mockCreatedTrip)

      const request = createMockRequest(validTripData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('trip-123')
      expect(data.title).toBe('Viaggio in Toscana')
      expect(data.slug).toBe('viaggio-in-toscana')
      expect(data.user_id).toBe('user-123')
      expect(data.status).toBe('Bozza')

      // Verify prisma.trip.create was called with correct data
      expect(prisma.trip.create).toHaveBeenCalledWith({
        data: {
          ...validTripData,
          slug: 'viaggio-in-toscana',
          user_id: 'user-123',
        },
      })
    })

    it('should create trip with minimal required data', async () => {
      const minimalData = {
        title: 'Viaggio Minimo',
        summary: 'Descrizione minima del viaggio',
        destination: 'Roma',
        duration_days: 1,
        duration_nights: 1,
        tags: ['roma'],
        theme: 'Città',
        recommended_season: RecommendedSeason.Tutte,
      }

      mockAuth.mockResolvedValue({
        user: mockUser,
        expires: '2024-12-31T23:59:59.999Z',
      })
      mockEnsureUserExists.mockResolvedValue(mockUser)
      ;(prisma.trip.create as jest.Mock).mockResolvedValue({
        ...mockCreatedTrip,
        ...minimalData,
        characteristics: [],
      })

      const request = createMockRequest(minimalData)
      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(prisma.trip.create).toHaveBeenCalledWith({
        data: {
          ...minimalData,
          characteristics: [],
          slug: 'viaggio-minimo',
          user_id: 'user-123',
        },
      })
    })

    it('should generate unique slug for similar titles', async () => {
      const tripWithSimilarTitle = {
        ...validTripData,
        title: 'Viaggio in Toscana - Versione 2',
      }

      mockAuth.mockResolvedValue({
        user: mockUser,
        expires: '2024-12-31T23:59:59.999Z',
      })
      mockEnsureUserExists.mockResolvedValue(mockUser)
      ;(prisma.trip.create as jest.Mock).mockResolvedValue({
        ...mockCreatedTrip,
        title: 'Viaggio in Toscana - Versione 2',
        slug: 'viaggio-in-toscana-versione-2',
      })

      const request = createMockRequest(tripWithSimilarTitle)
      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(prisma.trip.create).toHaveBeenCalledWith({
        data: {
          ...tripWithSimilarTitle,
          slug: 'viaggio-in-toscana-versione-2',
          user_id: 'user-123',
        },
      })
    })
  })

  describe('Validazione dati', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: mockUser,
        expires: '2024-12-31T23:59:59.999Z',
      })
    })

    it('should reject request with missing required fields', async () => {
      const invalidData = {
        title: '',
        destination: '',
        duration_days: 0,
        tags: [],
        theme: '',
      }

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Dati non validi.')
      expect(data.details).toBeDefined()
      expect(data.details.title).toContain('Il titolo deve contenere almeno 3 caratteri.')
      expect(data.details.summary).toContain('Required')
      expect(data.details.destination).toContain('La destinazione deve contenere almeno 3 caratteri.')
      expect(data.details.duration_days).toContain('La durata in giorni deve essere un numero positivo.')
      expect(data.details.tags).toContain('Devi specificare almeno un tag.')
      expect(data.details.theme).toContain('Il tema deve contenere almeno 3 caratteri.')
    })

    it('should reject trip with title too long', async () => {
      const invalidData = {
        ...validTripData,
        title: 'A'.repeat(101), // > 100 characters
      }

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Dati non validi.')
      expect(data.details.title).toBeDefined()
    })

    it('should reject trip with summary too long', async () => {
      const invalidData = {
        ...validTripData,
        summary: 'A'.repeat(501), // > 500 characters
      }

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Dati non validi.')
      expect(data.details.summary).toBeDefined()
    })

    it('should reject trip with negative duration', async () => {
      const invalidData = {
        ...validTripData,
        duration_days: -1,
        duration_nights: -1,
      }

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Dati non validi.')
      expect(data.details.duration_days).toContain('La durata in giorni deve essere un numero positivo.')
      expect(data.details.duration_nights).toContain('La durata in notti deve essere un numero positivo.')
    })

    it('should reject trip with invalid recommended season', async () => {
      const invalidData = {
        ...validTripData,
        recommended_season: 'Invalid Season' as any,
      }

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Dati non validi.')
      expect(data.details.recommended_season).toBeDefined()
    })

    it('should accept valid recommended seasons', async () => {
      mockEnsureUserExists.mockResolvedValue(mockUser)
      ;(prisma.trip.create as jest.Mock).mockResolvedValue(mockCreatedTrip)

      const seasons = [
        RecommendedSeason.Primavera,
        RecommendedSeason.Estate,
        RecommendedSeason.Autunno,
        RecommendedSeason.Inverno,
        RecommendedSeason.Tutte,
      ]

      for (const season of seasons) {
        const dataWithSeason = {
          ...validTripData,
          recommended_season: season,
        }

        const request = createMockRequest(dataWithSeason)
        const response = await POST(request)

        expect(response.status).toBe(201)
      }
    })
  })

  describe('Autorizzazione', () => {
    it('should reject request without authentication', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createMockRequest(validTripData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Utente non autorizzato.')
    })

    it('should reject request with user without id', async () => {
      mockAuth.mockResolvedValue({
        user: { ...mockUser, id: undefined },
        expires: '2024-12-31T23:59:59.999Z',
      })

      const request = createMockRequest(validTripData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Utente non autorizzato.')
    })
  })

  describe('Gestione errori database', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: mockUser,
        expires: '2024-12-31T23:59:59.999Z',
      })
      mockEnsureUserExists.mockResolvedValue(mockUser)
    })

    it('should handle slug duplication error', async () => {
      const prismaError = {
        code: 'P2002',
        meta: { target: ['slug'] },
        message: 'Unique constraint failed',
      }
      ;(prisma.trip.create as jest.Mock).mockRejectedValue(prismaError)

      const request = createMockRequest(validTripData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Viaggio già esistente. Cambia titolo.')
    })

    it('should handle foreign key constraint error', async () => {
      const prismaError = {
        code: 'P2003',
        message: 'Foreign key constraint failed',
      }
      ;(prisma.trip.create as jest.Mock).mockRejectedValue(prismaError)

      const request = createMockRequest(validTripData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore di collegamento utente. Riprova.')
    })

    it('should handle generic prisma error', async () => {
      const prismaError = {
        code: 'P2001',
        message: 'Record not found',
      }
      ;(prisma.trip.create as jest.Mock).mockRejectedValue(prismaError)

      const request = createMockRequest(validTripData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno server.')
      expect(data.details).toBe('Record not found')
    })

    it('should handle user sync failure', async () => {
      mockEnsureUserExists.mockRejectedValue(new Error('User sync failed'))

      const request = createMockRequest(validTripData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno server.')
      expect(data.details).toBe('User sync failed')
    })

    it('should handle generic error', async () => {
      mockEnsureUserExists.mockRejectedValue('Unknown error')

      const request = createMockRequest(validTripData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno server.')
      expect(data.details).toBe('Errore sconosciuto')
    })
  })

  describe('Slug generation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: mockUser,
        expires: '2024-12-31T23:59:59.999Z',
      })
      mockEnsureUserExists.mockResolvedValue(mockUser)
    })

    it('should generate correct slug from title', async () => {
      const testCases = [
        { title: 'Viaggio in Toscana', expectedSlug: 'viaggio-in-toscana' },
        { title: 'Tour delle Cinque Terre', expectedSlug: 'tour-delle-cinque-terre' },
        { title: 'VIAGGIO CON MAIUSCOLE', expectedSlug: 'viaggio-con-maiuscole' },
        { title: 'Viaggio con àccénti', expectedSlug: 'viaggio-con-accenti' },
        { title: 'Viaggio!!!Con???Punteggiatura', expectedSlug: 'viaggio-con-punteggiatura' },
      ]

      for (const { title, expectedSlug } of testCases) {
        ;(prisma.trip.create as jest.Mock).mockResolvedValue({
          ...mockCreatedTrip,
          title,
          slug: expectedSlug,
        })

        const tripData = { ...validTripData, title }
        const request = createMockRequest(tripData)
        const response = await POST(request)

        expect(response.status).toBe(201)
        expect(prisma.trip.create).toHaveBeenCalledWith({
          data: {
            ...tripData,
            slug: expectedSlug,
            user_id: 'user-123',
          },
        })

        jest.clearAllMocks()
      }
    })
  })
})
