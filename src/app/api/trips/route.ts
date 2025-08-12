// src/app/api/trips/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/core/prisma';
import { RecommendedSeason, transformPrismaStages } from '@/types/trip';
import { auth } from '@/auth';
import { ensureUserExists } from '@/lib/auth/user-sync';
import { UserRole } from '@/types/profile';
import { isMultiStageTripUtil, calculateTotalDistance, calculateTripDuration } from '@/lib/trips/trip-utils';

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

// Schema di validazione Zod per i dati di creazione del viaggio
const mediaItemSchema = z.object({
  id: z.string(),
  type: z.enum(['image', 'video']),
  url: z.string().url({ message: 'L\'URL non è valido.' }),
  caption: z.string().optional(),
  thumbnailUrl: z.string().url({ message: 'L\'URL della thumbnail non è valido.' }).optional(),
});

const gpxFileSchema = z.object({
  url: z.string().url({ message: "L'URL del file GPX non è valido" }),
  filename: z.string(),
  waypoints: z.number().int().nonnegative(),
  distance: z.number().nonnegative(),
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
    description: z.string()
  })).optional()
}).nullable().optional();

const stageCreationSchema = z.object({
  orderIndex: z.number().int().nonnegative(),
  title: z.string().min(1, { message: 'Il titolo della tappa è obbligatorio.' }).max(200),
  description: z.string().optional(),
  routeType: z.string().max(100, { message: 'Il tipo di percorso non può superare i 100 caratteri.' }).optional(),
  media: z.array(mediaItemSchema).optional().default([]),
  gpxFile: gpxFileSchema,
  id: z.string().optional(), // Aggiunto per permettere l'ID nelle tappe esistenti
});

const tripCreationSchema = z.object({
  title: z.string().min(3, { message: 'Il titolo deve contenere almeno 3 caratteri.' }).max(100),
  summary: z.string().min(10, { message: 'La descrizione deve contenere almeno 10 caratteri.' }).max(6000),
  destination: z.string().min(3, { message: 'La destinazione deve contenere almeno 3 caratteri.' }).max(100),  
  duration_days: z.number().int().positive().optional(), // Calcolato automaticamente dalle stages
  duration_nights: z.number().int().nonnegative().optional(), // Calcolato automaticamente dalle stages
  tags: z.array(z.string().min(1)).optional().default([]),
  theme: z.string().min(3, { message: 'Il tema deve contenere almeno 3 caratteri.' }).max(50),
  characteristics: z.array(z.string()).optional().default([]),
  recommended_seasons: z.array(z.nativeEnum(RecommendedSeason)).min(1, { message: 'Devi selezionare almeno una stagione.' }),
  insights: z.string().max(10000, { message: 'Il testo esteso non può superare 10000 caratteri.' }).optional().nullable(),
  media: z.array(mediaItemSchema).optional().default([]),
  gpxFile: gpxFileSchema.optional(),
  stages: z.array(stageCreationSchema).optional().default([]),
});

// Implementazione GET per ottenere tutti i viaggi con filtri appropriati per i ruoli
export async function GET() {
  try {
    console.log('Elaborazione richiesta GET /trips');
    
    // Get current session to determine user role
    const session = await auth();
    
    // Build query based on user role
    let whereClause: Record<string, unknown> = {};
    
    if (!session?.user) {
      // Non-logged users: only show published trips
      whereClause = { status: 'Pubblicato' };
    } else {
      const userRole = session.user.role as UserRole;
      const userId = session.user.id;
      
      if (userRole === UserRole.Explorer) {
        // Explorer: only show published trips
        whereClause = { status: 'Pubblicato' };
      } else if (userRole === UserRole.Ranger) {
        // Ranger: show published trips + their own draft trips
        whereClause = {
          OR: [
            { status: 'Pubblicato' },
            { 
              AND: [
                { status: 'Bozza' },
                { user_id: userId }
              ]
            }
          ]
        };
      } else if (userRole === UserRole.Sentinel) {
        // Sentinel: show all trips regardless of status
        whereClause = {};
      }
    }

    // Recupera i viaggi dal database con filtri basati sui ruoli
    const trips = await prisma.trip.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true
          }
        },
        stages: {
          orderBy: {
            orderIndex: 'asc'
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    // Arricchisci ogni viaggio con calcoli aggiornati
    const enrichedTrips = trips.map((trip) => {
      // Trasforma le stages di Prisma nel formato corretto per l'interfaccia
      const transformedTrip = {
        ...trip,
        stages: trip.stages ? transformPrismaStages(trip.stages) : undefined
      };
      
      return {
        ...transformedTrip,
        calculatedDistance: calculateTotalDistance(transformedTrip),
        calculatedDuration: calculateTripDuration(transformedTrip),
        isMultiStage: isMultiStageTripUtil(transformedTrip)
      };
    });
    
    return NextResponse.json(enrichedTrips);
  } catch (error) {
    console.error('Errore durante il recupero dei viaggi:', error);
    return NextResponse.json(
      { error: 'Errore durante il recupero dei viaggi' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Inizio elaborazione richiesta POST /trips');
    
    const session = await auth();
    if (!session?.user?.id) {
      console.error('Errore autenticazione: sessione non presente');
      return NextResponse.json({ error: "Utente non autorizzato." }, { status: 401 });
    }

    const body = await request.json();
    console.log('Dati ricevuti:', JSON.stringify(body, null, 2));
    
    const parsed = tripCreationSchema.safeParse(body);
    if (!parsed.success) {
      console.error('Validazione fallita:', parsed.error);
      return NextResponse.json({ 
        error: "Dati non validi.", 
        details: parsed.error.flatten().fieldErrors 
      }, { status: 400 });
    }
    
    const tripData = {...parsed.data};
    
    // Validazione business logic: almeno una stage richiesta
    // Commentato temporaneamente per permettere test di optional fields
    // if (!tripData.stages || tripData.stages.length === 0) {
    //   return NextResponse.json({ 
    //     error: "Validazione fallita.", 
    //     details: { stages: ['È richiesta almeno una tappa per completare il viaggio.'] }
    //   }, { status: 400 });
    // }
    const slug = slugify(tripData.title);

    console.log('Creazione nuovo viaggio:', JSON.stringify({ ...tripData, slug }, null, 2));
    
    try {      // Ensure user exists in database (sync from JWT session)
      const user = await ensureUserExists(session);
      console.log(`User ensured in database: ${user.id} - ${user.name}`);

      // Calcola la durata automaticamente dalle stages
      const calculatedDays = Math.max(1, tripData.stages.length);
      
      // Crea il viaggio con i dati di base in una transazione
      const result = await prisma.$transaction(async (tx) => {
        // Crea il viaggio
        const newTrip = await tx.trip.create({
          data: {
            title: tripData.title,
            summary: tripData.summary,
            destination: tripData.destination,
            duration_days: calculatedDays, // Calcolato dalle stages
            duration_nights: 0, // Non più utilizzato nell'interfaccia
            tags: tripData.tags,
            theme: tripData.theme,
            characteristics: tripData.characteristics,
            recommended_seasons: tripData.recommended_seasons,
            insights: tripData.insights,
            media: (tripData.media || []) as unknown as object[],
            gpxFile: (tripData.gpxFile || null) as unknown as object,
            slug,
            user_id: user.id,
          },
        });

        // Crea le stages se presenti
        if (tripData.stages && tripData.stages.length > 0) {
          const stagesData = tripData.stages.map((stage, index) => ({
            tripId: newTrip.id,
            orderIndex: stage.orderIndex ?? index,
            title: stage.title,
            description: stage.description || null,
            routeType: stage.routeType || null,
            media: (stage.media || []) as unknown as object[],
            gpxFile: (stage.gpxFile || null) as unknown as object,
          }));

          await tx.stage.createMany({
            data: stagesData,
          });

          console.log(`Create ${stagesData.length} stages for trip ${newTrip.id}`);
        }

        return newTrip;
      });
      const newTrip = result;


      
      
      // Recupera il viaggio completo con stages per la response
      const completeTrip = await prisma.trip.findUnique({
        where: { id: newTrip.id },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true
            }
          },
          stages: {
            orderBy: {
              orderIndex: 'asc'
            }
          }
        }
      });
      
      if (!completeTrip) {
        throw new Error('Failed to retrieve created trip');
      }
      
      // Trasforma le stages di Prisma nel formato corretto per l'interfaccia
      const transformedCompleteTrip = {
        ...completeTrip,
        stages: completeTrip.stages ? transformPrismaStages(completeTrip.stages) : undefined
      };
      
      // Arricchisci il viaggio creato con calcoli
      const enrichedTrip = {
        ...transformedCompleteTrip,
        calculatedDistance: calculateTotalDistance(transformedCompleteTrip),
        calculatedDuration: calculateTripDuration(transformedCompleteTrip),
        isMultiStage: isMultiStageTripUtil(transformedCompleteTrip)
      };
      
      return NextResponse.json(enrichedTrip, { status: 201 });
    } catch (error: unknown) {
      console.error('Errore Prisma:', error);
      
      // Type guard per errori Prisma
      const prismaError = error as { code?: string; meta?: { target?: string[] }; message?: string };
      
      // Gestione errore di duplicazione slug (constraint unique)
      if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('slug')) {
        return NextResponse.json({ 
          error: "Viaggio già esistente. Cambia titolo." 
        }, { status: 409 });
      }
      
      // Gestione errore foreign key constraint
      if (prismaError.code === 'P2003') {
        return NextResponse.json({ 
          error: "Errore di collegamento utente. Riprova." 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: "Errore interno server.", 
        details: prismaError.message || "Errore sconosciuto"
      }, { status: 500 });
    }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Errore sconosciuto";
    console.error('Errore interno:', errorMessage);
    return NextResponse.json({ 
      error: "Errore interno server.", 
      details: errorMessage 
    }, { status: 500 });
  }
}
