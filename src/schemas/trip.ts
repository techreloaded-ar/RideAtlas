// src/schemas/trip.ts
import { z } from 'zod'

// Schema per MediaItem
const mediaItemSchema = z.object({
  id: z.string(),
  type: z.enum(['image', 'video']),
  url: z.string().url('URL non valido'),
  caption: z.string().optional(),
  thumbnailUrl: z.string().url('URL thumbnail non valido').optional(),
})

// Schema per GpxFile
const gpxFileSchema = z.object({
  url: z.string().url('URL GPX non valido'),
  filename: z.string().min(1, 'Nome file richiesto'),
  waypoints: z.number().min(0),
  distance: z.number().min(0),
  elevationGain: z.number().optional(),
  elevationLoss: z.number().optional(),
  duration: z.number().optional(),
  maxElevation: z.number().optional(),
  minElevation: z.number().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  isValid: z.boolean(),
  keyPoints: z.array(z.object({
    lat: z.number(),
    lng: z.number(),
    elevation: z.number().optional(),
    distanceFromStart: z.number(),
    type: z.enum(['start', 'intermediate', 'end']),
    description: z.string(),
  })).optional(),
})

// Schema per Stage
export const stageSchema = z.object({
  id: z.string().optional(), // Optional per nuove stages
  tripId: z.string().optional(), // Viene impostato dal server
  orderIndex: z.number().min(0),
  title: z.string().min(1, 'Il titolo della tappa è obbligatorio'),
  description: z.string().optional(),
  routeType: z.string().optional(),
  media: z.array(mediaItemSchema).default([]),
  gpxFile: gpxFileSchema.nullable().default(null),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

// Schema per StageCreationData (senza campi auto-generati)
const stageCreationSchema = z.object({
  orderIndex: z.number().min(0),
  title: z.string().min(1, 'Il titolo della tappa è obbligatorio'),
  description: z.string().optional(),
  routeType: z.string().optional(),
  media: z.array(mediaItemSchema),
  gpxFile: gpxFileSchema.nullable(),
  id: z.string().optional(), // Aggiunto per permettere l'ID nelle tappe esistenti
})

// Caratteristiche valide
const characteristicOptions = [
  'Strade sterrate',
  'Curve strette', 
  'Presenza pedaggi',
  'Presenza traghetti',
  'Autostrada',
  'Bel paesaggio',
  'Visita prolungata',
  'Interesse gastronomico',
  'Interesse storico-culturale'
] as const

// Stagioni valide
const recommendedSeasons = [
  'Primavera',
  'Estate', 
  'Autunno',
  'Inverno'
] as const

// Schema principale per TripCreationData
export const tripFormSchema = z.object({
  title: z.string()
    .min(3, 'Il titolo deve essere almeno 3 caratteri')
    .max(100, 'Il titolo non può superare 100 caratteri'),
  summary: z.string()
    .min(10, 'Il sommario deve essere almeno 10 caratteri')
    .max(500, 'Il sommario non può superare 500 caratteri'),
  destination: z.string()
    .min(1, 'La destinazione è obbligatoria')
    .max(100, 'La destinazione non può superare 100 caratteri'),
  theme: z.string()
    .min(1, 'Il tema è obbligatorio')
    .max(100, 'Il tema non può superare 100 caratteri'),
  characteristics: z.array(z.enum(characteristicOptions)),
  recommended_seasons: z.array(z.enum(recommendedSeasons)),
  tags: z.array(z.string()),
  insights: z.string().optional(),
  media: z.array(mediaItemSchema),
  gpxFile: gpxFileSchema.nullable(),
})

// Schema per trip con stages (quello che useremo principalmente)
export const tripWithStagesSchema = tripFormSchema.extend({
  stages: z.array(stageCreationSchema)
    .min(1, 'È richiesta almeno una tappa per completare il viaggio')
    .max(20, 'Non puoi avere più di 20 tappe'),
})

// Schema per trip senza obbligo di stages (per backward compatibility)
export const tripOptionalStagesSchema = tripFormSchema.extend({
  stages: z.array(stageCreationSchema).default([]),
})

// Tipi derivati dagli schemi
export type MediaItem = z.infer<typeof mediaItemSchema>
export type GpxFile = z.infer<typeof gpxFileSchema>
export type Stage = z.infer<typeof stageSchema>
export type StageCreationData = z.infer<typeof stageCreationSchema>
export type TripFormData = z.infer<typeof tripFormSchema>
export type TripWithStagesData = z.infer<typeof tripWithStagesSchema>
export type TripOptionalStagesData = z.infer<typeof tripOptionalStagesSchema>

// Enum per facilità d'uso
export const CharacteristicOptions = characteristicOptions
export const RecommendedSeasons = recommendedSeasons

// Schema di validazione server-side per quando riceviamo errori
export const serverErrorSchema = z.object({
  error: z.string(),
  details: z.record(z.array(z.string())).optional(),
})

export type ServerError = z.infer<typeof serverErrorSchema>