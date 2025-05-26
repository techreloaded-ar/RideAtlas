// src/types/trip.ts
import { Trip as PrismaTrip, TripStatus, RecommendedSeason } from '@prisma/client'

// Usa i tipi generati da Prisma
export type Trip = PrismaTrip

// Tipo per la creazione di un viaggio (esclude campi auto-generati)
export type TripCreationData = Omit<Trip, 'id' | 'slug' | 'status' | 'created_at' | 'updated_at' | 'user_id'>

// Tipo per l'aggiornamento di un viaggio
export type TripUpdateData = Partial<TripCreationData> & {
  status?: TripStatus;
}

// Esporta gli enum per facilità d'uso
export { TripStatus, RecommendedSeason }