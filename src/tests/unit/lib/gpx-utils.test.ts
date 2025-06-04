// src/tests/unit/lib/gpx-utils.test.ts
import { 
  parseGpxMetadata, 
  createGpxFileFromMetadata, 
  isValidGpxFile, 
  isValidGpxFileSize 
} from '@/lib/gpx-utils'
import { readFileSync } from 'fs'
import { join } from 'path'
import expectedResults from '../../fixtures/test-data/expected-results.json'

// Helper per caricare file GPX di test
const loadTestGPX = (filename: string): File => {
  const filePath = join(__dirname, '../../fixtures/gpx-samples', filename)
  const content = readFileSync(filePath, 'utf-8')
  // Create File directly with string content for better test compatibility
  return new File([content], filename, { type: 'application/gpx+xml' })
}

describe('GPX Utils - Core Business Logic', () => {
  
  describe('parseGpxMetadata', () => {
    
    describe('Basic GPX Processing', () => {
      it('should extract metadata from valid basic GPX', async () => {
        const file = loadTestGPX('valid-basic.xml')
        const result = await parseGpxMetadata(file)
        
        expect(result.filename).toBe('valid-basic.xml')
        expect(result.waypoints).toBe(expectedResults.validBasic.expectedWaypoints)
        expect(result.distance).toBeCloseTo(expectedResults.validBasic.expectedDistance, 1)
        expect(result.elevationGain).toBe(expectedResults.validBasic.expectedElevationGain)
        expect(result.elevationLoss).toBe(expectedResults.validBasic.expectedElevationLoss)
        expect(result.duration).toBe(expectedResults.validBasic.expectedDuration)
        expect(result.maxElevation).toBe(expectedResults.validBasic.expectedMaxElevation)
        expect(result.minElevation).toBe(expectedResults.validBasic.expectedMinElevation)
        expect(result.startTime).toBe(expectedResults.validBasic.expectedStartTime)
        expect(result.endTime).toBe(expectedResults.validBasic.expectedEndTime)
      })

      it('should handle complex GPX with multiple tracks and segments', async () => {
        const file = loadTestGPX('valid-complex.xml')
        const result = await parseGpxMetadata(file)
        
        expect(result.filename).toBe('valid-complex.xml')
        expect(result.waypoints).toBe(expectedResults.validComplex.expectedWaypoints)
        expect(result.distance).toBeCloseTo(expectedResults.validComplex.expectedDistance, 1)
        expect(result.elevationGain).toBe(expectedResults.validComplex.expectedElevationGain)
        expect(result.elevationLoss).toBe(expectedResults.validComplex.expectedElevationLoss)
        expect(result.duration).toBe(expectedResults.validComplex.expectedDuration)
        expect(result.maxElevation).toBe(expectedResults.validComplex.expectedMaxElevation)
        expect(result.minElevation).toBe(expectedResults.validComplex.expectedMinElevation)
      })

      it('should handle edge cases gracefully', async () => {
        const file = loadTestGPX('edge-cases.xml')
        const result = await parseGpxMetadata(file)
        
        expect(result.filename).toBe('edge-cases.xml')
        expect(result.waypoints).toBe(expectedResults.edgeCases.expectedWaypoints)
        expect(result.distance).toBeCloseTo(expectedResults.edgeCases.expectedDistance, 1)
        // Should handle missing elevation data
        expect(result.elevationGain).toBe(expectedResults.edgeCases.expectedElevationGain)
        expect(result.elevationLoss).toBe(expectedResults.edgeCases.expectedElevationLoss)
      })
    })

    describe('Error Handling', () => {

      it('should throw error for invalid XML structure', async () => {
        const file = loadTestGPX('invalid-broken.xml')
        
        await expect(parseGpxMetadata(file)).rejects.toThrow('File non è un GPX valido')
      })

      it('should handle malformed XML gracefully', async () => {
        const content = '<?xml version="1.0"?><gpx><trk><incomplete'
        const blob = new Blob([content], { type: 'application/gpx+xml' })
        const file = new File([blob], 'malformed.gpx', { type: 'application/gpx+xml' })
        
        await expect(parseGpxMetadata(file)).rejects.toThrow()
      })
    })

    describe('Coordinate Processing', () => {
      it('should filter out invalid coordinates', async () => {
        const file = loadTestGPX('edge-cases.xml')
        const result = await parseGpxMetadata(file)
        
        // Should process 4 points but only count valid ones for calculations
        expect(result.waypoints).toBe(4)
        expect(result.distance).toBeGreaterThan(0)
      })

      it('should handle missing elevation data', async () => {
        const file = loadTestGPX('edge-cases.xml')
        const result = await parseGpxMetadata(file)
        
        // Should still calculate what it can
        expect(result.maxElevation).toBeDefined()
        expect(result.minElevation).toBeDefined()
      })

      it('should handle missing timestamp data', async () => {
        const file = loadTestGPX('edge-cases.xml')
        const result = await parseGpxMetadata(file)
        
        // Should extract available timestamps
        expect(result.startTime).toBeDefined()
        expect(result.endTime).toBeDefined()
      })
    })
  })

  describe('Distance Calculation Algorithm', () => {
    it('should calculate correct distance between known coordinates', () => {
      // Test haversine formula with known coordinates
      const { point1, point2, expectedDistance } = expectedResults.knownCoordinates
      
      // Access private function for testing - we'll test through parseGpxMetadata
      const content = `<?xml version="1.0"?>
        <gpx version="1.1">
          <trk>
            <trkseg>
              <trkpt lat="${point1.lat}" lon="${point1.lon}"/>
              <trkpt lat="${point2.lat}" lon="${point2.lon}"/>
            </trkseg>
          </trk>
        </gpx>`
      
      const file = new File([content], 'test-distance.gpx', { type: 'application/gpx+xml' })
      
      return parseGpxMetadata(file).then(result => {
        expect(result.distance).toBeCloseTo(expectedDistance, 1)
      })
    })

    it('should handle edge cases in distance calculation', () => {
      // Test with same coordinates (distance should be 0)
      const content = `<?xml version="1.0"?>
        <gpx version="1.1">
          <trk>
            <trkseg>
              <trkpt lat="45.0000" lon="7.0000"/>
              <trkpt lat="45.0000" lon="7.0000"/>
            </trkseg>
          </trk>
        </gpx>`
      
      const file = new File([content], 'test-same-point.gpx', { type: 'application/gpx+xml' })
      
      return parseGpxMetadata(file).then(result => {
        expect(result.distance).toBe(0)
      })
    })

    it('should accumulate distances across multiple segments', async () => {
      const file = loadTestGPX('valid-complex.xml')
      const result = await parseGpxMetadata(file)
      
      // Should accumulate distance from all segments and tracks
      expect(result.distance).toBeGreaterThan(0)
      expect(result.distance).toBeCloseTo(expectedResults.validComplex.expectedDistance, 1)
    })
  })

  describe('Elevation Calculation Algorithm', () => {
    it('should calculate elevation gain correctly', async () => {
      const file = loadTestGPX('valid-basic.xml')
      const result = await parseGpxMetadata(file)
      
      expect(result.elevationGain).toBe(expectedResults.validBasic.expectedElevationGain)
    })

    it('should calculate elevation loss correctly', async () => {
      const file = loadTestGPX('valid-basic.xml')
      const result = await parseGpxMetadata(file)
      
      expect(result.elevationLoss).toBe(expectedResults.validBasic.expectedElevationLoss)
    })

    it('should identify max and min elevations', async () => {
      const file = loadTestGPX('valid-complex.xml')
      const result = await parseGpxMetadata(file)
      
      expect(result.maxElevation).toBe(expectedResults.validComplex.expectedMaxElevation)
      expect(result.minElevation).toBe(expectedResults.validComplex.expectedMinElevation)
    })

    it('should handle missing elevation data gracefully', async () => {
      const content = `<?xml version="1.0"?>
        <gpx version="1.1">
          <trk>
            <trkseg>
              <trkpt lat="45.0000" lon="7.0000"/>
              <trkpt lat="45.0010" lon="7.0010"/>
            </trkseg>
          </trk>
        </gpx>`
      
      const file = new File([content], 'no-elevation.gpx', { type: 'application/gpx+xml' })
      
      const result = await parseGpxMetadata(file)
      
      expect(result.elevationGain).toBeUndefined()
      expect(result.elevationLoss).toBeUndefined()
      expect(result.maxElevation).toBeUndefined()
      expect(result.minElevation).toBeUndefined()
    })
  })

  describe('Time Analysis Algorithm', () => {
    it('should calculate duration from timestamps correctly', async () => {
      const file = loadTestGPX('valid-basic.xml')
      const result = await parseGpxMetadata(file)
      
      expect(result.duration).toBe(expectedResults.validBasic.expectedDuration) // 15 minutes = 900 seconds
    })

    it('should handle missing timestamps gracefully', async () => {
      const content = `<?xml version="1.0"?>
        <gpx version="1.1">
          <trk>
            <trkseg>
              <trkpt lat="45.0000" lon="7.0000"/>
              <trkpt lat="45.0010" lon="7.0010"/>
            </trkseg>
          </trk>
        </gpx>`
      
      const file = new File([content], 'no-time.gpx', { type: 'application/gpx+xml' })
      
      const result = await parseGpxMetadata(file)
      
      expect(result.duration).toBeUndefined()
      expect(result.startTime).toBeUndefined()
      expect(result.endTime).toBeUndefined()
    })

    it('should identify start and end times correctly', async () => {
      const file = loadTestGPX('valid-complex.xml')
      const result = await parseGpxMetadata(file)
      
      expect(result.startTime).toBe(expectedResults.validComplex.expectedStartTime)
      expect(result.endTime).toBe(expectedResults.validComplex.expectedEndTime)
    })
  })

  describe('createGpxFileFromMetadata', () => {
    it('should transform metadata to GpxFile object correctly', () => {
      const metadata = {
        filename: 'test.gpx',
        distance: 10.5,
        waypoints: 100,
        elevationGain: 500,
        elevationLoss: 200,
        duration: 3600,
        maxElevation: 1000,
        minElevation: 200,
        startTime: '2024-01-01T10:00:00Z',
        endTime: '2024-01-01T11:00:00Z'
      }
      
      const url = 'https://storage.example.com/test.gpx'
      const isValid = true
      
      const result = createGpxFileFromMetadata(metadata, url, isValid)
      
      expect(result.url).toBe(url)
      expect(result.filename).toBe(metadata.filename)
      expect(result.distance).toBe(metadata.distance)
      expect(result.waypoints).toBe(metadata.waypoints)
      expect(result.elevationGain).toBe(metadata.elevationGain)
      expect(result.elevationLoss).toBe(metadata.elevationLoss)
      expect(result.duration).toBe(metadata.duration)
      expect(result.maxElevation).toBe(metadata.maxElevation)
      expect(result.minElevation).toBe(metadata.minElevation)
      expect(result.startTime).toBe(metadata.startTime)
      expect(result.endTime).toBe(metadata.endTime)
      expect(result.isValid).toBe(isValid)
    })

    it('should preserve optional fields when present', () => {
      const metadata = {
        filename: 'test.gpx',
        distance: 10.5,
        waypoints: 100
      }
      
      const result = createGpxFileFromMetadata(metadata, 'test-url', true)
      
      expect(result.elevationGain).toBeUndefined()
      expect(result.elevationLoss).toBeUndefined()
      expect(result.duration).toBeUndefined()
      expect(result.maxElevation).toBeUndefined()
      expect(result.minElevation).toBeUndefined()
      expect(result.startTime).toBeUndefined()
      expect(result.endTime).toBeUndefined()
    })

    it('should set isValid flag correctly', () => {
      const metadata = {
        filename: 'test.gpx',
        distance: 10.5,
        waypoints: 100
      }
      
      const validResult = createGpxFileFromMetadata(metadata, 'test-url', true)
      const invalidResult = createGpxFileFromMetadata(metadata, 'test-url', false)
      
      expect(validResult.isValid).toBe(true)
      expect(invalidResult.isValid).toBe(false)
    })
  })
})
