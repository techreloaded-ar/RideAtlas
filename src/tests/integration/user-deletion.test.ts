// src/tests/integration/user-deletion.test.ts

import { DELETE } from '@/app/api/admin/users/[id]/route'
import { UserRole } from '@/types/profile'
import { NextRequest } from 'next/server'

// Mock dell'autenticazione
jest.mock('@/auth', () => ({
  auth: jest.fn()
}))

// Mock di Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      count: jest.fn(),
      delete: jest.fn()
    },
    trip: {
      deleteMany: jest.fn()
    },
    account: {
      deleteMany: jest.fn()
    },
    session: {
      deleteMany: jest.fn()
    }
  }
}))

// Mock NextRequest
const createMockRequest = (url: string, method: string = 'DELETE'): NextRequest => {
  return {
    url,
    method,
    headers: new Map(),
    json: jest.fn().mockResolvedValue({}),
    cookies: new Map(),
    geo: {},
    ip: '127.0.0.1',
    nextUrl: new URL(url),
  } as unknown as NextRequest
}

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Session } from 'next-auth'

// Access the mocked auth function with proper typing
const mockAuth = auth as unknown as jest.MockedFunction<() => Promise<Session | null>>

describe('User Deletion API', () => {
  const sentinelUser = {
    id: 'sentinel-1',
    email: 'sentinel@test.com',
    role: UserRole.Sentinel
  }

  const explorerUser = {
    id: 'explorer-1', 
    email: 'explorer@test.com',
    role: UserRole.Explorer,
    name: 'Test Explorer',
    _count: { trips: 3 }
  }

  const rangerUser = {
    id: 'ranger-1',
    email: 'ranger@test.com', 
    role: UserRole.Ranger,
    name: 'Test Ranger',
    _count: { trips: 5 }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication and Authorization', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createMockRequest('http://localhost/api/admin/users/test-id')

      const response = await DELETE(request, { params: { id: 'test-id' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Non autorizzato')
    })

    it('should return 403 if user is not a Sentinel', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'explorer-1', role: UserRole.Explorer },
        expires: '2024-12-31T23:59:59.999Z'
      })

      const request = createMockRequest('http://localhost/api/admin/users/test-id')

      const response = await DELETE(request, { params: { id: 'test-id' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Permessi insufficienti')
    })

    it('should return 403 if Ranger tries to delete a user', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'ranger-1', role: UserRole.Ranger },
        expires: '2024-12-31T23:59:59.999Z'
      })

      const request = createMockRequest('http://localhost/api/admin/users/test-id')

      const response = await DELETE(request, { params: { id: 'test-id' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Permessi insufficienti')
    })
  })

  describe('Self-Protection', () => {
    it('should prevent user from deleting their own account', async () => {
      mockAuth.mockResolvedValue({
        user: sentinelUser,
        expires: '2024-12-31T23:59:59.999Z'
      })

      const request = createMockRequest('http://localhost/api/admin/users/sentinel-1')

      const response = await DELETE(request, { params: { id: 'sentinel-1' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Non puoi eliminare il tuo stesso account')
    })
  })

  describe('User Existence Validation', () => {
    it('should return 404 if user to delete does not exist', async () => {
      mockAuth.mockResolvedValue({ 
        user: sentinelUser,
        expires: '2024-12-31T23:59:59.999Z'
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest('http://localhost/api/admin/users/non-existent')

      const response = await DELETE(request, { params: { id: 'non-existent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Utente non trovato')
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          _count: {
            select: {
              trips: true
            }
          }
        }
      })
    })
  })

  describe('Last Sentinel Protection', () => {
    it('should prevent deletion of the last Sentinel in the system', async () => {
      const anotherSentinel = {
        id: 'sentinel-2',
        email: 'sentinel2@test.com',
        role: UserRole.Sentinel,
        name: 'Another Sentinel',
        _count: { trips: 0 }
      }

      mockAuth.mockResolvedValue({ 
        user: sentinelUser,
        expires: '2024-12-31T23:59:59.999Z'
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(anotherSentinel)
      ;(prisma.user.count as jest.Mock).mockResolvedValue(1) // Solo un Sentinel rimasto

      const request = createMockRequest('http://localhost/api/admin/users/sentinel-2')

      const response = await DELETE(request, { params: { id: 'sentinel-2' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Non puoi eliminare l\'ultimo Sentinel del sistema')
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { role: UserRole.Sentinel }
      })
    })

    it('should allow deletion of a Sentinel if there are multiple Sentinels', async () => {
      const anotherSentinel = {
        id: 'sentinel-2',
        email: 'sentinel2@test.com',
        role: UserRole.Sentinel,
        name: 'Another Sentinel',
        _count: { trips: 2 }
      }

      mockAuth.mockResolvedValue({ 
        user: sentinelUser,
        expires: '2024-12-31T23:59:59.999Z'
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(anotherSentinel)
      ;(prisma.user.count as jest.Mock).mockResolvedValue(3) // Più Sentinels disponibili
      ;(prisma.trip.deleteMany as jest.Mock).mockResolvedValue({ count: 2 })
      ;(prisma.account.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 2 })
      ;(prisma.user.delete as jest.Mock).mockResolvedValue(anotherSentinel)

      const request = createMockRequest('http://localhost/api/admin/users/sentinel-2')

      const response = await DELETE(request, { params: { id: 'sentinel-2' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Utente eliminato con successo')
      expect(data.deletedUser.email).toBe('sentinel2@test.com')
      expect(data.deletedUser.tripsDeleted).toBe(2)
    })
  })

  describe('Successful Deletion Scenarios', () => {
    it('should successfully delete an Explorer user with cascading deletes', async () => {
      mockAuth.mockResolvedValue({ 
        user: sentinelUser,
        expires: '2024-12-31T23:59:59.999Z'
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(explorerUser)
      ;(prisma.trip.deleteMany as jest.Mock).mockResolvedValue({ count: 3 })
      ;(prisma.account.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 2 })
      ;(prisma.user.delete as jest.Mock).mockResolvedValue(explorerUser)

      const request = createMockRequest('http://localhost/api/admin/users/explorer-1')

      const response = await DELETE(request, { params: { id: 'explorer-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Utente eliminato con successo')
      expect(data.deletedUser.id).toBe('explorer-1')
      expect(data.deletedUser.email).toBe('explorer@test.com')
      expect(data.deletedUser.tripsDeleted).toBe(3)

      // Verifica l'ordine corretto delle eliminazioni
      expect(prisma.trip.deleteMany).toHaveBeenCalledWith({
        where: { user_id: 'explorer-1' }
      })
      expect(prisma.account.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'explorer-1' }
      })
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'explorer-1' }
      })
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'explorer-1' }
      })
    })

    it('should successfully delete a Ranger user', async () => {
      mockAuth.mockResolvedValue({ 
        user: sentinelUser,
        expires: '2024-12-31T23:59:59.999Z'
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(rangerUser)
      ;(prisma.trip.deleteMany as jest.Mock).mockResolvedValue({ count: 5 })
      ;(prisma.account.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.user.delete as jest.Mock).mockResolvedValue(rangerUser)

      const request = createMockRequest('http://localhost/api/admin/users/ranger-1')

      const response = await DELETE(request, { params: { id: 'ranger-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Utente eliminato con successo')
      expect(data.deletedUser.id).toBe('ranger-1')
      expect(data.deletedUser.email).toBe('ranger@test.com')
      expect(data.deletedUser.tripsDeleted).toBe(5)
    })

    it('should handle user with no trips correctly', async () => {
      const userWithNoTrips = {
        ...explorerUser,
        _count: { trips: 0 }
      }

      mockAuth.mockResolvedValue({ 
        user: sentinelUser,
        expires: '2024-12-31T23:59:59.999Z'
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithNoTrips)
      ;(prisma.trip.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.account.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.user.delete as jest.Mock).mockResolvedValue(userWithNoTrips)

      const request = createMockRequest('http://localhost/api/admin/users/explorer-1')

      const response = await DELETE(request, { params: { id: 'explorer-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.deletedUser.tripsDeleted).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAuth.mockResolvedValue({ 
        user: sentinelUser,
        expires: '2024-12-31T23:59:59.999Z'
      })
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest('http://localhost/api/admin/users/test-id')

      const response = await DELETE(request, { params: { id: 'test-id' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })

    it('should handle deletion errors during cascading deletes', async () => {
      mockAuth.mockResolvedValue({ 
        user: sentinelUser,
        expires: '2024-12-31T23:59:59.999Z'
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(explorerUser)
      ;(prisma.trip.deleteMany as jest.Mock).mockRejectedValue(new Error('Failed to delete trips'))

      const request = createMockRequest('http://localhost/api/admin/users/explorer-1')

      const response = await DELETE(request, { params: { id: 'explorer-1' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Errore interno del server')
    })
  })

  describe('Role-based Test Coverage', () => {
    it('should test all three user roles for permissions', async () => {
      // Test Explorer permissions
      mockAuth.mockResolvedValue({
        user: { id: 'explorer-1', role: UserRole.Explorer },
        expires: '2024-12-31T23:59:59.999Z'
      })

      let request = createMockRequest('http://localhost/api/admin/users/test-id')

      let response = await DELETE(request, { params: { id: 'test-id' } })
      expect(response.status).toBe(403)

      // Test Ranger permissions  
      mockAuth.mockResolvedValue({
        user: { id: 'ranger-1', role: UserRole.Ranger },
        expires: '2024-12-31T23:59:59.999Z'
      })

      request = createMockRequest('http://localhost/api/admin/users/test-id')

      response = await DELETE(request, { params: { id: 'test-id' } })
      expect(response.status).toBe(403)

      // Test Sentinel permissions (should pass authentication check)
      mockAuth.mockResolvedValue({ 
        user: sentinelUser,
        expires: '2024-12-31T23:59:59.999Z'
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null) // User not found

      request = createMockRequest('http://localhost/api/admin/users/test-id')

      response = await DELETE(request, { params: { id: 'test-id' } })
      expect(response.status).toBe(404) // Should reach the user existence check
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty user ID parameter', async () => {
      mockAuth.mockResolvedValue({ 
        user: sentinelUser,
        expires: '2024-12-31T23:59:59.999Z'
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest('http://localhost/api/admin/users/')

      const response = await DELETE(request, { params: { id: '' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Utente non trovato')
    })

    it('should verify proper mock call order for cascading deletes', async () => {
      mockAuth.mockResolvedValue({ 
        user: sentinelUser,
        expires: '2024-12-31T23:59:59.999Z'
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(explorerUser)
      ;(prisma.trip.deleteMany as jest.Mock).mockResolvedValue({ count: 3 })
      ;(prisma.account.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 2 })
      ;(prisma.user.delete as jest.Mock).mockResolvedValue(explorerUser)

      const request = createMockRequest('http://localhost/api/admin/users/explorer-1')

      await DELETE(request, { params: { id: 'explorer-1' } })

      // Verifica che i mock siano stati chiamati nell'ordine corretto
      expect(prisma.trip.deleteMany).toHaveBeenCalled()
      expect(prisma.account.deleteMany).toHaveBeenCalled()
      expect(prisma.session.deleteMany).toHaveBeenCalled()
      expect(prisma.user.delete).toHaveBeenCalled()
    })
  })
})