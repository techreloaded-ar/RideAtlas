/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { PATCH } from '@/app/api/trips/[id]/revert-to-draft/route'
import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { UserRole } from '@/types/profile'

// Mock the external dependencies
jest.mock('@/auth')
jest.mock('@/lib/core/prisma', () => ({
  prisma: {
    trip: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/trips/[id]/revert-to-draft PATCH', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/trips/trip-123/revert-to-draft', {
      method: 'PATCH',
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'trip-123' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Non autorizzato')
  })

  it('should return 403 if user is not Ranger or Sentinel', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: 'user-123',
        role: UserRole.Explorer,
      },
    } as any)

    const request = new NextRequest('http://localhost:3000/api/trips/trip-123/revert-to-draft', {
      method: 'PATCH',
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'trip-123' }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Permessi insufficienti')
  })

  it('should return 404 if trip does not exist', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: 'user-123',
        role: UserRole.Ranger,
      },
    } as any)

    mockPrisma.trip.findUnique.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/trips/trip-123/revert-to-draft', {
      method: 'PATCH',
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'trip-123' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Viaggio non trovato')
  })

  it('should return 403 if Ranger tries to revert another user\'s trip', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: 'user-123',
        role: UserRole.Ranger,
      },
    } as any)

    mockPrisma.trip.findUnique.mockResolvedValue({
      id: 'trip-123',
      title: 'Test Trip',
      status: 'Pubblicato',
      user_id: 'other-user-456',
      user: {
        id: 'other-user-456',
        name: 'Other User',
        email: 'other@example.com'
      }
    } as any)

    const request = new NextRequest('http://localhost:3000/api/trips/trip-123/revert-to-draft', {
      method: 'PATCH',
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'trip-123' }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Non hai i permessi per modificare questo viaggio')
  })

  it('should return 400 if trip is already in draft status', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: 'user-123',
        role: UserRole.Ranger,
      },
    } as any)

    mockPrisma.trip.findUnique.mockResolvedValue({
      id: 'trip-123',
      title: 'Test Trip',
      status: 'Bozza',
      user_id: 'user-123',
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com'
      }
    } as any)

    const request = new NextRequest('http://localhost:3000/api/trips/trip-123/revert-to-draft', {
      method: 'PATCH',
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'trip-123' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Il viaggio è già in stato bozza')
  })

  it('should successfully revert trip to draft for Ranger (own trip)', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: 'user-123',
        role: UserRole.Ranger,
      },
    } as any)

    mockPrisma.trip.findUnique.mockResolvedValue({
      id: 'trip-123',
      title: 'Test Trip',
      status: 'Pubblicato',
      user_id: 'user-123',
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com'
      }
    } as any)

    const updatedTrip = {
      id: 'trip-123',
      title: 'Test Trip',
      status: 'Bozza',
      updated_at: new Date(),
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com'
      }
    }

    mockPrisma.trip.update.mockResolvedValue(updatedTrip as any)

    const request = new NextRequest('http://localhost:3000/api/trips/trip-123/revert-to-draft', {
      method: 'PATCH',
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'trip-123' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Viaggio riportato in bozza con successo')
    expect(data.trip.status).toBe('Bozza')
    expect(mockPrisma.trip.update).toHaveBeenCalledWith({
      where: { id: 'trip-123' },
      data: { 
        status: 'Bozza',
        updated_at: expect.any(Date)
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
  })

  it('should successfully revert trip to draft for Sentinel (any trip)', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: 'user-123',
        role: UserRole.Sentinel,
      },
    } as any)

    mockPrisma.trip.findUnique.mockResolvedValue({
      id: 'trip-123',
      title: 'Test Trip',
      status: 'Pubblicato',
      user_id: 'other-user-456',
      user: {
        id: 'other-user-456',
        name: 'Other User',
        email: 'other@example.com'
      }
    } as any)

    const updatedTrip = {
      id: 'trip-123',
      title: 'Test Trip',
      status: 'Bozza',
      updated_at: new Date(),
      user: {
        id: 'other-user-456',
        name: 'Other User',
        email: 'other@example.com'
      }
    }

    mockPrisma.trip.update.mockResolvedValue(updatedTrip as any)

    const request = new NextRequest('http://localhost:3000/api/trips/trip-123/revert-to-draft', {
      method: 'PATCH',
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'trip-123' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Viaggio riportato in bozza con successo')
    expect(data.trip.status).toBe('Bozza')
  })

  it('should handle from different statuses', async () => {
    const statuses = ['Pubblicato', 'Archiviato', 'Pronto_per_revisione']
    
    for (const status of statuses) {
      // Clear mocks for each iteration
      jest.clearAllMocks()
      
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-123',
          role: UserRole.Ranger,
        },
      } as any)

      mockPrisma.trip.findUnique.mockResolvedValue({
        id: 'trip-123',
        title: 'Test Trip',
        status,
        user_id: 'user-123',
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com'
        }
      } as any)

      const updatedTrip = {
        id: 'trip-123',
        title: 'Test Trip',
        status: 'Bozza',
        updated_at: new Date(),
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com'
        }
      }

      mockPrisma.trip.update.mockResolvedValue(updatedTrip as any)

      const request = new NextRequest('http://localhost:3000/api/trips/trip-123/revert-to-draft', {
        method: 'PATCH',
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: 'trip-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Viaggio riportato in bozza con successo')
      expect(data.trip.status).toBe('Bozza')
    }
  })

  it('should handle database errors gracefully', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: 'user-123',
        role: UserRole.Ranger,
      },
    } as any)

    mockPrisma.trip.findUnique.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/trips/trip-123/revert-to-draft', {
      method: 'PATCH',
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'trip-123' }) })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Errore interno del server')
  })
})