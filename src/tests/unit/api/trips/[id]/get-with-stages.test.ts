import { GET } from '@/app/api/trips/[id]/route'
import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { UserRole } from '@/types/profile'

// Mock delle dipendenze
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/core/prisma', () => ({
  prisma: {
    trip: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock delle utility functions
jest.mock('@/lib/trips/trip-utils', () => ({
  ...jest.requireActual('@/lib/trips/trip-utils'),
  isMultiStageTripUtil: jest.fn(),
  calculateTotalDistance: jest.fn(),
  calculateTripDuration: jest.fn(),
}))

const mockAuth = auth as jest.Mock
const mockFindUnique = prisma.trip.findUnique as jest.Mock

describe('/api/trips/[id] GET - Singolo viaggio con stages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockTripWithStages = {
    id: 'trip-multi-1',
    title: 'Viaggio Multi-Tappa',
    destination: 'Toscana',
    duration_days: 3,
    duration_nights: 2,
    status: 'Pubblicato',
    user_id: 'owner-123',
    user: {
      id: 'owner-123',
      name: 'Trip Owner',
      email: 'owner@example.com',
      role: UserRole.Ranger
    },
    stages: [
      {
        id: 'stage-1',
        tripId: 'trip-multi-1',
        orderIndex: 0,
        title: 'Tappa 1: Firenze',
        description: 'Partenza da Firenze',
        routeType: 'Stradale panoramico',
        media: [],
        gpxFile: { 
          distance: 50000,
          filename: 'tappa1.gpx',
          waypoints: 100,
          isValid: true
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'stage-2',
        tripId: 'trip-multi-1',
        orderIndex: 1,
        title: 'Tappa 2: Siena',
        description: 'Arrivo a Siena',
        routeType: 'Sterrato',
        media: [],
        gpxFile: { 
          distance: 75000,
          filename: 'tappa2.gpx',
          waypoints: 150,
          isValid: true
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ]
  }

  const mockTripLegacy = {
    id: 'trip-legacy-1',
    title: 'Viaggio Legacy',
    destination: 'Umbria',
    duration_days: 2,
    duration_nights: 1,
    status: 'Pubblicato',
    user_id: 'owner-456',
    user: {
      id: 'owner-456',
      name: 'Legacy Owner',
      email: 'legacy@example.com', 
      role: UserRole.Ranger
    },
    stages: []
  }

  const createMockRequest = (id: string): NextRequest => {
    return new NextRequest(`http://localhost/api/trips/${id}`, {
      method: 'GET',
    })
  }

  describe('Inclusione stages e proprietà calcolate', () => {
    it('dovrebbe includere stages ordinate e proprietà calcolate per viaggio multi-stage', async () => {
      const mockSession = {
        user: { id: 'owner-123', role: UserRole.Ranger }
      }

      mockAuth.mockResolvedValue(mockSession)
      mockFindUnique.mockResolvedValue(mockTripWithStages)

      // Mock delle utility functions
      const { isMultiStageTripUtil, calculateTotalDistance, calculateTripDuration } = await import('@/lib/trips/trip-utils')
      isMultiStageTripUtil.mockReturnValue(true)
      calculateTotalDistance.mockReturnValue(125000)
      calculateTripDuration.mockReturnValue({ days: 2, nights: 1 })

      const request = createMockRequest('trip-multi-1')
      const response = await GET(request, { params: { id: 'trip-multi-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('trip-multi-1')
      
      // Verifica stages ordinate
      expect(data.stages).toHaveLength(2)
      expect(data.stages[0].orderIndex).toBe(0)
      expect(data.stages[0].title).toBe('Tappa 1: Firenze')
      expect(data.stages[1].orderIndex).toBe(1)
      expect(data.stages[1].title).toBe('Tappa 2: Siena')
      
      // Verifica proprietà calcolate
      expect(data.calculatedDistance).toBe(125000)
      expect(data.calculatedDuration).toEqual({ days: 2, nights: 1 })
      expect(data.isMultiStage).toBe(true)
    })

    it('dovrebbe gestire correttamente viaggio legacy senza stages', async () => {
      const mockSession = {
        user: { id: 'owner-456', role: UserRole.Ranger }
      }

      mockAuth.mockResolvedValue(mockSession)
      mockFindUnique.mockResolvedValue(mockTripLegacy)

      // Mock delle utility functions per viaggio legacy
      const { isMultiStageTripUtil, calculateTotalDistance, calculateTripDuration } = await import('@/lib/trips/trip-utils')
      isMultiStageTripUtil.mockReturnValue(false)
      calculateTotalDistance.mockReturnValue(0)
      calculateTripDuration.mockReturnValue({ days: 2, nights: 1 })

      const request = createMockRequest('trip-legacy-1')
      const response = await GET(request, { params: { id: 'trip-legacy-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('trip-legacy-1')
      
      // Verifica assenza di stages
      expect(data.stages).toHaveLength(0)
      
      // Verifica proprietà calcolate per viaggio legacy
      expect(data.calculatedDistance).toBe(0)
      expect(data.calculatedDuration).toEqual({ days: 2, nights: 1 })
      expect(data.isMultiStage).toBe(false)
    })
  })

  describe('Ordinamento stages', () => {
    it('dovrebbe richiedere stages ordinate per orderIndex', async () => {
      const mockSession = {
        user: { id: 'owner-123', role: UserRole.Ranger }
      }

      mockAuth.mockResolvedValue(mockSession)
      mockFindUnique.mockResolvedValue(mockTripWithStages)

      const request = createMockRequest('trip-multi-1')
      await GET(request, { params: { id: 'trip-multi-1' } })

      // Verifica che sia stata chiamata con l'ordinamento corretto
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'trip-multi-1' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          stages: {
            orderBy: {
              orderIndex: 'asc'
            }
          }
        }
      })
    })
  })

  describe('Controllo permessi con viaggi multi-stage', () => {
    it('dovrebbe permettere al proprietario di vedere il proprio viaggio multi-stage', async () => {
      const mockSession = {
        user: { id: 'owner-123', role: UserRole.Ranger }
      }

      mockAuth.mockResolvedValue(mockSession)
      mockFindUnique.mockResolvedValue(mockTripWithStages)

      const request = createMockRequest('trip-multi-1')
      const response = await GET(request, { params: { id: 'trip-multi-1' } })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.id).toBe('trip-multi-1')
      expect(data.stages).toHaveLength(2)
    })

    it('dovrebbe permettere al Sentinel di vedere qualsiasi viaggio multi-stage', async () => {
      const mockSession = {
        user: { id: 'sentinel-999', role: UserRole.Sentinel }
      }

      mockAuth.mockResolvedValue(mockSession)
      mockFindUnique.mockResolvedValue(mockTripWithStages)

      const request = createMockRequest('trip-multi-1')
      const response = await GET(request, { params: { id: 'trip-multi-1' } })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.id).toBe('trip-multi-1')
      expect(data.stages).toHaveLength(2)
    })

    it('dovrebbe negare accesso a utente non autorizzato per viaggio multi-stage', async () => {
      const mockSession = {
        user: { id: 'other-user', role: UserRole.Explorer }
      }

      mockAuth.mockResolvedValue(mockSession)
      mockFindUnique.mockResolvedValue(mockTripWithStages)

      const request = createMockRequest('trip-multi-1')
      const response = await GET(request, { params: { id: 'trip-multi-1' } })

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Non hai i permessi per visualizzare questo viaggio')
    })

    it('dovrebbe negare accesso a utente non autenticato', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createMockRequest('trip-multi-1')
      const response = await GET(request, { params: { id: 'trip-multi-1' } })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Non autorizzato')
    })
  })

  describe('Gestione errori', () => {
    it('dovrebbe restituire 404 per viaggio inesistente', async () => {
      const mockSession = {
        user: { id: 'user-123', role: UserRole.Ranger }
      }

      mockAuth.mockResolvedValue(mockSession)
      mockFindUnique.mockResolvedValue(null)

      const request = createMockRequest('non-existent')
      const response = await GET(request, { params: { id: 'non-existent' } })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Viaggio non trovato')
    })

    it('dovrebbe gestire errori del database', async () => {
      const mockSession = {
        user: { id: 'user-123', role: UserRole.Ranger }
      }

      mockAuth.mockResolvedValue(mockSession)
      mockFindUnique.mockRejectedValue(new Error('Database error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const request = createMockRequest('trip-multi-1')
      const response = await GET(request, { params: { id: 'trip-multi-1' } })

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Errore interno server.')

      expect(consoleSpy).toHaveBeenCalledWith(
        'Errore nel caricamento del viaggio:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Struttura della query', () => {
    it('dovrebbe includere tutti i campi necessari nella query', async () => {
      const mockSession = {
        user: { id: 'owner-123', role: UserRole.Ranger }
      }

      mockAuth.mockResolvedValue(mockSession)
      mockFindUnique.mockResolvedValue(mockTripWithStages)

      const request = createMockRequest('trip-multi-1')
      await GET(request, { params: { id: 'trip-multi-1' } })

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'trip-multi-1' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          stages: {
            orderBy: {
              orderIndex: 'asc'
            }
          }
        }
      })
    })
  })
})