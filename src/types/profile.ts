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

// Media Item type (reused from trip media pattern)
export interface MediaItem {
  id: string;           // Temporary ID generated client-side
  type: 'image';        // Only 'image' for bike photos
  url: string;          // Full public URL from storage provider
  caption?: string;     // Optional description/caption
  uploadedAt?: string;  // Optional ISO timestamp for chronological ordering
}

// Public profile (no sensitive data exposed)
export interface PublicUserProfile {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  bikeDescription: string | null;
  bikePhotos: MediaItem[];
}

// Email change request
export interface EmailChangeRequest {
  newEmail: string;
  password: string;
}
