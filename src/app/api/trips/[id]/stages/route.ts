import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { UserRole } from '@/types/profile'
import { createStage, getStagesByTripId, getNextOrderIndex } from '@/lib/stage-utils'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

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
}).nullable().optional()

// Schema di validazione per la creazione di una tappa
const stageCreationSchema = z.object({
  title: z.string().min(3, { message: 'Il titolo deve contenere almeno 3 caratteri.' }).max(100),
  description: z.string().max(2000, { message: 'La descrizione non può superare i 2000 caratteri.' }).optional(),
  routeType: z.string().max(100, { message: 'Il tipo di percorso non può superare i 100 caratteri.' }).optional(),
  duration: z.string().max(500, { message: 'La durata stimata non può superare i 500 caratteri.' }).optional(),
  media: z.array(mediaItemSchema).default([]),
  gpxFile: gpxFileSchema,
  orderIndex: z.number().int().nonnegative({ message: 'L\'indice di ordinamento deve essere un numero non negativo.' }).optional()
})

// GET - Ottieni tutte le tappe di un viaggio
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const tripId = params.id

    // Verifica che il viaggio esista e controlla i permessi
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        user: {
          select: {
            id: true,
            role: true
          }
        }
      }
    })

    if (!trip) {
      return NextResponse.json(
        { error: 'Viaggio non trovato' },
        { status: 404 }
      )
    }

    // Controlla i permessi: solo creatore o Sentinel
    const isOwner = trip.user_id === session.user.id
    const isSentinel = session.user.role === UserRole.Sentinel

    if (!isOwner && !isSentinel) {
      return NextResponse.json(
        { error: 'Non hai i permessi per visualizzare le tappe di questo viaggio' },
        { status: 403 }
      )
    }

    // Recupera le tappe ordinate
    const stages = await getStagesByTripId(tripId)

    return NextResponse.json({
      tripId,
      stages
    })

  } catch (error) {
    console.error('Errore nel caricamento delle tappe:', error)
    return NextResponse.json(
      { error: 'Errore interno server.' },
      { status: 500 }
    )
  }
}

// POST - Crea una nuova tappa per il viaggio
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const tripId = params.id
    const body = await request.json()

    // Validazione dei dati
    const parsed = stageCreationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({
        error: 'Dati non validi',
        details: parsed.error.flatten().fieldErrors
      }, { status: 400 })
    }

    // Verifica che il viaggio esista e controlla i permessi
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        user: {
          select: {
            id: true,
            role: true
          }
        }
      }
    })

    if (!trip) {
      return NextResponse.json(
        { error: 'Viaggio non trovato' },
        { status: 404 }
      )
    }

    // Controlla i permessi: solo creatore o Sentinel
    const isOwner = trip.user_id === session.user.id
    const isSentinel = session.user.role === UserRole.Sentinel

    if (!isOwner && !isSentinel) {
      return NextResponse.json(
        { error: 'Non hai i permessi per aggiungere tappe a questo viaggio' },
        { status: 403 }
      )
    }

    const { orderIndex, ...stageData } = parsed.data

    // Se orderIndex non è specificato, calcola il prossimo disponibile
    const finalOrderIndex = orderIndex !== undefined ? orderIndex : await getNextOrderIndex(tripId)

    try {
      // Crea la tappa usando la utility esistente
      const newStage = await createStage(tripId, {
        ...stageData,
        orderIndex: finalOrderIndex,
        media: stageData.media || [],
        gpxFile: stageData.gpxFile || null
      })

      return NextResponse.json({
        message: 'Tappa creata con successo',
        stage: newStage
      }, { status: 201 })

    } catch (error: unknown) {
      console.error('Errore nella creazione della tappa:', error)
      
      // Gestione errori specifici dalle utility
      if (error instanceof Error) {
        if (error.message.includes('orderIndex') && error.message.includes('esiste già')) {
          return NextResponse.json({
            error: 'Indice di ordinamento già utilizzato. Scegli un valore diverso.'
          }, { status: 409 })
        }
        
        if (error.message === 'Viaggio non trovato') {
          return NextResponse.json({
            error: 'Viaggio non trovato'
          }, { status: 404 })
        }
      }

      // Gestione errori Prisma generici
      if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as { code?: string; meta?: { target?: string[] } }
        
        if (prismaError.code === 'P2002') {
          return NextResponse.json({
            error: 'Violazione di vincolo univoco. Verifica i dati inseriti.'
          }, { status: 409 })
        }
        
        if (prismaError.code === 'P2003') {
          return NextResponse.json({
            error: 'Riferimento non valido. Verifica che il viaggio esista.'
          }, { status: 400 })
        }
      }

      return NextResponse.json(
        { error: 'Errore interno server.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Errore nella creazione della tappa:', error)
    return NextResponse.json(
      { error: 'Errore interno server.' },
      { status: 500 }
    )
  }
}