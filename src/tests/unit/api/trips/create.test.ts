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
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    stage: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

jest.mock('@/lib/user-sync', () => ({
  ensureUserExists: jest.fn(),
}))

// Mock delle utility functions
jest.mock('@/lib/trip-utils', () => ({
  ...jest.requireActual('@/lib/trip-utils'),
  isMultiStageTripUtil: jest.fn(),
  calculateTotalDistance: jest.fn(),
  calculateTripDuration: jest.fn(),
}))

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockEnsureUserExists = ensureUserExists as jest.MockedFunction<typeof ensureUserExists>

describe('POST /api/trips - Creazione Viaggi', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    
    // Setup default mocks for utility functions
    const { isMultiStageTripUtil, calculateTotalDistance, calculateTripDuration } = await import('@/lib/trip-utils')
    isMultiStageTripUtil.mockReturnValue(false)
    calculateTotalDistance.mockReturnValue(0)
    calculateTripDuration.mockReturnValue({ days: 3, nights: 2 })
    
    // Mock $transaction per eseguire la callback con il mock prisma
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      return callback(mockPrisma);
    });
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
    insights: 'Approfondimenti sul viaggio',
    duration_days: 1,
    duration_nights: 0,
    tags: ['natura', 'panorami', 'cultura'],
    theme: 'Turismo naturalistico',
    characteristics: ['Strade sterrate', 'Bel paesaggio'],
    recommended_seasons: [RecommendedSeason.Primavera],
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
      });
      mockEnsureUserExists.mockResolvedValue(mockUser);
      
      const mockTripWithStages = {
        ...mockCreatedTrip,
        user: mockUser,
        stages: []
      };
      
      (prisma.trip.create as jest.Mock).mockResolvedValue(mockTripWithStages);
      (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTripWithStages);

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
          media: [],
          gpxFile: null,
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
        insights: 'Approfondimenti sul viaggio',
        tags: ['roma'],
        theme: 'Città',
        recommended_seasons: [RecommendedSeason.Primavera],
      }

      mockAuth.mockResolvedValue({
        user: mockUser,
        expires: '2024-12-31T23:59:59.999Z',
      })
      mockEnsureUserExists.mockResolvedValue(mockUser)
      
      const mockTripWithStages = {
        ...mockCreatedTrip,
        ...minimalData,
        characteristics: [],
        user: mockUser,
        stages: []
      };
      
      (prisma.trip.create as jest.Mock).mockResolvedValue(mockTripWithStages);
      (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTripWithStages);

      const request = createMockRequest(minimalData)
      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(prisma.trip.create).toHaveBeenCalledWith({
        data: {
          ...minimalData,
          characteristics: [],
          media: [],
          gpxFile: null,
          slug: 'viaggio-minimo',
          duration_days: 1,
          duration_nights: 0,
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
      
      const mockTripWithStages = {
        ...mockCreatedTrip,
        title: 'Viaggio in Toscana - Versione 2',
        slug: 'viaggio-in-toscana-versione-2',
        user: mockUser,
        stages: []
      };
      
      (prisma.trip.create as jest.Mock).mockResolvedValue(mockTripWithStages);
      (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTripWithStages);

      const request = createMockRequest(tripWithSimilarTitle)
      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(prisma.trip.create).toHaveBeenCalledWith({
        data: {
          ...tripWithSimilarTitle,
          media: [],
          gpxFile: null,
          slug: 'viaggio-in-toscana-versione-2',
          user_id: 'user-123',
        },
      })
    })
  })

  describe('Validazione dati', () => {    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: mockUser,
        expires: '2024-12-31T23:59:59.999Z',
      })
    })

    it('should reject request with missing required fields', async () => {
      const invalidData = {
        title: '',
        destination: '',
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
      // tags è opzionale con default [], quindi non dovrebbe generare errore
      expect(data.details.tags).toBeUndefined()
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
        summary: 'A'.repeat(6001), // > 6000 characters
      }

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Dati non validi.')
      expect(data.details.summary).toBeDefined()
    })

    it('should reject trip with invalid recommended season', async () => {
      const invalidData = {
        ...validTripData,
        recommended_seasons: ['Invalid Season' as any],
      }

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Dati non validi.')
      expect(data.details.recommended_seasons).toBeDefined()
    })

    it('should reject trip with empty recommended seasons array', async () => {
      const invalidData = {
        ...validTripData,
        recommended_seasons: [],
      }

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const data = await response.json()      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Dati non validi.')
      expect(data.details.recommended_seasons).toContain('Devi selezionare almeno una stagione.')
    })

      it('should accept valid recommended seasons', async () => {
      mockEnsureUserExists.mockResolvedValue(mockUser);
      
      const mockTripWithStages = {
        ...mockCreatedTrip,
        user: mockUser,
        stages: []
      };
      
      (prisma.trip.create as jest.Mock).mockResolvedValue(mockTripWithStages);
      (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTripWithStages);
      
      const seasons = [
        RecommendedSeason.Primavera,
        RecommendedSeason.Estate,
        RecommendedSeason.Autunno,
        RecommendedSeason.Inverno,
      ]
      
      for (const season of seasons) {
        const dataWithSeason = {
          ...validTripData,
          recommended_seasons: [season],
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
        const mockTripWithStages = {
          ...mockCreatedTrip,
          title,
          slug: expectedSlug,
          user: mockUser,
          stages: []
        }

        ;(prisma.trip.create as jest.Mock).mockResolvedValue(mockTripWithStages)
        ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTripWithStages)

        const tripData = { ...validTripData, title }
        const request = createMockRequest(tripData)
        const response = await POST(request)

        expect(response.status).toBe(201)
        expect(prisma.trip.create).toHaveBeenCalledWith({
          data: {
            ...tripData,
            media: [],
            gpxFile: null,
            slug: expectedSlug,
            user_id: 'user-123',
          },
        })

        jest.clearAllMocks()
      }
    })
  })
})
