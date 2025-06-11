// src/tests/unit/api/trips/[id]/gpx.test.ts
import { GET } from '@/app/api/trips/[id]/gpx/route'
import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/types/profile'

// Mock delle dipendenze
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    trip: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock di fetch globale
global.fetch = jest.fn()

const mockAuth = auth as jest.Mock
const mockPrisma = prisma.trip.findUnique as jest.Mock
const mockFetch = global.fetch as jest.Mock

describe('GET /api/trips/[id]/gpx - Download GPX', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (): NextRequest => {
    return new NextRequest('http://localhost/api/trips/trip-123/gpx')
  }

  const mockTrip = {
    id: 'trip-123',
    title: 'Test Trip',
    status: 'Pubblicato',
    user_id: 'user-123',
    gpxFile: {
      url: 'https://blob.vercel-storage.com/test.gpx',
      filename: 'test-route.gpx',
      distance: 15.5,
      waypoints: 120
    },
    user: {
      name: 'Test User',
      email: 'test@example.com'
    }
  }

  const mockGpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Test" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Test Route</name>
    <trkseg>
      <trkpt lat="45.0000" lon="7.0000"><ele>100</ele></trkpt>
      <trkpt lat="45.0010" lon="7.0010"><ele>110</ele></trkpt>
    </trkseg>
  </trk>
</gpx>`

  describe('Controlli di Base', () => {
    it('deve restituire errore 400 per ID non valido', async () => {
      const request = createMockRequest()
      const response = await GET(request, { params: { id: '' } })
      
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toBe('ID viaggio non valido')
    })

    it('deve restituire errore 404 per viaggio non esistente', async () => {
      mockPrisma.mockResolvedValue(null)
      
      const request = createMockRequest()
      const response = await GET(request, { params: { id: 'nonexistent' } })
      
      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.error).toBe('Viaggio non trovato')
    })

    it('deve restituire errore 404 se non esiste file GPX', async () => {
      mockPrisma.mockResolvedValue({
        ...mockTrip,
        gpxFile: null
      })
      
      const request = createMockRequest()
      const response = await GET(request, { params: { id: 'trip-123' } })
      
      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.error).toBe('Nessun file GPX disponibile per questo viaggio')
    })
  })

  describe('Controlli di Permessi', () => {
    it('deve negare il download per viaggio pubblico senza autenticazione', async () => {
      mockPrisma.mockResolvedValue(mockTrip)
      mockAuth.mockResolvedValue(null) // Utente non autenticato
      
      const request = createMockRequest()
      const response = await GET(request, { params: { id: 'trip-123' } })
      
      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error).toBe('Accesso negato. È necessario effettuare il login per scaricare le tracce GPX.')
    })

    it('deve permettere il download per viaggio pubblico con utente autenticato', async () => {
      mockPrisma.mockResolvedValue(mockTrip)
      mockAuth.mockResolvedValue({
        user: { id: 'another-user', role: 'User' }
      })
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockGpxContent)
      })
      
      const request = createMockRequest()
      const response = await GET(request, { params: { id: 'trip-123' } })
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/gpx+xml')
    })

    it('deve negare il download per viaggio privato senza autenticazione', async () => {
      mockPrisma.mockResolvedValue({
        ...mockTrip,
        status: 'Bozza'
      })
      mockAuth.mockResolvedValue(null)
      
      const request = createMockRequest()
      const response = await GET(request, { params: { id: 'trip-123' } })
      
      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error).toBe('Accesso negato. È necessario effettuare il login per scaricare le tracce GPX.')
    })

    it('deve permettere il download al proprietario del viaggio', async () => {
      mockPrisma.mockResolvedValue({
        ...mockTrip,
        status: 'Bozza'
      })
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', role: 'User' }
      })
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockGpxContent)
      })
      
      const request = createMockRequest()
      const response = await GET(request, { params: { id: 'trip-123' } })
      
      expect(response.status).toBe(200)
    })

    it('deve negare il download a utenti autenticati per viaggi privati di altri', async () => {
      mockPrisma.mockResolvedValue({
        ...mockTrip,
        status: 'Bozza',
        user_id: 'other-user'
      })
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', role: 'User' }
      })
      
      const request = createMockRequest()
      const response = await GET(request, { params: { id: 'trip-123' } })
      
      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body.error).toBe('Non hai i permessi per scaricare questo file GPX')
    })

    it('deve permettere il download ai Sentinel', async () => {
      mockPrisma.mockResolvedValue({
        ...mockTrip,
        status: 'Bozza',
        user_id: 'other-user'
      })
      mockAuth.mockResolvedValue({
        user: { id: 'admin-123', role: UserRole.Sentinel }
      })
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockGpxContent)
      })
      
      const request = createMockRequest()
      const response = await GET(request, { params: { id: 'trip-123' } })
      
      expect(response.status).toBe(200)
    })
  })

  describe('Download del File', () => {
    beforeEach(() => {
      mockPrisma.mockResolvedValue(mockTrip)
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', role: 'User' }
      })
    })

    it('deve scaricare correttamente il file GPX da Vercel Blob', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockGpxContent)
      })
      
      const request = createMockRequest()
      const response = await GET(request, { params: { id: 'trip-123' } })
      
      expect(response.status).toBe(200)
      expect(mockFetch).toHaveBeenCalledWith(
        mockTrip.gpxFile.url,
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'RideAtlas/1.0',
            'Cache-Control': 'no-cache'
          })
        })
      )
      
      const headers = response.headers
      expect(headers.get('Content-Type')).toBe('application/gpx+xml')
      expect(headers.get('Content-Disposition')).toBe('attachment; filename="test-route.gpx"')
      expect(headers.get('Cache-Control')).toBe('public, max-age=3600')
      
    })

    it('deve gestire errore 404 da Vercel Blob', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })
      
      const request = createMockRequest()
      const response = await GET(request, { params: { id: 'trip-123' } })
      
      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.error).toBe('File GPX non disponibile o danneggiato')
    })

    it('deve gestire timeout del download', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AbortError')), 100)
        })
      )
      
      const request = createMockRequest()
      const response = await GET(request, { params: { id: 'trip-123' } })
      
      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.error).toBe('File GPX non disponibile o danneggiato')
    })

    it('deve validare che il contenuto scaricato sia un GPX', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('contenuto non valido')
      })
      
      const request = createMockRequest()
      const response = await GET(request, { params: { id: 'trip-123' } })
      
      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.error).toBe('File GPX non disponibile o danneggiato')
    })

    it('deve generare filename sicuro se mancante', async () => {
      mockPrisma.mockResolvedValue({
        ...mockTrip,
        gpxFile: {
          ...mockTrip.gpxFile,
          filename: undefined
        }
      })
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockGpxContent)
      })
      
      const request = createMockRequest()
      const response = await GET(request, { params: { id: 'trip-123' } })
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="test-trip-trip-123.gpx"')
    })
  })

  describe('Gestione Errori', () => {
    it('deve gestire errori del database', async () => {
      mockPrisma.mockRejectedValue(new Error('Database error'))
      
      const request = createMockRequest()
      const response = await GET(request, { params: { id: 'trip-123' } })
      
      expect(response.status).toBe(500)
      const body = await response.json()
      expect(body.error).toBe('Errore interno del server durante il download')
    })

    it('deve gestire errori di rete', async () => {
      mockPrisma.mockResolvedValue(mockTrip)
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', role: 'User' }
      })
      mockFetch.mockRejectedValue(new Error('Network error'))
      
      const request = createMockRequest()
      const response = await GET(request, { params: { id: 'trip-123' } })
      
      expect(response.status).toBe(404)
      const body = await response.json()
      expect(body.error).toBe('File GPX non disponibile o danneggiato')
    })
  })
})
