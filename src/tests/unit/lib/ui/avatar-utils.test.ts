
import { getUserInitials, getUserAvatarBgColor } from '@/lib/ui/avatar-utils'
import { Session } from 'next-auth'

describe('Avatar Utils', () => {
  describe('getUserInitials', () => {
    it('should return initials from full name', () => {
      const user = { name: 'Mario Rossi', email: 'mario@example.com' } as Session['user']
      expect(getUserInitials(user)).toBe('MR')
    })

    it('should return single initial from single name', () => {
      const user = { name: 'Mario', email: 'mario@example.com' } as Session['user']
      expect(getUserInitials(user)).toBe('M')
    })

    it('should return first letter of email when no name', () => {
      const user = { email: 'mario@example.com' } as Session['user']
      expect(getUserInitials(user)).toBe('M')
    })

    it('should return empty string when no name and no email', () => {
      const user = {} as Session['user']
      expect(getUserInitials(user)).toBe('')
    })

    it('should handle names with multiple spaces', () => {
      const user = { name: 'Mario   Rossi', email: 'mario@example.com' } as Session['user']
      expect(getUserInitials(user)).toBe('MR')
    })

    it('should handle three names', () => {
      const user = { name: 'Mario Luigi Rossi', email: 'mario@example.com' } as Session['user']
      expect(getUserInitials(user)).toBe('MR')
    })

    it('should be case insensitive for email fallback', () => {
      const user = { email: 'MARIO@EXAMPLE.COM' } as Session['user']
      expect(getUserInitials(user)).toBe('M')
    })
  })

  describe('getUserAvatarBgColor', () => {
    it('should return consistent color for same email', () => {
      const user = { email: 'mario@example.com' } as Session['user']
      const color1 = getUserAvatarBgColor(user)
      const color2 = getUserAvatarBgColor(user)
      expect(color1).toBe(color2)
    })

    it('should return different colors for different emails', () => {
      const user1 = { email: 'mario@example.com' } as Session['user']
      const user2 = { email: 'luigi@example.com' } as Session['user']
      const color1 = getUserAvatarBgColor(user1)
      const color2 = getUserAvatarBgColor(user2)
      expect(color1).not.toBe(color2)
    })

    it('should return valid CSS color hex', () => {
      const user = { email: 'mario@example.com' } as Session['user']
      const color = getUserAvatarBgColor(user)
      const validColors = [
        '#3b82f6', '#10b981', '#8b5cf6', 
        '#ec4899', '#6366f1', '#ef4444', 
        '#eab308', '#14b8a6'
      ]
      expect(validColors).toContain(color)
    })

    it('should handle empty user gracefully', () => {
      const user = {} as Session['user']
      const color = getUserAvatarBgColor(user)
      expect(typeof color).toBe('string')
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('should be case insensitive for email', () => {
      const user1 = { email: 'mario@example.com' } as Session['user']
      const user2 = { email: 'MARIO@EXAMPLE.COM' } as Session['user']
      const color1 = getUserAvatarBgColor(user1)
      const color2 = getUserAvatarBgColor(user2)
      expect(color1).toBe(color2)
    })
  })
})
