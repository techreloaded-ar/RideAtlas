// src/tests/unit/schemas/batch-trip.test.ts
import { describe, it, expect } from '@jest/globals'
import { 
  singleTripBatchSchema, 
  multipleTripsBatchSchema, 
  batchUploadSchema,
  isSingleTripBatch,
  isMultipleTripsBatch 
} from '@/schemas/batch-trip'

describe('Batch Trip Schemas', () => {
  describe('singleTripBatchSchema', () => {
    it('should validate a valid single trip', () => {
      const validTrip = {
        title: 'Giro delle Dolomiti',
        summary: 'Un incredibile percorso attraverso le montagne più belle d\'Italia',
        destination: 'Dolomiti, Trentino-Alto Adige',
        theme: 'Montagna e natura',
        characteristics: ['Curve strette', 'Bel paesaggio'],
        recommended_seasons: ['Estate', 'Autunno'],
        tags: ['dolomiti', 'montagna'],
        travelDate: '2024-07-15T00:00:00.000Z',
        stages: [
          {
            title: 'Bolzano - Ortisei',
            description: 'Prima tappa attraverso la Val Gardena',
            routeType: 'Strada statale',
            duration: '2 ore'
          }
        ]
      }

      const result = singleTripBatchSchema.safeParse(validTrip)
      expect(result.success).toBe(true)
    })

    it('should fail validation with missing required fields', () => {
      const invalidTrip = {
        title: 'Te',
        summary: 'Too short',
        destination: '',
        theme: '',
        recommended_seasons: [],
        stages: []
      }

      const result = singleTripBatchSchema.safeParse(invalidTrip)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['title'] }),
            expect.objectContaining({ path: ['summary'] }),
            expect.objectContaining({ path: ['destination'] }),
            expect.objectContaining({ path: ['theme'] }),
            expect.objectContaining({ path: ['recommended_seasons'] }),
            expect.objectContaining({ path: ['stages'] })
          ])
        )
      }
    })

    it('should validate with optional fields', () => {
      const tripWithOptionals = {
        title: 'Viaggio minimale',
        summary: 'Descrizione minimale ma valida',
        destination: 'Destinazione',
        theme: 'Tema',
        characteristics: [],
        recommended_seasons: ['Estate'],
        tags: [],
        stages: [
          {
            title: 'Tappa unica'
          }
        ]
      }

      const result = singleTripBatchSchema.safeParse(tripWithOptionals)
      expect(result.success).toBe(true)
    })

    it('should enforce stages limit', () => {
      const stages = Array.from({ length: 21 }, (_, i) => ({
        title: `Tappa ${i + 1}`
      }))

      const tripWithTooManyStages = {
        title: 'Viaggio con troppe tappe',
        summary: 'Descrizione valida',
        destination: 'Destinazione',
        theme: 'Tema',
        recommended_seasons: ['Estate'],
        stages
      }

      const result = singleTripBatchSchema.safeParse(tripWithTooManyStages)
      expect(result.success).toBe(false)
    })
  })

  describe('multipleTripsBatchSchema', () => {
    it('should validate multiple trips', () => {
      const validBatch = {
        viaggi: [
          {
            title: 'Viaggio 1',
            summary: 'Descrizione del primo viaggio',
            destination: 'Destinazione 1',
            theme: 'Tema 1',
            recommended_seasons: ['Estate'],
            stages: [{ title: 'Tappa 1' }]
          },
          {
            title: 'Viaggio 2',
            summary: 'Descrizione del secondo viaggio',
            destination: 'Destinazione 2',
            theme: 'Tema 2',
            recommended_seasons: ['Autunno'],
            stages: [{ title: 'Tappa 1' }]
          }
        ]
      }

      const result = multipleTripsBatchSchema.safeParse(validBatch)
      expect(result.success).toBe(true)
    })

    it('should enforce trips limit', () => {
      const viaggi = Array.from({ length: 11 }, (_, i) => ({
        title: `Viaggio ${i + 1}`,
        summary: 'Descrizione valida',
        destination: 'Destinazione',
        theme: 'Tema',
        recommended_seasons: ['Estate'],
        stages: [{ title: 'Tappa 1' }]
      }))

      const batchWithTooManyTrips = { viaggi }

      const result = multipleTripsBatchSchema.safeParse(batchWithTooManyTrips)
      expect(result.success).toBe(false)
    })

    it('should require at least one trip', () => {
      const emptyBatch = { viaggi: [] }

      const result = multipleTripsBatchSchema.safeParse(emptyBatch)
      expect(result.success).toBe(false)
    })
  })

  describe('batchUploadSchema union', () => {
    it('should accept single trip format', () => {
      const singleTrip = {
        title: 'Viaggio singolo',
        summary: 'Descrizione del viaggio singolo',
        destination: 'Destinazione',
        theme: 'Tema',
        recommended_seasons: ['Estate'],
        stages: [{ title: 'Tappa 1' }]
      }

      const result = batchUploadSchema.safeParse(singleTrip)
      expect(result.success).toBe(true)
    })

    it('should accept multiple trips format', () => {
      const multipleTrips = {
        viaggi: [
          {
            title: 'Viaggio 1',
            summary: 'Descrizione del primo viaggio',
            destination: 'Destinazione 1',
            theme: 'Tema 1',
            recommended_seasons: ['Estate'],
            stages: [{ title: 'Tappa 1' }]
          }
        ]
      }

      const result = batchUploadSchema.safeParse(multipleTrips)
      expect(result.success).toBe(true)
    })
  })

  describe('Type guards', () => {
    it('should correctly identify single trip batch', () => {
      const singleTrip = {
        title: 'Viaggio singolo',
        summary: 'Descrizione',
        destination: 'Destinazione',
        theme: 'Tema',
        recommended_seasons: ['Estate'],
        stages: []
      }

      expect(isSingleTripBatch(singleTrip)).toBe(true)
      expect(isMultipleTripsBatch(singleTrip)).toBe(false)
    })

    it('should correctly identify multiple trips batch', () => {
      const multipleTrips = {
        viaggi: [
          {
            title: 'Viaggio 1',
            summary: 'Descrizione',
            destination: 'Destinazione',
            theme: 'Tema',
            recommended_seasons: ['Estate'],
            stages: []
          }
        ]
      }

      expect(isSingleTripBatch(multipleTrips)).toBe(false)
      expect(isMultipleTripsBatch(multipleTrips)).toBe(true)
    })
  })

  describe('Stage validation', () => {
    it('should validate stage with all fields', () => {
      const fullStage = {
        title: 'Bolzano - Ortisei',
        description: 'Prima tappa attraverso la Val Gardena con paesaggi mozzafiato',
        routeType: 'Strada statale con alcune curve',
        duration: '2 ore con soste fotografiche'
      }

      const trip = {
        title: 'Viaggio test',
        summary: 'Descrizione viaggio test',
        destination: 'Destinazione test',
        theme: 'Tema test',
        recommended_seasons: ['Estate'],
        stages: [fullStage]
      }

      const result = singleTripBatchSchema.safeParse(trip)
      expect(result.success).toBe(true)
    })

    it('should enforce stage title length limits', () => {
      const stageWithLongTitle = {
        title: 'A'.repeat(201)
      }

      const trip = {
        title: 'Viaggio test',
        summary: 'Descrizione viaggio test',
        destination: 'Destinazione test',
        theme: 'Tema test',
        recommended_seasons: ['Estate'],
        stages: [stageWithLongTitle]
      }

      const result = singleTripBatchSchema.safeParse(trip)
      expect(result.success).toBe(false)
    })

    it('should enforce stage description length limits', () => {
      const stageWithLongDescription = {
        title: 'Tappa valida',
        description: 'A'.repeat(2001)
      }

      const trip = {
        title: 'Viaggio test',
        summary: 'Descrizione viaggio test',
        destination: 'Destinazione test',
        theme: 'Tema test',
        recommended_seasons: ['Estate'],
        stages: [stageWithLongDescription]
      }

      const result = singleTripBatchSchema.safeParse(trip)
      expect(result.success).toBe(false)
    })
  })

  describe('Characteristics and seasons validation', () => {
    it('should accept valid characteristics', () => {
      const trip = {
        title: 'Viaggio test',
        summary: 'Descrizione viaggio test',
        destination: 'Destinazione test',
        theme: 'Tema test',
        characteristics: ['Strade sterrate', 'Curve strette', 'Bel paesaggio'],
        recommended_seasons: ['Estate'],
        stages: [{ title: 'Tappa 1' }]
      }

      const result = singleTripBatchSchema.safeParse(trip)
      expect(result.success).toBe(true)
    })

    it('should reject invalid characteristics', () => {
      const trip = {
        title: 'Viaggio test',
        summary: 'Descrizione viaggio test',
        destination: 'Destinazione test',
        theme: 'Tema test',
        characteristics: ['Caratteristica inesistente'],
        recommended_seasons: ['Estate'],
        stages: [{ title: 'Tappa 1' }]
      }

      const result = singleTripBatchSchema.safeParse(trip)
      expect(result.success).toBe(false)
    })

    it('should accept valid seasons', () => {
      const trip = {
        title: 'Viaggio test',
        summary: 'Descrizione viaggio test',
        destination: 'Destinazione test',
        theme: 'Tema test',
        recommended_seasons: ['Primavera', 'Estate', 'Autunno', 'Inverno'],
        stages: [{ title: 'Tappa 1' }]
      }

      const result = singleTripBatchSchema.safeParse(trip)
      expect(result.success).toBe(true)
    })

    it('should reject invalid seasons', () => {
      const trip = {
        title: 'Viaggio test',
        summary: 'Descrizione viaggio test',
        destination: 'Destinazione test',
        theme: 'Tema test',
        recommended_seasons: ['Stagione inesistente'],
        stages: [{ title: 'Tappa 1' }]
      }

      const result = singleTripBatchSchema.safeParse(trip)
      expect(result.success).toBe(false)
    })
  })
})