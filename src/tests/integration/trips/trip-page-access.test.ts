/**
 * Integration test for trip page access control logic
 */

import { describe, it, expect, jest } from '@jest/globals'
import { checkTripAccess } from '@/lib/auth/trip-access'
import { TripStatus, UserRole } from '@prisma/client'
import type { Session } from 'next-auth'

describe('Trip Page Access Control Logic', () => {
  const mockDraftTrip = {
    id: 'trip-123',
    status: TripStatus.Bozza,
    user_id: 'user-owner'
  }

  const mockPublishedTrip = {
    id: 'trip-456',
    status: TripStatus.Pubblicato,
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

  describe('Draft Trip Access Control', () => {
    it('should allow owner access to draft trip', async () => {
      const result = await checkTripAccess(mockDraftTrip, mockOwnerSession)
      
      expect(result.hasAccess).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should allow sentinel access to draft trip', async () => {
      const result = await checkTripAccess(mockDraftTrip, mockSentinelSession)
      
      expect(result.hasAccess).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should deny explorer access to draft trip', async () => {
      const result = await checkTripAccess(mockDraftTrip, mockExplorerSession)
      
      expect(result.hasAccess).toBe(false)
      expect(result.reason).toBe('draft-unauthorized')
    })

    it('should deny unauthenticated access to draft trip', async () => {
      const result = await checkTripAccess(mockDraftTrip, null)
      
      expect(result.hasAccess).toBe(false)
      expect(result.reason).toBe('not-authenticated')
    })
  })

  describe('Published Trip Access Control', () => {
    it('should allow anyone access to published trip', async () => {
      const sessions = [
        mockOwnerSession,
        mockSentinelSession,
        mockExplorerSession,
        null // unauthenticated
      ]

      for (const session of sessions) {
        const result = await checkTripAccess(mockPublishedTrip, session)
        
        // All users (including unauthenticated) should have access to published trips
        expect(result.hasAccess).toBe(true)
        expect(result.reason).toBeUndefined()
      }
    })
  })

  describe('Access Control Integration Points', () => {
    it('should properly integrate with trip page logic flow', async () => {
      // Test the exact logic that would be used in the trip page
      const trip = mockDraftTrip
      const session = mockExplorerSession

      const accessResult = await checkTripAccess(
        {
          id: trip.id,
          status: trip.status,
          user_id: trip.user_id
        },
        session
      )

      // This should match the logic in the trip page
      expect(accessResult.hasAccess).toBe(false)
      expect(accessResult.reason).toBe('draft-unauthorized')

      // The page should show DraftAccessRestricted component
      // (This is what the actual page logic does)
    })

    it('should handle different trip statuses correctly', async () => {
      const statuses = [
        TripStatus.Bozza,
        TripStatus.Pronto_per_revisione,
        TripStatus.Archiviato
      ]

      for (const status of statuses) {
        const trip = { ...mockDraftTrip, status }
        const result = await checkTripAccess(trip, mockExplorerSession)

        // All these statuses should require access control
        expect(result.hasAccess).toBe(false)
        expect(result.reason).toBe('draft-unauthorized')
      }

      // Published trips should be accessible
      const publishedTrip = { ...mockDraftTrip, status: TripStatus.Pubblicato }
      const publishedResult = await checkTripAccess(publishedTrip, mockExplorerSession)
      
      expect(publishedResult.hasAccess).toBe(true)
    })
  })
})