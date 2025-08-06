import { GET, PUT } from '@/app/api/trips/[id]/route'
import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/types/profile'
import { RecommendedSeason } from '@/types/trip'

// Mock delle dipendenze
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/prisma', () => {
  const mockTrip = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  const mockStage = {
    findMany: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  };

  return {
    prisma: {
      trip: mockTrip,
      stage: mockStage,
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback({
          trip: mockTrip,
          stage: mockStage,
        });
      }),
    },
  };
});

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockAuth = auth as jest.MockedFunction<typeof auth>

describe('API /api/trips/[id] - Gestione Singolo Viaggio', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (body?: unknown, id = 'trip-123'): NextRequest => {
    const url = `http://localhost/api/trips/${id}`
    const options: RequestInit = {
      method: body ? 'PUT' : 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
    if (body) {
      options.body = JSON.stringify(body)
    }
    return new NextRequest(url, options)
  }

  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: UserRole.Explorer,
  }

  const mockSentinel = {
    id: 'sentinel-456',
    name: 'Sentinel User',
    email: 'sentinel@example.com',
    role: UserRole.Sentinel,
  }
  const mockTrip = {
    id: 'trip-123',
    title: 'Viaggio in Toscana',
    summary: 'Un bellissimo viaggio attraverso le colline toscane',
    destination: 'Toscana, Italia',
    duration_days: 3,
    duration_nights: 2,
    tags: ['natura', 'panorami'],
    theme: 'Turismo naturalistico',
    characteristics: ['Strade sterrate', 'Bel paesaggio'],
    recommended_seasons: [RecommendedSeason.Primavera],
    user_id: 'user-123',
    status: 'Bozza',
    slug: 'viaggio-in-toscana',
    created_at: new Date(),
    updated_at: new Date(),
    user: {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      role: UserRole.Explorer,
    },
  }

  describe('GET /api/trips/[id] - Recupero Viaggio', () => {
    describe('Scenari di successo', () => {
      it('should return trip for owner', async () => {
        mockAuth.mockResolvedValue({
          user: mockUser,
          expires: '2024-12-31T23:59:59.999Z',
        });

        mockPrisma.trip.findUnique.mockResolvedValue(mockTrip)

        const request = createMockRequest()
        const response = await GET(request, { params: { id: 'trip-123' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.id).toBe('trip-123')
        expect(data.title).toBe('Viaggio in Toscana')
        expect(data.user_id).toBe('user-123')

        expect(prisma.trip.findUnique).toHaveBeenCalledWith({
          where: { id: 'trip-123' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            stages: {
              orderBy: {
                orderIndex: 'asc'
              }
            }
          },
        })
      })

      it('should return trip for Sentinel even if not owner', async () => {
        mockAuth.mockResolvedValue({
          user: mockSentinel,
          expires: '2024-12-31T23:59:59.999Z',
        })
        ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip)

        const request = createMockRequest()
        const response = await GET(request, { params: { id: 'trip-123' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.id).toBe('trip-123')
      })
    })

    describe('Autorizzazione', () => {
      it('should reject request without authentication', async () => {
        mockAuth.mockResolvedValue(null)

        const request = createMockRequest()
        const response = await GET(request, { params: { id: 'trip-123' } })
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Non autorizzato')
      })

      it('should reject request from non-owner Explorer', async () => {
        const otherUser = { ...mockUser, id: 'other-user-456' }
        mockAuth.mockResolvedValue({
          user: otherUser,
          expires: '2024-12-31T23:59:59.999Z',
        })
        ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockTrip)

        const request = createMockRequest()
        const response = await GET(request, { params: { id: 'trip-123' } })
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.error).toBe('Non hai i permessi per visualizzare questo viaggio')
      })
    })

    describe('Gestione errori', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: mockUser,
          expires: '2024-12-31T23:59:59.999Z',
        })
      })

      it('should return 404 for non-existent trip', async () => {
        ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(null)

        const request = createMockRequest()
        const response = await GET(request, { params: { id: 'non-existent' } })
        const data = await response.json()

        expect(response.status).toBe(404)
        expect(data.error).toBe('Viaggio non trovato')
      })

      it('should handle database error', async () => {
        ;(prisma.trip.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

        const request = createMockRequest()
        const response = await GET(request, { params: { id: 'trip-123' } })
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Errore interno server.')
      })
    })
  })

  describe('PUT /api/trips/[id] - Aggiornamento Viaggio', () => {    const validUpdateData = {
      title: 'Viaggio in Toscana - Aggiornato',
      summary: 'Descrizione aggiornata del viaggio',
      destination: 'Siena, Toscana',
      duration_days: 4,
      duration_nights: 3,
      tags: ['natura', 'cultura', 'enogastronomia'],
      theme: 'Turismo culturale',
      characteristics: ['Strade sterrate', 'Bel paesaggio', 'Curve strette'],
      recommended_seasons: [RecommendedSeason.Estate],
    }

    const mockExistingTrip = {
      id: 'trip-123',
      title: 'Viaggio in Toscana',
      user_id: 'user-123',
      status: 'Bozza',
      slug: 'viaggio-in-toscana',
    }

    const mockUpdatedTrip = {
      ...mockTrip,
      ...validUpdateData,
      slug: 'viaggio-in-toscana-aggiornato',
      updated_at: new Date(),
    }

    describe('Scenari di successo', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: mockUser,
          expires: '2024-12-31T23:59:59.999Z',
        })
        ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockExistingTrip)
      })

      it('should update trip successfully', async () => {
        ;(prisma.trip.findUnique as jest.Mock)
          .mockResolvedValueOnce(mockExistingTrip) // For the initial existingTrip fetch
          .mockResolvedValue(mockUpdatedTrip); // For the fetch inside the transaction

        ;(prisma.trip.update as jest.Mock).mockResolvedValue(mockUpdatedTrip)

        const request = createMockRequest(validUpdateData)
        const response = await PUT(request, { params: { id: 'trip-123' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.message).toBe('Viaggio aggiornato con successo')
        expect(data.trip.title).toBe('Viaggio in Toscana - Aggiornato')
        expect(data.trip.slug).toBe('viaggio-in-toscana-aggiornato')

        expect(prisma.trip.update).toHaveBeenCalledWith({
          where: { id: 'trip-123' },
          data: {
            ...validUpdateData,
            slug: 'viaggio-in-toscana-aggiornato',
            updated_at: expect.any(Date),
          },
        })
      })

      it('should update trip with partial data', async () => {
        const partialData = {
          title: 'Nuovo Titolo',
          summary: 'Nuova descrizione del viaggio',
        }
        // Mock findUnique to return existing trip first, then updated trip
        ;(prisma.trip.findUnique as jest.Mock)
          .mockResolvedValueOnce(mockExistingTrip)
          .mockResolvedValue({
            ...mockExistingTrip,
            ...partialData,
            slug: 'nuovo-titolo',
          });

        ;(prisma.trip.update as jest.Mock).mockResolvedValue({
          ...mockUpdatedTrip,
          ...partialData,
        });
        
        const request = createMockRequest(partialData)
        const response = await PUT(request, { params: { id: 'trip-123' } })

        expect(response.status).toBe(200);
        expect(prisma.trip.update).toHaveBeenCalledWith({
          where: { id: 'trip-123' },
          data: {
            ...partialData,
            slug: 'nuovo-titolo',
            tags: [],
            updated_at: expect.any(Date),
          },
        })
      })

      it('should allow Sentinel to update any trip', async () => {
        mockAuth.mockResolvedValue({
          user: mockSentinel,
          expires: '2024-12-31T23:59:59.999Z',
        })
        ;(prisma.trip.update as jest.Mock).mockResolvedValue(mockUpdatedTrip)

        const request = createMockRequest(validUpdateData)
        const response = await PUT(request, { params: { id: 'trip-123' } })

        expect(response.status).toBe(200)
      })

      it('should keep same slug if title unchanged', async () => {
        const updateWithoutTitle = {
          summary: 'Nuova descrizione',
          duration_days: 5,
        };

        // Mock findUnique to return existing trip first, then updated trip
        ;(prisma.trip.findUnique as jest.Mock)
          .mockResolvedValueOnce(mockExistingTrip)
          .mockResolvedValue({
            ...mockExistingTrip,
            ...updateWithoutTitle,
          });

        (prisma.trip.update as jest.Mock).mockResolvedValue({
          ...mockTrip,
          ...updateWithoutTitle,
        })        
        const request = createMockRequest(updateWithoutTitle)
        const response = await PUT(request, { params: { id: 'trip-123' } })

        expect(response.status).toBe(200);
        expect(prisma.trip.update).toHaveBeenCalledWith({
          where: { id: 'trip-123' },
          data: {
            ...updateWithoutTitle,
            tags: [],
            updated_at: expect.any(Date),
          },
        })
      })
    })

    describe('Validazione dati', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: mockUser,
          expires: '2024-12-31T23:59:59.999Z',
        })
        ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockExistingTrip)
      })

      it('should reject invalid data', async () => {
        const invalidData = {
          title: 'AB', // Too short
          summary: 'Short', // Too short
          destination: 'X', // Too short
          duration_days: -1, // Negative
          duration_nights: 0, // Zero
          tags: [], // Empty array
          theme: 'X', // Too short
          recommended_seasons: ['Invalid' as any],
        }

        const request = createMockRequest(invalidData)
        const response = await PUT(request, { params: { id: 'trip-123' } })
        const data = await response.json()       
        expect(response.status).toBe(400)
        expect(data.error).toBe('Dati non validi')
        expect(data.details).toBeDefined()
        expect(data.details.title).toContain('Il titolo deve contenere almeno 3 caratteri.')
        expect(data.details.summary).toContain('Il sommario deve contenere almeno 10 caratteri.')
        expect(data.details.destination).toContain('La destinazione deve contenere almeno 3 caratteri.')
        expect(data.details.duration_days).toContain('La durata in giorni deve essere un numero positivo.')
        // tags è opzionale con default [], quindi non dovrebbe generare errore
        expect(data.details.tags).toBeUndefined()
        expect(data.details.theme).toContain('Il tema deve contenere almeno 3 caratteri.')
      })

      it('should accept optional fields as undefined', async () => {
        const validMinimalUpdate = {
          title: 'Nuovo Titolo Valido',
        }

        ;(prisma.trip.update as jest.Mock).mockResolvedValue({
          ...mockTrip,
          ...validMinimalUpdate,
        })

        const request = createMockRequest(validMinimalUpdate)
        const response = await PUT(request, { params: { id: 'trip-123' } })

        expect(response.status).toBe(200)
      })
    })

    describe('Autorizzazione', () => {
      it('should reject request without authentication', async () => {
        mockAuth.mockResolvedValue(null)

        const request = createMockRequest(validUpdateData)
        const response = await PUT(request, { params: { id: 'trip-123' } })
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Non autorizzato')
      })

      it('should reject request from non-owner Explorer', async () => {
        const otherUser = { ...mockUser, id: 'other-user-456' }
        mockAuth.mockResolvedValue({
          user: otherUser,
          expires: '2024-12-31T23:59:59.999Z',
        })
        ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockExistingTrip)

        const request = createMockRequest(validUpdateData)
        const response = await PUT(request, { params: { id: 'trip-123' } })
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.error).toBe('Non hai i permessi per modificare questo viaggio')
      })
    })

    describe('Gestione errori', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: mockUser,
          expires: '2024-12-31T23:59:59.999Z',
        })
      })

      it('should return 404 for non-existent trip', async () => {
        ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(null)

        const request = createMockRequest(validUpdateData)
        const response = await PUT(request, { params: { id: 'non-existent' } })
        const data = await response.json()

        expect(response.status).toBe(404)
        expect(data.error).toBe('Viaggio non trovato')
      })

      it('should handle slug duplication error', async () => {
        ;(prisma.trip.findUnique as jest.Mock).mockResolvedValueOnce(mockExistingTrip)
        // Mock for slug check
        ;(prisma.trip.findUnique as jest.Mock).mockResolvedValueOnce({
          id: 'other-trip',
        })

        const updateData = {
          title: 'Titolo Esistente',
        }

        const request = createMockRequest(updateData)
        const response = await PUT(request, { params: { id: 'trip-123' } })
        const data = await response.json()

        expect(response.status).toBe(409)
        expect(data.error).toBe('Un viaggio con questo titolo esiste già. Scegli un titolo diverso.')
      })

      it('should handle prisma update error with slug conflict', async () => {
        ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockExistingTrip)
        const prismaError = {
          code: 'P2002',
          meta: { target: ['slug'] },
        }
        ;(prisma.trip.update as jest.Mock).mockRejectedValue(prismaError)

        const request = createMockRequest(validUpdateData)
        const response = await PUT(request, { params: { id: 'trip-123' } })
        const data = await response.json()

        expect(response.status).toBe(409)
        expect(data.error).toBe('Un viaggio con questo titolo esiste già. Scegli un titolo diverso.')
      })

      it('should handle generic database error', async () => {
        ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockExistingTrip)
        ;(prisma.trip.update as jest.Mock).mockRejectedValue(new Error('Database error'))

        const request = createMockRequest(validUpdateData)
        const response = await PUT(request, { params: { id: 'trip-123' } })
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Errore interno server.')
      })
    })

    describe('Slug management', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({
          user: mockUser,
          expires: '2024-12-31T23:59:59.999Z',
        });
        (prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockExistingTrip)
      })

      it('should generate new slug when title changes', async () => {
        const updateData = {
          title: 'Nuovo Titolo Completamente Diverso',
        }

        // Mock findUnique to return existing trip first, then updated trip
        ;(prisma.trip.findUnique as jest.Mock)
          .mockResolvedValueOnce(mockExistingTrip)
          .mockResolvedValue({
            ...mockExistingTrip,
            ...updateData,
            slug: 'nuovo-titolo-completamente-diverso',
          });

        ;(prisma.trip.update as jest.Mock).mockResolvedValue({
          ...mockTrip,
          ...updateData,
          slug: 'nuovo-titolo-completamente-diverso',
        })

        const request = createMockRequest(updateData)
        const response = await PUT(request, { params: { id: 'trip-123' } })

        expect(response.status).toBe(200)        
        expect(prisma.trip.update).toHaveBeenCalledWith({
          where: { id: 'trip-123' },
          data: {
            ...updateData,
            slug: 'nuovo-titolo-completamente-diverso',
            tags: [],
            updated_at: expect.any(Date),
          },
        })
      })

      it('should handle special characters in title for slug generation', async () => {
        const testCases = [
          { title: 'Viaggio con àccénti!', expectedSlug: 'viaggio-con-accenti' },
          { title: 'VIAGGIO TUTTO MAIUSCOLO', expectedSlug: 'viaggio-tutto-maiuscolo' },
          { title: 'Viaggio   con   spazi', expectedSlug: 'viaggio-con-spazi' },
          { title: 'Viaggio!!!Con???Punteggiatura', expectedSlug: 'viaggio-con-punteggiatura' },
        ]

        for (const { title, expectedSlug } of testCases) {
          // Mock findUnique to return existing trip first, then updated trip
          ;(prisma.trip.findUnique as jest.Mock)
            .mockResolvedValueOnce(mockExistingTrip)
            .mockResolvedValue({
              ...mockExistingTrip,
              title,
              slug: expectedSlug,
            });

          (prisma.trip.update as jest.Mock).mockResolvedValue({
            ...mockTrip,
            title,
            slug: expectedSlug,
          })          
          const updateData = { title }
          const request = createMockRequest(updateData)
          const response = await PUT(request, { params: { id: 'trip-123' } })

          expect(response.status).toBe(200);
          expect(prisma.trip.update).toHaveBeenCalledWith({
            where: { id: 'trip-123' },
            data: {
              title,
              slug: expectedSlug,
              tags: [],
              updated_at: expect.any(Date),
            },
          })

          jest.clearAllMocks()
          ;(prisma.trip.findUnique as jest.Mock).mockResolvedValue(mockExistingTrip)
        }
      })
    })
  })
})
