import { GET, PATCH, DELETE } from '@/app/api/admin/users/[id]/route'
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
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    trip: {
      deleteMany: jest.fn(),
    },
    account: {
      deleteMany: jest.fn(),
    },
    session: {
      deleteMany: jest.fn(),
    },
  },
}))

const mockAuth = auth as jest.MockedFunction<typeof auth>

describe('/api/admin/users/[id] - Gestione Utenti Admin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockSentinelSession = {
    user: {
      id: 'sentinel-user-id',
      name: 'Admin Sentinel',
      email: 'admin@rideatlas.com',
      role: UserRole.Sentinel,
    },
  }

  const mockUser = {
    id: 'user-123',
    name: 'Mario Rossi',
    email: 'mario@example.com',
    role: UserRole.Explorer,
    emailVerified: new Date('2023-12-01'),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-12-01'),
    image: null,
    bio: 'Appassionato di moto',
    _count: {
      trips: 3,
    },
    trips: [
      {
        id: 'trip-1',
        title: 'Viaggio 1',
        status: 'Pubblicato',
        created_at: new Date('2023-06-01'),
      },
      {
        id: 'trip-2',
        title: 'Viaggio 2',
        status: 'Bozza',
        created_at: new Date('2023-07-01'),
      },
    ],
  }

  const mockSentinelUser = {
    ...mockUser,
    id: 'sentinel-123',
    role: UserRole.Sentinel,
    email: 'sentinel@example.com',
  }

  describe('GET - Recupero dettagli utente', () => {
    describe('Autorizzazione', () => {
      it('should return 401 if user is not authenticated', async () => {
        mockAuth.mockResolvedValue(null)

        const request = new NextRequest('http://localhost/api/admin/users/user-123')
        const response = await GET(request, { params: { id: 'user-123' } })
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Non autorizzato')
      })

      it('should return 403 if user is not Sentinel', async () => {
        mockAuth.mockResolvedValue({
          user: { role: UserRole.Explorer },
        } as any)

        const request = new NextRequest('http://localhost/api/admin/users/user-123')
        const response = await GET(request, { params: { id: 'user-123' } })
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.error).toBe('Permessi insufficienti')
      })
    })

    describe('Successo', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue(mockSentinelSession as any)
      })

      it('should return user details successfully', async () => {
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

        const request = new NextRequest('http://localhost/api/admin/users/user-123')
        const response = await GET(request, { params: { id: 'user-123' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.user).toEqual(mockUser)

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'user-123' },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            image: true,
            bio: true,
            _count: {
              select: {
                trips: true,
              },
            },
            trips: {
              select: {
                id: true,
                title: true,
                status: true,
                created_at: true,
              },
              orderBy: { created_at: 'desc' },
              take: 5,
            },
          },
        })
      })

      it('should return 404 if user does not exist', async () => {
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

        const request = new NextRequest('http://localhost/api/admin/users/nonexistent')
        const response = await GET(request, { params: { id: 'nonexistent' } })
        const data = await response.json()

        expect(response.status).toBe(404)
        expect(data.error).toBe('Utente non trovato')
      })
    })

    describe('Gestione errori', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue(mockSentinelSession as any)
      })

      it('should handle database errors gracefully', async () => {
        ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

        const request = new NextRequest('http://localhost/api/admin/users/user-123')
        const response = await GET(request, { params: { id: 'user-123' } })
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Errore interno del server')
      })
    })
  })

  describe('PATCH - Aggiornamento ruolo utente', () => {
    describe('Autorizzazione', () => {
      it('should return 401 if user is not authenticated', async () => {
        mockAuth.mockResolvedValue(null)

        const request = new NextRequest('http://localhost/api/admin/users/user-123', {
          method: 'PATCH',
          body: JSON.stringify({ role: UserRole.Ranger }),
          headers: { 'Content-Type': 'application/json' },
        })
        const response = await PATCH(request, { params: { id: 'user-123' } })
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Non autorizzato')
      })

      it('should return 403 if user is not Sentinel', async () => {
        mockAuth.mockResolvedValue({
          user: { role: UserRole.Ranger },
        } as any)

        const request = new NextRequest('http://localhost/api/admin/users/user-123', {
          method: 'PATCH',
          body: JSON.stringify({ role: UserRole.Ranger }),
          headers: { 'Content-Type': 'application/json' },
        })
        const response = await PATCH(request, { params: { id: 'user-123' } })
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.error).toBe('Permessi insufficienti')
      })
    })

    describe('Validazione dati', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue(mockSentinelSession as any)
      })

      it('should return 400 for invalid role', async () => {
        const request = new NextRequest('http://localhost/api/admin/users/user-123', {
          method: 'PATCH',
          body: JSON.stringify({ role: 'InvalidRole' }),
          headers: { 'Content-Type': 'application/json' },
        })
        const response = await PATCH(request, { params: { id: 'user-123' } })
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Dati non validi')
        expect(data.details).toHaveProperty('role')
      })

      it('should return 400 for missing role', async () => {
        const request = new NextRequest('http://localhost/api/admin/users/user-123', {
          method: 'PATCH',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' },
        })
        const response = await PATCH(request, { params: { id: 'user-123' } })
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Dati non validi')
      })

      it('should ignore extra fields in request', async () => {
        const updatedUser = { ...mockUser, role: UserRole.Ranger }
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
        ;(prisma.user.update as jest.Mock).mockResolvedValue(updatedUser)

        const request = new NextRequest('http://localhost/api/admin/users/user-123', {
          method: 'PATCH',
          body: JSON.stringify({ 
            role: UserRole.Ranger,
            extraField: 'should be ignored',
            name: 'should not be updated',
          }),
          headers: { 'Content-Type': 'application/json' },
        })
        const response = await PATCH(request, { params: { id: 'user-123' } })

        expect(response.status).toBe(200)
        
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: 'user-123' },
          data: { role: UserRole.Ranger },
          select: expect.any(Object),
        })
      })
    })

    describe('Successo', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue(mockSentinelSession as any)
      })

      it('should update user role successfully', async () => {
        const updatedUser = { ...mockUser, role: UserRole.Ranger }
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
        ;(prisma.user.update as jest.Mock).mockResolvedValue(updatedUser)

        const request = new NextRequest('http://localhost/api/admin/users/user-123', {
          method: 'PATCH',
          body: JSON.stringify({ role: UserRole.Ranger }),
          headers: { 'Content-Type': 'application/json' },
        })
        const response = await PATCH(request, { params: { id: 'user-123' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.message).toBe('Ruolo utente aggiornato con successo')
        expect(data.user).toEqual(updatedUser)

        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: 'user-123' },
          data: { role: UserRole.Ranger },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            image: true,
            _count: {
              select: {
                trips: true,
              },
            },
          },
        })
      })

      it('should promote user to Sentinel', async () => {
        const updatedUser = { ...mockUser, role: UserRole.Sentinel }
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
        ;(prisma.user.update as jest.Mock).mockResolvedValue(updatedUser)

        const request = new NextRequest('http://localhost/api/admin/users/user-123', {
          method: 'PATCH',
          body: JSON.stringify({ role: UserRole.Sentinel }),
          headers: { 'Content-Type': 'application/json' },
        })
        const response = await PATCH(request, { params: { id: 'user-123' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.user.role).toBe(UserRole.Sentinel)
      })

      it('should demote user to Explorer', async () => {
        const updatedUser = { ...mockUser, role: UserRole.Explorer }
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
        ;(prisma.user.update as jest.Mock).mockResolvedValue(updatedUser)

        const request = new NextRequest('http://localhost/api/admin/users/user-123', {
          method: 'PATCH',
          body: JSON.stringify({ role: UserRole.Explorer }),
          headers: { 'Content-Type': 'application/json' },
        })
        const response = await PATCH(request, { params: { id: 'user-123' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.user.role).toBe(UserRole.Explorer)
      })
    })

    describe('Gestione errori', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue(mockSentinelSession as any)
      })

      it('should handle database errors during update', async () => {
        ;(prisma.user.update as jest.Mock).mockRejectedValue(new Error('Update failed'))

        const request = new NextRequest('http://localhost/api/admin/users/user-123', {
          method: 'PATCH',
          body: JSON.stringify({ role: UserRole.Ranger }),
          headers: { 'Content-Type': 'application/json' },
        })
        const response = await PATCH(request, { params: { id: 'user-123' } })
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Errore interno del server')
      })

      it('should handle user not found during update', async () => {
        ;(prisma.user.update as jest.Mock).mockRejectedValue({
          code: 'P2025',
          message: 'Record not found',
        })

        const request = new NextRequest('http://localhost/api/admin/users/user-123', {
          method: 'PATCH',
          body: JSON.stringify({ role: UserRole.Ranger }),
          headers: { 'Content-Type': 'application/json' },
        })
        const response = await PATCH(request, { params: { id: 'user-123' } })
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Errore interno del server')
      })
    })
  })

  describe('DELETE - Eliminazione utente', () => {
    describe('Autorizzazione', () => {
      it('should return 401 if user is not authenticated', async () => {
        mockAuth.mockResolvedValue(null)

        const request = new NextRequest('http://localhost/api/admin/users/user-123')
        const response = await DELETE(request, { params: { id: 'user-123' } })
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Non autorizzato')
      })

      it('should return 403 if user is not Sentinel', async () => {
        mockAuth.mockResolvedValue({
          user: { role: UserRole.Ranger },
        } as any)

        const request = new NextRequest('http://localhost/api/admin/users/user-123')
        const response = await DELETE(request, { params: { id: 'user-123' } })
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.error).toBe('Permessi insufficienti')
      })
    })

    describe('Validazioni eliminazione', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue(mockSentinelSession as any)
      })

      it('should return 400 when trying to delete own account', async () => {
        const request = new NextRequest('http://localhost/api/admin/users/sentinel-user-id')
        const response = await DELETE(request, { params: { id: 'sentinel-user-id' } })
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Non puoi eliminare il tuo stesso account')
        expect(prisma.user.findUnique).not.toHaveBeenCalled()
      })

      it('should return 404 if user does not exist', async () => {
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

        const request = new NextRequest('http://localhost/api/admin/users/nonexistent')
        const response = await DELETE(request, { params: { id: 'nonexistent' } })
        const data = await response.json()

        expect(response.status).toBe(404)
        expect(data.error).toBe('Utente non trovato')
      })

      it('should return 400 when trying to delete last Sentinel', async () => {
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockSentinelUser)
        ;(prisma.user.count as jest.Mock).mockResolvedValue(1)

        const request = new NextRequest('http://localhost/api/admin/users/sentinel-123')
        const response = await DELETE(request, { params: { id: 'sentinel-123' } })
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Non puoi eliminare l\'ultimo Sentinel del sistema')

        expect(prisma.user.count).toHaveBeenCalledWith({
          where: { role: UserRole.Sentinel },
        })
        expect(prisma.user.delete).not.toHaveBeenCalled()
      })

      it('should allow deleting Sentinel when there are multiple Sentinels', async () => {
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockSentinelUser)
        ;(prisma.user.count as jest.Mock).mockResolvedValue(2)
        ;(prisma.trip.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
        ;(prisma.account.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
        ;(prisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
        ;(prisma.user.delete as jest.Mock).mockResolvedValue(mockSentinelUser)

        const request = new NextRequest('http://localhost/api/admin/users/sentinel-123')
        const response = await DELETE(request, { params: { id: 'sentinel-123' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.message).toBe('Utente eliminato con successo')
      })
    })

    describe('Successo eliminazione', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue(mockSentinelSession as any)
      })

      it('should delete user successfully without trips', async () => {
        const userWithoutTrips = { ...mockUser, _count: { trips: 0 } }
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithoutTrips)
        ;(prisma.trip.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
        ;(prisma.account.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
        ;(prisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
        ;(prisma.user.delete as jest.Mock).mockResolvedValue(userWithoutTrips)

        const request = new NextRequest('http://localhost/api/admin/users/user-123')
        const response = await DELETE(request, { params: { id: 'user-123' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.message).toBe('Utente eliminato con successo')
        expect(data.deletedUser).toEqual({
          id: userWithoutTrips.id,
          email: userWithoutTrips.email,
          tripsDeleted: userWithoutTrips._count.trips
        })

        expect(prisma.trip.deleteMany).toHaveBeenCalledWith({
          where: { user_id: 'user-123' },
        })
        expect(prisma.user.delete).toHaveBeenCalledWith({
          where: { id: 'user-123' },
        })
      })

      it('should delete user and associated trips', async () => {
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
        ;(prisma.trip.deleteMany as jest.Mock).mockResolvedValue({ count: 3 })
        ;(prisma.account.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
        ;(prisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
        ;(prisma.user.delete as jest.Mock).mockResolvedValue(mockUser)

        const request = new NextRequest('http://localhost/api/admin/users/user-123')
        const response = await DELETE(request, { params: { id: 'user-123' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.message).toBe('Utente eliminato con successo')

        // Verifica che i viaggi siano stati eliminati per primi
        expect(prisma.trip.deleteMany).toHaveBeenCalledWith({
          where: { user_id: 'user-123' },
        })
        // Poi l'utente
        expect(prisma.user.delete).toHaveBeenCalledWith({
          where: { id: 'user-123' },
        })
      })

      it('should handle user with many trips', async () => {
        const userWithManyTrips = { ...mockUser, _count: { trips: 50 } }
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithManyTrips)
        ;(prisma.trip.deleteMany as jest.Mock).mockResolvedValue({ count: 50 })
        ;(prisma.account.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
        ;(prisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
        ;(prisma.user.delete as jest.Mock).mockResolvedValue(userWithManyTrips)

        const request = new NextRequest('http://localhost/api/admin/users/user-123')
        const response = await DELETE(request, { params: { id: 'user-123' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.message).toBe('Utente eliminato con successo')
      })
    })

    describe('Gestione errori eliminazione', () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue(mockSentinelSession as any)
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      })

      it('should handle database error during trip deletion', async () => {
        ;(prisma.trip.deleteMany as jest.Mock).mockRejectedValue(new Error('Delete trips failed'))

        const request = new NextRequest('http://localhost/api/admin/users/user-123')
        const response = await DELETE(request, { params: { id: 'user-123' } })
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Errore interno del server')
        expect(prisma.user.delete).not.toHaveBeenCalled()
        expect(prisma.account.deleteMany).not.toHaveBeenCalled()
        expect(prisma.session.deleteMany).not.toHaveBeenCalled()
      })

      it('should handle database error during user deletion', async () => {
        ;(prisma.trip.deleteMany as jest.Mock).mockResolvedValue({ count: 3 })
        ;(prisma.account.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
        ;(prisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
        ;(prisma.user.delete as jest.Mock).mockRejectedValue(new Error('Delete user failed'))

        const request = new NextRequest('http://localhost/api/admin/users/user-123')
        const response = await DELETE(request, { params: { id: 'user-123' } })
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Errore interno del server')
      })

      it('should handle foreign key constraint error', async () => {
        ;(prisma.trip.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
        ;(prisma.account.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
        ;(prisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
        ;(prisma.user.delete as jest.Mock).mockRejectedValue({
          code: 'P2003',
          message: 'Foreign key constraint failed',
        })

        const request = new NextRequest('http://localhost/api/admin/users/user-123')
        const response = await DELETE(request, { params: { id: 'user-123' } })
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Errore interno del server')
      })

      it('should handle user already deleted by another process', async () => {
        ;(prisma.trip.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
        ;(prisma.account.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
        ;(prisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
        ;(prisma.user.delete as jest.Mock).mockRejectedValue({
          code: 'P2025',
          message: 'Record not found',
        })

        const request = new NextRequest('http://localhost/api/admin/users/user-123')
        const response = await DELETE(request, { params: { id: 'user-123' } })
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Errore interno del server')
      })
    })
  })
})
