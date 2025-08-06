// src/lib/stage-utils.ts
// Servizi per la gestione delle tappe (Stage) nei viaggi multi-tappa

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Stage, StageCreationData, StageUpdateData, MediaItem, GpxFile } from '@/types/trip'
import { validateStageOrder } from '@/lib/trip-utils'

// Schema di validazione per i media item (riutilizzato dalle API esistenti)
const mediaItemSchema = z.object({
  id: z.string(),
  type: z.enum(['image', 'video']),
  url: z.string().url({ message: 'L\'URL non è valido.' }),
  caption: z.string().optional(),
  thumbnailUrl: z.string().url({ message: 'L\'URL della thumbnail non è valido.' }).optional(),
})

// Schema di validazione per file GPX (riutilizzato dalle API esistenti)
const gpxFileSchema = z.object({
  url: z.string(),
  filename: z.string(),
  waypoints: z.number().int().nonnegative(),
  distance: z.number().nonnegative({ message: 'La distanza deve essere positiva.' }),
  isValid: z.boolean(),
  elevationGain: z.number().optional(),
  elevationLoss: z.number().optional(),
  duration: z.number().optional(),
  maxElevation: z.number().optional(),
  minElevation: z.number().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  keyPoints: z.array(z.object({
    lat: z.number(),
    lng: z.number(),
    elevation: z.number().optional(),
    distanceFromStart: z.number(),
    type: z.enum(['start', 'intermediate', 'end']),
    description: z.string()
  })).optional()
})

// Schema di validazione per la creazione di una tappa
const stageCreationSchema = z.object({
  orderIndex: z.number().int().nonnegative({ message: 'L\'indice di ordinamento deve essere un numero non negativo.' }),
  title: z.string().min(3, { message: 'Il titolo deve contenere almeno 3 caratteri.' }).max(100),
  description: z.string().max(2000, { message: 'La descrizione non può superare i 2000 caratteri.' }).optional(),
  routeType: z.string().max(100, { message: 'Il tipo di percorso non può superare i 100 caratteri.' }).optional(),
  duration: z.string().max(500, { message: 'La durata stimata non può superare i 500 caratteri.' }).optional(),
  media: z.array(mediaItemSchema).default([]),
  gpxFile: gpxFileSchema.nullable().optional(),
})

// Schema di validazione per l'aggiornamento di una tappa
const stageUpdateSchema = stageCreationSchema.partial()

/**
 * Prepara i campi JSON per l'aggiornamento/creazione
 * Riutilizza la logica esistente per la gestione dei campi JSON
 */
function prepareStageJsonFields(data: {
  media?: MediaItem[]
  gpxFile?: GpxFile | null
}): Record<string, unknown> {
  const updatePayload: Record<string, unknown> = {}
  
  if (data.media !== undefined) {
    updatePayload.media = data.media
  }
  
  if (data.gpxFile !== undefined) {
    updatePayload.gpxFile = data.gpxFile
  }
  
  return updatePayload
}

/**
 * Crea una nuova tappa per un viaggio
 * @param tripId ID del viaggio a cui aggiungere la tappa
 * @param data Dati della tappa da creare
 * @returns La tappa creata
 */
export async function createStage(tripId: string, data: StageCreationData): Promise<Stage> {
  // Validazione dei dati di input
  const validatedData = stageCreationSchema.parse(data)
  
  // Verifica che il viaggio esista
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { stages: true }
  })
  
  if (!trip) {
    throw new Error('Viaggio non trovato')
  }
  
  // Verifica che l'orderIndex non sia già utilizzato
  const existingStage = trip.stages.find(stage => stage.orderIndex === validatedData.orderIndex)
  if (existingStage) {
    throw new Error(`Una tappa con orderIndex ${validatedData.orderIndex} esiste già per questo viaggio`)
  }
  
  // Prepara i campi JSON
  const jsonFields = prepareStageJsonFields({
    media: validatedData.media,
    gpxFile: validatedData.gpxFile || null
  })
  
  // Crea la tappa
  const stage = await prisma.stage.create({
    data: {
      tripId,
      orderIndex: validatedData.orderIndex,
      title: validatedData.title,
      description: validatedData.description,
      routeType: validatedData.routeType,
      duration: validatedData.duration,
      ...jsonFields
    }
  })
  
  // Converti e restituisci il risultato tipizzato
  return {
    id: stage.id,
    tripId: stage.tripId,
    orderIndex: stage.orderIndex,
    title: stage.title,
    description: stage.description || undefined,
    routeType: stage.routeType || undefined,
    duration: stage.duration || undefined,
    media: stage.media as unknown as MediaItem[],
    gpxFile: stage.gpxFile as unknown as GpxFile | null,
    createdAt: stage.createdAt,
    updatedAt: stage.updatedAt
  }
}

/**
 * Aggiorna una tappa esistente
 * @param stageId ID della tappa da aggiornare
 * @param data Dati da aggiornare
 * @returns La tappa aggiornata
 */
export async function updateStage(stageId: string, data: StageUpdateData): Promise<Stage> {
  // Validazione dei dati di input
  const validatedData = stageUpdateSchema.parse(data)
  
  // Verifica che la tappa esista
  const existingStage = await prisma.stage.findUnique({
    where: { id: stageId },
    include: { trip: { include: { stages: true } } }
  })
  
  if (!existingStage) {
    throw new Error('Tappa non trovata')
  }
  
  // Se si sta cambiando l'orderIndex, verifica che non sia già utilizzato
  if (validatedData.orderIndex !== undefined && validatedData.orderIndex !== existingStage.orderIndex) {
    const conflictingStage = existingStage.trip.stages.find(
      stage => stage.id !== stageId && stage.orderIndex === validatedData.orderIndex
    )
    if (conflictingStage) {
      throw new Error(`Una tappa con orderIndex ${validatedData.orderIndex} esiste già per questo viaggio`)
    }
  }
  
  // Prepara i campi per l'aggiornamento
  const updateData: Record<string, unknown> = {}
  
  if (validatedData.orderIndex !== undefined) updateData.orderIndex = validatedData.orderIndex
  if (validatedData.title !== undefined) updateData.title = validatedData.title
  if (validatedData.description !== undefined) updateData.description = validatedData.description
  if (validatedData.routeType !== undefined) updateData.routeType = validatedData.routeType
  if (validatedData.duration !== undefined) updateData.duration = validatedData.duration
  
  // Gestione campi JSON
  const jsonFields = prepareStageJsonFields({
    media: validatedData.media,
    gpxFile: validatedData.gpxFile
  })
  Object.assign(updateData, jsonFields)
  
  // Aggiorna la tappa
  const updatedStage = await prisma.stage.update({
    where: { id: stageId },
    data: updateData
  })
  
  // Converti e restituisci il risultato tipizzato
  return {
    id: updatedStage.id,
    tripId: updatedStage.tripId,
    orderIndex: updatedStage.orderIndex,
    title: updatedStage.title,
    description: updatedStage.description || undefined,
    routeType: updatedStage.routeType || undefined,
    duration: updatedStage.duration || undefined,
    media: updatedStage.media as unknown as MediaItem[],
    gpxFile: updatedStage.gpxFile as unknown as GpxFile | null,
    createdAt: updatedStage.createdAt,
    updatedAt: updatedStage.updatedAt
  }
}

/**
 * Elimina una tappa e ricompatta gli orderIndex delle tappe successive
 * @param stageId ID della tappa da eliminare
 */
export async function deleteStage(stageId: string): Promise<void> {
  // Verifica che la tappa esista e ottieni tutte le tappe del viaggio
  const stageToDelete = await prisma.stage.findUnique({
    where: { id: stageId },
    include: { trip: { include: { stages: { orderBy: { orderIndex: 'asc' } } } } }
  })
  
  if (!stageToDelete) {
    throw new Error('Tappa non trovata')
  }
  
  const deletedOrderIndex = stageToDelete.orderIndex
  const stagesToReorder = stageToDelete.trip.stages.filter(
    stage => stage.orderIndex > deletedOrderIndex
  )
  
  // Usa una transazione per eliminare la tappa e ricompattare gli indici
  await prisma.$transaction(async (tx) => {
    // Elimina la tappa
    await tx.stage.delete({
      where: { id: stageId }
    })
    
    // Ricompatta gli orderIndex delle tappe successive
    for (const stage of stagesToReorder) {
      await tx.stage.update({
        where: { id: stage.id },
        data: { orderIndex: stage.orderIndex - 1 }
      })
    }
  })
}

/**
 * Recupera tutte le tappe di un viaggio ordinate per orderIndex
 * @param tripId ID del viaggio
 * @returns Array di tappe ordinate
 */
export async function getStagesByTripId(tripId: string): Promise<Stage[]> {
  // Verifica che il viaggio esista
  const trip = await prisma.trip.findUnique({
    where: { id: tripId }
  })
  
  if (!trip) {
    throw new Error('Viaggio non trovato')
  }
  
  // Recupera le tappe ordinate
  const stages = await prisma.stage.findMany({
    where: { tripId },
    orderBy: { orderIndex: 'asc' }
  })
  
  // Converti e restituisci i risultati tipizzati
  return stages.map(stage => ({
    id: stage.id,
    tripId: stage.tripId,
    orderIndex: stage.orderIndex,
    title: stage.title,
    description: stage.description || undefined,
    routeType: stage.routeType || undefined,
    duration: stage.duration || undefined,
    media: stage.media as unknown as MediaItem[],
    gpxFile: stage.gpxFile as unknown as GpxFile | null,
    createdAt: stage.createdAt,
    updatedAt: stage.updatedAt
  }))
}

/**
 * Verifica la coerenza degli orderIndex delle tappe di un viaggio
 * Utilizza la funzione di validazione esistente da trip-utils
 * @param tripId ID del viaggio da verificare
 * @returns true se l'ordinamento è valido, false altrimenti
 */
export async function validateTripStagesOrder(tripId: string): Promise<boolean> {
  const stages = await getStagesByTripId(tripId)
  return validateStageOrder(stages)
}

/**
 * Ottieni il prossimo orderIndex disponibile per un viaggio
 * @param tripId ID del viaggio
 * @returns Il prossimo indice di ordinamento disponibile
 */
export async function getNextOrderIndex(tripId: string): Promise<number> {
  const stages = await getStagesByTripId(tripId)
  return stages.length
}