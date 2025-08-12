import { ensureUserExists } from '@/lib/auth/user-sync'
import { prisma } from '@/lib/core/prisma'
import type { Session } from 'next-auth'

// Mock Prisma
jest.mock('@/lib/core/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

describe('User Sync Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockSession: Session = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.jpg',
      role: 'Explorer' as any,
    },
    expires: '2024-12-31',
  }

  describe('ensureUserExists', () => {
    describe('User Creation', () => {
      it('should create new user when user does not exist', async () => {
        const newUser = {
          id: 'new-user-id',
          email: 'test@example.com',
          name: 'Test User',
          image: 'https://example.com/avatar.jpg',
          emailVerified: expect.any(Date),
          role: 'Explorer',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }

        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
        ;(prisma.user.create as jest.Mock).mockResolvedValue(newUser)

        const result = await ensureUserExists(mockSession)

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { email: 'test@example.com' },
        })

        expect(prisma.user.create).toHaveBeenCalledWith({
          data: {
            email: 'test@example.com',
            name: 'Test User',
            image: 'https://example.com/avatar.jpg',
            emailVerified: expect.any(Date),
          },
        })

        expect(result).toEqual(newUser)
      })

      it('should create user with empty name when name is null', async () => {
        const sessionWithoutName = {
          ...mockSession,
          user: { ...mockSession.user!, name: null },
        }

        const newUser = {
          id: 'new-user-id',
          email: 'test@example.com',
          name: '',
          image: 'https://example.com/avatar.jpg',
          emailVerified: expect.any(Date),
        }

        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
        ;(prisma.user.create as jest.Mock).mockResolvedValue(newUser)

        const result = await ensureUserExists(sessionWithoutName)

        expect(prisma.user.create).toHaveBeenCalledWith({
          data: {
            email: 'test@example.com',
            name: '',
            image: 'https://example.com/avatar.jpg',
            emailVerified: expect.any(Date),
          },
        })

        expect(result).toEqual(newUser)
      })

      it('should create user with empty image when image is null', async () => {
        const sessionWithoutImage = {
          ...mockSession,
          user: { ...mockSession.user!, image: null },
        }

        const newUser = {
          id: 'new-user-id',
          email: 'test@example.com',
          name: 'Test User',
          image: '',
          emailVerified: expect.any(Date),
        }

        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
        ;(prisma.user.create as jest.Mock).mockResolvedValue(newUser)

        const result = await ensureUserExists(sessionWithoutImage)

        expect(prisma.user.create).toHaveBeenCalledWith({
          data: {
            email: 'test@example.com',
            name: 'Test User',
            image: '',
            emailVerified: expect.any(Date),
          },
        })

        expect(result).toEqual(newUser)
      })

      it('should set emailVerified to current date for OAuth users', async () => {
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
        ;(prisma.user.create as jest.Mock).mockResolvedValue({
          id: 'new-user-id',
          emailVerified: new Date(),
        })

        const beforeTime = new Date()
        await ensureUserExists(mockSession)
        const afterTime = new Date()

        const createCall = (prisma.user.create as jest.Mock).mock.calls[0][0]
        const emailVerified = createCall.data.emailVerified

        expect(emailVerified).toBeInstanceOf(Date)
        expect(emailVerified.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
        expect(emailVerified.getTime()).toBeLessThanOrEqual(afterTime.getTime())
      })
    })

    describe('Existing User', () => {
      it('should return existing user without creating new one', async () => {
        const existingUser = {
          id: 'existing-user-id',
          email: 'test@example.com',
          name: 'Existing User',
          image: 'https://example.com/old-avatar.jpg',
          emailVerified: new Date('2023-01-01'),
          role: 'Ranger',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-06-01'),
        }

        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)

        const result = await ensureUserExists(mockSession)

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { email: 'test@example.com' },
        })

        expect(prisma.user.create).not.toHaveBeenCalled()
        expect(result).toEqual(existingUser)
      })

      it('should find user by email regardless of case differences in session', async () => {
        const sessionWithDifferentCase = {
          ...mockSession,
          user: { ...mockSession.user!, email: 'TEST@EXAMPLE.COM' },
        }

        const existingUser = {
          id: 'existing-user-id',
          email: 'test@example.com', // lowercase in database
        }

        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)

        const result = await ensureUserExists(sessionWithDifferentCase)

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
          where: { email: 'TEST@EXAMPLE.COM' },
        })

        expect(result).toEqual(existingUser)
      })
    })

    describe('Error Handling', () => {
      it('should throw error when session has no user', async () => {
        const sessionWithoutUser = {
          ...mockSession,
          user: null,
        } as any

        await expect(ensureUserExists(sessionWithoutUser)).rejects.toThrow(
          'No user email in session'
        )

        expect(prisma.user.findUnique).not.toHaveBeenCalled()
        expect(prisma.user.create).not.toHaveBeenCalled()
      })

      it('should throw error when user has no email', async () => {
        const sessionWithoutEmail = {
          ...mockSession,
          user: { ...mockSession.user!, email: null },
        } as any

        await expect(ensureUserExists(sessionWithoutEmail)).rejects.toThrow(
          'No user email in session'
        )

        expect(prisma.user.findUnique).not.toHaveBeenCalled()
        expect(prisma.user.create).not.toHaveBeenCalled()
      })

      it('should throw error when user has empty email', async () => {
        const sessionWithEmptyEmail = {
          ...mockSession,
          user: { ...mockSession.user!, email: '' },
        } as any

        await expect(ensureUserExists(sessionWithEmptyEmail)).rejects.toThrow(
          'No user email in session'
        )

        expect(prisma.user.findUnique).not.toHaveBeenCalled()
        expect(prisma.user.create).not.toHaveBeenCalled()
      })

      it('should handle database errors during findUnique', async () => {
        ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(
          new Error('Database connection failed')
        )

        await expect(ensureUserExists(mockSession)).rejects.toThrow(
          'Database connection failed'
        )

        expect(prisma.user.create).not.toHaveBeenCalled()
      })

      it('should handle database errors during user creation', async () => {
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
        ;(prisma.user.create as jest.Mock).mockRejectedValue(
          new Error('Unique constraint violation')
        )

        await expect(ensureUserExists(mockSession)).rejects.toThrow(
          'Unique constraint violation'
        )

        expect(prisma.user.findUnique).toHaveBeenCalled()
        expect(prisma.user.create).toHaveBeenCalled()
      })

      it('should handle email constraint violations gracefully', async () => {
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
        ;(prisma.user.create as jest.Mock).mockRejectedValue({
          code: 'P2002',
          message: 'Unique constraint failed on email',
        })

        await expect(ensureUserExists(mockSession)).rejects.toMatchObject({
          code: 'P2002',
          message: 'Unique constraint failed on email',
        })
      })
    })

    describe('Data Integrity', () => {
      it('should preserve email exactly as provided in session', async () => {
        const emailVariations = [
          'user@example.com',
          'User@Example.Com',
          'USER@EXAMPLE.COM',
          'test+alias@example.co.uk',
        ]

        for (const email of emailVariations) {
          const session = {
            ...mockSession,
            user: { ...mockSession.user!, email },
          }

          ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
          ;(prisma.user.create as jest.Mock).mockResolvedValue({ id: 'test', email })

          await ensureUserExists(session)

          expect(prisma.user.findUnique).toHaveBeenLastCalledWith({
            where: { email },
          })

          expect(prisma.user.create).toHaveBeenLastCalledWith({
            data: expect.objectContaining({ email }),
          })
        }
      })

      it('should handle special characters in user data', async () => {
        const sessionWithSpecialChars = {
          ...mockSession,
          user: {
            ...mockSession.user!,
            name: "José María O'Connor-Smith",
            email: 'josé.maría@example.com',
            image: 'https://example.com/avatar?id=123&size=large',
          },
        }

        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
        ;(prisma.user.create as jest.Mock).mockResolvedValue({
          id: 'test',
          name: "José María O'Connor-Smith",
        })

        const result = await ensureUserExists(sessionWithSpecialChars)

        expect(prisma.user.create).toHaveBeenCalledWith({
          data: {
            email: 'josé.maría@example.com',
            name: "José María O'Connor-Smith",
            image: 'https://example.com/avatar?id=123&size=large',
            emailVerified: expect.any(Date),
          },
        })
      })

      it('should handle very long user data within database limits', async () => {
        const longName = 'A'.repeat(255) // Assuming 255 char limit
        const longImage = 'https://example.com/' + 'B'.repeat(1000)

        const sessionWithLongData = {
          ...mockSession,
          user: {
            ...mockSession.user!,
            name: longName,
            image: longImage,
          },
        }

        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
        ;(prisma.user.create as jest.Mock).mockResolvedValue({
          id: 'test',
          name: longName,
          image: longImage,
        })

        const result = await ensureUserExists(sessionWithLongData)

        expect(prisma.user.create).toHaveBeenCalledWith({
          data: {
            email: 'test@example.com',
            name: longName,
            image: longImage,
            emailVerified: expect.any(Date),
          },
        })
      })
    })

    describe('Performance and Concurrency', () => {
      it('should handle concurrent calls for same email correctly', async () => {
        // Simula due chiamate simultanee per lo stesso utente
        ;(prisma.user.findUnique as jest.Mock)
          .mockResolvedValueOnce(null) // Prima chiamata: utente non esiste
          .mockResolvedValueOnce(null) // Seconda chiamata: utente ancora non esiste

        ;(prisma.user.create as jest.Mock)
          .mockResolvedValueOnce({ id: 'user-1', email: 'test@example.com' })
          .mockRejectedValueOnce({ code: 'P2002' }) // Seconda creazione fallisce per constraint

        const promises = [
          ensureUserExists(mockSession),
          ensureUserExists(mockSession),
        ]

        const results = await Promise.allSettled(promises)

        expect(results[0].status).toBe('fulfilled')
        expect((results[0] as PromiseFulfilledResult<any>).value).toMatchObject({
          id: 'user-1',
          email: 'test@example.com',
        })

        expect(results[1].status).toBe('rejected')
        expect((results[1] as PromiseRejectedResult).reason).toMatchObject({
          code: 'P2002',
        })
      })
    })
  })
})
