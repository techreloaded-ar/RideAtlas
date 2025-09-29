/**
 * Unit tests for trip access control utilities
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { TripStatus, UserRole } from '@prisma/client'
import type { Session } from 'next-auth'
import {
  checkTripAccess,
  checkTripAccessBySlug,
  checkTripAccessById,
  requiresAccessControl,
  canEditTrip,
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

describe('Trip Access Control', () => {
  // Test data
  const mockTrip: TripAccessData = {
    id: 'trip-123',
    status: TripStatus.Bozza,
    user_id: 'user-owner'
  }

  const mockOwnerSession: Session = {
    user: {
      id: 'user-owner',
      role: UserRole.Ranger,
      email: 'owner@example.com',
      name: 'Trip Owner'
    },
    expires: '2024-12-31'
  }

  const mockSentinelSession: Session = {
    user: {
      id: 'user-sentinel',
      role: UserRole.Sentinel,
      email: 'sentinel@example.com',
      name: 'Sentinel User'
    },
    expires: '2024-12-31'
  }

  const mockExplorerSession: Session = {
    user: {
      id: 'user-explorer',
      role: UserRole.Explorer,
      email: 'explorer@example.com',
      name: 'Explorer User'
    },
    expires: '2024-12-31'
  }

  const mockOtherRangerSession: Session = {
    user: {
      id: 'user-other-ranger',
      role: UserRole.Ranger,
      email: 'ranger@example.com',
      name: 'Other Ranger'
    },
    expires: '2024-12-31'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('checkTripAccess', () => {
    it('should deny access to unauthenticated users for draft trips', async () => {
      const result = await checkTripAccess(mockTrip, null)
      
      expect(result).toEqual({
        hasAccess: false,
        reason: 'not-authenticated'
      })
    })

    it('should allow owner access to draft trip', async () => {
      const result = await checkTripAccess(mockTrip, mockOwnerSession)
      
      expect(result).toEqual({
        hasAccess: true
      })
    })

    it('should allow sentinel access to any draft trip', async () => {
      const result = await checkTripAccess(mockTrip, mockSentinelSession)
      
      expect(result).toEqual({
        hasAccess: true
      })
    })

    it('should deny explorer access to draft trip', async () => {
      const result = await checkTripAccess(mockTrip, mockExplorerSession)
      
      expect(result).toEqual({
        hasAccess: false,
        reason: 'draft-unauthorized'
      })
    })

    it('should deny other ranger access to draft trip', async () => {
      const result = await checkTripAccess(mockTrip, mockOtherRangerSession)
      
      expect(result).toEqual({
        hasAccess: false,
        reason: 'draft-unauthorized'
      })
    })

    it('should allow anyone access to published trip', async () => {
      const publishedTrip = { ...mockTrip, status: TripStatus.Pubblicato }
      
      const explorerResult = await checkTripAccess(publishedTrip, mockExplorerSession)
      const rangerResult = await checkTripAccess(publishedTrip, mockOtherRangerSession)
      const sentinelResult = await checkTripAccess(publishedTrip, mockSentinelSession)
      
      expect(explorerResult).toEqual({ hasAccess: true })
      expect(rangerResult).toEqual({ hasAccess: true })
      expect(sentinelResult).toEqual({ hasAccess: true })
    })

    it('should allow unauthenticated users access to published trip', async () => {
      const publishedTrip = { ...mockTrip, status: TripStatus.Pubblicato }
      
      const result = await checkTripAccess(publishedTrip, null)
      
      expect(result).toEqual({ hasAccess: true })
    })

    it('should handle Pronto_per_revisione status like draft', async () => {
      const reviewTrip = { ...mockTrip, status: TripStatus.Pronto_per_revisione }
      
      const ownerResult = await checkTripAccess(reviewTrip, mockOwnerSession)
      const sentinelResult = await checkTripAccess(reviewTrip, mockSentinelSession)
      const explorerResult = await checkTripAccess(reviewTrip, mockExplorerSession)
      
      expect(ownerResult).toEqual({ hasAccess: true })
      expect(sentinelResult).toEqual({ hasAccess: true })
      expect(explorerResult).toEqual({ hasAccess: false, reason: 'draft-unauthorized' })
    })

    it('should handle Archiviato status like draft', async () => {
      const archivedTrip = { ...mockTrip, status: TripStatus.Archiviato }
      
      const ownerResult = await checkTripAccess(archivedTrip, mockOwnerSession)
      const sentinelResult = await checkTripAccess(archivedTrip, mockSentinelSession)
      const explorerResult = await checkTripAccess(archivedTrip, mockExplorerSession)
      
      expect(ownerResult).toEqual({ hasAccess: true })
      expect(sentinelResult).toEqual({ hasAccess: true })
      expect(explorerResult).toEqual({ hasAccess: false, reason: 'draft-unauthorized' })
    })
  })

  describe('checkTripAccessBySlug', () => {
    it('should return not-found when trip does not exist', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(null)
      
      const result = await checkTripAccessBySlug('non-existent-slug', mockOwnerSession)
      
      expect(result).toEqual({
        hasAccess: false,
        reason: 'not-found'
      })
      expect(mockPrisma.trip.findUnique).toHaveBeenCalledWith({
        where: { slug: 'non-existent-slug' },
        select: {
          id: true,
          status: true,
          user_id: true
        }
      })
    })

    it('should check access when trip exists', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip)
      
      const result = await checkTripAccessBySlug('test-slug', mockOwnerSession)
      
      expect(result).toEqual({ hasAccess: true })
      expect(mockPrisma.trip.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-slug' },
        select: {
          id: true,
          status: true,
          user_id: true
        }
      })
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.trip.findUnique.mockRejectedValue(new Error('Database error'))
      
      const result = await checkTripAccessBySlug('test-slug', mockOwnerSession)
      
      expect(result).toEqual({
        hasAccess: false,
        reason: 'database-error'
      })
    })
  })

  describe('checkTripAccessById', () => {
    it('should return not-found when trip does not exist', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(null)
      
      const result = await checkTripAccessById('non-existent-id', mockOwnerSession)
      
      expect(result).toEqual({
        hasAccess: false,
        reason: 'not-found'
      })
      expect(mockPrisma.trip.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        select: {
          id: true,
          status: true,
          user_id: true
        }
      })
    })

    it('should check access when trip exists', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip)
      
      const result = await checkTripAccessById('trip-123', mockOwnerSession)
      
      expect(result).toEqual({ hasAccess: true })
    })
  })

  describe('requiresAccessControl', () => {
    it('should return true for Bozza status', () => {
      expect(requiresAccessControl(TripStatus.Bozza)).toBe(true)
    })

    it('should return true for Pronto_per_revisione status', () => {
      expect(requiresAccessControl(TripStatus.Pronto_per_revisione)).toBe(true)
    })

    it('should return true for Archiviato status', () => {
      expect(requiresAccessControl(TripStatus.Archiviato)).toBe(true)
    })

    it('should return false for Pubblicato status', () => {
      expect(requiresAccessControl(TripStatus.Pubblicato)).toBe(false)
    })
  })

  describe('canEditTrip', () => {
    it('should return false for unauthenticated users', () => {
      const result = canEditTrip(mockTrip, null)
      expect(result).toBe(false)
    })

    it('should return true for trip owner', () => {
      const result = canEditTrip(mockTrip, mockOwnerSession)
      expect(result).toBe(true)
    })

    it('should return true for sentinel', () => {
      const result = canEditTrip(mockTrip, mockSentinelSession)
      expect(result).toBe(true)
    })

    it('should return false for explorer', () => {
      const result = canEditTrip(mockTrip, mockExplorerSession)
      expect(result).toBe(false)
    })

    it('should return false for other ranger', () => {
      const result = canEditTrip(mockTrip, mockOtherRangerSession)
      expect(result).toBe(false)
    })
  })
})