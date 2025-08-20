// src/tests/unit/api/trips/batch/template.test.ts
import { GET } from '@/app/api/trips/batch/template/route'
import JSZip from 'jszip'

describe('/api/trips/batch/template', () => {
  it('should generate a valid template ZIP file', async () => {
    const response = await GET()
    
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/zip')
    expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="rideatlas-batch-template.zip"')
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    expect(buffer.length).toBeGreaterThan(0)
    
    // Verify ZIP structure
    const zip = await JSZip.loadAsync(buffer)
    
    // Check required files
    expect(zip.file('viaggi.json')).toBeTruthy()
    expect(zip.file('main.gpx')).toBeTruthy()
    expect(zip.file('README.txt')).toBeTruthy()
    
    // Check media folder
    expect(zip.file('media/hero-example.jpg')).toBeTruthy()
    expect(zip.file('media/README.txt')).toBeTruthy()
    
    // Check stages structure
    expect(zip.file('tappe/01-bolzano-ortisei/tappa.gpx')).toBeTruthy()
    expect(zip.file('tappe/01-bolzano-ortisei/media/stage1-photo.jpg')).toBeTruthy()
    expect(zip.file('tappe/02-ortisei-cortina/tappa.gpx')).toBeTruthy()
    expect(zip.file('tappe/02-ortisei-cortina/media/stage2-photo.jpg')).toBeTruthy()
  })

  it('should contain valid JSON in viaggi.json', async () => {
    const response = await GET()
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const zip = await JSZip.loadAsync(buffer)
    
    const viaggiJsonFile = zip.file('viaggi.json')
    expect(viaggiJsonFile).toBeTruthy()
    
    if (viaggiJsonFile) {
      const content = await viaggiJsonFile.async('text')
      const parsed = JSON.parse(content)
      
      // Check required fields
      expect(parsed.title).toBeTruthy()
      expect(parsed.summary).toBeTruthy()
      expect(parsed.destination).toBeTruthy()
      expect(parsed.theme).toBeTruthy()
      expect(Array.isArray(parsed.characteristics)).toBe(true)
      expect(Array.isArray(parsed.recommended_seasons)).toBe(true)
      expect(Array.isArray(parsed.stages)).toBe(true)
      
      // Verify characteristics are valid
      const validCharacteristics = [
        'Strade sterrate',
        'Curve strette',
        'Presenza pedaggi',
        'Presenza traghetti',
        'Autostrada',
        'Bel paesaggio',
        'Visita prolungata',
        'Interesse gastronomico',
        'Interesse storico-culturale'
      ]
      
      parsed.characteristics.forEach((char: string) => {
        expect(validCharacteristics).toContain(char)
      })
      
      // Verify seasons are valid
      const validSeasons = ['Primavera', 'Estate', 'Autunno', 'Inverno']
      parsed.recommended_seasons.forEach((season: string) => {
        expect(validSeasons).toContain(season)
      })
    }
  })

  it('should contain valid GPX files', async () => {
    const response = await GET()
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const zip = await JSZip.loadAsync(buffer)
    
    // Check main GPX
    const mainGpx = zip.file('main.gpx')
    expect(mainGpx).toBeTruthy()
    if (mainGpx) {
      const content = await mainGpx.async('text')
      expect(content).toContain('<?xml version="1.0"')
      expect(content).toContain('<gpx')
      expect(content).toContain('</gpx>')
    }
    
    // Check stage GPX files
    const stage1Gpx = zip.file('tappe/01-bolzano-ortisei/tappa.gpx')
    expect(stage1Gpx).toBeTruthy()
    if (stage1Gpx) {
      const content = await stage1Gpx.async('text')
      expect(content).toContain('<?xml version="1.0"')
      expect(content).toContain('<gpx')
    }
  })
})