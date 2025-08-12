import {
  createStage,
  updateStage,
  deleteStage,
  getStagesByTripId,
  validateTripStagesOrder,
  getNextOrderIndex
} from '@/lib/stages/stage-utils'
import { prisma } from '@/lib/core/prisma'
import { Trip, Stage, MediaItem, GpxFile, TripStatus, RecommendedSeason } from '@/types/trip'

// Mock di Prisma
jest.mock('@/lib/core/prisma', () => ({
  prisma: {
    trip: {
      findUnique: jest.fn(),
    },
    stage: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('stage-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // Mock data
  const mockTrip: Trip = {
    id: 'trip-123',
    title: 'Viaggio Test',
    summary: 'Un viaggio di test',
    destination: 'Test Destination',
    duration_days: 3,
    duration_nights: 2,
    tags: ['test'],
    theme: 'Avventura',
    characteristics: ['test'],
    recommended_seasons: [RecommendedSeason.Estate],
    media: [],
    gpxFile: null,
    insights: null,
    slug: 'viaggio-test',
    status: TripStatus.Bozza,
    created_at: new Date(),
    updated_at: new Date(),
    user_id: 'user-123'
  }

  const mockGpxFile: GpxFile = {
    url: 'https://example.com/stage.gpx',
    filename: 'stage.gpx',
    waypoints: 50,
    distance: 8500,
    elevationGain: 200,
    elevationLoss: 150,
    isValid: true
  }

  const mockMediaItems: MediaItem[] = [
    {
      id: 'media-1',
      type: 'image',
      url: 'https://example.com/image.jpg',
      caption: 'Test image'
    }
  ]

  const mockStage: Stage = {
    id: 'stage-123',
    tripId: 'trip-123',
    orderIndex: 0,
    title: 'Prima Tappa',
    description: 'Descrizione prima tappa',
    routeType: 'Asfalto',
    media: mockMediaItems,
    gpxFile: mockGpxFile,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockPrismaStage = {
    id: 'stage-123',
    tripId: 'trip-123',
    orderIndex: 0,
    title: 'Prima Tappa',
    description: 'Descrizione prima tappa',
    routeType: 'Asfalto',
    media: mockMediaItems,
    gpxFile: mockGpxFile,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  describe('createStage', () => {
    const validStageData = {
      orderIndex: 0,
      title: 'Prima Tappa',
      description: 'Descrizione prima tappa',
      routeType: 'Asfalto',
      media: mockMediaItems,
      gpxFile: mockGpxFile
    }

    it('should create a stage successfully with all fields', async () => {
      const tripWithStages = { ...mockTrip, stages: [] }
      mockPrisma.trip.findUnique.mockResolvedValue(tripWithStages)
      mockPrisma.stage.create.mockResolvedValue(mockPrismaStage)

      const result = await createStage('trip-123', validStageData)

      expect(mockPrisma.trip.findUnique).toHaveBeenCalledWith({
        where: { id: 'trip-123' },
        include: { stages: true }
      })
      
      expect(mockPrisma.stage.create).toHaveBeenCalledWith({
        data: {
          tripId: 'trip-123',
          orderIndex: 0,
          title: 'Prima Tappa',
          description: 'Descrizione prima tappa',
          routeType: 'Asfalto',
          media: mockMediaItems,
          gpxFile: mockGpxFile
        }
      })

      expect(result).toEqual(mockStage)
    })

    it('should create a stage with minimal required fields', async () => {
      const minimalData = {
        orderIndex: 1,
        title: 'Tappa Minimale',
        media: []
      }

      const tripWithStages = { ...mockTrip, stages: [] }
      const minimalPrismaStage = {
        id: 'stage-456',
        tripId: 'trip-123',
        orderIndex: 1,
        title: 'Tappa Minimale',
        description: null,
        routeType: null,
        media: [],
        gpxFile: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.trip.findUnique.mockResolvedValue(tripWithStages)
      mockPrisma.stage.create.mockResolvedValue(minimalPrismaStage)

      const result = await createStage('trip-123', minimalData)

      expect(result.description).toBeUndefined()
      expect(result.routeType).toBeUndefined()
      expect(result.gpxFile).toBeNull()
      expect(result.media).toEqual([])
    })

    it('should throw error if trip does not exist', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(null)

      await expect(createStage('nonexistent-trip', validStageData))
        .rejects.toThrow('Viaggio non trovato')

      expect(mockPrisma.stage.create).not.toHaveBeenCalled()
    })

    it('should throw error if orderIndex already exists', async () => {
      const existingStage = { id: 'existing-stage', orderIndex: 0 }
      const tripWithStages = { ...mockTrip, stages: [existingStage] }
      
      mockPrisma.trip.findUnique.mockResolvedValue(tripWithStages)

      await expect(createStage('trip-123', validStageData))
        .rejects.toThrow('Una tappa con orderIndex 0 esiste già per questo viaggio')

      expect(mockPrisma.stage.create).not.toHaveBeenCalled()
    })

    it('should throw validation error for invalid data', async () => {
      const invalidData = {
        orderIndex: -1, // Invalid negative index
        title: '', // Invalid empty title
        media: []
      }

      await expect(createStage('trip-123', invalidData))
        .rejects.toThrow()
    })
  })

  describe('updateStage', () => {
    const updateData = {
      title: 'Tappa Aggiornata',
      description: 'Nuova descrizione',
      routeType: 'Sterrato'
    }

    it('should update stage successfully', async () => {
      const existingStage = {
        ...mockPrismaStage,
        trip: { ...mockTrip, stages: [mockPrismaStage] }
      }
      const updatedStage = { ...mockPrismaStage, ...updateData }

      mockPrisma.stage.findUnique.mockResolvedValue(existingStage)
      mockPrisma.stage.update.mockResolvedValue(updatedStage)

      const result = await updateStage('stage-123', updateData)

      expect(mockPrisma.stage.findUnique).toHaveBeenCalledWith({
        where: { id: 'stage-123' },
        include: { trip: { include: { stages: true } } }
      })

      expect(mockPrisma.stage.update).toHaveBeenCalledWith({
        where: { id: 'stage-123' },
        data: updateData
      })

      expect(result.title).toBe('Tappa Aggiornata')
    })

    it('should update orderIndex when valid', async () => {
      const updateWithOrder = { orderIndex: 2 }
      const existingStage = {
        ...mockPrismaStage,
        trip: { ...mockTrip, stages: [mockPrismaStage] }
      }

      mockPrisma.stage.findUnique.mockResolvedValue(existingStage)
      mockPrisma.stage.update.mockResolvedValue({ ...mockPrismaStage, orderIndex: 2 })

      await updateStage('stage-123', updateWithOrder)

      expect(mockPrisma.stage.update).toHaveBeenCalledWith({
        where: { id: 'stage-123' },
        data: { orderIndex: 2 }
      })
    })

    it('should throw error if stage does not exist', async () => {
      mockPrisma.stage.findUnique.mockResolvedValue(null)

      await expect(updateStage('nonexistent-stage', updateData))
        .rejects.toThrow('Tappa non trovata')

      expect(mockPrisma.stage.update).not.toHaveBeenCalled()
    })

    it('should throw error if orderIndex conflicts', async () => {
      const conflictingStage = { id: 'other-stage', orderIndex: 1 }
      const existingStage = {
        ...mockPrismaStage,
        trip: { ...mockTrip, stages: [mockPrismaStage, conflictingStage] }
      }

      mockPrisma.stage.findUnique.mockResolvedValue(existingStage)

      await expect(updateStage('stage-123', { orderIndex: 1 }))
        .rejects.toThrow('Una tappa con orderIndex 1 esiste già per questo viaggio')

      expect(mockPrisma.stage.update).not.toHaveBeenCalled()
    })
  })

  describe('deleteStage', () => {
    it('should delete stage and reorder subsequent stages', async () => {
      const stagesToReorder = [
        { id: 'stage-2', orderIndex: 2 },
        { id: 'stage-3', orderIndex: 3 }
      ]
      
      const stageToDelete = {
        ...mockPrismaStage,
        orderIndex: 1,
        trip: { 
          ...mockTrip, 
          stages: [
            mockPrismaStage, // orderIndex: 0
            { id: 'stage-delete', orderIndex: 1 }, // this will be deleted
            ...stagesToReorder
          ]
        }
      }

      mockPrisma.stage.findUnique.mockResolvedValue(stageToDelete)
      
      // Mock transaction
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        return await callback({
          stage: {
            delete: jest.fn(),
            update: jest.fn()
          }
        })
      })
      mockPrisma.$transaction.mockImplementation(mockTransaction)

      await deleteStage('stage-delete')

      expect(mockPrisma.stage.findUnique).toHaveBeenCalledWith({
        where: { id: 'stage-delete' },
        include: { trip: { include: { stages: { orderBy: { orderIndex: 'asc' } } } } }
      })

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('should throw error if stage does not exist', async () => {
      mockPrisma.stage.findUnique.mockResolvedValue(null)

      await expect(deleteStage('nonexistent-stage'))
        .rejects.toThrow('Tappa non trovata')

      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })
  })

  describe('getStagesByTripId', () => {
    it('should return stages ordered by orderIndex', async () => {
      const stages = [
        mockPrismaStage,
        { ...mockPrismaStage, id: 'stage-2', orderIndex: 1, title: 'Seconda Tappa' }
      ]

      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip)
      mockPrisma.stage.findMany.mockResolvedValue(stages)

      const result = await getStagesByTripId('trip-123')

      expect(mockPrisma.trip.findUnique).toHaveBeenCalledWith({
        where: { id: 'trip-123' }
      })

      expect(mockPrisma.stage.findMany).toHaveBeenCalledWith({
        where: { tripId: 'trip-123' },
        orderBy: { orderIndex: 'asc' }
      })

      expect(result).toHaveLength(2)
      expect(result[0].orderIndex).toBe(0)
      expect(result[1].orderIndex).toBe(1)
    })

    it('should return empty array for trip with no stages', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip)
      mockPrisma.stage.findMany.mockResolvedValue([])

      const result = await getStagesByTripId('trip-123')

      expect(result).toEqual([])
    })

    it('should throw error if trip does not exist', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(null)

      await expect(getStagesByTripId('nonexistent-trip'))
        .rejects.toThrow('Viaggio non trovato')

      expect(mockPrisma.stage.findMany).not.toHaveBeenCalled()
    })

    it('should handle null fields correctly', async () => {
      const stageWithNulls = {
        ...mockPrismaStage,
        description: null,
        routeType: null
      }

      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip)
      mockPrisma.stage.findMany.mockResolvedValue([stageWithNulls])

      const result = await getStagesByTripId('trip-123')

      expect(result[0].description).toBeUndefined()
      expect(result[0].routeType).toBeUndefined()
    })
  })

  describe('validateTripStagesOrder', () => {
    it('should validate correct stage order', async () => {
      const orderedStages = [
        { ...mockPrismaStage, orderIndex: 0 },
        { ...mockPrismaStage, id: 'stage-2', orderIndex: 1 },
        { ...mockPrismaStage, id: 'stage-3', orderIndex: 2 }
      ]

      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip)
      mockPrisma.stage.findMany.mockResolvedValue(orderedStages)

      const result = await validateTripStagesOrder('trip-123')

      expect(result).toBe(true)
    })

    it('should detect invalid stage order', async () => {
      const invalidStages = [
        { ...mockPrismaStage, orderIndex: 0 },
        { ...mockPrismaStage, id: 'stage-2', orderIndex: 2 } // Missing orderIndex 1
      ]

      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip)
      mockPrisma.stage.findMany.mockResolvedValue(invalidStages)

      const result = await validateTripStagesOrder('trip-123')

      expect(result).toBe(false)
    })
  })

  describe('getNextOrderIndex', () => {
    it('should return correct next order index', async () => {
      const stages = [
        { ...mockPrismaStage, orderIndex: 0 },
        { ...mockPrismaStage, id: 'stage-2', orderIndex: 1 }
      ]

      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip)
      mockPrisma.stage.findMany.mockResolvedValue(stages)

      const result = await getNextOrderIndex('trip-123')

      expect(result).toBe(2)
    })

    it('should return 0 for trip with no stages', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip)
      mockPrisma.stage.findMany.mockResolvedValue([])

      const result = await getNextOrderIndex('trip-123')

      expect(result).toBe(0)
    })
  })
})