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

// Interfaccia per una singola tappa di un viaggio
export interface Stage {
  id: string
  tripId: string
  orderIndex: number
  title: string
  description?: string
  routeType?: string
  duration?: string
  media: MediaItem[]
  gpxFile: GpxFile | null
  createdAt: Date
  updatedAt: Date
}

// Tipo per la creazione di una tappa (esclude campi auto-generati)
export type StageCreationData = Omit<Stage, 'id' | 'tripId' | 'createdAt' | 'updatedAt'>

// Tipo per l'aggiornamento di una tappa
export type StageUpdateData = Partial<StageCreationData>

// Estende il tipo Trip di Prisma per supportare stages
export type Trip = PrismaTrip & {
  stages?: Stage[]
}

// Tipo per la creazione di un viaggio (esclude campi auto-generati)
// Sostituiamo il campo media JsonValue[] con MediaItem[] per facilitare il lavoro nel frontend
// Aggiungiamo support per GPX file e stages
export type TripCreationData = Omit<Trip, 'id' | 'slug' | 'status' | 'created_at' | 'updated_at' | 'user_id' | 'media' | 'gpxFile' | 'stages' | 'price'> & {
  media: MediaItem[]
  gpxFile?: GpxFile | null
  stages?: StageCreationData[]
  price?: number // Reso opzionale per permettere al DB di gestire il default
}

// Tipo per l'aggiornamento di un viaggio
export type TripUpdateData = Partial<TripCreationData> & {
  status?: TripStatus;
}

// Utility function per identificare viaggi multi-tappa
export const isMultiStageTrip = (trip: Trip): boolean => {
  return trip.stages != null && trip.stages.length > 0
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

// Helper per type casting dei Stage
export const castToStages = (stages: JsonValue[]): Stage[] => {
  return stages as unknown as Stage[]
}

export const castStagesToJsonValue = (stages: Stage[]): JsonValue[] => {
  return stages as unknown as JsonValue[]
}

// Tipo per i dati Stage che arrivano da Prisma
interface PrismaStage {
  id: string
  tripId: string
  orderIndex: number
  title: string
  description: string | null
  routeType: string | null
  duration: string | null
  media: JsonValue[]
  gpxFile: JsonValue | null
  createdAt: Date
  updatedAt: Date
}

// Funzione per trasformare i dati Prisma Stage nell'interfaccia Stage
export const transformPrismaStageToStage = (prismaStage: PrismaStage): Stage => {
  return {
    ...prismaStage,
    description: prismaStage.description ?? undefined,
    routeType: prismaStage.routeType ?? undefined,
    duration: prismaStage.duration ?? undefined,
    media: castToMediaItems(prismaStage.media || []),
    gpxFile: castToGpxFile(prismaStage.gpxFile)
  }
}

// Funzione per trasformare array di Prisma Stages in array di Stages
export const transformPrismaStages = (prismaStages: PrismaStage[]): Stage[] => {
  return prismaStages.map(transformPrismaStageToStage)
}

// Esporta gli enum per facilità d'uso
export { TripStatus, RecommendedSeason }