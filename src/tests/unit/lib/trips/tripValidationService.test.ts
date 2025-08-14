import { TripValidationService } from '@/lib/trips/tripValidationService'
import { prisma } from '@/lib/core/prisma'

// Mock Prisma
jest.mock('@/lib/core/prisma', () => ({
  prisma: {
    trip: {
      findUnique: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('TripValidationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateForPublication', () => {
    const tripId = 'test-trip-id'

    it('should return valid when trip meets all requirements', async () => {
      // Mock valido trip con tutte le tappe complete
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: tripId,
        title: 'Viaggio in Toscana',
        summary: 'Un bellissimo viaggio attraverso la Toscana',
        stages: [
          {
            id: 'stage-1',
            orderIndex: 1,
            title: 'Tappa 1',
            description: 'Prima tappa del viaggio',
            gpxFile: { url: 'test.gpx', filename: 'test.gpx' },
          },
          {
            id: 'stage-2',
            orderIndex: 2,
            title: 'Tappa 2',
            description: 'Seconda tappa del viaggio',
            gpxFile: { url: 'test2.gpx', filename: 'test2.gpx' },
          },
        ],
      } as any)

      const result = await TripValidationService.validateForPublication(tripId)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return error when trip is not found', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(null)

      const result = await TripValidationService.validateForPublication(tripId)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toEqual({
        field: 'trip',
        message: 'Viaggio non trovato',
        code: 'TRIP_NOT_FOUND'
      })
    })

    it('should return error when title is missing', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: tripId,
        title: '', // Titolo vuoto
        summary: 'Una descrizione',
        stages: [
          {
            id: 'stage-1',
            orderIndex: 1,
            title: 'Tappa 1',
            description: 'Prima tappa',
            gpxFile: { url: 'test.gpx' },
          },
        ],
      } as any)

      const result = await TripValidationService.validateForPublication(tripId)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'title',
        message: 'Il titolo è obbligatorio',
        code: 'TITLE_REQUIRED'
      })
    })

    it('should return error when title is only whitespace', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: tripId,
        title: '   ', // Solo spazi
        summary: 'Una descrizione',
        stages: [
          {
            id: 'stage-1',
            orderIndex: 1,
            title: 'Tappa 1',
            description: 'Prima tappa',
            gpxFile: { url: 'test.gpx' },
          },
        ],
      } as any)

      const result = await TripValidationService.validateForPublication(tripId)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'title',
        message: 'Il titolo è obbligatorio',
        code: 'TITLE_REQUIRED'
      })
    })

    it('should return error when summary is missing', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: tripId,
        title: 'Titolo valido',
        summary: '', // Descrizione vuota
        stages: [
          {
            id: 'stage-1',
            orderIndex: 1,
            title: 'Tappa 1',
            description: 'Prima tappa',
            gpxFile: { url: 'test.gpx' },
          },
        ],
      } as any)

      const result = await TripValidationService.validateForPublication(tripId)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'summary',
        message: 'La descrizione è obbligatoria',
        code: 'SUMMARY_REQUIRED'
      })
    })

    it('should return error when no stages exist', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: tripId,
        title: 'Titolo valido',
        summary: 'Descrizione valida',
        stages: [], // Nessuna tappa
      } as any)

      const result = await TripValidationService.validateForPublication(tripId)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'stages',
        message: 'Il viaggio deve avere almeno una tappa',
        code: 'STAGES_REQUIRED'
      })
    })

    it('should return error when stages are null', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: tripId,
        title: 'Titolo valido',
        summary: 'Descrizione valida',
        stages: null, // Stages null
      } as any)

      const result = await TripValidationService.validateForPublication(tripId)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'stages',
        message: 'Il viaggio deve avere almeno una tappa',
        code: 'STAGES_REQUIRED'
      })
    })

    it('should return error when some stages lack GPX files', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: tripId,
        title: 'Titolo valido',
        summary: 'Descrizione valida',
        stages: [
          {
            id: 'stage-1',
            orderIndex: 1,
            title: 'Tappa 1',
            description: 'Prima tappa',
            gpxFile: { url: 'test.gpx' }, // Ha GPX
          },
          {
            id: 'stage-2',
            orderIndex: 2,
            title: 'Tappa 2',
            description: 'Seconda tappa',
            gpxFile: null, // Manca GPX
          },
          {
            id: 'stage-3',
            orderIndex: 3,
            title: 'Tappa 3',
            description: 'Terza tappa',
            // gpxFile mancante
          },
        ],
      } as any)

      const result = await TripValidationService.validateForPublication(tripId)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'stages.gpx',
        message: '2 tappa/e mancano del file GPX',
        code: 'STAGES_GPX_REQUIRED'
      })
    })

    it('should return error when some stages lack descriptions', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: tripId,
        title: 'Titolo valido',
        summary: 'Descrizione valida',
        stages: [
          {
            id: 'stage-1',
            orderIndex: 1,
            title: 'Tappa 1',
            description: 'Prima tappa',
            gpxFile: { url: 'test.gpx' },
          },
          {
            id: 'stage-2',
            orderIndex: 2,
            title: 'Tappa 2',
            description: '', // Descrizione vuota
            gpxFile: { url: 'test2.gpx' },
          },
          {
            id: 'stage-3',
            orderIndex: 3,
            title: 'Tappa 3',
            description: null, // Descrizione null
            gpxFile: { url: 'test3.gpx' },
          },
        ],
      } as any)

      const result = await TripValidationService.validateForPublication(tripId)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual({
        field: 'stages.description',
        message: '2 tappa/e mancano della descrizione',
        code: 'STAGES_DESCRIPTION_REQUIRED'
      })
    })

    it('should return multiple errors when multiple validations fail', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: tripId,
        title: '', // Titolo mancante
        summary: '', // Descrizione mancante
        stages: [
          {
            id: 'stage-1',
            orderIndex: 1,
            title: 'Tappa 1',
            description: '', // Descrizione tappa mancante
            gpxFile: null, // GPX mancante
          },
        ],
      } as any)

      const result = await TripValidationService.validateForPublication(tripId)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(4)
      
      // Controlla che ci siano tutti gli errori previsti
      const errorCodes = result.errors.map(error => error.code)
      expect(errorCodes).toContain('TITLE_REQUIRED')
      expect(errorCodes).toContain('SUMMARY_REQUIRED')
      expect(errorCodes).toContain('STAGES_GPX_REQUIRED')
      expect(errorCodes).toContain('STAGES_DESCRIPTION_REQUIRED')
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.trip.findUnique.mockRejectedValue(new Error('Database connection failed'))

      const result = await TripValidationService.validateForPublication(tripId)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toEqual({
        field: 'system',
        message: 'Errore interno durante la validazione',
        code: 'VALIDATION_ERROR'
      })
    })

    it('should handle edge case with empty stages array but valid trip data', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: tripId,
        title: 'Titolo valido',
        summary: 'Descrizione valida',
        stages: [], // Array vuoto ma definito
      } as any)

      const result = await TripValidationService.validateForPublication(tripId)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('STAGES_REQUIRED')
    })

    it('should validate single stage trip correctly', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: tripId,
        title: 'Viaggio breve',
        summary: 'Un viaggio di una sola tappa',
        stages: [
          {
            id: 'stage-1',
            orderIndex: 1,
            title: 'Unica tappa',
            description: 'La tappa del viaggio',
            gpxFile: { url: 'single.gpx', filename: 'single.gpx' },
          },
        ],
      } as any)

      const result = await TripValidationService.validateForPublication(tripId)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should trim whitespace when checking title and summary', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        id: tripId,
        title: '  \n  ', // Solo spazi e newlines
        summary: '\t\r\n', // Solo tab, carriage return, newline  
        stages: [
          {
            id: 'stage-1',
            orderIndex: 1,
            title: 'Tappa 1',
            description: 'Descrizione',
            gpxFile: { url: 'test.gpx' },
          },
        ],
      } as any)

      const result = await TripValidationService.validateForPublication(tripId)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(2)
      
      const errorCodes = result.errors.map(error => error.code)
      expect(errorCodes).toContain('TITLE_REQUIRED')
      expect(errorCodes).toContain('SUMMARY_REQUIRED')
    })
  })
})