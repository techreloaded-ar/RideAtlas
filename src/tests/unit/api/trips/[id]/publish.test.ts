import { PATCH } from '@/app/api/trips/[id]/publish/route'
import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { UserRole } from '@/types/profile'
import { TripStatus } from '@/types/trip'
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

describe('PATCH /api/trips/[id]/publish - Pubblicazione Viaggi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (tripId: string): NextRequest => {
    return new NextRequest(`http://localhost/api/trips/${tripId}/publish`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  const mockOwnerSession = {
    user: {
      id: 'owner-user-id',
      name: 'Trip Owner',
      email: 'owner@example.com',
      role: UserRole.Ranger,
    },
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
    user_id: 'owner-user-id',
    status: TripStatus.Bozza,
    title: 'Viaggio in Bozza',
    updated_at: new Date('2024-01-01T00:00:00Z')
  }

  const mockPublishedTrip = {
    id: 'trip-456',
    user_id: 'owner-user-id',
    status: TripStatus.Pubblicato,
    title: 'Viaggio Già Pubblicato',
    updated_at: new Date('2024-01-01T00:00:00Z')
  }

  const mockUpdatedTrip = {
    ...mockDraftTrip,
    status: TripStatus.Pubblicato,
    updated_at: new Date()
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

    it('should allow trip owner to publish their trip', async () => {
      mockAuth.mockResolvedValue(mockOwnerSession as any)
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockDraftTrip)
      ;(prisma.trip.update as jest.Mock).mockResolvedValue(mockUpdatedTrip)
      mockValidationService.validateForPublication.mockResolvedValue({
        isValid: true,
        errors: []
      })

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })

      expect(response.status).toBe(200)
    })

    it('should allow Sentinel to publish any trip', async () => {
      const tripByDifferentUser = {
        ...mockDraftTrip,
        user_id: 'different-user-id'
      }

      mockAuth.mockResolvedValue(mockSentinelSession as any)
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(tripByDifferentUser)
      ;(prisma.trip.update as jest.Mock).mockResolvedValue({
        ...tripByDifferentUser,
        status: TripStatus.Pubblicato
      })
      mockValidationService.validateForPublication.mockResolvedValue({
        isValid: true,
        errors: []
      })

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })

      expect(response.status).toBe(200)
    })

    it('should return 403 if user is not owner nor Sentinel', async () => {
      const unauthorizedSession = {
        user: {
          id: 'different-user-id', // Non è il proprietario
          role: UserRole.Ranger,
        },
      }

      mockAuth.mockResolvedValue(unauthorizedSession as any)
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockDraftTrip)

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Permessi insufficienti')
    })

    it('should allow Explorer owner to publish their own trip', async () => {
      const explorerSession = {
        user: {
          id: 'owner-user-id', // Stesso ID del proprietario
          role: UserRole.Explorer,
        },
      }

      mockAuth.mockResolvedValue(explorerSession as any)
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockDraftTrip)
      ;(prisma.trip.update as jest.Mock).mockResolvedValue(mockUpdatedTrip)
      mockValidationService.validateForPublication.mockResolvedValue({
        isValid: true,
        errors: []
      })

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })

      expect(response.status).toBe(200)
      // L'API permette al proprietario di pubblicare indipendentemente dal ruolo
    })
  })

  describe('Validazione stato trip', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockOwnerSession as any)
    })

    it('should return 404 if trip does not exist', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest('nonexistent-trip')
      const response = await PATCH(request, { params: { id: 'nonexistent-trip' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Viaggio non trovato')
    })

    it('should return 400 if trip is already published', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockPublishedTrip)

      const request = createMockRequest('trip-456')
      const response = await PATCH(request, { params: { id: 'trip-456' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Solo i viaggi in stato "Bozza" possono essere pubblicati')
    })

    it('should return 400 if trip is in ready for review status', async () => {
      const reviewTrip = {
        ...mockDraftTrip,
        status: TripStatus.Pronto_per_revisione
      }
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(reviewTrip)

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Solo i viaggi in stato "Bozza" possono essere pubblicati')
    })

    it('should return 400 if trip is archived', async () => {
      const archivedTrip = {
        ...mockDraftTrip,
        status: 'Archiviato' as any
      }
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(archivedTrip)

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Solo i viaggi in stato "Bozza" possono essere pubblicati')
    })
  })

  describe('Validazione business logic', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockOwnerSession as any)
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockDraftTrip)
    })

    it('should publish trip successfully when validation passes', async () => {
      mockValidationService.validateForPublication.mockResolvedValue({
        isValid: true,
        errors: []
      })
      ;(prisma.trip.update as jest.Mock).mockResolvedValue(mockUpdatedTrip)

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.trip).toEqual(mockUpdatedTrip)

      // Verifica che la validazione sia stata chiamata
      expect(mockValidationService.validateForPublication).toHaveBeenCalledWith('trip-123')

      // Verifica che l'update sia stato fatto correttamente
      expect(prisma.trip.update).toHaveBeenCalledWith({
        where: { id: 'trip-123' },
        data: { status: TripStatus.Pubblicato, updated_at: expect.any(Date) }
      })
    })

    it('should return 400 with validation errors when validation fails', async () => {
      const validationErrors = [
        {
          field: 'title',
          message: 'Il titolo è obbligatorio',
          code: 'TITLE_REQUIRED'
        },
        {
          field: 'stages.gpx',
          message: '1 tappa/e mancano del file GPX',
          code: 'STAGES_GPX_REQUIRED'
        }
      ]

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

      // Verifica che NON venga fatto l'update se la validazione fallisce
      expect(prisma.trip.update).not.toHaveBeenCalled()
    })

    it('should return 400 with single validation error', async () => {
      const singleError = [{
        field: 'summary',
        message: 'La descrizione è obbligatoria',
        code: 'SUMMARY_REQUIRED'
      }]

      mockValidationService.validateForPublication.mockResolvedValue({
        isValid: false,
        errors: singleError
      })

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Il viaggio non può essere pubblicato')
      expect(data.validationErrors).toEqual(singleError)
      expect(data.validationErrors).toHaveLength(1)
    })

    it('should return 400 with multiple validation errors', async () => {
      const multipleErrors = [
        {
          field: 'title',
          message: 'Il titolo è obbligatorio',
          code: 'TITLE_REQUIRED'
        },
        {
          field: 'summary',
          message: 'La descrizione è obbligatoria',
          code: 'SUMMARY_REQUIRED'
        },
        {
          field: 'stages',
          message: 'Il viaggio deve avere almeno una tappa',
          code: 'STAGES_REQUIRED'
        }
      ]

      mockValidationService.validateForPublication.mockResolvedValue({
        isValid: false,
        errors: multipleErrors
      })

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.validationErrors).toHaveLength(3)
      expect(data.validationErrors).toEqual(multipleErrors)
    })

    it('should handle validation service system errors', async () => {
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
  })

  describe('Gestione errori database', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(mockOwnerSession as any)
    })

    it('should handle database error during trip search', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno server')
    })

    it('should handle database error during trip update', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockDraftTrip)
      mockValidationService.validateForPublication.mockResolvedValue({
        isValid: true,
        errors: []
      })
      ;(prisma.trip.update as jest.Mock).mockRejectedValue(new Error('Update failed'))

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno server')
    })

    it('should handle validation service throwing exceptions', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockDraftTrip)
      mockValidationService.validateForPublication.mockRejectedValue(new Error('Validation service failed'))

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno server')
    })

    it('should handle concurrent modification during update', async () => {
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockDraftTrip)
      mockValidationService.validateForPublication.mockResolvedValue({
        isValid: true,
        errors: []
      })
      ;(prisma.trip.update as jest.Mock).mockRejectedValue({
        code: 'P2025',
        message: 'Record not found',
      })

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno server')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty trip ID', async () => {
      mockAuth.mockResolvedValue(mockOwnerSession as any)
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest('')
      const response = await PATCH(request, { params: { id: '' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Viaggio non trovato')
    })

    it('should handle UUID format trip ID correctly', async () => {
      const uuidTripId = '550e8400-e29b-41d4-a716-446655440000'
      const uuidTrip = {
        ...mockDraftTrip,
        id: uuidTripId
      }

      mockAuth.mockResolvedValue(mockOwnerSession as any)
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(uuidTrip)
      ;(prisma.trip.update as jest.Mock).mockResolvedValue({
        ...uuidTrip,
        status: TripStatus.Pubblicato
      })
      mockValidationService.validateForPublication.mockResolvedValue({
        isValid: true,
        errors: []
      })

      const request = createMockRequest(uuidTripId)
      const response = await PATCH(request, { params: { id: uuidTripId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.trip.id).toBe(uuidTripId)
    })

    it('should properly handle trip ownership check', async () => {
      const tripByDifferentUser = {
        ...mockDraftTrip,
        user_id: 'different-user-id'
      }

      mockAuth.mockResolvedValue(mockOwnerSession as any) // owner-user-id
      ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(tripByDifferentUser) // different-user-id

      const request = createMockRequest('trip-123')
      const response = await PATCH(request, { params: { id: 'trip-123' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Permessi insufficienti')

      // La validazione non dovrebbe essere chiamata se non ha i permessi
      expect(mockValidationService.validateForPublication).not.toHaveBeenCalled()
    })
  })
})