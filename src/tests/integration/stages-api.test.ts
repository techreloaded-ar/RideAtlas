// src/tests/integration/stages-api.test.ts

import { GET as StagesListGET, POST as StagesListPOST } from '@/app/api/trips/[id]/stages/route'
import { GET as SingleStageGET, PUT as SingleStagePUT, DELETE as SingleStageDELETE } from '@/app/api/trips/[id]/stages/[stageId]/route'
import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { createStage, updateStage, deleteStage, getStagesByTripId, getNextOrderIndex } from '@/lib//stages/stage-utils'
import { TripTestFactory } from '@/tests/unit/factories/TripTestFactory'

// Mock delle dipendenze
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/core/prisma', () => ({
  prisma: {
    trip: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/lib/stages/stage-utils', () => ({
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
  // Utilizziamo scenari predefiniti dalla factory
  const { users, trips, stages } = TripTestFactory.getAllScenarios();
  const mockTrip = trips.basic;
  const mockStage = stages.basic;
  const validStageData = stages.validData;

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // Utilizziamo la factory per creare mock requests
  const createMockRequest = (method: string, body?: unknown): NextRequest => {
    return TripTestFactory.createMockRequest(method, body, mockTrip.id, mockStage.id);
  }

  describe('GET /api/trips/[id]/stages - Lista Tappe', () => {
    describe('Scenari di successo', () => {
      it('dovrebbe restituire lista tappe per proprietario del viaggio', async () => {
        mockAuth.mockResolvedValue({
          user: users.tripOwner,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
        mockGetStagesByTripId.mockResolvedValue([mockStage]);

        const request = createMockRequest('GET')
        const response = await StagesListGET(request, TripTestFactory.createMockParams(mockTrip.id))
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.tripId).toBe(mockTrip.id)
        expect(data.stages).toHaveLength(1)
        expect(data.stages[0].id).toBe(mockStage.id)
        expect(getStagesByTripId).toHaveBeenCalledWith(mockTrip.id)
      })

      it('dovrebbe restituire lista tappe per utente Sentinel', async () => {
        mockAuth.mockResolvedValue({
          user: users.sentinel,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
        mockGetStagesByTripId.mockResolvedValue([]);

        const request = createMockRequest('GET')
        const response = await StagesListGET(request, TripTestFactory.createMockParams(mockTrip.id))
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.stages).toHaveLength(0)
      })
    })

    describe('Scenari di errore', () => {
      it('dovrebbe restituire 401 se utente non autenticato', async () => {
        mockAuth.mockResolvedValue(null);

        const request = createMockRequest('GET')
        const response = await StagesListGET(request, TripTestFactory.createMockParams(mockTrip.id))
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Non autorizzato')
      })

      it('dovrebbe restituire 404 se viaggio non trovato', async () => {
        mockAuth.mockResolvedValue({
          user: users.tripOwner,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(null);

        const request = createMockRequest('GET')
        const response = await StagesListGET(request, TripTestFactory.createMockParams('trip-999'))
        const data = await response.json()

        expect(response.status).toBe(404)
        expect(data.error).toBe('Viaggio non trovato')
      })

      it('dovrebbe restituire 403 se utente non ha permessi', async () => {
        mockAuth.mockResolvedValue({
          user: users.explorer,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);

        const request = createMockRequest('GET')
        const response = await StagesListGET(request, TripTestFactory.createMockParams(mockTrip.id))
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
          user: users.tripOwner,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
        mockGetNextOrderIndex.mockResolvedValue(1);
        mockCreateStage.mockResolvedValue({ ...mockStage, orderIndex: 1 });

        const request = createMockRequest('POST', validStageData)
        const response = await StagesListPOST(request, TripTestFactory.createMockParams(mockTrip.id))
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data.message).toBe('Tappa creata con successo')
        expect(data.stage.orderIndex).toBe(1)
        expect(createStage).toHaveBeenCalledWith(mockTrip.id, {
          ...validStageData,
          orderIndex: 1,
          media: [],
          gpxFile: null,
        })
      })

      it('dovrebbe creare tappa con orderIndex specificato', async () => {
        mockAuth.mockResolvedValue({
          user: users.tripOwner,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
        mockCreateStage.mockResolvedValue({ ...mockStage, orderIndex: 2 });

        const stageDataWithOrder = { ...validStageData, orderIndex: 2 }
        const request = createMockRequest('POST', stageDataWithOrder)
        const response = await StagesListPOST(request, TripTestFactory.createMockParams(mockTrip.id))

        expect(response.status).toBe(201)
        expect(createStage).toHaveBeenCalledWith(mockTrip.id, stageDataWithOrder)
      })
    })

    describe('Scenari di errore', () => {
      it('dovrebbe restituire 400 per dati non validi', async () => {
        mockAuth.mockResolvedValue({
          user: users.tripOwner,
          expires: '2024-12-31T23:59:59.999Z',
        });

        const invalidData = stages.invalidData
        const request = createMockRequest('POST', invalidData)
        const response = await StagesListPOST(request, TripTestFactory.createMockParams(mockTrip.id))
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Dati non validi')
        expect(data.details).toBeDefined()
      })

      it('dovrebbe gestire errore di orderIndex duplicato', async () => {
        mockAuth.mockResolvedValue({
          user: users.tripOwner,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
        mockGetNextOrderIndex.mockResolvedValue(1);
        mockCreateStage.mockRejectedValue(new Error('Una tappa con orderIndex 1 esiste già per questo viaggio'));

        const request = createMockRequest('POST', validStageData)
        const response = await StagesListPOST(request, TripTestFactory.createMockParams(mockTrip.id))
        const data = await response.json()

        expect(response.status).toBe(409)
        expect(data.error).toBe('Indice di ordinamento già utilizzato. Scegli un valore diverso.')
      })
    })

    describe('Autorizzazione basata su ruolo', () => {
      it('dovrebbe negare creazione tappa a Explorer', async () => {
        mockAuth.mockResolvedValue({
          user: users.explorer,
          expires: '2024-12-31T23:59:59.999Z',
        });

        const request = createMockRequest('POST', validStageData)
        const response = await StagesListPOST(request, TripTestFactory.createMockParams(mockTrip.id))
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.error).toBe('Non hai i permessi per creare tappe. Solo Ranger e Sentinel possono modificare itinerari.')
      })

      it('dovrebbe permettere a Ranger proprietario di creare tappa', async () => {
        mockAuth.mockResolvedValue({
          user: users.tripOwner, // tripOwner è Ranger
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
        mockGetNextOrderIndex.mockResolvedValue(1);
        mockCreateStage.mockResolvedValue({ ...mockStage, orderIndex: 1 });

        const request = createMockRequest('POST', validStageData)
        const response = await StagesListPOST(request, TripTestFactory.createMockParams(mockTrip.id))

        expect(response.status).toBe(201)
      })

      it('dovrebbe permettere a Sentinel di creare tappa su qualsiasi viaggio', async () => {
        mockAuth.mockResolvedValue({
          user: users.sentinel,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip);
        mockGetNextOrderIndex.mockResolvedValue(1);
        mockCreateStage.mockResolvedValue({ ...mockStage, orderIndex: 1 });

        const request = createMockRequest('POST', validStageData)
        const response = await StagesListPOST(request, TripTestFactory.createMockParams(mockTrip.id))

        expect(response.status).toBe(201)
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
          user: users.tripOwner,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTripWithStage);

        const request = createMockRequest('GET')
        const response = await SingleStageGET(request, TripTestFactory.createMockParams(mockTrip.id, mockStage.id))
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.id).toBe(mockStage.id)
        expect(data.title).toBe(mockStage.title)
        expect(data.tripId).toBe(mockTrip.id)
      })
    })

    describe('Scenari di errore', () => {
      it('dovrebbe restituire 404 se tappa non trovata', async () => {
        const mockTripWithoutStage = {
          ...mockTrip,
          stages: []
        };

        mockAuth.mockResolvedValue({
          user: users.tripOwner,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTripWithoutStage);

        const request = createMockRequest('GET')
        const response = await SingleStageGET(request, TripTestFactory.createMockParams(mockTrip.id, 'stage-999'))
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
          user: users.tripOwner,
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
        expect(updateStage).toHaveBeenCalledWith(mockStage.id, updateData)
      })
    })

    describe('Scenari di errore', () => {
      it('dovrebbe gestire errore di orderIndex duplicato', async () => {
        const mockTripWithStage = {
          ...mockTrip,
          stages: [mockStage]
        };

        mockAuth.mockResolvedValue({
          user: users.tripOwner,
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
          user: users.tripOwner,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTripWithStage);
        mockDeleteStage.mockResolvedValue();

        const request = createMockRequest('DELETE')
        const response = await SingleStageDELETE(request, TripTestFactory.createMockParams(mockTrip.id, mockStage.id))
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.message).toBe('Tappa eliminata con successo')
        expect(deleteStage).toHaveBeenCalledWith(mockStage.id)
      })
    })

    describe('Scenari di errore', () => {
      it('dovrebbe gestire errore se tappa non trovata durante eliminazione', async () => {
        const mockTripWithStage = {
          ...mockTrip,
          stages: [mockStage]
        };

        mockAuth.mockResolvedValue({
          user: users.tripOwner,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTripWithStage);
        mockDeleteStage.mockRejectedValue(new Error('Tappa non trovata'));

        const request = createMockRequest('DELETE')
        const response = await SingleStageDELETE(request, TripTestFactory.createMockParams(mockTrip.id, 'stage-999'))
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