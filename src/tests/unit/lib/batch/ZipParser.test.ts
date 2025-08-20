// src/tests/unit/lib/batch/ZipParser.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import JSZip from 'jszip'
import { ZipParser } from '@/lib/batch/ZipParser'

// Mock the storage provider
jest.mock('@/lib/storage', () => ({
  getStorageProvider: jest.fn()
}))

describe('ZipParser', () => {
  let zip: JSZip
  let zipBuffer: Buffer

  beforeEach(async () => {
    zip = new JSZip()
    
    // Create a basic valid ZIP structure
    zip.file('viaggi.json', JSON.stringify({
      title: 'Test Trip',
      summary: 'A test trip for unit testing',
      destination: 'Test Destination',
      theme: 'Test Theme',
      characteristics: ['Bel paesaggio'],
      recommended_seasons: ['Estate'],
      tags: ['test'],
      stages: [
        {
          title: 'Test Stage',
          description: 'A test stage'
        }
      ]
    }))
    
    // Add some media files
    zip.file('media/hero.jpg', 'fake-image-data')
    zip.file('media/photo1.jpg', 'fake-image-data')
    
    // Add GPX file
    zip.file('main.gpx', '<?xml version="1.0"?><gpx></gpx>')
    
    // Add stage files
    zip.file('tappe/01-test-stage/tappa.gpx', '<?xml version="1.0"?><gpx></gpx>')
    zip.file('tappe/01-test-stage/media/stage-photo.jpg', 'fake-image-data')
    
    zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
  })

  describe('ZIP loading and validation', () => {
    it('should load a valid ZIP file', async () => {
      const parser = new ZipParser()
      await parser.loadZip(zipBuffer)
      
      const errors = parser.validateZipStructure()
      expect(errors).toHaveLength(0)
    })

    it('should detect missing viaggi.json', async () => {
      const emptyZip = new JSZip()
      const emptyBuffer = await emptyZip.generateAsync({ type: 'nodebuffer' })
      
      const parser = new ZipParser(emptyBuffer)
      await parser.loadZip(emptyBuffer)
      
      const errors = parser.validateZipStructure()
      expect(errors).toContain('File viaggi.json mancante. Aggiungi il file nella root dello ZIP.')
    })

    it('should validate ZIP size', async () => {
      const parser = new ZipParser()
      await parser.loadZip(zipBuffer)
      
      // Simplified validation always returns true (size check is done at API layer)
      expect(parser.validateZipSize()).toBe(true)
    })
  })

  describe('JSON parsing', () => {
    it('should parse valid viaggi.json', async () => {
      const parser = new ZipParser()
      await parser.loadZip(zipBuffer)
      
      const result = await parser.parse()
      
      expect(result.metadata).toEqual(
        expect.objectContaining({
          title: 'Test Trip',
          summary: 'A test trip for unit testing',
          destination: 'Test Destination'
        })
      )
    })

    it('should handle invalid JSON', async () => {
      const invalidZip = new JSZip()
      invalidZip.file('viaggi.json', 'invalid json content')
      const invalidBuffer = await invalidZip.generateAsync({ type: 'nodebuffer' })
      
      const parser = new ZipParser(invalidBuffer)
      await parser.loadZip(invalidBuffer)
      
      await expect(parser.parse()).rejects.toThrow('File viaggi.json non è un JSON valido')
    })
  })

  describe('Single trip parsing', () => {
    it('should parse single trip structure', async () => {
      const parser = new ZipParser()
      await parser.loadZip(zipBuffer)
      
      const result = await parser.parse()
      
      expect(result.trips).toHaveLength(1)
      expect(result.trips[0]).toEqual(
        expect.objectContaining({
          title: 'Test Trip',
          summary: 'A test trip for unit testing',
          destination: 'Test Destination',
          theme: 'Test Theme'
        })
      )
    })

    it('should parse trip media files', async () => {
      const parser = new ZipParser()
      await parser.loadZip(zipBuffer)
      
      const result = await parser.parse()
      
      expect(result.trips[0].media).toHaveLength(2)
      expect(result.trips[0].media[0]).toEqual(
        expect.objectContaining({
          filename: 'hero.jpg',
          mimeType: 'image/jpeg',
          isHero: true
        })
      )
      expect(result.trips[0].media[1]).toEqual(
        expect.objectContaining({
          filename: 'photo1.jpg',
          mimeType: 'image/jpeg',
          isHero: false
        })
      )
    })

    it('should parse trip GPX file', async () => {
      const parser = new ZipParser()
      await parser.loadZip(zipBuffer)
      
      const result = await parser.parse()
      
      expect(result.trips[0].gpxFile).toEqual(
        expect.objectContaining({
          filename: 'main.gpx'
        })
      )
      expect(result.trips[0].gpxFile?.buffer).toBeInstanceOf(Buffer)
    })

    it('should parse stages', async () => {
      const parser = new ZipParser()
      await parser.loadZip(zipBuffer)
      
      const result = await parser.parse()
      
      expect(result.trips[0].stages).toHaveLength(1)
      expect(result.trips[0].stages[0]).toEqual(
        expect.objectContaining({
          title: 'Test Stage',
          description: 'A test stage',
          orderIndex: 0,
          folderName: '01-test-stage'
        })
      )
    })

    it('should parse stage media and GPX', async () => {
      const parser = new ZipParser()
      await parser.loadZip(zipBuffer)
      
      const result = await parser.parse()
      
      const stage = result.trips[0].stages[0]
      expect(stage.media).toHaveLength(1)
      expect(stage.media[0]).toEqual(
        expect.objectContaining({
          filename: 'stage-photo.jpg',
          mimeType: 'image/jpeg'
        })
      )
      
      expect(stage.gpxFile).toEqual(
        expect.objectContaining({
          filename: 'tappa.gpx'
        })
      )
    })
  })

  describe('Multiple trips parsing', () => {
    it('should parse multiple trips structure', async () => {
      const multiZip = new JSZip()
      
      // Create viaggi.json with multiple trips
      multiZip.file('viaggi.json', JSON.stringify({
        viaggi: [
          {
            title: 'Trip 1',
            summary: 'First test trip',
            destination: 'Destination 1',
            theme: 'Theme 1',
            recommended_seasons: ['Estate'],
            stages: [{ title: 'Stage 1' }]
          },
          {
            title: 'Trip 2',
            summary: 'Second test trip',
            destination: 'Destination 2',
            theme: 'Theme 2',
            recommended_seasons: ['Autunno'],
            stages: [{ title: 'Stage 1' }]
          }
        ]
      }))
      
      // Add trip folders
      multiZip.file('01-trip-one/main.gpx', '<?xml version="1.0"?><gpx></gpx>')
      multiZip.file('01-trip-one/media/hero1.jpg', 'fake-image-data')
      multiZip.file('01-trip-one/tappe/01-stage-one/tappa.gpx', '<?xml version="1.0"?><gpx></gpx>')
      
      multiZip.file('02-trip-two/main.gpx', '<?xml version="1.0"?><gpx></gpx>')
      multiZip.file('02-trip-two/media/hero2.jpg', 'fake-image-data')
      multiZip.file('02-trip-two/tappe/01-stage-one/tappa.gpx', '<?xml version="1.0"?><gpx></gpx>')
      
      const multiBuffer = await multiZip.generateAsync({ type: 'nodebuffer' })
      
      const parser = new ZipParser(multiBuffer)
      await parser.loadZip(multiBuffer)
      
      const result = await parser.parse()
      
      expect(result.trips).toHaveLength(2)
      expect(result.trips[0].title).toBe('Trip 1')
      expect(result.trips[1].title).toBe('Trip 2')
      expect(result.trips[0].folderName).toBe('01-trip-one')
      expect(result.trips[1].folderName).toBe('02-trip-two')
    })
  })

  describe('File type detection', () => {
    it('should detect supported image types', async () => {
      const testZip = new JSZip()
      testZip.file('viaggi.json', JSON.stringify({
        title: 'Test',
        summary: 'Test summary',
        destination: 'Test',
        theme: 'Test',
        recommended_seasons: ['Estate'],
        stages: []
      }))
      
      testZip.file('media/image.jpg', 'fake-data')
      testZip.file('media/image.jpeg', 'fake-data')
      testZip.file('media/image.png', 'fake-data')
      testZip.file('media/image.webp', 'fake-data')
      
      const testBuffer = await testZip.generateAsync({ type: 'nodebuffer' })
      
      const parser = new ZipParser(testBuffer)
      await parser.loadZip(testBuffer)
      
      const result = await parser.parse()
      
      expect(result.trips[0].media).toHaveLength(4)
      expect(result.trips[0].media.map(m => m.mimeType)).toEqual([
        'image/jpeg',
        'image/jpeg', 
        'image/png',
        'image/webp'
      ])
    })

    it('should detect supported video types', async () => {
      const testZip = new JSZip()
      testZip.file('viaggi.json', JSON.stringify({
        title: 'Test',
        summary: 'Test summary',
        destination: 'Test',
        theme: 'Test',
        recommended_seasons: ['Estate'],
        stages: []
      }))
      
      testZip.file('media/video.mp4', 'fake-data')
      testZip.file('media/video.mov', 'fake-data')
      
      const testBuffer = await testZip.generateAsync({ type: 'nodebuffer' })
      
      const parser = new ZipParser(testBuffer)
      await parser.loadZip(testBuffer)
      
      const result = await parser.parse()
      
      expect(result.trips[0].media).toHaveLength(2)
      const mimeTypes = result.trips[0].media.map(m => m.mimeType).sort()
      expect(mimeTypes).toEqual([
        'video/mp4',
        'video/quicktime'
      ])
    })

    it('should ignore unsupported file types', async () => {
      const testZip = new JSZip()
      testZip.file('viaggi.json', JSON.stringify({
        title: 'Test',
        summary: 'Test summary',
        destination: 'Test',
        theme: 'Test',
        recommended_seasons: ['Estate'],
        stages: []
      }))
      
      testZip.file('media/document.pdf', 'fake-data')
      testZip.file('media/text.txt', 'fake-data')
      testZip.file('media/image.jpg', 'fake-data')
      
      const testBuffer = await testZip.generateAsync({ type: 'nodebuffer' })
      
      const parser = new ZipParser(testBuffer)
      await parser.loadZip(testBuffer)
      
      const result = await parser.parse()
      
      // Should only include the JPG file
      expect(result.trips[0].media).toHaveLength(1)
      expect(result.trips[0].media[0].filename).toBe('image.jpg')
    })
  })

  describe('Folder name parsing', () => {
    it('should extract title from numbered folder names', async () => {
      const testZip = new JSZip()
      testZip.file('viaggi.json', JSON.stringify({
        title: 'Test',
        summary: 'Test summary',
        destination: 'Test',
        theme: 'Test',
        recommended_seasons: ['Estate'],
        stages: [{}] // Empty stage, title should come from folder
      }))
      
      testZip.file('tappe/01-bolzano-ortisei/tappa.gpx', '<?xml version="1.0"?><gpx></gpx>')
      
      const testBuffer = await testZip.generateAsync({ type: 'nodebuffer' })
      
      const parser = new ZipParser(testBuffer)
      await parser.loadZip(testBuffer)
      
      const result = await parser.parse()
      
      expect(result.trips[0].stages[0].title).toBe('Bolzano Ortisei')
    })
  })
})