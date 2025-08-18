import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { StorageCleanupService } from '@/lib/services/storageCleanup'

// Mock del provider storage
const mockStorageProvider = {
  deleteFile: jest.fn(),
  uploadFile: jest.fn(),
  getFileUrl: jest.fn(),
  validateFile: jest.fn()
}

jest.mock('@/lib/storage', () => ({
  getStorageProvider: () => mockStorageProvider
}))

describe('StorageCleanupService', () => {
  let service: StorageCleanupService

  beforeEach(() => {
    jest.clearAllMocks()
    // Create new instance to ensure fresh mock state
    service = new (StorageCleanupService as any)()
    // Override the storage provider with our mock
    service['storageProvider'] = mockStorageProvider
  })

  describe('URL extraction', () => {
    it('should extract media URLs correctly', async () => {
      const tripMedia = [
        { url: 'https://blob.vercel-storage.com/hero.jpg', type: 'image' },
        { url: 'https://blob.vercel-storage.com/photo.jpg', type: 'image', thumbnailUrl: 'https://blob.vercel-storage.com/thumb.jpg' }
      ]

      const stages = [
        {
          media: [{ url: 'https://blob.vercel-storage.com/stage1.jpg', type: 'image' }],
          gpxFile: { url: 'https://blob.vercel-storage.com/stage1.gpx' }
        }
      ]

      mockStorageProvider.deleteFile.mockResolvedValue(undefined)

      const result = await service.cleanupTripStorage(tripMedia, null, stages)

      // Should call deleteFile for each unique URL
      expect(mockStorageProvider.deleteFile).toHaveBeenCalledTimes(5)
      expect(mockStorageProvider.deleteFile).toHaveBeenCalledWith('hero.jpg')
      expect(mockStorageProvider.deleteFile).toHaveBeenCalledWith('photo.jpg')
      expect(mockStorageProvider.deleteFile).toHaveBeenCalledWith('thumb.jpg')
      expect(mockStorageProvider.deleteFile).toHaveBeenCalledWith('stage1.jpg')
      expect(mockStorageProvider.deleteFile).toHaveBeenCalledWith('stage1.gpx')

      expect(result.deletedFiles).toHaveLength(5)
      expect(result.failedFiles).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
    })

    it('should extract GPX URLs correctly', async () => {
      const tripGpxFile = { url: 'https://blob.vercel-storage.com/main.gpx' }
      
      mockStorageProvider.deleteFile.mockResolvedValue(undefined)

      const result = await service.cleanupTripStorage([], tripGpxFile, [])

      expect(mockStorageProvider.deleteFile).toHaveBeenCalledTimes(1)
      expect(mockStorageProvider.deleteFile).toHaveBeenCalledWith('main.gpx')
      expect(result.deletedFiles).toHaveLength(1)
    })

    it('should handle different storage provider URLs', async () => {
      const mediaWithDifferentProviders = [
        { url: 'https://abc123.public.blob.vercel-storage.com/file1-xyz789.jpg', type: 'image' },
        { url: 'https://bucket.s3.us-east-1.amazonaws.com/uploads/file2.jpg', type: 'image' },
        { url: 'https://d1234567890.cloudfront.net/media/file3.jpg', type: 'image' }
      ]

      mockStorageProvider.deleteFile.mockResolvedValue(undefined)

      const result = await service.cleanupTripStorage(mediaWithDifferentProviders, null, [])

      expect(mockStorageProvider.deleteFile).toHaveBeenCalledTimes(3)
      expect(mockStorageProvider.deleteFile).toHaveBeenCalledWith('file1-xyz789.jpg')
      expect(mockStorageProvider.deleteFile).toHaveBeenCalledWith('uploads/file2.jpg')
      expect(mockStorageProvider.deleteFile).toHaveBeenCalledWith('media/file3.jpg')
    })
  })

  describe('Error handling', () => {
    it('should handle storage deletion failures gracefully', async () => {
      const tripMedia = [
        { url: 'https://blob.vercel-storage.com/file1.jpg', type: 'image' },
        { url: 'https://blob.vercel-storage.com/file2.jpg', type: 'image' }
      ]

      // First file succeeds, second fails
      mockStorageProvider.deleteFile
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Access denied'))

      const result = await service.cleanupTripStorage(tripMedia, null, [])

      expect(result.deletedFiles).toEqual(['https://blob.vercel-storage.com/file1.jpg'])
      expect(result.failedFiles).toEqual(['https://blob.vercel-storage.com/file2.jpg'])
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Access denied')
    })

    it('should handle invalid URLs gracefully', async () => {
      const tripMedia = [
        { url: 'not-a-valid-url', type: 'image' },
        { url: 'https://blob.vercel-storage.com/valid.jpg', type: 'image' }
      ]

      // Mock success for all files since the service has a fallback that extracts filename from any URL
      mockStorageProvider.deleteFile.mockResolvedValue(undefined)

      const result = await service.cleanupTripStorage(tripMedia, null, [])

      // Both URLs should be processed successfully since the service has a fallback mechanism
      expect(mockStorageProvider.deleteFile).toHaveBeenCalledWith('not-a-valid-url')
      expect(mockStorageProvider.deleteFile).toHaveBeenCalledWith('valid.jpg')
      expect(result.deletedFiles).toHaveLength(2)
      expect(result.failedFiles).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
    })

    it('should remove duplicate URLs', async () => {
      const tripMedia = [
        { url: 'https://blob.vercel-storage.com/file.jpg', type: 'image' },
        { url: 'https://blob.vercel-storage.com/file.jpg', type: 'image' } // Duplicate
      ]

      mockStorageProvider.deleteFile.mockResolvedValue(undefined)

      const result = await service.cleanupTripStorage(tripMedia, null, [])

      // Should only call deleteFile once for the unique URL
      expect(mockStorageProvider.deleteFile).toHaveBeenCalledTimes(1)
      expect(mockStorageProvider.deleteFile).toHaveBeenCalledWith('file.jpg')
      expect(result.deletedFiles).toHaveLength(1)
    })
  })

  describe('Data format handling', () => {
    it('should handle empty or invalid media arrays', async () => {
      const result = await service.cleanupTripStorage([], null, [])

      expect(mockStorageProvider.deleteFile).not.toHaveBeenCalled()
      expect(result.deletedFiles).toHaveLength(0)
      expect(result.failedFiles).toHaveLength(0)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle invalid media items', async () => {
      const tripMedia = [
        null,
        undefined,
        { url: 'https://blob.vercel-storage.com/valid.jpg', type: 'image' },
        { type: 'image' }, // Missing URL
        'invalid-format'
      ]

      mockStorageProvider.deleteFile.mockResolvedValue(undefined)

      const result = await service.cleanupTripStorage(tripMedia as any, null, [])

      // Should only process the valid media item
      expect(mockStorageProvider.deleteFile).toHaveBeenCalledTimes(1)
      expect(mockStorageProvider.deleteFile).toHaveBeenCalledWith('valid.jpg')
      expect(result.deletedFiles).toHaveLength(1)
    })

    it('should handle invalid GPX file format', async () => {
      const invalidGpxFile = { filename: 'test.gpx' } // Missing URL

      const result = await service.cleanupTripStorage([], invalidGpxFile, [])

      expect(mockStorageProvider.deleteFile).not.toHaveBeenCalled()
      expect(result.deletedFiles).toHaveLength(0)
    })
  })

  describe('Complex scenarios', () => {
    it('should handle large trips with many files', async () => {
      const tripMedia = Array.from({ length: 10 }, (_, i) => ({
        url: `https://blob.vercel-storage.com/trip-${i}.jpg`,
        type: 'image'
      }))

      const stages = Array.from({ length: 5 }, (_, i) => ({
        media: Array.from({ length: 3 }, (_, j) => ({
          url: `https://blob.vercel-storage.com/stage-${i}-${j}.jpg`,
          type: 'image'
        })),
        gpxFile: { url: `https://blob.vercel-storage.com/stage-${i}.gpx` }
      }))

      mockStorageProvider.deleteFile.mockResolvedValue(undefined)

      const result = await service.cleanupTripStorage(tripMedia, null, stages)

      // 10 trip media + 5 stages * (3 media + 1 gpx) = 10 + 20 = 30 files
      expect(mockStorageProvider.deleteFile).toHaveBeenCalledTimes(30)
      expect(result.deletedFiles).toHaveLength(30)
      expect(result.failedFiles).toHaveLength(0)
    })

    it('should handle mixed success and failure scenarios', async () => {
      const tripMedia = [
        { url: 'https://blob.vercel-storage.com/success.jpg', type: 'image' },
        { url: 'https://blob.vercel-storage.com/fail.jpg', type: 'image' }
      ]

      const stages = [
        {
          media: [{ url: 'https://blob.vercel-storage.com/stage-success.jpg', type: 'image' }],
          gpxFile: { url: 'https://blob.vercel-storage.com/stage-fail.gpx' }
        }
      ]

      // Mock alternating success/failure
      mockStorageProvider.deleteFile
        .mockResolvedValueOnce(undefined) // success.jpg succeeds
        .mockRejectedValueOnce(new Error('File not found')) // fail.jpg fails
        .mockResolvedValueOnce(undefined) // stage-success.jpg succeeds
        .mockRejectedValueOnce(new Error('Access denied')) // stage-fail.gpx fails

      const result = await service.cleanupTripStorage(tripMedia, null, stages)

      expect(result.deletedFiles).toHaveLength(2)
      expect(result.failedFiles).toHaveLength(2)
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0]).toContain('File not found')
      expect(result.errors[1]).toContain('Access denied')
    })
  })
})