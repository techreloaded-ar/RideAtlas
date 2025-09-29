/**
 * Edge cases and error handling tests for trip access control
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { TripStatus, UserRole } from '@prisma/client'
import type { Session } from 'next-auth'
import {
  checkTripAccess,
  checkTripAccessBySlug,
  checkTripAccessById,
  type TripAccessData
} from '@/lib/auth/trip-access'
import { prisma } from '@/lib/core/prisma'

// Mock Prisma
jest.mock('@/lib/core/prisma', () => ({
  prisma: {
    trip: {
      findUnique: jest.fn()
    }
  }
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Trip Access Control - Edge Cases and Error Handling', () => {
  const validTrip: TripAccessData = {
    id: 'trip-123',
    status: TripStatus.Bozza,
    user_id: 'user-owner'
  }

  const validSession: Session = {
    user: {
      id: 'user-owner',
      role: UserRole.Ranger,
      email: 'owner@example.com',
      name: 'Trip Owner'
    },
    expires: '2024-12-31'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Clear console mocks
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'info').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Invalid Input Handling', () => {
    it('should handle invalid trip data', async () => {
      const invalidTrips = [
        null,
        undefined,
        {},
        { id: '', status: TripStatus.Bozza, user_id: 'user' },
        { id: 'trip', status: null, user_id: 'user' },
        { id: 'trip', status: TripStatus.Bozza, user_id: '' }
      ]

      for (const invalidTrip of invalidTrips) {
        const result = await checkTripAccess(invalidTrip as any, validSession)
        
        expect(result.hasAccess).toBe(false)
        expect(result.reason).toBe('not-found')
      }

      expect(console.error).toHaveBeenCalled()
    })

    it('should handle invalid session data', async () => {
      const invalidSessions = [
        { user: { id: 'user', role: null, email: 'test@test.com' } },
        { user: { id: 'user', role: undefined, email: 'test@test.com' } },
        { user: { id: '', role: UserRole.Explorer, email: 'test@test.com' } }
      ]

      for (const invalidSession of invalidSessions) {
        const result = await checkTripAccess(validTrip, invalidSession as any)
        
        expect(result.hasAccess).toBe(false)
        expect(['not-authenticated', 'session-invalid']).toContain(result.reason)
      }
    })

    it('should handle invalid slug in checkTripAccessBySlug', async () => {
      const invalidSlugs = ['', null, undefined, 123, {}, []]

      for (const invalidSlug of invalidSlugs) {
        const result = await checkTripAccessBySlug(invalidSlug as any, validSession)
        
        expect(result.hasAccess).toBe(false)
        expect(result.reason).toBe('not-found')
      }

      expect(console.error).toHaveBeenCalled()
    })

    it('should handle invalid tripId in checkTripAccessById', async () => {
      const invalidTripIds = ['', null, undefined, 123, {}, []]

      for (const invalidTripId of invalidTripIds) {
        const result = await checkTripAccessById(invalidTripId as any, validSession)
        
        expect(result.hasAccess).toBe(false)
        expect(result.reason).toBe('not-found')
      }

      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('Database Error Handling', () => {
    it('should handle database connection errors in checkTripAccessBySlug', async () => {
      mockPrisma.trip.findUnique.mockRejectedValue(new Error('Database connection failed'))

      const result = await checkTripAccessBySlug('test-slug', validSession)

      expect(result.hasAccess).toBe(false)
      expect(result.reason).toBe('database-error')
      expect(console.error).toHaveBeenCalledWith(
        'Database error checking trip access by slug:',
        expect.any(Error),
        { slug: 'test-slug' }
      )
    })

    it('should handle database connection errors in checkTripAccessById', async () => {
      mockPrisma.trip.findUnique.mockRejectedValue(new Error('Database timeout'))

      const result = await checkTripAccessById('trip-123', validSession)

      expect(result.hasAccess).toBe(false)
      expect(result.reason).toBe('database-error')
      expect(console.error).toHaveBeenCalledWith(
        'Database error checking trip access by ID:',
        expect.any(Error),
        { tripId: 'trip-123' }
      )
    })

    it('should handle unexpected errors in checkTripAccess', async () => {
      // Force an error by passing a malformed trip object that causes an exception
      const malformedTrip = {
        get id() { throw new Error('Unexpected error') },
        status: TripStatus.Bozza,
        user_id: 'user'
      }

      const result = await checkTripAccess(malformedTrip as any, validSession)

      expect(result.hasAccess).toBe(false)
      expect(result.reason).toBe('database-error')
      expect(console.error).toHaveBeenCalledWith(
        'Unexpected error in checkTripAccess:',
        expect.any(Error)
      )
    })
  })

  describe('Logging Behavior', () => {
    it('should log unauthorized access attempts for draft trips', async () => {
      const explorerSession: Session = {
        user: {
          id: 'user-explorer',
          role: UserRole.Explorer,
          email: 'explorer@example.com',
          name: 'Explorer'
        },
        expires: '2024-12-31'
      }

      await checkTripAccess(validTrip, explorerSession)

      expect(console.warn).toHaveBeenCalledWith(
        `Unauthorized access attempt to draft trip ${validTrip.id} by user ${explorerSession.user.id} (${explorerSession.user.role})`
      )
    })

    it('should log unauthorized access attempts by unauthenticated users', async () => {
      await checkTripAccess(validTrip, null)

      expect(console.warn).toHaveBeenCalledWith(
        `Unauthorized access attempt to ${validTrip.status} trip ${validTrip.id} by unauthenticated user`
      )
    })

    it('should log unauthorized access attempts for different trip statuses', async () => {
      const statuses = [TripStatus.Pronto_per_revisione, TripStatus.Archiviato]
      const explorerSession: Session = {
        user: {
          id: 'user-explorer',
          role: UserRole.Explorer,
          email: 'explorer@example.com',
          name: 'Explorer'
        },
        expires: '2024-12-31'
      }

      for (const status of statuses) {
        const trip = { ...validTrip, status }
        await checkTripAccess(trip, explorerSession)

        expect(console.warn).toHaveBeenCalledWith(
          `Unauthorized access attempt to ${status} trip ${trip.id} by user ${explorerSession.user.id} (${explorerSession.user.role})`
        )
      }
    })

    it('should not log for successful access', async () => {
      await checkTripAccess(validTrip, validSession)

      expect(console.warn).not.toHaveBeenCalled()
      expect(console.error).not.toHaveBeenCalled()
    })

    it('should not log for published trips accessed by anyone', async () => {
      const publishedTrip = { ...validTrip, status: TripStatus.Pubblicato }
      const explorerSession: Session = {
        user: {
          id: 'user-explorer',
          role: UserRole.Explorer,
          email: 'explorer@example.com',
          name: 'Explorer'
        },
        expires: '2024-12-31'
      }

      await checkTripAccess(publishedTrip, explorerSession)

      expect(console.warn).not.toHaveBeenCalled()
      expect(console.error).not.toHaveBeenCalled()
    })

    it('should not log for published trips accessed by unauthenticated users', async () => {
      const publishedTrip = { ...validTrip, status: TripStatus.Pubblicato }

      await checkTripAccess(publishedTrip, null)

      expect(console.warn).not.toHaveBeenCalled()
      expect(console.error).not.toHaveBeenCalled()
    })
  })

  describe('Trip Not Found Scenarios', () => {
    it('should log info when trip is not found by slug', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(null)

      await checkTripAccessBySlug('non-existent-slug', validSession)

      expect(console.info).toHaveBeenCalledWith('Trip not found for slug: non-existent-slug')
    })

    it('should log info when trip is not found by ID', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(null)

      await checkTripAccessById('non-existent-id', validSession)

      expect(console.info).toHaveBeenCalledWith('Trip not found for ID: non-existent-id')
    })
  })

  describe('Session Edge Cases', () => {
    it('should handle session with missing user object', async () => {
      const sessionWithoutUser = { expires: '2024-12-31' } as any

      const result = await checkTripAccess(validTrip, sessionWithoutUser)

      expect(result.hasAccess).toBe(false)
      expect(result.reason).toBe('not-authenticated')
    })

    it('should handle session with partial user data', async () => {
      const partialSession = {
        user: { id: 'user-123' }, // Missing role and other fields
        expires: '2024-12-31'
      } as any

      const result = await checkTripAccess(validTrip, partialSession)

      expect(result.hasAccess).toBe(false)
      expect(result.reason).toBe('session-invalid')
    })
  })
})