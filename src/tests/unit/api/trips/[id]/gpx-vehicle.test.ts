// src/tests/unit/api/trips/[id]/gpx-vehicle.test.ts
import { GET } from '@/app/api/trips/[id]/gpx/route'
import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/core/prisma'
import { PurchaseService } from '@/lib/payment/purchaseService'

jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/core/prisma', () => ({
  prisma: { trip: { findUnique: jest.fn() } },
}))
jest.mock('@/lib/payment/purchaseService', () => ({
  PurchaseService: { canAccessPremiumContent: jest.fn() },
}))

global.fetch = jest.fn()

const mockAuth = auth as jest.Mock
const mockFindUnique = prisma.trip.findUnique as jest.Mock
const mockCanAccess = PurchaseService.canAccessPremiumContent as jest.Mock

describe('GET /api/trips/[id]/gpx - indipendenza dal mezzo', () => {
  const url = 'https://blob.vercel-storage.com/test.gpx'
  const makeTrip = (vehicle: string) => ({
    id: 'trip-123',
    title: 'Test Trip',
    status: 'Pubblicato',
    user_id: 'owner',
    vehicle,
    gpxFile: { url, filename: 'r.gpx', distance: 1, waypoints: 2 },
    user: { name: 'N', email: 'e@test.com' },
  })
  const call = () =>
    GET(new NextRequest('http://localhost/api/trips/trip-123/gpx'), {
      params: Promise.resolve({ id: 'trip-123' }),
    })

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
  })

  it.each(['MOTO', 'MONOPATTINO'])('redirect al GPX per utente con accesso (%s)', async (vehicle) => {
    mockFindUnique.mockResolvedValue(makeTrip(vehicle))
    mockAuth.mockResolvedValue({ user: { id: 'u1', role: 'Explorer' } })
    mockCanAccess.mockResolvedValue(true)

    const res = await call()
    expect(res.status).toBe(302)
    expect(await res.json()).toEqual({ redirect: url })
  })

  it.each(['MOTO', 'MONOPATTINO'])('401 senza autenticazione (%s)', async (vehicle) => {
    mockFindUnique.mockResolvedValue(makeTrip(vehicle))
    mockAuth.mockResolvedValue(null)

    const res = await call()
    expect(res.status).toBe(401)
  })
})
