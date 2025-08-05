// src/tests/integration/stages-api.test.ts

import { GET as StagesListGET, POST as StagesListPOST } from '@/app/api/trips/[id]/stages/route'
import { GET as SingleStageGET, PUT as SingleStagePUT, DELETE as SingleStageDELETE } from '@/app/api/trips/[id]/stages/[stageId]/route'
import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createStage, updateStage, deleteStage, getStagesByTripId, getNextOrderIndex } from '@/lib/stage-utils'
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

jest.mock('@/lib/stage-utils', () => ({
  createStage: jest.fn(),
  updateStage: jest.fn(),
  deleteStage: jest.fn(),
  getStagesByTripId: jest.fn(),
  getNextOrderIndex: jest.fn(),
}))

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockCreateStage = createStage as jest.MockedFunction<typeof createStage>
const mockUpdateStage = updateStage as jest.MockedFunction<typeof updateStage>
const mockDeleteStage = deleteStage as jest.MockedFunction<typeof deleteStage>
const mockGetStagesByTripId = getStagesByTripId as jest.MockedFunction<typeof getStagesByTripId>
const mockGetNextOrderIndex = getNextOrderIndex as jest.MockedFunction<typeof getNextOrderIndex>

describe('Stages API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockTripOwner = {
    id: 'user-123',
    name: 'Trip Owner',
    email: 'owner@example.com',
    role: UserRole.Ranger,
  }

  const mockSentinel = {
    id: 'sentinel-456',
    name: 'Sentinel User',
    email: 'sentinel@example.com',
    role: UserRole.Sentinel,
  }

  const mockExplorer = {
    id: 'explorer-789',
    name: 'Explorer User',
    email: 'explorer@example.com',
    role: UserRole.Explorer,
  }

  const mockTrip = {
    id: 'trip-123',
    title: 'Test Trip',
    user_id: 'user-123',
    user: {
      id: 'user-123',
      role: UserRole.Ranger,
    },
    stages: []
  }

  const mockStage = {
    id: 'stage-123',
    tripId: 'trip-123',
    orderIndex: 0,
    title: 'Prima Tappa',
    description: 'Descrizione della prima tappa',
    routeType: 'Mountain',
    media: [],
    gpxFile: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  const validStageData = {
    title: 'Nuova Tappa',
    description: 'Descrizione della nuova tappa',
    routeType: 'Highway',
    media: [],
    gpxFile: null,
  }

  const createMockRequest = (method: string, body?: unknown): NextRequest => {
    return new NextRequest(`http://localhost/api/trips/trip-123/stages${method === 'GET' ? '' : '/stage-123'}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  describe('GET /api/trips/[id]/stages - Lista Tappe', () => {
    describe('Scenari di successo', () => {
      it('dovrebbe restituire lista tappe per proprietario del viaggio', async () => {
        mockAuth.mockResolvedValue({
          user: mockTripOwner,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
        mockGetStagesByTripId.mockResolvedValue([mockStage]);

        const request = createMockRequest('GET')
        const response = await StagesListGET(request, { params: { id: 'trip-123' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.tripId).toBe('trip-123')
        expect(data.stages).toHaveLength(1)
        expect(data.stages[0].id).toBe('stage-123')
        expect(getStagesByTripId).toHaveBeenCalledWith('trip-123')
      })

      it('dovrebbe restituire lista tappe per utente Sentinel', async () => {
        mockAuth.mockResolvedValue({
          user: mockSentinel,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
        mockGetStagesByTripId.mockResolvedValue([]);

        const request = createMockRequest('GET')
        const response = await StagesListGET(request, { params: { id: 'trip-123' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.stages).toHaveLength(0)
      })
    })

    describe('Scenari di errore', () => {
      it('dovrebbe restituire 401 se utente non autenticato', async () => {
        mockAuth.mockResolvedValue(null);

        const request = createMockRequest('GET')
        const response = await StagesListGET(request, { params: { id: 'trip-123' } })
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Non autorizzato')
      })

      it('dovrebbe restituire 404 se viaggio non trovato', async () => {
        mockAuth.mockResolvedValue({
          user: mockTripOwner,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(null);

        const request = createMockRequest('GET')
        const response = await StagesListGET(request, { params: { id: 'trip-999' } })
        const data = await response.json()

        expect(response.status).toBe(404)
        expect(data.error).toBe('Viaggio non trovato')
      })

      it('dovrebbe restituire 403 se utente non ha permessi', async () => {
        mockAuth.mockResolvedValue({
          user: mockExplorer,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);

        const request = createMockRequest('GET')
        const response = await StagesListGET(request, { params: { id: 'trip-123' } })
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.error).toBe('Non hai i permessi per visualizzare le tappe di questo viaggio')
      })
    })
  })

  describe('POST /api/trips/[id]/stages - Crea Tappa', () => {
    describe('Scenari di successo', () => {
      it('dovrebbe creare nuova tappa con successo', async () => {
        mockAuth.mockResolvedValue({
          user: mockTripOwner,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
        mockGetNextOrderIndex.mockResolvedValue(1);
        mockCreateStage.mockResolvedValue({ ...mockStage, orderIndex: 1 });

        const request = createMockRequest('POST', validStageData)
        const response = await StagesListPOST(request, { params: { id: 'trip-123' } })
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data.message).toBe('Tappa creata con successo')
        expect(data.stage.orderIndex).toBe(1)
        expect(createStage).toHaveBeenCalledWith('trip-123', {
          ...validStageData,
          orderIndex: 1,
          media: [],
          gpxFile: null,
        })
      })

      it('dovrebbe creare tappa con orderIndex specificato', async () => {
        mockAuth.mockResolvedValue({
          user: mockTripOwner,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
        mockCreateStage.mockResolvedValue({ ...mockStage, orderIndex: 2 });

        const stageDataWithOrder = { ...validStageData, orderIndex: 2 }
        const request = createMockRequest('POST', stageDataWithOrder)
        const response = await StagesListPOST(request, { params: { id: 'trip-123' } })

        expect(response.status).toBe(201)
        expect(createStage).toHaveBeenCalledWith('trip-123', stageDataWithOrder)
      })
    })

    describe('Scenari di errore', () => {
      it('dovrebbe restituire 400 per dati non validi', async () => {
        mockAuth.mockResolvedValue({
          user: mockTripOwner,
          expires: '2024-12-31T23:59:59.999Z',
        });

        const invalidData = { title: 'AB' } // Titolo troppo corto
        const request = createMockRequest('POST', invalidData)
        const response = await StagesListPOST(request, { params: { id: 'trip-123' } })
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Dati non validi')
        expect(data.details).toBeDefined()
      })

      it('dovrebbe gestire errore di orderIndex duplicato', async () => {
        mockAuth.mockResolvedValue({
          user: mockTripOwner,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
        mockGetNextOrderIndex.mockResolvedValue(1);
        mockCreateStage.mockRejectedValue(new Error('Una tappa con orderIndex 1 esiste già per questo viaggio'));

        const request = createMockRequest('POST', validStageData)
        const response = await StagesListPOST(request, { params: { id: 'trip-123' } })
        const data = await response.json()

        expect(response.status).toBe(409)
        expect(data.error).toBe('Indice di ordinamento già utilizzato. Scegli un valore diverso.')
      })
    })
  })

  describe('GET /api/trips/[id]/stages/[stageId] - Dettaglio Tappa', () => {
    describe('Scenari di successo', () => {
      it('dovrebbe restituire dettaglio tappa per proprietario', async () => {
        const mockTripWithStage = {
          ...mockTrip,
          stages: [mockStage]
        };

        mockAuth.mockResolvedValue({
          user: mockTripOwner,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTripWithStage);

        const request = createMockRequest('GET')
        const response = await SingleStageGET(request, { params: { id: 'trip-123', stageId: 'stage-123' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.id).toBe('stage-123')
        expect(data.title).toBe('Prima Tappa')
        expect(data.tripId).toBe('trip-123')
      })
    })

    describe('Scenari di errore', () => {
      it('dovrebbe restituire 404 se tappa non trovata', async () => {
        const mockTripWithoutStage = {
          ...mockTrip,
          stages: []
        };

        mockAuth.mockResolvedValue({
          user: mockTripOwner,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTripWithoutStage);

        const request = createMockRequest('GET')
        const response = await SingleStageGET(request, { params: { id: 'trip-123', stageId: 'stage-999' } })
        const data = await response.json()

        expect(response.status).toBe(404)
        expect(data.error).toBe('Tappa non trovata')
      })
    })
  })

  describe('PUT /api/trips/[id]/stages/[stageId] - Aggiorna Tappa', () => {
    describe('Scenari di successo', () => {
      it('dovrebbe aggiornare tappa con successo', async () => {
        const mockTripWithStage = {
          ...mockTrip,
          stages: [mockStage]
        };

        const updateData = { title: 'Tappa Aggiornata' }
        const updatedStage = { ...mockStage, ...updateData }

        mockAuth.mockResolvedValue({
          user: mockTripOwner,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTripWithStage);
        mockUpdateStage.mockResolvedValue(updatedStage);

        const request = createMockRequest('PUT', updateData)
        const response = await SingleStagePUT(request, { params: { id: 'trip-123', stageId: 'stage-123' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.message).toBe('Tappa aggiornata con successo')
        expect(data.stage.title).toBe('Tappa Aggiornata')
        expect(updateStage).toHaveBeenCalledWith('stage-123', updateData)
      })
    })

    describe('Scenari di errore', () => {
      it('dovrebbe gestire errore di orderIndex duplicato', async () => {
        const mockTripWithStage = {
          ...mockTrip,
          stages: [mockStage]
        };

        mockAuth.mockResolvedValue({
          user: mockTripOwner,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTripWithStage);
        mockUpdateStage.mockRejectedValue(new Error('Una tappa con orderIndex 2 esiste già per questo viaggio'));

        const updateData = { orderIndex: 2 }
        const request = createMockRequest('PUT', updateData)
        const response = await SingleStagePUT(request, { params: { id: 'trip-123', stageId: 'stage-123' } })
        const data = await response.json()

        expect(response.status).toBe(409)
        expect(data.error).toBe('Indice di ordinamento già utilizzato. Scegli un valore diverso.')
      })
    })
  })

  describe('DELETE /api/trips/[id]/stages/[stageId] - Elimina Tappa', () => {
    describe('Scenari di successo', () => {
      it('dovrebbe eliminare tappa con successo', async () => {
        const mockTripWithStage = {
          ...mockTrip,
          stages: [mockStage]
        };

        mockAuth.mockResolvedValue({
          user: mockTripOwner,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTripWithStage);
        mockDeleteStage.mockResolvedValue();

        const request = createMockRequest('DELETE')
        const response = await SingleStageDELETE(request, { params: { id: 'trip-123', stageId: 'stage-123' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.message).toBe('Tappa eliminata con successo')
        expect(deleteStage).toHaveBeenCalledWith('stage-123')
      })
    })

    describe('Scenari di errore', () => {
      it('dovrebbe gestire errore se tappa non trovata durante eliminazione', async () => {
        const mockTripWithStage = {
          ...mockTrip,
          stages: [mockStage]
        };

        mockAuth.mockResolvedValue({
          user: mockTripOwner,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTripWithStage);
        mockDeleteStage.mockRejectedValue(new Error('Tappa non trovata'));

        const request = createMockRequest('DELETE')
        const response = await SingleStageDELETE(request, { params: { id: 'trip-123', stageId: 'stage-999' } })
        const data = await response.json()

        expect(response.status).toBe(404)
        expect(data.error).toBe('Tappa non trovata')
      })
    })
  })

  describe('Test di sicurezza e autorizzazione', () => {
    describe('Controlli di autorizzazione trasversali', () => {
      const endpoints = [
        { name: 'GET stages list', fn: StagesListGET, params: { id: 'trip-123' } },
        { name: 'POST new stage', fn: StagesListPOST, params: { id: 'trip-123' } },
        { name: 'GET single stage', fn: SingleStageGET, params: { id: 'trip-123', stageId: 'stage-123' } },
        { name: 'PUT stage', fn: SingleStagePUT, params: { id: 'trip-123', stageId: 'stage-123' } },
        { name: 'DELETE stage', fn: SingleStageDELETE, params: { id: 'trip-123', stageId: 'stage-123' } },
      ]

      endpoints.forEach(({ name, fn, params }) => {
        it(`${name} - dovrebbe negare accesso a utente non autenticato`, async () => {
          mockAuth.mockResolvedValue(null);

          const request = createMockRequest(name.includes('POST') ? 'POST' : name.includes('PUT') ? 'PUT' : name.includes('DELETE') ? 'DELETE' : 'GET', name.includes('POST') || name.includes('PUT') ? validStageData : undefined)
          const response = await fn(request, { params })
          const data = await response.json()

          expect(response.status).toBe(401)
          expect(data.error).toBe('Non autorizzato')
        })
      })
    })
  })
})