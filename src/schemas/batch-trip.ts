// src/schemas/batch-trip.ts
import { z } from 'zod'

// Schema per Stage nei batch upload (senza campi auto-generati)
const batchStageSchema = z.object({
  title: z.string()
    .min(1, 'Il titolo della tappa è obbligatorio')
    .max(200, 'Il titolo non può superare 200 caratteri'),
  description: z.string()
    .max(2000, 'La descrizione non può superare 2000 caratteri')
    .optional(),
  routeType: z.string()
    .max(100, 'Il tipo di percorso non può superare 100 caratteri')
    .optional(),
  duration: z.string()
    .max(50, 'La durata non può superare 50 caratteri')
    .optional(),
})

// Caratteristiche valide (allineate con il sistema esistente)
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

// Schema per Trip nei batch upload (senza insights)
const batchTripSchema = z.object({
  title: z.string()
    .min(3, 'Il titolo deve essere almeno 3 caratteri')
    .max(100, 'Il titolo non può superare 100 caratteri'),
  summary: z.string()
    .min(10, 'La descrizione deve essere almeno 10 caratteri')
    .max(6000, 'La descrizione non può superare 6000 caratteri'),
  destination: z.string()
    .min(1, 'La destinazione è obbligatoria')
    .max(100, 'La destinazione non può superare 100 caratteri'),
  theme: z.string()
    .min(1, 'Il tema è obbligatorio')
    .max(100, 'Il tema non può superare 100 caratteri'),
  characteristics: z.array(z.enum(characteristicOptions))
    .default([]),
  recommended_seasons: z.array(z.enum(recommendedSeasons))
    .min(1, 'Devi selezionare almeno una stagione'),
  tags: z.array(z.string().min(1))
    .default([]),
  travelDate: z.union([
    z.string().datetime(),
    z.string().date(),
    z.date(),
  ])
    .optional()
    .nullable(),
  stages: z.array(batchStageSchema)
    .min(1, 'È richiesta almeno una tappa')
    .max(20, 'Non puoi avere più di 20 tappe'),
})

// Schema per modalità singolo viaggio
export const singleTripBatchSchema = batchTripSchema

// Schema per modalità batch multipli viaggi
export const multipleTripsBatchSchema = z.object({
  viaggi: z.array(batchTripSchema)
    .min(1, 'È richiesto almeno un viaggio')
    .max(10, 'Non puoi caricare più di 10 viaggi alla volta'),
})

// Schema union per riconoscimento automatico del formato
export const batchUploadSchema = z.union([
  singleTripBatchSchema,
  multipleTripsBatchSchema,
])

// Tipi derivati
export type BatchStage = z.infer<typeof batchStageSchema>
export type BatchTrip = z.infer<typeof batchTripSchema>
export type SingleTripBatch = z.infer<typeof singleTripBatchSchema>
export type MultipleTripsBatch = z.infer<typeof multipleTripsBatchSchema>
export type BatchUpload = z.infer<typeof batchUploadSchema>

// Schema per il risultato del processing
export const batchProcessingResultSchema = z.object({
  jobId: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  totalTrips: z.number(),
  processedTrips: z.number(),
  createdTripIds: z.array(z.string()),
  errors: z.array(z.object({
    tripIndex: z.number().optional(),
    stageIndex: z.number().optional(),
    field: z.string().optional(),
    message: z.string(),
  })),
  startedAt: z.date(),
  completedAt: z.date().optional(),
})

export type BatchProcessingResult = z.infer<typeof batchProcessingResultSchema>

// Utility per riconoscere il tipo di batch
export const isSingleTripBatch = (data: BatchUpload): data is SingleTripBatch => {
  return 'title' in data
}

export const isMultipleTripsBatch = (data: BatchUpload): data is MultipleTripsBatch => {
  return 'viaggi' in data
}

// Enum per facilità d'uso
export const CharacteristicOptions = characteristicOptions
export const RecommendedSeasons = recommendedSeasons