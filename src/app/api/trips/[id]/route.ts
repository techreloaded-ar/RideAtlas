import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { UserRole } from '@/types/profile'
import { RecommendedSeason } from '@/types/trip'
import { prepareJsonFieldsUpdate, isMultiStageTripUtil, calculateTotalDistance, calculateTripDuration } from '@/lib/trip-utils'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Schema di validazione per i media item
const mediaItemSchema = z.object({
  id: z.string(),
  type: z.enum(['image', 'video']),
  url: z.string().url({ message: 'L\'URL non è valido.' }),
  caption: z.string().optional(),
  thumbnailUrl: z.string().url({ message: 'L\'URL della thumbnail non è valido.' }).optional(),
})

const gpxFileSchema = z.object({
  url: z.string(), // Allow any string for URL in tests
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
});

// Schema di validazione per l'aggiornamento del viaggio
const tripUpdateSchema = z.object({
  title: z.string().min(3, { message: 'Il titolo deve contenere almeno 3 caratteri.' }).max(100).optional(),
  summary: z.string().min(10, { message: 'Il sommario deve contenere almeno 10 caratteri.' }).max(500).optional(),
  destination: z.string().min(3, { message: 'La destinazione deve contenere almeno 3 caratteri.' }).max(100).optional(),  
  duration_days: z.number().int().positive({ message: 'La durata in giorni deve essere un numero positivo.' }).optional(),
  duration_nights: z.number().int().nonnegative({ message: 'La durata in notti deve essere un numero non negativo.' }).optional(),
  tags: z.array(z.string().min(1)).optional().default([]),
  theme: z.string().min(3, { message: 'Il tema deve contenere almeno 3 caratteri.' }).max(50).optional(),
  characteristics: z.array(z.string()).optional(),
  recommended_seasons: z.array(z.nativeEnum(RecommendedSeason)).min(1, { message: 'Devi selezionare almeno una stagione.' }).optional(),
  insights: z.string().max(10000, { message: 'Il testo esteso non può superare 10000 caratteri.' }).optional(),
  media: z.array(mediaItemSchema).optional(),
  gpxFile: gpxFileSchema.nullable().optional(),
})

// Funzione di utilità per generare lo slug
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')             // Normalize diacritics
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s+/g, '-')        // Sostituisci gli spazi con -
    .replace(/[^\w-]+/g, '-')    // Sostituisci caratteri non-word con -
    .replace(/-+/g, '-')         // Sostituisci multipli - con uno singolo
    .replace(/^-+/, '')          // Rimuovi - iniziali
    .replace(/-+$/, '');         // Rimuovi - finali
}

// GET - Ottieni un singolo viaggio per modifica
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

    // Trova il viaggio con informazioni dell'utente e stages
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        stages: {
          orderBy: {
            orderIndex: 'asc'
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
        { error: 'Non hai i permessi per visualizzare questo viaggio' },
        { status: 403 }
      )
    }

    // Arricchisci i dati del viaggio con calcoli aggiornati
    const enrichedTrip = {
      ...trip,
      // Calcoli aggiornati per supportare multi-stage
      calculatedDistance: calculateTotalDistance(trip),
      calculatedDuration: calculateTripDuration(trip),
      isMultiStage: isMultiStageTripUtil(trip)
    };

    return NextResponse.json(enrichedTrip)

  } catch (error) {
    console.error('Errore nel caricamento del viaggio:', error)
    return NextResponse.json(
      { error: 'Errore interno server.' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna un viaggio
export async function PUT(
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
    const parsed = tripUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({
        error: 'Dati non validi',
        details: parsed.error.flatten().fieldErrors
      }, { status: 400 })
    }
  

    // Trova il viaggio esistente
    const existingTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        title: true,
        user_id: true,
        status: true,
        slug: true
      }
    })

    if (!existingTrip) {
      return NextResponse.json(
        { error: 'Viaggio non trovato' },
        { status: 404 }
      )
    }

    // Controlla i permessi: solo creatore o Sentinel
    const isOwner = existingTrip.user_id === session.user.id
    const isSentinel = session.user.role === UserRole.Sentinel

    if (!isOwner && !isSentinel) {
      return NextResponse.json(
        { error: 'Non hai i permessi per modificare questo viaggio' },
        { status: 403 }
      )
    }

    const { gpxFile, media, ...updateData } = parsed.data

    // Se il titolo è cambiato, aggiorna anche lo slug
    let newSlug = existingTrip.slug
    if (updateData.title && updateData.title !== existingTrip.title) {
      newSlug = slugify(updateData.title)
      
      // Verifica che il nuovo slug non esista già
      const existingWithSlug = await prisma.trip.findUnique({
        where: { slug: newSlug },
        select: { id: true }
      })
      
      if (existingWithSlug && existingWithSlug.id !== tripId) {
        return NextResponse.json({
          error: 'Un viaggio con questo titolo esiste già. Scegli un titolo diverso.'
        }, { status: 409 })
      }
    }    // TODO: Salva i dati originali per l'audit log quando implementeremo la tabella trip_changes
    // const originalData = await prisma.trip.findUnique({
    //   where: { id: tripId }
    // })    // Prepara i dati per l'aggiornamento di base
    const baseUpdateData = {
      ...updateData,
      ...(newSlug !== existingTrip.slug && { slug: newSlug }),
      updated_at: new Date()
    }

    // Aggiungi i campi JSON usando logica condivisa
    const jsonFieldsUpdate = prepareJsonFieldsUpdate({ media, gpxFile });
    const updatePayload: Record<string, unknown> = { ...baseUpdateData, ...jsonFieldsUpdate };

    // Aggiorna il viaggio con tutti i dati in un'unica chiamata
    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: updatePayload,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        stages: {
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    });

    // TODO: Implementare audit log qui
    // await createTripAuditLog(tripId, session.user.id, originalData, updatedTrip)

    // Arricchisci i dati del viaggio aggiornato con calcoli
    const enrichedTrip = {
      ...updatedTrip,
      calculatedDistance: calculateTotalDistance(updatedTrip),
      calculatedDuration: calculateTripDuration(updatedTrip),
      isMultiStage: isMultiStageTripUtil(updatedTrip)
    };

    return NextResponse.json({
      message: 'Viaggio aggiornato con successo',
      trip: enrichedTrip
    })

  } catch (error) {
    console.error('Errore nell\'aggiornamento del viaggio:', error)
    
    // Gestione errori specifici di Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code?: string; meta?: { target?: string[] } }
      
      if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('slug')) {
        return NextResponse.json({
          error: 'Un viaggio con questo titolo esiste già. Scegli un titolo diverso.'
        }, { status: 409 })
      }
    }

    return NextResponse.json(
      { error: 'Errore interno server.' },
      { status: 500 }
    )
  }
}
