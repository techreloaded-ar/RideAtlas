// src/types/profile.ts
import { Profile as PrismaProfile } from '@prisma/client'

// Usa i tipi generati da Prisma
export type Profile = PrismaProfile

// Tipo per la creazione di un profilo (esclude campi auto-generati)
export type ProfileCreationData = Omit<Profile, 'id' | 'created_at' | 'updated_at'>

// Tipo per l'aggiornamento di un profilo
export type ProfileUpdateData = Partial<Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
