import { GET } from '@/app/api/admin/rangers/route'
import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { UserRole } from '@/types/profile'

// Mock delle dipendenze
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/core/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
    },
  },
}))

const mockAuth = auth as jest.Mock

describe('GET /api/admin/rangers - Lista Rangers disponibili', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockSentinelSession = {
    user: {
      id: 'sentinel-user-id',
      name: 'Admin Sentinel',
      email: 'admin@rideatlas.com',
      role: UserRole.Sentinel,
    },
  }

  describe('Autenticazione e autorizzazione', () => {
    it('Restituisce 401 se utente non autenticato', async () => {
      mockAuth.mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Non autorizzato')
    })

    it('Restituisce 403 se utente non è Sentinel', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'ranger-user-id',
          name: 'Ranger User',
          email: 'ranger@rideatlas.com',
          role: UserRole.Ranger,
        },
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Permessi insufficienti')
    })

    it('Restituisce 403 se utente è Explorer', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'explorer-user-id',
          name: 'Explorer User',
          email: 'explorer@rideatlas.com',
          role: UserRole.Explorer,
        },
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Permessi insufficienti')
    })
  })

  describe('Recupero lista rangers con successo', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSentinelSession)
    })

    it('Restituisce lista di rangers e sentinel ordinati per nome', async () => {
      const mockRangersList = [
        {
          id: 'ranger-1',
          name: 'Anna Bianchi',
          email: 'anna@rideatlas.com',
          image: null,
          role: UserRole.Ranger,
        },
        {
          id: 'sentinel-1',
          name: 'Carlo Rossi',
          email: 'carlo@rideatlas.com',
          image: 'https://example.com/avatar.jpg',
          role: UserRole.Sentinel,
        },
        {
          id: 'ranger-2',
          name: 'Marco Verdi',
          email: 'marco@rideatlas.com',
          image: null,
          role: UserRole.Ranger,
        },
      ]

      ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockRangersList)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ rangers: mockRangersList })
      expect(data.rangers).toHaveLength(3)

      // Verifica che la query Prisma sia corretta
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          role: { in: [UserRole.Ranger, UserRole.Sentinel] },
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
        orderBy: {
          name: 'asc',
        },
      })
    })

    it('Restituisce array vuoto se non ci sono ranger', async () => {
      ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ rangers: [] })
      expect(data.rangers).toHaveLength(0)
    })
  })

  describe('Gestione errori', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSentinelSession)
    })

    it('Gestisce errori del database (500)', async () => {
      ;(prisma.user.findMany as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })
  })
})
