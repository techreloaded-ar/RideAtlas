/**
 * @jest-environment node
 */

import { getTripStatusColor, getTripStatusLabel, shouldShowStatusBadge, TripStatusType } from '@/lib/utils/tripStatusUtils'

describe('tripStatusUtils', () => {
  describe('getTripStatusColor', () => {
    it('should return correct colors for valid trip statuses', () => {
      expect(getTripStatusColor('Bozza')).toBe('bg-yellow-100 text-yellow-800')
      expect(getTripStatusColor('Pronto_per_revisione')).toBe('bg-blue-100 text-blue-800')
      expect(getTripStatusColor('Pubblicato')).toBe('bg-green-100 text-green-800')
      expect(getTripStatusColor('Archiviato')).toBe('bg-gray-100 text-gray-800')
    })

    it('should return default gray color for unknown status', () => {
      expect(getTripStatusColor('UnknownStatus')).toBe('bg-gray-100 text-gray-800')
      expect(getTripStatusColor('')).toBe('bg-gray-100 text-gray-800')
    })

    it('should handle TypeScript TripStatusType correctly', () => {
      const status: TripStatusType = 'Bozza'
      expect(getTripStatusColor(status)).toBe('bg-yellow-100 text-yellow-800')
    })
  })

  describe('getTripStatusLabel', () => {
    it('should return correct labels for valid trip statuses', () => {
      expect(getTripStatusLabel('Bozza')).toBe('Bozza')
      expect(getTripStatusLabel('Pronto_per_revisione')).toBe('Pronto per revisione')
      expect(getTripStatusLabel('Pubblicato')).toBe('Pubblicato')
      expect(getTripStatusLabel('Archiviato')).toBe('Archiviato')
    })

    it('should return the original string for unknown status', () => {
      expect(getTripStatusLabel('UnknownStatus')).toBe('UnknownStatus')
      expect(getTripStatusLabel('CustomStatus')).toBe('CustomStatus')
      expect(getTripStatusLabel('')).toBe('')
    })

    it('should handle TypeScript TripStatusType correctly', () => {
      const status: TripStatusType = 'Pronto_per_revisione'
      expect(getTripStatusLabel(status)).toBe('Pronto per revisione')
    })
  })

  describe('shouldShowStatusBadge', () => {
    describe('when isPublicView is true (default)', () => {
      it('should not show badge for published trips', () => {
        expect(shouldShowStatusBadge('Pubblicato')).toBe(false)
        expect(shouldShowStatusBadge('Pubblicato', true)).toBe(false)
      })

      it('should show badge for non-published trips', () => {
        expect(shouldShowStatusBadge('Bozza')).toBe(true)
        expect(shouldShowStatusBadge('Pronto_per_revisione')).toBe(true)
        expect(shouldShowStatusBadge('Archiviato')).toBe(true)
      })

      it('should show badge for unknown statuses', () => {
        expect(shouldShowStatusBadge('UnknownStatus')).toBe(true)
        expect(shouldShowStatusBadge('')).toBe(true)
      })
    })

    describe('when isPublicView is false', () => {
      it('should show badge for all statuses including published', () => {
        expect(shouldShowStatusBadge('Pubblicato', false)).toBe(true)
        expect(shouldShowStatusBadge('Bozza', false)).toBe(true)
        expect(shouldShowStatusBadge('Pronto_per_revisione', false)).toBe(true)
        expect(shouldShowStatusBadge('Archiviato', false)).toBe(true)
        expect(shouldShowStatusBadge('UnknownStatus', false)).toBe(true)
      })
    })

    it('should handle TypeScript TripStatusType correctly', () => {
      const publishedStatus: TripStatusType = 'Pubblicato'
      const draftStatus: TripStatusType = 'Bozza'
      
      expect(shouldShowStatusBadge(publishedStatus, true)).toBe(false)
      expect(shouldShowStatusBadge(draftStatus, true)).toBe(true)
    })
  })

  describe('integration scenarios', () => {
    it('should provide consistent behavior for complete workflow', () => {
      const statuses: TripStatusType[] = ['Bozza', 'Pronto_per_revisione', 'Pubblicato', 'Archiviato']
      
      statuses.forEach(status => {
        // All functions should work without throwing errors
        expect(() => getTripStatusColor(status)).not.toThrow()
        expect(() => getTripStatusLabel(status)).not.toThrow()
        expect(() => shouldShowStatusBadge(status, true)).not.toThrow()
        expect(() => shouldShowStatusBadge(status, false)).not.toThrow()

        // Color should always return a non-empty string
        expect(getTripStatusColor(status)).toMatch(/^bg-.+ text-.+$/)
        
        // Label should always return a non-empty string
        expect(getTripStatusLabel(status)).toBeTruthy()
        
        // Badge visibility should be boolean
        expect(typeof shouldShowStatusBadge(status, true)).toBe('boolean')
        expect(typeof shouldShowStatusBadge(status, false)).toBe('boolean')
      })
    })

    it('should handle edge cases gracefully', () => {
      const edgeCases = [null, undefined, 0, false, {}, []]
      
      edgeCases.forEach(edgeCase => {
        // Functions should not throw with edge cases
        expect(() => getTripStatusColor(edgeCase as any)).not.toThrow()
        expect(() => getTripStatusLabel(edgeCase as any)).not.toThrow()
        expect(() => shouldShowStatusBadge(edgeCase as any)).not.toThrow()
        
        // Should return default values
        expect(getTripStatusColor(edgeCase as any)).toBe('bg-gray-100 text-gray-800')
        expect(shouldShowStatusBadge(edgeCase as any)).toBe(true) // Non-published should show badge
      })
    })
  })

  describe('real-world usage scenarios', () => {
    it('should support public trips page scenario', () => {
      // Simulates /trips page where only published trips are shown
      const publishedTrips = [
        { status: 'Pubblicato' as TripStatusType },
        { status: 'Pubblicato' as TripStatusType }
      ]
      
      publishedTrips.forEach(trip => {
        // Published trips should not show badges in public view
        expect(shouldShowStatusBadge(trip.status, true)).toBe(false)
        
        // But should have valid color/label if needed
        expect(getTripStatusColor(trip.status)).toBe('bg-green-100 text-green-800')
        expect(getTripStatusLabel(trip.status)).toBe('Pubblicato')
      })
    })

    it('should support admin dashboard scenario', () => {
      // Simulates admin dashboard where all trip statuses are visible
      const allTrips = [
        { status: 'Bozza' as TripStatusType },
        { status: 'Pronto_per_revisione' as TripStatusType },
        { status: 'Pubblicato' as TripStatusType },
        { status: 'Archiviato' as TripStatusType }
      ]
      
      allTrips.forEach(trip => {
        // All trips should show badges in admin view
        expect(shouldShowStatusBadge(trip.status, false)).toBe(true)
        
        // Should have appropriate colors
        expect(getTripStatusColor(trip.status)).toMatch(/^bg-.+ text-.+$/)
        
        // Should have meaningful labels
        expect(getTripStatusLabel(trip.status)).toBeTruthy()
      })
    })

    it('should support user dashboard scenario', () => {
      // Simulates user dashboard where user sees their own trips in all statuses
      const userTrips = [
        { status: 'Bozza' as TripStatusType },
        { status: 'Pubblicato' as TripStatusType }
      ]
      
      userTrips.forEach(trip => {
        // User should see all their trip badges (private view)
        expect(shouldShowStatusBadge(trip.status, false)).toBe(true)
        
        // Colors should be distinct for different statuses
        const color = getTripStatusColor(trip.status)
        if (trip.status === 'Bozza') {
          expect(color).toContain('yellow')
        } else if (trip.status === 'Pubblicato') {
          expect(color).toContain('green')
        }
      })
    })
  })
})