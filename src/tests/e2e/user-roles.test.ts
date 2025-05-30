// src/tests/e2e/user-roles.test.ts
import { UserRole, UserPermissions } from '@/types/profile'

describe('User Roles System', () => {
  describe('UserRole Enum', () => {
    it('should have all required roles', () => {
      expect(UserRole.Explorer).toBe('Explorer')
      expect(UserRole.Ranger).toBe('Ranger')
      expect(UserRole.Sentinel).toBe('Sentinel')
    })
  })

  describe('UserPermissions', () => {
    it('Explorer permissions', () => {
      expect(UserPermissions.canCreateTrips(UserRole.Explorer)).toBe(false)
      expect(UserPermissions.canManageUsers(UserRole.Explorer)).toBe(false)
      expect(UserPermissions.canAccessAdminPanel(UserRole.Explorer)).toBe(false)
    })

    it('Ranger permissions', () => {
      expect(UserPermissions.canCreateTrips(UserRole.Ranger)).toBe(true)
      expect(UserPermissions.canManageUsers(UserRole.Ranger)).toBe(false)
      expect(UserPermissions.canAccessAdminPanel(UserRole.Ranger)).toBe(false)
    })

    it('Sentinel permissions', () => {
      expect(UserPermissions.canCreateTrips(UserRole.Sentinel)).toBe(true)
      expect(UserPermissions.canManageUsers(UserRole.Sentinel)).toBe(true)
      expect(UserPermissions.canAccessAdminPanel(UserRole.Sentinel)).toBe(true)
    })
  })
})
