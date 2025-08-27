import { GET } from '@/app/api/trips/route'
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
      findMany: jest.fn(),
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
const mockFindMany = prisma.trip.findMany as jest.Mock

describe('/api/trips GET - Lista viaggi con stages', () => {
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
    created_at: new Date('2024-01-01'),
    user: {
      name: 'Test User',
      email: 'test@example.com',
      image: null
    },
    stages: [
      {
        id: 'stage-1',
        tripId: 'trip-multi-1',
        orderIndex: 0,
        title: 'Tappa 1',
        description: 'Prima tappa',
        gpxFile: { distance: 50000 }
      },
      {
        id: 'stage-2',
        tripId: 'trip-multi-1',
        orderIndex: 1,
        title: 'Tappa 2',
        description: 'Seconda tappa',
        gpxFile: { distance: 75000 }
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
    created_at: new Date('2024-01-02'),
    user: {
      name: 'Legacy User',
      email: 'legacy@example.com',
      image: null
    },
    stages: []
  }

  describe('Inclusione stages e proprietà calcolate', () => {
    it('dovrebbe includere stages e proprietà calcolate per viaggi multi-stage', async () => {
      const mockSession = {
        user: { id: 'user-1', role: UserRole.Explorer }
      }

      mockAuth.mockResolvedValue(mockSession)
      mockFindMany.mockResolvedValue([mockTripWithStages])

      // Mock delle utility functions
      const { isMultiStageTripUtil, calculateTotalDistance, calculateTripDuration } = await import('@/lib/trips/trip-utils')
      isMultiStageTripUtil.mockReturnValue(true)
      calculateTotalDistance.mockReturnValue(125000)
      calculateTripDuration.mockReturnValue({ days: 2, nights: 1 })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      
      const trip = data[0]
      expect(trip.id).toBe('trip-multi-1')
      expect(trip.stages).toHaveLength(2)
      expect(trip.stages[0].orderIndex).toBe(0)
      expect(trip.stages[1].orderIndex).toBe(1)
      
      // Verifica proprietà calcolate
      expect(trip.calculatedDistance).toBe(125000)
      expect(trip.calculatedDuration).toEqual({ days: 2, nights: 1 })
      expect(trip.isMultiStage).toBe(true)
    })

    it('dovrebbe gestire correttamente viaggi legacy senza stages', async () => {
      const mockSession = {
        user: { id: 'user-1', role: UserRole.Explorer }
      }

      mockAuth.mockResolvedValue(mockSession)
      mockFindMany.mockResolvedValue([mockTripLegacy])

      // Mock delle utility functions per viaggio legacy
      const { isMultiStageTripUtil, calculateTotalDistance, calculateTripDuration } = await import('@/lib/trips/trip-utils')
      isMultiStageTripUtil.mockReturnValue(false)
      calculateTotalDistance.mockReturnValue(0)
      calculateTripDuration.mockReturnValue({ days: 2, nights: 1 })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      
      const trip = data[0]
      expect(trip.id).toBe('trip-legacy-1')
      expect(trip.stages).toHaveLength(0)
      
      // Verifica proprietà calcolate per viaggio legacy
      expect(trip.calculatedDistance).toBe(0)
      expect(trip.calculatedDuration).toEqual({ days: 2, nights: 1 })
      expect(trip.isMultiStage).toBe(false)
    })

    it('dovrebbe gestire mix di viaggi multi-stage e legacy', async () => {
      const mockSession = {
        user: { id: 'user-1', role: UserRole.Explorer }
      }

      mockAuth.mockResolvedValue(mockSession)
      mockFindMany.mockResolvedValue([mockTripWithStages, mockTripLegacy])

      const { isMultiStageTripUtil, calculateTotalDistance, calculateTripDuration } = await import('@/lib/trips/trip-utils')
      
      // Mock per primo viaggio (multi-stage)
      isMultiStageTripUtil.mockReturnValueOnce(true)
      calculateTotalDistance.mockReturnValueOnce(125000)
      calculateTripDuration.mockReturnValueOnce({ days: 2, nights: 1 })
      
      // Mock per secondo viaggio (legacy)
      isMultiStageTripUtil.mockReturnValueOnce(false)
      calculateTotalDistance.mockReturnValueOnce(0)
      calculateTripDuration.mockReturnValueOnce({ days: 2, nights: 1 })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
      
      // Primo viaggio (multi-stage)
      expect(data[0].isMultiStage).toBe(true)
      expect(data[0].stages).toHaveLength(2)
      expect(data[0].calculatedDistance).toBe(125000)
      
      // Secondo viaggio (legacy)
      expect(data[1].isMultiStage).toBe(false)
      expect(data[1].stages).toHaveLength(0)
      expect(data[1].calculatedDistance).toBe(0)
    })
  })

  describe('Ordinamento stages', () => {
    it('dovrebbe ordinare le stages per orderIndex', async () => {
      const mockSession = {
        user: { id: 'user-1', role: UserRole.Explorer }
      }

      mockAuth.mockResolvedValue(mockSession)
      mockFindMany.mockResolvedValue([mockTripWithStages])

      const response = await GET()

      // Verifica che sia stata chiamata con l'ordinamento corretto
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            stages: {
              orderBy: {
                orderIndex: 'asc'
              }
            }
          })
        })
      )
    })
  })

  describe('Filtri per ruoli utente con viaggi multi-stage', () => {
    it('dovrebbe mostrare solo viaggi pubblicati per utenti non autenticati', async () => {
      mockAuth.mockResolvedValue(null)
      mockFindMany.mockResolvedValue([])

      await GET()

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'Pubblicato' }
        })
      )
    })

    it('dovrebbe mostrare solo viaggi pubblicati per Explorer', async () => {
      const mockSession = {
        user: { id: 'user-1', role: UserRole.Explorer }
      }

      mockAuth.mockResolvedValue(mockSession)
      mockFindMany.mockResolvedValue([])

      await GET()

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'Pubblicato' }
        })
      )
    })

    it('dovrebbe mostrare viaggi pubblicati + proprie bozze per Ranger', async () => {
      const mockSession = {
        user: { id: 'ranger-1', role: UserRole.Ranger }
      }

      mockAuth.mockResolvedValue(mockSession)
      mockFindMany.mockResolvedValue([])

      await GET()

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { status: 'Pubblicato' },
              { 
                AND: [
                  { status: 'Bozza' },
                  { user_id: 'ranger-1' }
                ]
              }
            ]
          }
        })
      )
    })

    it('dovrebbe mostrare tutti i viaggi per Sentinel', async () => {
      const mockSession = {
        user: { id: 'sentinel-1', role: UserRole.Sentinel }
      }

      mockAuth.mockResolvedValue(mockSession)
      mockFindMany.mockResolvedValue([])

      await GET()

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {}
        })
      )
    })
  })

  describe('Struttura response', () => {
    it('dovrebbe includere tutti i campi necessari nella response', async () => {
      const mockSession = {
        user: { id: 'user-1', role: UserRole.Explorer }
      }

      mockAuth.mockResolvedValue(mockSession)
      mockFindMany.mockResolvedValue([mockTripWithStages])

      const response = await GET()

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true
              }
            },
            stages: {
              orderBy: {
                orderIndex: 'asc'
              }
            }
          },
          orderBy: [
            {
              orderIndex: 'asc'
            },
            {
              created_at: 'desc'
            }
          ]
        })
      )
    })
  })
})