import { GET } from '@/app/api/admin/trips/route'
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
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}))

const mockAuth = auth as jest.Mock

describe('GET /api/admin/trips - Gestione Admin Viaggi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (searchParams: Record<string, string> = {}): NextRequest => {
    const url = new URL('http://localhost/api/admin/trips')
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
    return new NextRequest(url)
  }

  const mockSentinelSession = {
    user: {
      id: 'sentinel-user-id',
      name: 'Admin Sentinel',
      email: 'admin@rideatlas.com',
      role: UserRole.Sentinel,
    },
  }

  const mockTripData = [
    {
      id: 'trip-1',
      title: 'Viaggio Alpi',
      destination: 'Alpi',
      status: 'Bozza',
      created_at: new Date('2024-01-01'),
      user: {
        id: 'user-1',
        name: 'Mario Rossi',
        email: 'mario@example.com',
        image: null,
      },
    },
    {
      id: 'trip-2', 
      title: 'Tour Toscana',
      destination: 'Toscana',
      status: 'Pubblicato',
      created_at: new Date('2024-01-02'),
      user: {
        id: 'user-2',
        name: 'Luigi Verdi',
        email: 'luigi@example.com',
        image: null,
      },
    },
  ]

  describe('Autorizzazione', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Non autorizzato')
    })

    it('should return 403 if user is not Sentinel', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-id',
          role: UserRole.Explorer,
        },
      } as any)

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Permessi insufficienti')
    })
  })

  describe('Recupero viaggi con successo', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSentinelSession as any)
    })

    it('should return all trips with default pagination', async () => {
      ;(prisma.trip.findMany as jest.Mock).mockResolvedValue(mockTripData)
      ;(prisma.trip.count as jest.Mock).mockResolvedValue(2)

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trips).toEqual(mockTripData)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      })

      expect(prisma.trip.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip: 0,
        take: 10,
      })
    })

    it('should handle pagination correctly', async () => {
      ;(prisma.trip.findMany as jest.Mock).mockResolvedValue([mockTripData[1]])
      ;(prisma.trip.count as jest.Mock).mockResolvedValue(2)

      const request = createMockRequest({ page: '2', limit: '1' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination).toEqual({
        page: 2,
        limit: 1,
        total: 2,
        pages: 2,
      })

      expect(prisma.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 1,
          take: 1,
        })
      )
    })

    it('should filter trips by search query', async () => {
      const filteredTrips = [mockTripData[0]]
      ;(prisma.trip.findMany as jest.Mock).mockResolvedValue(filteredTrips)
      ;(prisma.trip.count as jest.Mock).mockResolvedValue(1)

      const request = createMockRequest({ search: 'Alpi' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trips).toEqual(filteredTrips)
      expect(data.pagination.total).toBe(1)

      expect(prisma.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { title: { contains: 'Alpi', mode: 'insensitive' } },
              { destination: { contains: 'Alpi', mode: 'insensitive' } },
              { user: { name: { contains: 'Alpi', mode: 'insensitive' } } },
            ],
          },
        })
      )
    })

    it('should filter trips by status', async () => {
      const draftTrips = [mockTripData[0]]
      ;(prisma.trip.findMany as jest.Mock).mockResolvedValue(draftTrips)
      ;(prisma.trip.count as jest.Mock).mockResolvedValue(1)

      const request = createMockRequest({ status: 'Bozza' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trips).toEqual(draftTrips)

      expect(prisma.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: 'Bozza',
          },
        })
      )
    })

    it('should combine search and status filters', async () => {
      ;(prisma.trip.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.trip.count as jest.Mock).mockResolvedValue(0)

      const request = createMockRequest({ search: 'Mario', status: 'Pubblicato' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      expect(prisma.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { title: { contains: 'Mario', mode: 'insensitive' } },
              { destination: { contains: 'Mario', mode: 'insensitive' } },
              { user: { name: { contains: 'Mario', mode: 'insensitive' } } },
            ],
            status: 'Pubblicato',
          },
        })
      )
    })

    it('should return empty list when no trips found', async () => {
      ;(prisma.trip.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.trip.count as jest.Mock).mockResolvedValue(0)

      const request = createMockRequest({ search: 'nonexistent' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trips).toEqual([])
      expect(data.pagination.total).toBe(0)
      expect(data.pagination.pages).toBe(0)
    })
  })

  describe('Gestione errori', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSentinelSession as any)
    })

    it('should handle database errors gracefully', async () => {
      ;(prisma.trip.findMany as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })

    it('should handle invalid page parameter', async () => {
      ;(prisma.trip.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.trip.count as jest.Mock).mockResolvedValue(0)

      const request = createMockRequest({ page: 'invalid' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination.page).toBe(1) // Default fallback
    })

    it('should handle invalid limit parameter', async () => {
      ;(prisma.trip.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.trip.count as jest.Mock).mockResolvedValue(0)

      const request = createMockRequest({ limit: 'invalid' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination.limit).toBe(10) // Default fallback
    })
  })

  describe('Validazione parametri', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSentinelSession as any)
      ;(prisma.trip.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.trip.count as jest.Mock).mockResolvedValue(0)
    })

    it('should handle large page numbers', async () => {
      const request = createMockRequest({ page: '999' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination.page).toBe(999)
      
      expect(prisma.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 9980, // (999 - 1) * 10
        })
      )
    })

    it('should handle zero and negative page numbers', async () => {
      const request = createMockRequest({ page: '0' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination.page).toBe(0)
    })

    it('should handle very large limit', async () => {
      const request = createMockRequest({ limit: '1000' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination.limit).toBe(1000)
    })

    it('should handle empty search string', async () => {
      const request = createMockRequest({ search: '' })
      const response = await GET(request)

      expect(response.status).toBe(200)
      
      expect(prisma.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {}, // No search filter applied
        })
      )
    })
  })
})
