import { PATCH } from '@/app/api/admin/trips/[id]/assign/route'
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
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}))

const mockAuth = auth as jest.Mock

describe('PATCH /api/admin/trips/[id]/assign - Assegnazione Ranger a Viaggio', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (tripId: string, body?: Record<string, unknown>): NextRequest => {
    return new NextRequest(`http://localhost/api/admin/trips/${tripId}/assign`, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers: body ? { 'Content-Type': 'application/json' } : {},
    })
  }

  const createMockContext = (tripId: string) => ({
    params: Promise.resolve({ id: tripId }),
  })

  const mockSentinelSession = {
    user: {
      id: 'sentinel-user-id',
      name: 'Admin Sentinel',
      email: 'admin@rideatlas.com',
      role: UserRole.Sentinel,
    },
  }

  // CUID validi per i test
  const CUID_RANGER_ATTUALE = 'clrangerattualeidxxxxxxxx'
  const CUID_RANGER_NUOVO = 'clrangernuovoidxxxxxxxxxx'
  const CUID_RANGER_INESISTENTE = 'clrangerinesistenteidxxxx'
  const CUID_EXPLORER = 'clexploreridxxxxxxxxxxxxx'
  const CUID_SENTINEL_DEST = 'clsentineldestidxxxxxxxxx'

  const mockViaggio = {
    id: 'trip-123',
    title: 'Viaggio nelle Alpi',
    status: 'Bozza',
    user_id: CUID_RANGER_ATTUALE,
  }

  const mockRangerDestinatario = {
    id: CUID_RANGER_NUOVO,
    role: UserRole.Ranger,
  }

  describe('Autenticazione e autorizzazione', () => {
    it('Restituisce 401 se utente non autenticato', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createMockRequest('trip-123', { rangerId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx' })
      const response = await PATCH(request, createMockContext('trip-123'))
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

      const request = createMockRequest('trip-123', { rangerId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx' })
      const response = await PATCH(request, createMockContext('trip-123'))
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Permessi insufficienti')
    })
  })

  describe('Validazione input', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSentinelSession)
    })

    it('Restituisce 400 se body non valido (rangerId mancante)', async () => {
      const request = createMockRequest('trip-123', {})
      const response = await PATCH(request, createMockContext('trip-123'))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Dati non validi: rangerId è obbligatorio')
    })

    it('Restituisce 400 se rangerId è stringa vuota', async () => {
      const request = createMockRequest('trip-123', { rangerId: '' })
      const response = await PATCH(request, createMockContext('trip-123'))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Dati non validi: rangerId è obbligatorio')
    })

    it('Restituisce 400 se rangerId non è un CUID valido', async () => {
      const request = createMockRequest('trip-123', { rangerId: 'non-un-cuid' })
      const response = await PATCH(request, createMockContext('trip-123'))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Dati non validi: rangerId è obbligatorio')
    })
  })

  describe('Verifica esistenza viaggio e ranger', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSentinelSession)
    })

    it('Restituisce 404 se viaggio non esiste', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest('trip-inesistente', { rangerId: CUID_RANGER_NUOVO })
      const response = await PATCH(request, createMockContext('trip-inesistente'))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Viaggio non trovato')
    })

    it('Restituisce 404 se ranger non esiste', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockViaggio)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest('trip-123', { rangerId: CUID_RANGER_INESISTENTE })
      const response = await PATCH(request, createMockContext('trip-123'))
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Ranger non trovato')
    })

    it('Restituisce 400 se destinatario non ha ruolo Ranger o Sentinel', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockViaggio)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: CUID_EXPLORER,
        role: UserRole.Explorer,
      })

      const request = createMockRequest('trip-123', { rangerId: CUID_EXPLORER })
      const response = await PATCH(request, createMockContext('trip-123'))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("L'utente selezionato non ha il ruolo di Ranger o Sentinel")
    })
  })

  describe('Assegnazione viaggio', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSentinelSession)
    })

    it('Restituisce 200 senza modifiche se viaggio già assegnato allo stesso ranger', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockViaggio)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: CUID_RANGER_ATTUALE,
        role: UserRole.Ranger,
      })

      const request = createMockRequest('trip-123', { rangerId: CUID_RANGER_ATTUALE })
      const response = await PATCH(request, createMockContext('trip-123'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Viaggio già assegnato a questo ranger')
      // Verifica che NON venga chiamato update
      expect(prisma.trip.update).not.toHaveBeenCalled()
    })

    it('Assegna correttamente il viaggio a un nuovo ranger (200)', async () => {
      const viaggioAggiornato = {
        ...mockViaggio,
        user_id: CUID_RANGER_NUOVO,
        user: {
          id: CUID_RANGER_NUOVO,
          name: 'Nuovo Ranger',
          email: 'nuovo@rideatlas.com',
          image: null,
          role: UserRole.Ranger,
        },
      }

      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockViaggio)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockRangerDestinatario)
      ;(prisma.trip.update as jest.Mock).mockResolvedValue(viaggioAggiornato)

      const request = createMockRequest('trip-123', { rangerId: CUID_RANGER_NUOVO })
      const response = await PATCH(request, createMockContext('trip-123'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user_id).toBe(CUID_RANGER_NUOVO)
      expect(data.user.name).toBe('Nuovo Ranger')

      // Verifica la chiamata a prisma.trip.update
      expect(prisma.trip.update).toHaveBeenCalledWith({
        where: { id: 'trip-123' },
        data: { user_id: CUID_RANGER_NUOVO },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
        },
      })
    })

    it('Assegna correttamente il viaggio a un Sentinel', async () => {
      const viaggioAggiornato = {
        ...mockViaggio,
        user_id: CUID_SENTINEL_DEST,
        user: {
          id: CUID_SENTINEL_DEST,
          name: 'Sentinel Destinatario',
          email: 'sentinel-dest@rideatlas.com',
          image: null,
          role: UserRole.Sentinel,
        },
      }

      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockViaggio)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: CUID_SENTINEL_DEST,
        role: UserRole.Sentinel,
      })
      ;(prisma.trip.update as jest.Mock).mockResolvedValue(viaggioAggiornato)

      const request = createMockRequest('trip-123', { rangerId: CUID_SENTINEL_DEST })
      const response = await PATCH(request, createMockContext('trip-123'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user.role).toBe(UserRole.Sentinel)
    })
  })

  describe('Gestione errori', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSentinelSession)
    })

    it('Gestisce errori del database (500)', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = createMockRequest('trip-123', { rangerId: CUID_RANGER_NUOVO })
      const response = await PATCH(request, createMockContext('trip-123'))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })

    it('Gestisce errori durante l\'aggiornamento del viaggio', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockViaggio)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockRangerDestinatario)
      ;(prisma.trip.update as jest.Mock).mockRejectedValue(
        new Error('Update failed')
      )

      const request = createMockRequest('trip-123', { rangerId: CUID_RANGER_NUOVO })
      const response = await PATCH(request, createMockContext('trip-123'))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })
  })
})
