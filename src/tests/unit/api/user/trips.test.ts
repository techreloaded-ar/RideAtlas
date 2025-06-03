import { GET } from '@/app/api/user/trips/route'
import { NextRequest } from 'next/server'

// Mock delle dipendenze
jest.mock('@/lib/prisma', () => ({
  prisma: {
    trip: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

// Import dei mock
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockAuth = auth as jest.MockedFunction<typeof auth>

describe('/api/user/trips', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('dovrebbe restituire i viaggi dell\'utente con successo', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'EXPLORER',
        },
      }

      const mockTrips = [
        {
          id: 'trip-1',
          slug: 'viaggio-in-toscana',
          title: 'Viaggio in Toscana',
          destination: 'Toscana',
          duration_days: 7,
          duration_nights: 6,
          theme: 'CULTURA',
          status: 'APPROVED',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-15'),
        },
        {
          id: 'trip-2',
          slug: 'tour-delle-dolomiti',
          title: 'Tour delle Dolomiti',
          destination: 'Dolomiti',
          duration_days: 5,
          duration_nights: 4,
          theme: 'NATURA',
          status: 'PENDING',
          created_at: new Date('2024-01-10'),
          updated_at: new Date('2024-01-20'),
        },
      ]

      mockAuth.mockResolvedValue(mockSession)
      mockPrisma.trip.findMany.mockResolvedValue(mockTrips)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        trips: mockTrips,
        total: 2,
      })

      expect(mockPrisma.trip.findMany).toHaveBeenCalledWith({
        where: {
          user_id: 'user-123',
        },
        select: {
          id: true,
          slug: true,
          title: true,
          destination: true,
          duration_days: true,
          duration_nights: true,
          theme: true,
          status: true,
          created_at: true,
          updated_at: true,
        },
        orderBy: {
          updated_at: 'desc',
        },
      })
    })

    it('dovrebbe restituire un array vuoto quando l\'utente non ha viaggi', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'EXPLORER',
        },
      }

      mockAuth.mockResolvedValue(mockSession)
      mockPrisma.trip.findMany.mockResolvedValue([])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        trips: [],
        total: 0,
      })
    })

    it('dovrebbe restituire 401 se l\'utente non è autenticato', async () => {
      mockAuth.mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        error: 'Non autorizzato',
      })

      expect(mockPrisma.trip.findMany).not.toHaveBeenCalled()
    })

    it('dovrebbe restituire 401 se la sessione non ha utente', async () => {
      mockAuth.mockResolvedValue({ user: null })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        error: 'Non autorizzato',
      })

      expect(mockPrisma.trip.findMany).not.toHaveBeenCalled()
    })

    it('dovrebbe gestire gli errori del database', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'EXPLORER',
        },
      }

      mockAuth.mockResolvedValue(mockSession)
      mockPrisma.trip.findMany.mockRejectedValue(new Error('Database error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Errore interno del server',
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Errore nel recupero viaggi utente:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('dovrebbe ordinare i viaggi per updated_at discendente', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'EXPLORER',
        },
      }

      const mockTrips = [
        {
          id: 'trip-2',
          slug: 'viaggio-recente',
          title: 'Viaggio Recente',
          destination: 'Milano',
          duration_days: 3,
          duration_nights: 2,
          theme: 'BUSINESS',
          status: 'APPROVED',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-20'),
        },
        {
          id: 'trip-1',
          slug: 'viaggio-vecchio',
          title: 'Viaggio Vecchio',
          destination: 'Roma',
          duration_days: 5,
          duration_nights: 4,
          theme: 'CULTURA',
          status: 'APPROVED',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-10'),
        },
      ]

      mockAuth.mockResolvedValue(mockSession)
      mockPrisma.trip.findMany.mockResolvedValue(mockTrips)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trips).toEqual(mockTrips)
      expect(mockPrisma.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            updated_at: 'desc',
          },
        })
      )
    })

    it('dovrebbe selezionare solo i campi necessari', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'EXPLORER',
        },
      }

      mockAuth.mockResolvedValue(mockSession)
      mockPrisma.trip.findMany.mockResolvedValue([])

      await GET()

      expect(mockPrisma.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            id: true,
            slug: true,
            title: true,
            destination: true,
            duration_days: true,
            duration_nights: true,
            theme: true,
            status: true,
            created_at: true,
            updated_at: true,
          },
        })
      )
    })

    it('dovrebbe gestire viaggi con diversi status', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'EXPLORER',
        },
      }

      const mockTrips = [
        {
          id: 'trip-1',
          slug: 'viaggio-approvato',
          title: 'Viaggio Approvato',
          destination: 'Firenze',
          duration_days: 3,
          duration_nights: 2,
          theme: 'CULTURA',
          status: 'APPROVED',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-15'),
        },
        {
          id: 'trip-2',
          slug: 'viaggio-in-attesa',
          title: 'Viaggio in Attesa',
          destination: 'Venezia',
          duration_days: 4,
          duration_nights: 3,
          theme: 'CULTURA',
          status: 'PENDING',
          created_at: new Date('2024-01-05'),
          updated_at: new Date('2024-01-10'),
        },
        {
          id: 'trip-3',
          slug: 'viaggio-rifiutato',
          title: 'Viaggio Rifiutato',
          destination: 'Napoli',
          duration_days: 6,
          duration_nights: 5,
          theme: 'ENOGASTRONOMIA',
          status: 'REJECTED',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-05'),
        },
      ]

      mockAuth.mockResolvedValue(mockSession)
      mockPrisma.trip.findMany.mockResolvedValue(mockTrips)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trips).toHaveLength(3)
      expect(data.total).toBe(3)
      expect(data.trips).toEqual(mockTrips)
    })
  })
})
