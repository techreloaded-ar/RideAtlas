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

// Tipo per file GPX con metadati
export interface GpxFile {
  url: string
  filename: string
  waypoints: number
  distance: number
  elevationGain?: number
  elevationLoss?: number
  duration?: number
  maxElevation?: number
  minElevation?: number
  startTime?: string
  endTime?: string
  isValid: boolean

  // Key geographic points every 30km for route understanding
  keyPoints?: Array<{
    lat: number
    lng: number
    elevation?: number
    distanceFromStart: number
    type: 'start' | 'intermediate' | 'end'
    description: string
  }>
}

// Usa i tipi generati da Prisma
export type Trip = PrismaTrip

// Tipo per la creazione di un viaggio (esclude campi auto-generati)
// Sostituiamo il campo media JsonValue[] con MediaItem[] per facilitare il lavoro nel frontend
// Aggiungiamo support per GPX file
export type TripCreationData = Omit<Trip, 'id' | 'slug' | 'status' | 'created_at' | 'updated_at' | 'user_id' | 'media' | 'gpxFile' | 'price'> & {
  media: MediaItem[]
  gpxFile?: GpxFile | null
  price?: number // Reso opzionale per permettere al DB di gestire il default
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

// Helper per type casting dei GPX files
export const castToGpxFile = (gpxFile: JsonValue | null): GpxFile | null => {
  if (!gpxFile) return null
  return gpxFile as unknown as GpxFile
}

export const castGpxFileToJsonValue = (gpxFile: GpxFile | null): JsonValue | null => {
  if (!gpxFile) return null
  return gpxFile as unknown as JsonValue
}

// Esporta gli enum per facilità d'uso
export { TripStatus, RecommendedSeason }