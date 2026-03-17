import { PATCH } from '@/app/api/admin/trips/[id]/route'
import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { UserRole } from '@/types/profile'

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/core/prisma', () => ({
  prisma: {
    trip: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const mockAuth = auth as jest.Mock
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('PATCH /api/admin/trips/[id] - Aggiornamento prezzo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/admin/trips/trip-1', {
      method: 'PATCH',
      body: JSON.stringify({ price: 19.99 }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'trip-1' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Non autorizzato')
  })

  it('should return 403 if user is not Sentinel', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: 'user-1',
        role: UserRole.Explorer,
      },
    } as any)

    const request = new NextRequest('http://localhost/api/admin/trips/trip-1', {
      method: 'PATCH',
      body: JSON.stringify({ price: 19.99 }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'trip-1' }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Permessi insufficienti')
  })

  it('should validate price payload', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: 'sentinel-1',
        role: UserRole.Sentinel,
      },
    } as any)

    const request = new NextRequest('http://localhost/api/admin/trips/trip-1', {
      method: 'PATCH',
      body: JSON.stringify({ price: -1 }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'trip-1' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Dati non validi')
    expect(mockPrisma.trip.update).not.toHaveBeenCalled()
  })

  it('should return 404 if trip does not exist', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: 'sentinel-1',
        role: UserRole.Sentinel,
      },
    } as any)
    ;(mockPrisma.trip.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/admin/trips/trip-1', {
      method: 'PATCH',
      body: JSON.stringify({ price: 24.5 }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'trip-1' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Viaggio non trovato')
  })

  it('should update trip price successfully', async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: 'sentinel-1',
        role: UserRole.Sentinel,
      },
    } as any)
    ;(mockPrisma.trip.findUnique as jest.Mock).mockResolvedValue({
      id: 'trip-1',
      title: 'Test Trip',
      price: 10,
    })
    ;(mockPrisma.trip.update as jest.Mock).mockResolvedValue({
      id: 'trip-1',
      title: 'Test Trip',
      price: 24.5,
      updated_at: new Date('2026-03-17T10:00:00.000Z'),
    })

    const request = new NextRequest('http://localhost/api/admin/trips/trip-1', {
      method: 'PATCH',
      body: JSON.stringify({ price: 24.5 }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'trip-1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Prezzo aggiornato con successo')
    expect(data.trip.previousPrice).toBe(10)
    expect(mockPrisma.trip.update).toHaveBeenCalledWith({
      where: { id: 'trip-1' },
      data: { price: 24.5 },
      select: {
        id: true,
        title: true,
        price: true,
        updated_at: true,
      },
    })
  })
})
