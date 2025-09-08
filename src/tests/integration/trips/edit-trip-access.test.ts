/**
 * Integration test for edit trip page access control
 */

import { describe, it, expect, jest } from '@jest/globals'
import { canEditTrip } from '@/lib/auth/trip-access'
import { TripStatus, UserRole } from '@prisma/client'
import type { Session } from 'next-auth'

describe('Edit Trip Page Access Control', () => {
  const mockTrip = {
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

  describe('Edit Permission Logic', () => {
    it('should allow owner to edit their trip', () => {
      const canEdit = canEditTrip(mockTrip, mockOwnerSession)
      expect(canEdit).toBe(true)
    })

    it('should allow sentinel to edit any trip', () => {
      const canEdit = canEditTrip(mockTrip, mockSentinelSession)
      expect(canEdit).toBe(true)
    })

    it('should deny explorer edit access', () => {
      const canEdit = canEditTrip(mockTrip, mockExplorerSession)
      expect(canEdit).toBe(false)
    })

    it('should deny other ranger edit access', () => {
      const canEdit = canEditTrip(mockTrip, mockOtherRangerSession)
      expect(canEdit).toBe(false)
    })

    it('should deny unauthenticated users', () => {
      const canEdit = canEditTrip(mockTrip, null)
      expect(canEdit).toBe(false)
    })
  })

  describe('Trip Status Scenarios', () => {
    it('should allow editing draft trips by authorized users', () => {
      const draftTrip = { ...mockTrip, status: TripStatus.Bozza }
      
      expect(canEditTrip(draftTrip, mockOwnerSession)).toBe(true)
      expect(canEditTrip(draftTrip, mockSentinelSession)).toBe(true)
      expect(canEditTrip(draftTrip, mockExplorerSession)).toBe(false)
    })

    it('should allow editing published trips by authorized users', () => {
      const publishedTrip = { ...mockTrip, status: TripStatus.Pubblicato }
      
      expect(canEditTrip(publishedTrip, mockOwnerSession)).toBe(true)
      expect(canEditTrip(publishedTrip, mockSentinelSession)).toBe(true)
      expect(canEditTrip(publishedTrip, mockExplorerSession)).toBe(false)
    })

    it('should allow editing trips in review by authorized users', () => {
      const reviewTrip = { ...mockTrip, status: TripStatus.Pronto_per_revisione }
      
      expect(canEditTrip(reviewTrip, mockOwnerSession)).toBe(true)
      expect(canEditTrip(reviewTrip, mockSentinelSession)).toBe(true)
      expect(canEditTrip(reviewTrip, mockExplorerSession)).toBe(false)
    })

    it('should allow editing archived trips by authorized users', () => {
      const archivedTrip = { ...mockTrip, status: TripStatus.Archiviato }
      
      expect(canEditTrip(archivedTrip, mockOwnerSession)).toBe(true)
      expect(canEditTrip(archivedTrip, mockSentinelSession)).toBe(true)
      expect(canEditTrip(archivedTrip, mockExplorerSession)).toBe(false)
    })
  })

  describe('Edit Page Security Model', () => {
    it('should follow the principle that edit access equals ownership or admin rights', () => {
      // The edit page should use the same logic as the canEditTrip function
      // which checks for ownership OR sentinel role
      
      const testCases = [
        { session: mockOwnerSession, expected: true, reason: 'owner should edit' },
        { session: mockSentinelSession, expected: true, reason: 'sentinel should edit' },
        { session: mockExplorerSession, expected: false, reason: 'explorer should not edit' },
        { session: mockOtherRangerSession, expected: false, reason: 'other ranger should not edit' },
        { session: null, expected: false, reason: 'unauthenticated should not edit' }
      ]

      testCases.forEach(({ session, expected, reason }) => {
        const result = canEditTrip(mockTrip, session)
        expect(result).toBe(expected)
      })
    })

    it('should return 404 for unauthorized users (security by obscurity)', () => {
      // The edit page should return 404 instead of showing an error message
      // This prevents revealing that a trip exists to unauthorized users
      
      const unauthorizedSessions = [
        mockExplorerSession,
        mockOtherRangerSession,
        null
      ]

      unauthorizedSessions.forEach(session => {
        const canEdit = canEditTrip(mockTrip, session)
        expect(canEdit).toBe(false)
        // In the actual page, this would result in notFound() being called
      })
    })
  })

  describe('Integration with Trip Access Control', () => {
    it('should be consistent with trip viewing permissions for authorized users', () => {
      // Users who can edit should also be able to view
      // (though the reverse is not necessarily true for draft trips)
      
      const authorizedUsers = [mockOwnerSession, mockSentinelSession]
      
      authorizedUsers.forEach(session => {
        const canEdit = canEditTrip(mockTrip, session)
        expect(canEdit).toBe(true)
      })
    })

    it('should be more restrictive than viewing permissions', () => {
      // Edit permissions should be a subset of view permissions
      // If someone can edit, they can definitely view
      // But someone might be able to view (published trips) without being able to edit
      
      const publishedTrip = { ...mockTrip, status: TripStatus.Pubblicato }
      
      // Explorer can view published trips but cannot edit them
      const canEdit = canEditTrip(publishedTrip, mockExplorerSession)
      expect(canEdit).toBe(false)
      
      // Owner can both view and edit
      const ownerCanEdit = canEditTrip(publishedTrip, mockOwnerSession)
      expect(ownerCanEdit).toBe(true)
    })
  })
})