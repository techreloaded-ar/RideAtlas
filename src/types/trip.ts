// src/types/trip.ts
import { Trip as PrismaTrip, TripStatus, RecommendedSeason } from '@prisma/client'
import { JsonValue } from '@prisma/client/runtime/library'

// Tipo per un elemento media (immagine o video)
export interface MediaItem {
  id: string
  type: 'image' | 'video'
  url: string
  caption?: string
  thumbnailUrl?: string // Per i video YouTube
}

// Usa i tipi generati da Prisma
export type Trip = PrismaTrip

// Tipo per la creazione di un viaggio (esclude campi auto-generati)
// Sostituiamo il campo media JsonValue[] con MediaItem[] per facilitare il lavoro nel frontend
export type TripCreationData = Omit<Trip, 'id' | 'slug' | 'status' | 'created_at' | 'updated_at' | 'user_id' | 'media'> & {
  media: MediaItem[]
}

// Tipo per l'aggiornamento di un viaggio
export type TripUpdateData = Partial<TripCreationData> & {
  status?: TripStatus;
}

// Helper per type casting dei media
export const castToMediaItems = (media: JsonValue[]): MediaItem[] => {
  return media as unknown as MediaItem[]
}

export const castToJsonValue = (media: MediaItem[]): JsonValue[] => {
  return media as unknown as JsonValue[]
}

// Esporta gli enum per facilità d'uso
export { TripStatus, RecommendedSeason }