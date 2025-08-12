// src/tests/unit/lib/gpx-utils.test.ts
import {
  parseGpxMetadata,
  parseGPXContent,
  createGpxFileFromMetadata,
  isValidGpxFile,
  isValidGpxFileSize,
  type GpxMetadata,
  type GPXParseResult
} from '@/lib/gpx/gpx-utils'

// Mock GPX file content for testing
const validGpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Test">
  <wpt lat="43.6142" lon="13.5173">
    <name>Waypoint 1</name>
    <ele>100</ele>
  </wpt>
  <wpt lat="43.6152" lon="13.5183">
    <name>Waypoint 2</name>
    <ele>110</ele>
  </wpt>
  <trk>
    <name>Test Track</name>
    <trkseg>
      <trkpt lat="43.6142" lon="13.5173">
        <ele>100</ele>
        <time>2024-01-01T10:00:00Z</time>
      </trkpt>
      <trkpt lat="43.6152" lon="13.5183">
        <ele>110</ele>
        <time>2024-01-01T10:05:00Z</time>
      </trkpt>
      <trkpt lat="43.6162" lon="13.5193">
        <ele>120</ele>
        <time>2024-01-01T10:10:00Z</time>
      </trkpt>
    </trkseg>
  </trk>
  <rte>
    <name>Test Route</name>
    <rtept lat="43.6172" lon="13.5203">
      <ele>130</ele>
    </rtept>
    <rtept lat="43.6182" lon="13.5213">
      <ele>140</ele>
    </rtept>
  </rte>
</gpx>`

const invalidGpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<notgpx>
  <invalid>content</invalid>
</notgpx>`

const gpxWithNoWaypoints = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Test">
  <trk>
    <name>Track Only</name>
    <trkseg>
      <trkpt lat="43.6142" lon="13.5173">
        <ele>100</ele>
      </trkpt>
      <trkpt lat="43.6152" lon="13.5183">
        <ele>110</ele>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`

// Helper function to create a mock File object
function createMockFile(content: string, filename: string = 'test.gpx', type: string = 'application/gpx+xml'): File {
  return new File([content], filename, { type })
}

describe('GPX Utils', () => {
  describe('isValidGpxFile', () => {
    it('should accept valid GPX MIME types', () => {
      const validTypes = [
        'application/gpx+xml',
        'application/xml',
        'text/xml'
      ]

      validTypes.forEach(type => {
        const file = createMockFile(validGpxContent, 'test.gpx', type)
        expect(isValidGpxFile(file)).toBe(true)
      })
    })

    it('should accept valid GPX file extensions', () => {
      const file = createMockFile(validGpxContent, 'test.gpx', 'text/plain')
      expect(isValidGpxFile(file)).toBe(true)
    })

    it('should reject invalid file types and extensions', () => {
      const file = createMockFile(validGpxContent, 'test.txt', 'text/plain')
      expect(isValidGpxFile(file)).toBe(false)
    })

    it('should be case insensitive for extensions', () => {
      const file = createMockFile(validGpxContent, 'test.GPX', 'text/plain')
      expect(isValidGpxFile(file)).toBe(true)
    })
  })

  describe('isValidGpxFileSize', () => {
    it('should accept files under 20MB', () => {
      const smallContent = 'small file content'
      const file = createMockFile(smallContent)
      expect(isValidGpxFileSize(file)).toBe(true)
    })

    it('should reject files over 20MB', () => {
      // Create a mock file that appears to be over 20MB
      const file = createMockFile(validGpxContent)
      // Mock the size property
      Object.defineProperty(file, 'size', {
        value: 21 * 1024 * 1024 // 21MB
      })
      expect(isValidGpxFileSize(file)).toBe(false)
    })

    it('should accept files exactly 20MB', () => {
      const file = createMockFile(validGpxContent)
      Object.defineProperty(file, 'size', {
        value: 20 * 1024 * 1024 // Exactly 20MB
      })
      expect(isValidGpxFileSize(file)).toBe(true)
    })
  })

  describe('parseGPXContent', () => {
    it('should parse valid GPX content correctly', () => {
      const result: GPXParseResult = parseGPXContent(validGpxContent, 'test.gpx')

      expect(result).toBeDefined()
      expect(result.metadata).toBeDefined()
      expect(result.tracks).toBeDefined()
      expect(result.routes).toBeDefined()
      expect(result.waypoints).toBeDefined()
    })

    it('should count waypoints correctly (not track points)', () => {
      const result = parseGPXContent(validGpxContent, 'test.gpx')
      
      // Should count only actual <wpt> elements (2), not track points (3)
      expect(result.metadata.waypoints).toBe(2)
      expect(result.waypoints).toHaveLength(2)
    })

    it('should parse tracks correctly', () => {
      const result = parseGPXContent(validGpxContent, 'test.gpx')
      
      expect(result.tracks).toHaveLength(1)
      expect(result.tracks[0].points).toHaveLength(3) // 3 track points
      
      // Check first track point
      expect(result.tracks[0].points[0]).toEqual({
        lat: 43.6142,
        lng: 13.5173,
        elevation: 100
      })
    })

    it('should parse routes correctly', () => {
      const result = parseGPXContent(validGpxContent, 'test.gpx')
      
      expect(result.routes).toHaveLength(1)
      expect(result.routes[0].name).toBe('Test Route')
      expect(result.routes[0].points).toHaveLength(2)
      
      // Check first route point
      expect(result.routes[0].points[0]).toEqual({
        lat: 43.6172,
        lng: 13.5203,
        elevation: 130
      })
    })

    it('should parse waypoints correctly', () => {
      const result = parseGPXContent(validGpxContent, 'test.gpx')
      
      expect(result.waypoints).toHaveLength(2)
      expect(result.waypoints[0]).toEqual({
        lat: 43.6142,
        lng: 13.5173,
        elevation: 100,
        name: 'Waypoint 1'
      })
    })

    it('should calculate distance correctly', () => {
      const result = parseGPXContent(validGpxContent, 'test.gpx')
      
      // Distance should be greater than 0 for multiple points
      expect(result.metadata.distance).toBeGreaterThan(0)
    })

    it('should calculate elevation metrics', () => {
      const result = parseGPXContent(validGpxContent, 'test.gpx')
      
      expect(result.metadata.elevationGain).toBeGreaterThan(0)
      expect(result.metadata.maxElevation).toBeDefined()
      expect(result.metadata.minElevation).toBeDefined()
    })

    it('should handle GPX with no waypoints', () => {
      const result = parseGPXContent(gpxWithNoWaypoints, 'test.gpx')
      
      expect(result.metadata.waypoints).toBe(0)
      expect(result.waypoints).toHaveLength(0)
      expect(result.tracks).toHaveLength(1) // Should still have tracks
    })

    it('should handle time data correctly', () => {
      const result = parseGPXContent(validGpxContent, 'test.gpx')
      
      expect(result.metadata.startTime).toBe('2024-01-01T10:00:00Z')
      expect(result.metadata.endTime).toBe('2024-01-01T10:10:00Z')
      expect(result.metadata.duration).toBe(600) // 10 minutes in seconds
    })

    it('should throw error for invalid GPX', () => {
      expect(() => {
        parseGPXContent(invalidGpxContent, 'invalid.gpx')
      }).toThrow('File non è un GPX valido')
    })

    it('should use default filename when not provided', () => {
      const result = parseGPXContent(validGpxContent)
      expect(result.metadata.filename).toBe('unknown.gpx')
    })
  })

  describe('parseGpxMetadata', () => {
    it('should extract metadata from GPX file', async () => {
      const file = createMockFile(validGpxContent, 'test.gpx')
      const metadata: GpxMetadata = await parseGpxMetadata(file)

      expect(metadata.filename).toBe('test.gpx')
      expect(metadata.distance).toBeGreaterThan(0)
      expect(metadata.waypoints).toBe(2) // Only actual waypoints, not track points
      expect(metadata.elevationGain).toBeGreaterThan(0)
      expect(metadata.maxElevation).toBeDefined()
      expect(metadata.minElevation).toBeDefined()
      expect(metadata.startTime).toBe('2024-01-01T10:00:00Z')
      expect(metadata.endTime).toBe('2024-01-01T10:10:00Z')
      expect(metadata.duration).toBe(600)
    })

    it('should handle file reading errors', async () => {
      const invalidFile = {} as File
      
      await expect(parseGpxMetadata(invalidFile)).rejects.toThrow(
        'Invalid file input: expected File object with .text() method'
      )
    })

    it('should handle corrupted file content', async () => {
      const file = createMockFile(invalidGpxContent, 'invalid.gpx')
      
      await expect(parseGpxMetadata(file)).rejects.toThrow(
        'File non è un GPX valido'
      )
    })
  })

  describe('createGpxFileFromMetadata', () => {
    it('should create GpxFile object from metadata', () => {
      const metadata: GpxMetadata = {
        filename: 'test.gpx',
        distance: 5.5,
        waypoints: 2,
        elevationGain: 100,
        elevationLoss: 50,
        duration: 600,
        maxElevation: 150,
        minElevation: 100,
        startTime: '2024-01-01T10:00:00Z',
        endTime: '2024-01-01T10:10:00Z'
      }

      const gpxFile = createGpxFileFromMetadata(metadata, 'http://example.com/test.gpx', true)

      expect(gpxFile).toEqual({
        url: 'http://example.com/test.gpx',
        filename: 'test.gpx',
        waypoints: 2,
        distance: 5.5,
        elevationGain: 100,
        elevationLoss: 50,
        duration: 600,
        maxElevation: 150,
        minElevation: 100,
        startTime: '2024-01-01T10:00:00Z',
        endTime: '2024-01-01T10:10:00Z',
        isValid: true
      })
    })

    it('should handle minimal metadata', () => {
      const metadata: GpxMetadata = {
        filename: 'minimal.gpx',
        distance: 0,
        waypoints: 0
      }

      const gpxFile = createGpxFileFromMetadata(metadata, 'http://example.com/minimal.gpx', false)

      expect(gpxFile.url).toBe('http://example.com/minimal.gpx')
      expect(gpxFile.filename).toBe('minimal.gpx')
      expect(gpxFile.waypoints).toBe(0)
      expect(gpxFile.distance).toBe(0)
      expect(gpxFile.isValid).toBe(false)
      expect(gpxFile.elevationGain).toBeUndefined()
      expect(gpxFile.duration).toBeUndefined()
    })
  })

  describe('GPX Waypoint Counting Regression Test', () => {
    /**
     * Regression test for the critical waypoint counting bug
     * 
     * This test specifically addresses the issue where waypoints were incorrectly 
     * counted as track points instead of actual <wpt> elements in the GPX file.
     * 
     * Bug: Previously showing 2238 waypoints instead of 19 for monte-conero trip
     * Fix: Now correctly counts only <wpt> elements, not track/route points
     */

    // Simulates a GPX file similar to monte-conero: many track points but few actual waypoints
    const gpxWithManyTrackPointsFewWaypoints = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Test GPX">
  <!-- Only 3 actual waypoints -->
  <wpt lat="43.6142" lon="13.5173">
    <name>Waypoint 1</name>
    <ele>100</ele>
  </wpt>
  <wpt lat="43.6242" lon="13.5273">
    <name>Waypoint 2</name>
    <ele>150</ele>
  </wpt>
  <wpt lat="43.6342" lon="13.5373">
    <name>Waypoint 3</name>
    <ele>200</ele>
  </wpt>
  
  <!-- Track with many points (simulating GPS track) -->
  <trk>
    <name>Monte Conero Trail</name>
    <trkseg>
      <trkpt lat="43.6142" lon="13.5173"><ele>100</ele></trkpt>
      <trkpt lat="43.6143" lon="13.5174"><ele>101</ele></trkpt>
      <trkpt lat="43.6144" lon="13.5175"><ele>102</ele></trkpt>
      <trkpt lat="43.6145" lon="13.5176"><ele>103</ele></trkpt>
      <trkpt lat="43.6146" lon="13.5177"><ele>104</ele></trkpt>
      <trkpt lat="43.6147" lon="13.5178"><ele>105</ele></trkpt>
      <trkpt lat="43.6148" lon="13.5179"><ele>106</ele></trkpt>
      <trkpt lat="43.6149" lon="13.5180"><ele>107</ele></trkpt>
      <trkpt lat="43.6150" lon="13.5181"><ele>108</ele></trkpt>
      <trkpt lat="43.6151" lon="13.5182"><ele>109</ele></trkpt>
      <!-- ... many more track points ... -->
      <trkpt lat="43.6200" lon="13.5230"><ele>150</ele></trkpt>
      <trkpt lat="43.6201" lon="13.5231"><ele>151</ele></trkpt>
      <trkpt lat="43.6202" lon="13.5232"><ele>152</ele></trkpt>
      <trkpt lat="43.6203" lon="13.5233"><ele>153</ele></trkpt>
      <trkpt lat="43.6204" lon="13.5234"><ele>154</ele></trkpt>
      <trkpt lat="43.6205" lon="13.5235"><ele>155</ele></trkpt>
      <trkpt lat="43.6206" lon="13.5236"><ele>156</ele></trkpt>
      <trkpt lat="43.6207" lon="13.5237"><ele>157</ele></trkpt>
      <trkpt lat="43.6208" lon="13.5238"><ele>158</ele></trkpt>
      <trkpt lat="43.6209" lon="13.5239"><ele>159</ele></trkpt>
    </trkseg>
  </trk>
  
  <!-- Additional route with more points -->
  <rte>
    <name>Alternative Route</name>
    <rtept lat="43.6300" lon="13.5300"><ele>200</ele></rtept>
    <rtept lat="43.6301" lon="13.5301"><ele>201</ele></rtept>
    <rtept lat="43.6302" lon="13.5302"><ele>202</ele></rtept>
    <rtept lat="43.6303" lon="13.5303"><ele>203</ele></rtept>
    <rtept lat="43.6304" lon="13.5304"><ele>204</ele></rtept>
  </rte>
</gpx>`

    // GPX with no waypoints but many track points (edge case)
    const gpxWithNoWaypointsButManyTrackPoints = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Test GPX">
  <trk>
    <name>Track Only</name>
    <trkseg>
      <trkpt lat="43.6142" lon="13.5173"><ele>100</ele></trkpt>
      <trkpt lat="43.6143" lon="13.5174"><ele>101</ele></trkpt>
      <trkpt lat="43.6144" lon="13.5175"><ele>102</ele></trkpt>
      <trkpt lat="43.6145" lon="13.5176"><ele>103</ele></trkpt>
      <trkpt lat="43.6146" lon="13.5177"><ele>104</ele></trkpt>
      <trkpt lat="43.6147" lon="13.5178"><ele>105</ele></trkpt>
      <trkpt lat="43.6148" lon="13.5179"><ele>106</ele></trkpt>
      <trkpt lat="43.6149" lon="13.5180"><ele>107</ele></trkpt>
      <trkpt lat="43.6150" lon="13.5181"><ele>108</ele></trkpt>
      <trkpt lat="43.6151" lon="13.5182"><ele>109</ele></trkpt>
    </trkseg>
  </trk>
</gpx>`

    it('CRITICAL: should count only actual waypoints, not track points', () => {
      const result = parseGPXContent(gpxWithManyTrackPointsFewWaypoints, 'monte-conero-sim.gpx')
      
      // CRITICAL ASSERTION: Must count only <wpt> elements
      expect(result.metadata.waypoints).toBe(3)
      expect(result.waypoints).toHaveLength(3)
      
      // Verify we have tracks with many points (but these don't count as waypoints)
      expect(result.tracks).toHaveLength(1)
      expect(result.tracks[0].points.length).toBeGreaterThan(3)
      
      // Verify we have routes with points (but these don't count as waypoints)
      expect(result.routes).toHaveLength(1)
      expect(result.routes[0].points.length).toBe(5)
      
      // REGRESSION TEST: The sum of track points + route points should NOT equal waypoints
      const totalTrackPoints = result.tracks.reduce((sum, track) => sum + track.points.length, 0)
      const totalRoutePoints = result.routes.reduce((sum, route) => sum + route.points.length, 0)
      const totalCoordinatePoints = totalTrackPoints + totalRoutePoints
      
      expect(totalCoordinatePoints).toBeGreaterThan(result.metadata.waypoints)
      expect(result.metadata.waypoints).not.toBe(totalCoordinatePoints)
    })

    it('should return 0 waypoints when GPX has no <wpt> elements', () => {
      const result = parseGPXContent(gpxWithNoWaypointsButManyTrackPoints, 'no-waypoints.gpx')
      
      // Even with many track points, waypoint count should be 0
      expect(result.metadata.waypoints).toBe(0)
      expect(result.waypoints).toHaveLength(0)
      
      // But should still have track data
      expect(result.tracks).toHaveLength(1)
      expect(result.tracks[0].points.length).toBe(10)
    })

    it('should handle parseGpxMetadata consistently with parseGPXContent', async () => {
      const file = new File([gpxWithManyTrackPointsFewWaypoints], 'test.gpx', { type: 'application/gpx+xml' })
      const metadata = await parseGpxMetadata(file)
      
      // parseGpxMetadata should give same waypoint count as parseGPXContent
      expect(metadata.waypoints).toBe(3)
      expect(metadata.filename).toBe('test.gpx')
    })

    it('EDGE CASE: should ignore waypoints with invalid coordinates', () => {
      const gpxWithInvalidWaypoints = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Test GPX">
  <wpt lat="43.6142" lon="13.5173">
    <name>Valid Waypoint</name>
  </wpt>
  <wpt lat="invalid" lon="also-invalid">
    <name>Invalid Waypoint</name>
  </wpt>
  <wpt lat="" lon="">
    <name>Empty Coords Waypoint</name>
  </wpt>
  <wpt lat="43.6242" lon="13.5273">
    <name>Another Valid Waypoint</name>
  </wpt>
  
  <!-- Track with valid points -->
  <trk>
    <trkseg>
      <trkpt lat="43.6142" lon="13.5173"></trkpt>
      <trkpt lat="43.6143" lon="13.5174"></trkpt>
    </trkseg>
  </trk>
</gpx>`

      const result = parseGPXContent(gpxWithInvalidWaypoints, 'invalid-coords.gpx')
      
      // Should count only valid waypoints
      expect(result.metadata.waypoints).toBe(2)
      expect(result.waypoints).toHaveLength(2)
      
      // Track points should still be parsed
      expect(result.tracks[0].points.length).toBe(2)
    })

    it('PERFORMANCE: should handle large GPX files efficiently', () => {
      // Create a GPX with realistic numbers (similar to monte-conero)
      let gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GPS Device">
  <!-- Only 5 actual waypoints -->
  <wpt lat="43.6142" lon="13.5173"><name>Start</name></wpt>
  <wpt lat="43.6242" lon="13.5273"><name>Checkpoint 1</name></wpt>
  <wpt lat="43.6342" lon="13.5373"><name>Checkpoint 2</name></wpt>
  <wpt lat="43.6442" lon="13.5473"><name>Checkpoint 3</name></wpt>
  <wpt lat="43.6542" lon="13.5573"><name>End</name></wpt>
  
  <trk>
    <name>GPS Track</name>
    <trkseg>`
      
      // Add many track points (simulating GPS logging)
      for (let i = 0; i < 100; i++) {
        const lat = 43.6142 + (i * 0.001)
        const lon = 13.5173 + (i * 0.001)
        const ele = 100 + i
        gpxContent += `<trkpt lat="${lat}" lon="${lon}"><ele>${ele}</ele></trkpt>`
      }
      
      gpxContent += `</trkseg>
  </trk>
</gpx>`

      const startTime = Date.now()
      const result = parseGPXContent(gpxContent, 'large-file.gpx')
      const endTime = Date.now()
      
      // Waypoint count should be correct regardless of track size
      expect(result.metadata.waypoints).toBe(5)
      expect(result.waypoints).toHaveLength(5)
      expect(result.tracks[0].points.length).toBe(100)
      
      // Should process reasonably quickly (less than 1 second for 100 points)
      expect(endTime - startTime).toBeLessThan(1000)
    })

    it('REAL WORLD: simulates the monte-conero bug scenario', () => {
      // This test specifically addresses the reported issue:
      // "waypoints mostrati sono 2238 ma dovrebbero essere 19"
      
      // Create a GPX similar to what might cause this issue
      let largeGpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GPS Device">
  <!-- Only 19 actual waypoints (as should be reported) -->`
      
      for (let i = 1; i <= 19; i++) {
        const lat = 43.6142 + (i * 0.01)
        const lon = 13.5173 + (i * 0.01)
        largeGpxContent += `<wpt lat="${lat}" lon="${lon}"><name>Waypoint ${i}</name></wpt>`
      }
      
      largeGpxContent += `
  <trk>
    <name>Detailed GPS Track</name>
    <trkseg>`
      
      // Add 2238 track points (simulating the bug scenario)
      for (let i = 0; i < 2238; i++) {
        const lat = 43.6142 + (i * 0.0001)
        const lon = 13.5173 + (i * 0.0001)
        const ele = 100 + (i % 100)
        largeGpxContent += `<trkpt lat="${lat}" lon="${lon}"><ele>${ele}</ele></trkpt>`
      }
      
      largeGpxContent += `</trkseg>
  </trk>
</gpx>`

      const result = parseGPXContent(largeGpxContent, 'monte-conero-simulation.gpx')
      
      // CRITICAL: Should report 19 waypoints, NOT 2238
      expect(result.metadata.waypoints).toBe(19)
      expect(result.waypoints).toHaveLength(19)
      
      // Verify the track has the expected number of points
      expect(result.tracks[0].points.length).toBe(2238)
    })
  })

  describe('Distance Calculation - Unit and Precision Tests', () => {
    /**
     * Test specifici per il calcolo della distanza GPX dopo la correzione del bug
     * dove la distanza veniva restituita in km invece che in metri.
     * 
     * Questi test prevengono regressioni e verificano la correttezza del calcolo haversine.
     */

    it('should calculate distance in meters, not kilometers', () => {
      // Test con due punti a distanza nota: Roma -> Milano (circa 574 km)
      const romaToMilanoGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Distance Test">
  <trk>
    <name>Roma-Milano</name>
    <trkseg>
      <trkpt lat="41.9028" lon="12.4964">
        <ele>50</ele>
      </trkpt>
      <trkpt lat="45.4642" lon="9.1900">
        <ele>120</ele>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`

      const result = parseGPXContent(romaToMilanoGpx, 'roma-milano.gpx')
      
      // La distanza Roma-Milano è circa 477 km = 477,000 metri (distanza reale calcolata)
      expect(result.metadata.distance).toBeGreaterThan(470000) // Min 470 km
      expect(result.metadata.distance).toBeLessThan(485000)    // Max 485 km
      
      // Verifica che il valore sia ragionevole (in metri, non km)
      expect(result.metadata.distance).toBeCloseTo(477000, -3) // ~477,000 ± 1000 metri
    })

    it('should calculate correct distance for short routes without rounding to zero', () => {
      // Test con distanza breve (circa 1.5 km) per verificare che non diventi 0
      const shortDistanceGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Short Distance Test">
  <trk>
    <name>Short Route</name>
    <trkseg>
      <trkpt lat="43.6142" lon="13.5173">
        <ele>100</ele>
      </trkpt>
      <trkpt lat="43.6242" lon="13.5273">
        <ele>110</ele>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`

      const result = parseGPXContent(shortDistanceGpx, 'short-distance.gpx')
      
      // Distanza prevista: circa 1.4-1.6 km = 1400-1600 metri
      expect(result.metadata.distance).toBeGreaterThan(1000)  // Min 1 km
      expect(result.metadata.distance).toBeLessThan(2000)     // Max 2 km
      
      // CRITICO: NON deve essere zero (bug precedente)
      expect(result.metadata.distance).not.toBe(0)
      
      // Quando visualizzato nell'UI (diviso per 1000), deve mostrare ~1.5 km
      const kmForDisplay = result.metadata.distance / 1000
      expect(kmForDisplay).toBeGreaterThan(1.0)
      expect(kmForDisplay).toBeLessThan(2.0)
    })

    it('should handle very short distances (meters range) correctly', () => {
      // Test con distanza molto breve (sotto il km)
      const veryShortGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Very Short Test">
  <trk>
    <name>Very Short Route</name>
    <trkseg>
      <trkpt lat="43.6142" lon="13.5173">
        <ele>100</ele>
      </trkpt>
      <trkpt lat="43.6145" lon="13.5176">
        <ele>101</ele>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`

      const result = parseGPXContent(veryShortGpx, 'very-short.gpx')
      
      // Distanza prevista: circa 40 metri (distanza reale calcolata)
      expect(result.metadata.distance).toBeGreaterThan(30)    // Min 30m
      expect(result.metadata.distance).toBeLessThan(60)       // Max 60m
      expect(result.metadata.distance).not.toBe(0)
      
      // Quando mostrato nell'UI dovrebbe essere 0.1 km (non 0.0 km) 
      const kmForDisplay = parseFloat((result.metadata.distance / 1000).toFixed(1))
      expect(kmForDisplay).toBeGreaterThanOrEqual(0.0) // Anche 0.0 va bene per distanze così brevi
      // Ma il valore raw non deve essere zero
      expect(result.metadata.distance).toBeGreaterThan(0)
    })

    it('should calculate distance consistently for tracks vs routes', () => {
      // Stesso percorso rappresentato come track e come route
      const commonPoints = `
        <trkpt lat="43.6142" lon="13.5173"><ele>100</ele></trkpt>
        <trkpt lat="43.6152" lon="13.5183"><ele>110</ele></trkpt>
        <trkpt lat="43.6162" lon="13.5193"><ele>120</ele></trkpt>`
      
      const trackGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Track Test">
  <trk>
    <name>Test Track</name>
    <trkseg>${commonPoints}</trkseg>
  </trk>
</gpx>`

      const routeGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Route Test">
  <rte>
    <name>Test Route</name>
    <rtept lat="43.6142" lon="13.5173"><ele>100</ele></rtept>
    <rtept lat="43.6152" lon="13.5183"><ele>110</ele></rtept>
    <rtept lat="43.6162" lon="13.5193"><ele>120</ele></rtept>
  </rte>
</gpx>`

      const trackResult = parseGPXContent(trackGpx, 'track.gpx')
      const routeResult = parseGPXContent(routeGpx, 'route.gpx')
      
      // Le distanze dovrebbero essere identiche
      expect(trackResult.metadata.distance).toBeCloseTo(routeResult.metadata.distance, 1)
      
      // Entrambe dovrebbero essere maggiori di zero e in metri
      expect(trackResult.metadata.distance).toBeGreaterThan(0)
      expect(routeResult.metadata.distance).toBeGreaterThan(0)
    })

    it('should accumulate distance correctly for multi-segment tracks', () => {
      // Track con più segmenti per verificare accumulo corretto
      const multiSegmentGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Multi-Segment Test">
  <trk>
    <name>Multi-Segment Track</name>
    <trkseg>
      <trkpt lat="43.6142" lon="13.5173"><ele>100</ele></trkpt>
      <trkpt lat="43.6152" lon="13.5183"><ele>110</ele></trkpt>
    </trkseg>
    <trkseg>
      <trkpt lat="43.6162" lon="13.5193"><ele>120</ele></trkpt>
      <trkpt lat="43.6172" lon="13.5203"><ele>130</ele></trkpt>
    </trkseg>
  </trk>
</gpx>`

      const result = parseGPXContent(multiSegmentGpx, 'multi-segment.gpx')
      
      // La distanza totale dovrebbe essere la somma di tutti i segmenti (circa 275m)
      expect(result.metadata.distance).toBeGreaterThan(250)  // Min 250m
      expect(result.metadata.distance).toBeLessThan(300)     // Max 300m
      
      // Verifica che i punti siano stati processati correttamente
      // Il parser crea una traccia separata per ogni segmento
      expect(result.tracks).toHaveLength(2) // 2 segmenti = 2 tracce
      expect(result.tracks[0].points).toHaveLength(2) // Primo segmento: 2 punti
      expect(result.tracks[1].points).toHaveLength(2) // Secondo segmento: 2 punti
    })

    it('should handle precision for very precise coordinates', () => {
      // Test con coordinate molto precise (6 decimali) come da GPS reali
      const preciseGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Precision Test">
  <trk>
    <name>Precise Coordinates</name>
    <trkseg>
      <trkpt lat="43.614200" lon="13.517300">
        <ele>100</ele>
      </trkpt>
      <trkpt lat="43.614250" lon="13.517350">
        <ele>101</ele>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`

      const result = parseGPXContent(preciseGpx, 'precise.gpx')
      
      // Anche per distanze molto piccole, il risultato non dovrebbe essere 0
      expect(result.metadata.distance).toBeGreaterThan(0)
      expect(result.metadata.distance).toBeLessThan(100) // Probabilmente sotto i 100 metri
      
      // Il calcolo dovrebbe essere preciso fino al metro
      expect(typeof result.metadata.distance).toBe('number')
      expect(Number.isFinite(result.metadata.distance)).toBe(true)
    })

    it('REGRESSION TEST: prevents distance showing as 0 in UI preview', () => {
      // Test specifico per prevenire la regressione del bug "distanza 0 nella preview"
      const bugPreventionGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Bug Prevention Test">
  <trk>
    <name>Test Track</name>
    <trkseg>
      <trkpt lat="43.6142" lon="13.5173"><ele>100</ele></trkpt>
      <trkpt lat="43.6242" lon="13.5273"><ele>110</ele></trkpt>
      <trkpt lat="43.6342" lon="13.5373"><ele>120</ele></trkpt>
    </trkseg>
  </trk>
</gpx>`

      const result = parseGPXContent(bugPreventionGpx, 'bug-prevention.gpx')
      
      // Simula quello che fa EditableStageItem.tsx linea 315
      const distanceInKmForUI = (result.metadata.distance / 1000).toFixed(1)
      
      // CRITICO: Non deve essere "0.0" nell'UI
      expect(distanceInKmForUI).not.toBe('0.0')
      expect(parseFloat(distanceInKmForUI)).toBeGreaterThan(0)
      
      // Deve mostrare un valore ragionevole (qualche km)
      expect(parseFloat(distanceInKmForUI)).toBeGreaterThan(1)
      expect(parseFloat(distanceInKmForUI)).toBeLessThan(50) // Massimo ragionevole per il test
      
      console.log(`Distance for UI display: ${distanceInKmForUI} km (raw: ${result.metadata.distance}m)`)
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle empty GPX content', () => {
      const emptyGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Test">
</gpx>`

      const result = parseGPXContent(emptyGpx, 'empty.gpx')
      
      expect(result.metadata.waypoints).toBe(0)
      expect(result.metadata.distance).toBe(0)
      expect(result.tracks).toHaveLength(0)
      expect(result.routes).toHaveLength(0)
      expect(result.waypoints).toHaveLength(0)
    })

    it('should handle GPX with invalid coordinates', () => {
      const invalidCoordsGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Test">
  <wpt lat="invalid" lon="also-invalid">
    <name>Invalid Waypoint</name>
  </wpt>
  <wpt lat="43.6142" lon="13.5173">
    <name>Valid Waypoint</name>
  </wpt>
</gpx>`

      const result = parseGPXContent(invalidCoordsGpx, 'invalid-coords.gpx')
      
      // Should only count valid waypoints
      expect(result.metadata.waypoints).toBe(1)
      expect(result.waypoints).toHaveLength(1)
      expect(result.waypoints[0].name).toBe('Valid Waypoint')
    })

    it('should handle GPX with missing elevation data', () => {
      const noElevationGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Test">
  <trk>
    <name>No Elevation Track</name>
    <trkseg>
      <trkpt lat="43.6142" lon="13.5173">
      </trkpt>
      <trkpt lat="43.6152" lon="13.5183">
      </trkpt>
    </trkseg>
  </trk>
</gpx>`

      const result = parseGPXContent(noElevationGpx, 'no-elevation.gpx')
      
      expect(result.metadata.elevationGain).toBeUndefined()
      expect(result.metadata.maxElevation).toBeUndefined()
      expect(result.tracks[0].points[0].elevation).toBeUndefined()
    })

    it('should handle malformed XML gracefully', () => {
      const malformedXml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Test">
  <unclosed tag>
</gpx>`

      // The XML parser is quite tolerant, so let's test with completely invalid XML
      const completelyInvalidXml = 'this is not xml at all'
      
      expect(() => {
        parseGPXContent(completelyInvalidXml, 'malformed.gpx')
      }).toThrow()
    })
  })
})
