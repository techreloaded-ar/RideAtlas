// src/types/profile.ts
import { User as PrismaUser, UserRole } from '@prisma/client'

// Re-esporta l'enum UserRole da Prisma per mantenere l'API esistente
export { UserRole } from '@prisma/client'

// Usa i tipi generati da Prisma
export type User = PrismaUser

// Legacy alias per compatibilità
export type Profile = PrismaUser

// Tipo per la creazione di un profilo (esclude campi auto-generati)
export type ProfileCreationData = Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>

// Tipo per l'aggiornamento di un profilo
export type ProfileUpdateData = Partial<Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>>

// Helper per controllare i permessi
export const UserPermissions = {
  canCreateTrips: (role: UserRole) => role === UserRole.Ranger || role === UserRole.Sentinel,
  canManageUsers: (role: UserRole) => role === UserRole.Sentinel,
  canAccessAdminPanel: (role: UserRole) => role === UserRole.Sentinel,
} as const

// Traduzione ruoli per l'UI
export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.Explorer]: 'Explorer',
  [UserRole.Ranger]: 'Ranger',
  [UserRole.Sentinel]: 'Sentinel',
} as const

export const UserRoleDescriptions: Record<UserRole, string> = {
  [UserRole.Explorer]: 'Può visualizzare e partecipare ai viaggi',
  [UserRole.Ranger]: 'Può creare, modificare e partecipare ai viaggi',
  [UserRole.Sentinel]: 'Può gestire utenti e ha accesso completo al sistema',
} as const
