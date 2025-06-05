// Test per il parsing dei waypoints GPX
import { parseGPX } from '@/lib/gpx-utils'

describe('GPX Waypoints Parsing', () => {
  it('dovrebbe parsare correttamente i waypoints da un file GPX', () => {
    const mockGpxContent = `<?xml version="1.0"?>
<gpx version="1.1" creator="test">
  <wpt lat="45.123456" lon="7.123456">
    <name>Punto di partenza</name>
    <ele>450</ele>
  </wpt>
  <wpt lat="45.234567" lon="7.234567">
    <name>Punto di arrivo</name>
    <ele>550</ele>
  </wpt>
  <trk>
    <trkseg>
      <trkpt lat="45.123456" lon="7.123456">
        <ele>450</ele>
      </trkpt>
      <trkpt lat="45.234567" lon="7.234567">
        <ele>550</ele>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`

    const parsed = parseGPX(mockGpxContent)
    
    expect(parsed.waypoints).toHaveLength(2)
    expect(parsed.waypoints[0].name).toBe('Punto di partenza')
    expect(parsed.waypoints[0].lat).toBe(45.123456)
    expect(parsed.waypoints[0].lon).toBe(7.123456)
    expect(parsed.waypoints[0].ele).toBe(450)
    
    expect(parsed.waypoints[1].name).toBe('Punto di arrivo')
    expect(parsed.waypoints[1].lat).toBe(45.234567)
    expect(parsed.waypoints[1].lon).toBe(7.234567)
    expect(parsed.waypoints[1].ele).toBe(550)
  })

  it('dovrebbe gestire waypoints senza nome', () => {
    const mockGpxContent = `<?xml version="1.0"?>
<gpx version="1.1" creator="test">
  <wpt lat="45.123456" lon="7.123456">
    <ele>450</ele>
  </wpt>
  <trk>
    <trkseg>
      <trkpt lat="45.123456" lon="7.123456">
        <ele>450</ele>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`

    const parsed = parseGPX(mockGpxContent)
    
    expect(parsed.waypoints).toHaveLength(1)
    expect(parsed.waypoints[0].name).toBeUndefined()
    expect(parsed.waypoints[0].lat).toBe(45.123456)
    expect(parsed.waypoints[0].lon).toBe(7.123456)
    expect(parsed.waypoints[0].ele).toBe(450)
  })
})
