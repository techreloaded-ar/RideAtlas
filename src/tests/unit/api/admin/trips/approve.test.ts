import { PATCH } from '@/app/api/admin/trips/[id]/approve/route'
import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { UserRole } from '@/types/profile'
import { TripValidationService } from '@/lib/trips/tripValidationService'

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
  },
}))

jest.mock('@/lib/trips/tripValidationService', () => ({
  TripValidationService: {
    validateForPublication: jest.fn(),
  },
}))

const mockAuth = auth as jest.Mock
const mockValidationService = TripValidationService as jest.Mocked<typeof TripValidationService>

describe('PATCH /api/admin/trips/[id]/approve - Approvazione Viaggi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (tripId: string): NextRequest => {
    return new NextRequest(`http://localhost/api/admin/trips/${tripId}/approve`, {
      method: 'PATCH',
    })
  }

  const mockSentinelSession = {
    user: {
      id: 'sentinel-user-id',
      name: 'Admin Sentinel',
      email: 'admin@rideatlas.com',
      role: UserRole.Sentinel,
    },
  }

  const mockDraftTrip = {
    id: 'trip-123',
    title: 'Viaggio da Approvare',
    status: 'Bozza',
    user: {
      id: 'creator-user-id',
      name: 'Creator User',
      email: 'creator@example.com',
    },
  }

  const mockPublishedTrip = {
    id: 'trip-456',
    title: 'Viaggio Già Pubblicato',
    status: 'Pubblicato',
    user: {
      id: 'creator-user-id',
      name: 'Creator User',
      email: 'creator@example.com',
    },
  }

  const mockUpdatedTrip = {
    ...mockDraftTrip,
    status: 'Pubblicato',
  }

  describe('Autorizzazione', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
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

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Permessi insufficienti')
    })

    it('should return 403 if user is Ranger (not Sentinel)', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-id',
          role: UserRole.Ranger,
        },
      } as any)

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Permessi insufficienti')
    })
  })

  describe('Approvazione con successo', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSentinelSession as any)
    })

    it('should approve a draft trip successfully', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockDraftTrip)
      ;(prisma.trip.update as jest.Mock).mockResolvedValue(mockUpdatedTrip)
      mockValidationService.validateForPublication.mockResolvedValue({
        isValid: true,
        errors: []
      })

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Viaggio approvato con successo')
      expect(data.trip).toEqual(mockUpdatedTrip)

      // Verifica che venga chiamata la validazione
      expect(mockValidationService.validateForPublication).toHaveBeenCalledWith('trip-123')

      // Verifica che venga cercato il viaggio esistente
      expect(prisma.trip.findUnique).toHaveBeenCalledWith({
        where: { id: 'trip-123' },
        select: {
          id: true,
          title: true,
          status: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Verifica che venga aggiornato con stato "Pubblicato"
      expect(prisma.trip.update).toHaveBeenCalledWith({
        where: { id: 'trip-123' },
        data: { status: 'Pubblicato' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    })

    it('should handle trip with different user data correctly', async () => {
      const tripWithDifferentUser = {
        ...mockDraftTrip,
        user: {
          id: 'different-user-id',
          name: 'Different User',
          email: 'different@example.com',
        },
      }

      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(tripWithDifferentUser)
      ;(prisma.trip.update as jest.Mock).mockResolvedValue({
        ...tripWithDifferentUser,
        status: 'Pubblicato',
      })
      mockValidationService.validateForPublication.mockResolvedValue({
        isValid: true,
        errors: []
      })

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trip.user.name).toBe('Different User')
      expect(data.trip.status).toBe('Pubblicato')
    })
  })

  describe('Errori di validazione', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSentinelSession as any)
    })

    it('should return 404 if trip does not exist', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest('nonexistent-trip')
      const response = await PATCH(request, { params: { id: 'nonexistent-trip' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Viaggio non trovato')
      expect(prisma.trip.update).not.toHaveBeenCalled()
    })

    it('should return 400 if trip is already published', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockPublishedTrip)

      const request = createMockRequest('trip-456')
      const response = await PATCH(request, { params: { id: 'trip-456' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Solo i viaggi in bozza possono essere approvati')
      expect(prisma.trip.update).not.toHaveBeenCalled()
    })

    it('should return 400 if trip is in archived status', async () => {
      const archivedTrip = {
        ...mockDraftTrip,
        status: 'Archiviato',
      }
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(archivedTrip)

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Solo i viaggi in bozza possono essere approvati')
    })

    it('should return 400 if trip is in ready for review status', async () => {
      const reviewTrip = {
        ...mockDraftTrip,
        status: 'Pronto_per_revisione',
      }
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(reviewTrip)

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Solo i viaggi in bozza possono essere approvati')
    })
  })

  describe('Gestione errori database', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSentinelSession as any)
    })

    it('should handle database error during trip search', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })

    it('should handle database error during trip update', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockDraftTrip)
      ;(prisma.trip.update as jest.Mock).mockRejectedValue(new Error('Update failed'))

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })

    it('should handle concurrent modification errors', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockDraftTrip)
      ;(prisma.trip.update as jest.Mock).mockRejectedValue({
        code: 'P2025',
        message: 'Record not found',
      })

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })

    it('should handle malformed trip ID gracefully', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockRejectedValue({
        code: 'P2023',
        message: 'Invalid ID format',
      })

      const request = createMockRequest('invalid-id-format')
      const response = await PATCH(request, { params: { id: 'invalid-id-format' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })
  })

  describe('Validazione ID parametri', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSentinelSession as any)
    })

    it('should handle empty trip ID', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest('')
      const response = await PATCH(request, { params: { id: '' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Viaggio non trovato')
    })

    it('should handle UUID format trip ID', async () => {
      const uuidTripId = '550e8400-e29b-41d4-a716-446655440000'
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue({
        ...mockDraftTrip,
        id: uuidTripId,
      })
      ;(prisma.trip.update as jest.Mock).mockResolvedValue({
        ...mockUpdatedTrip,
        id: uuidTripId,
      })

      const request = createMockRequest(uuidTripId)
      const response = await PATCH(request, { params: { id: uuidTripId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trip.id).toBe(uuidTripId)
    })
  })

  describe('Validazione con TripValidationService', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSentinelSession as any)
    })

    it('should return 400 with validation errors when trip validation fails', async () => {
      const validationErrors = [
        {
          field: 'title',
          message: 'Il titolo è obbligatorio',
          code: 'TITLE_REQUIRED'
        },
        {
          field: 'stages.gpx',
          message: '2 tappa/e mancano del file GPX',
          code: 'STAGES_GPX_REQUIRED'
        }
      ]

      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockDraftTrip)
      mockValidationService.validateForPublication.mockResolvedValue({
        isValid: false,
        errors: validationErrors
      })

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Il viaggio non può essere pubblicato')
      expect(data.validationErrors).toEqual(validationErrors)
      
      // Verifica che la validazione sia stata chiamata
      expect(mockValidationService.validateForPublication).toHaveBeenCalledWith('trip-123')
      
      // Verifica che NON venga fatto l'update se la validazione fallisce
      expect(prisma.trip.update).not.toHaveBeenCalled()
    })

    it('should return 400 with single validation error', async () => {
      const singleError = [{
        field: 'summary',
        message: 'La descrizione è obbligatoria',
        code: 'SUMMARY_REQUIRED'
      }]

      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockDraftTrip)
      mockValidationService.validateForPublication.mockResolvedValue({
        isValid: false,
        errors: singleError
      })

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.validationErrors).toEqual(singleError)
      expect(data.validationErrors).toHaveLength(1)
    })

    it('should handle validation service errors gracefully', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockDraftTrip)
      mockValidationService.validateForPublication.mockResolvedValue({
        isValid: false,
        errors: [{
          field: 'system',
          message: 'Errore interno durante la validazione',
          code: 'VALIDATION_ERROR'
        }]
      })

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Il viaggio non può essere pubblicato')
      expect(data.validationErrors[0].code).toBe('VALIDATION_ERROR')
    })

    it('should proceed with approval when validation passes', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockDraftTrip)
      ;(prisma.trip.update as jest.Mock).mockResolvedValue(mockUpdatedTrip)
      mockValidationService.validateForPublication.mockResolvedValue({
        isValid: true,
        errors: []
      })

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })

      expect(response.status).toBe(200)
      expect(mockValidationService.validateForPublication).toHaveBeenCalledWith('trip-123')
      expect(prisma.trip.update).toHaveBeenCalled()
    })

    it('should call validation service even for trips that would otherwise fail', async () => {
      // Trip che non esiste, ma dovrebbe chiamare prima la validazione
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(null)
      
      const request = createMockRequest('nonexistent-trip')
      const response = await PATCH(request, { params: { id: 'nonexistent-trip' } })
      
      expect(response.status).toBe(404)
      // La validazione non dovrebbe essere chiamata se il trip non esiste
      expect(mockValidationService.validateForPublication).not.toHaveBeenCalled()
    })
  })
})
