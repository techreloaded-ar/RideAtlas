import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/core/prisma'
import { auth } from '@/auth'
import { UserRole } from '@/types/profile'
import { updateStage, deleteStage } from '@/lib/stages/stage-utils'

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

// Schema di validazione per l'aggiornamento di una tappa
const stageUpdateSchema = z.object({
  title: z.string().min(3, { message: 'Il titolo deve contenere almeno 3 caratteri.' }).max(100).optional(),
  description: z.string().max(2000, { message: 'La descrizione non può superare i 2000 caratteri.' }).optional(),
  routeType: z.string().max(100, { message: 'Il tipo di percorso non può superare i 100 caratteri.' }).optional(),
  media: z.array(mediaItemSchema).optional(),
  gpxFile: gpxFileSchema,
  orderIndex: z.number().int().nonnegative({ message: 'L\'indice di ordinamento deve essere un numero non negativo.' }).optional()
})

// Tipi locali per la risposta di checkStagePermissions
interface StageData {
  id: string
  tripId: string
  orderIndex: number
  title: string
  description: string | null
  routeType: string | null
  media: unknown
  gpxFile: unknown
  createdAt: Date
  updatedAt: Date
}

interface TripData {
  user_id: string
  stages: StageData[]
}

/**
 * Verifica i permessi dell'utente per operazioni su una tappa
 */
async function checkStagePermissions(
  tripId: string, 
  stageId: string, 
  userId: string, 
  userRole: UserRole
): Promise<{ success: true; trip: TripData; stage: StageData } | { success: false; status: number; error: string }> {
  // Verifica che il viaggio e la tappa esistano
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      user: {
        select: { id: true, role: true }
      },
      stages: {
        where: { id: stageId },
        take: 1
      }
    }
  })

  if (!trip) {
    return { success: false, status: 404, error: 'Viaggio non trovato' }
  }

  if (trip.stages.length === 0) {
    return { success: false, status: 404, error: 'Tappa non trovata' }
  }

  const stage = trip.stages[0]

  // Controlla i permessi: solo creatore o Sentinel
  const isOwner = trip.user_id === userId
  const isSentinel = userRole === UserRole.Sentinel

  if (!isOwner && !isSentinel) {
    return { success: false, status: 403, error: 'Non hai i permessi per accedere a questa tappa' }
  }

  return { success: true, trip, stage }
}

// GET - Ottieni dettaglio di una singola tappa
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const { id: tripId, stageId } = await params

    // Verifica permessi e esistenza
    const permissionCheck = await checkStagePermissions(
      tripId, 
      stageId, 
      session.user.id, 
      session.user.role as UserRole
    )

    if (!permissionCheck.success) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { stage } = permissionCheck

    // Converte e restituisce la tappa con tipi corretti
    return NextResponse.json({
      id: stage.id,
      tripId: stage.tripId,
      orderIndex: stage.orderIndex,
      title: stage.title,
      description: stage.description || undefined,
      routeType: stage.routeType || undefined,
      media: stage.media,
      gpxFile: stage.gpxFile,
      createdAt: stage.createdAt,
      updatedAt: stage.updatedAt
    })

  } catch (error) {
    console.error('Errore nel caricamento della tappa:', error)
    return NextResponse.json(
      { error: 'Errore interno server.' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna una tappa esistente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const { id: tripId, stageId } = await params
    const body = await request.json()

    // Validazione dei dati
    const parsed = stageUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({
        error: 'Dati non validi',
        details: parsed.error.flatten().fieldErrors
      }, { status: 400 })
    }

    // Verifica permessi e esistenza
    const permissionCheck = await checkStagePermissions(
      tripId, 
      stageId, 
      session.user.id, 
      session.user.role as UserRole
    )

    if (!permissionCheck.success) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    try {
      // Aggiorna la tappa usando la utility esistente
      const updatedStage = await updateStage(stageId, parsed.data)

      return NextResponse.json({
        message: 'Tappa aggiornata con successo',
        stage: updatedStage
      })

    } catch (error: unknown) {
      console.error('Errore nell\'aggiornamento della tappa:', error)
      
      // Gestione errori specifici dalle utility
      if (error instanceof Error) {
        if (error.message.includes('orderIndex') && error.message.includes('esiste già')) {
          return NextResponse.json({
            error: 'Indice di ordinamento già utilizzato. Scegli un valore diverso.'
          }, { status: 409 })
        }
        
        if (error.message === 'Tappa non trovata') {
          return NextResponse.json({
            error: 'Tappa non trovata'
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
      }

      return NextResponse.json(
        { error: 'Errore interno server.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Errore nell\'aggiornamento della tappa:', error)
    return NextResponse.json(
      { error: 'Errore interno server.' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina una tappa
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const { id: tripId, stageId } = await params

    // Verifica permessi e esistenza
    const permissionCheck = await checkStagePermissions(
      tripId, 
      stageId, 
      session.user.id, 
      session.user.role as UserRole
    )

    if (!permissionCheck.success) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    try {
      // Elimina la tappa usando la utility esistente
      // La utility si occupa anche di ricompattare gli orderIndex
      await deleteStage(stageId)

      return NextResponse.json({
        message: 'Tappa eliminata con successo'
      })

    } catch (error: unknown) {
      console.error('Errore nell\'eliminazione della tappa:', error)
      
      // Gestione errori specifici dalle utility
      if (error instanceof Error) {
        if (error.message === 'Tappa non trovata') {
          return NextResponse.json({
            error: 'Tappa non trovata'
          }, { status: 404 })
        }
      }

      return NextResponse.json(
        { error: 'Errore interno server.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Errore nell\'eliminazione della tappa:', error)
    return NextResponse.json(
      { error: 'Errore interno server.' },
      { status: 500 }
    )
  }
}