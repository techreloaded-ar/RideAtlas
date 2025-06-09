// src/app/api/trips/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { RecommendedSeason } from '@/types/trip';
import { auth } from '@/auth';
import { ensureUserExists } from '@/lib/user-sync';
import { UserRole } from '@/types/profile';

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
  isValid: z.boolean()
}).nullable().optional();

const tripCreationSchema = z.object({
  title: z.string().min(3, { message: 'Il titolo deve contenere almeno 3 caratteri.' }).max(100),
  summary: z.string().min(10, { message: 'Il sommario deve contenere almeno 10 caratteri.' }).max(500),
  destination: z.string().min(3, { message: 'La destinazione deve contenere almeno 3 caratteri.' }).max(100),
  duration_days: z.number().int().positive({ message: 'La durata in giorni deve essere un numero positivo.' }),
  duration_nights: z.number().int().positive({ message: 'La durata in notti deve essere un numero positivo.' }),
  tags: z.array(z.string().min(1)).min(1, { message: 'Devi specificare almeno un tag.' }),    theme: z.string().min(3, { message: 'Il tema deve contenere almeno 3 caratteri.' }).max(50),
  characteristics: z.array(z.string()).optional().default([]),
  recommended_seasons: z.array(z.nativeEnum(RecommendedSeason)).min(1, { message: 'Devi selezionare almeno una stagione.' }),
  insights: z.string().max(10000, { message: 'Il testo esteso non può superare 10000 caratteri.' }).nullable().optional(),
  media: z.array(mediaItemSchema).optional().default([]),
  gpxFile: gpxFileSchema,
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
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    return NextResponse.json(trips);
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
    const slug = slugify(tripData.title);

    console.log('Creazione nuovo viaggio:', JSON.stringify({ ...tripData, slug }, null, 2));
    
    try {      // Ensure user exists in database (sync from JWT session)
      const user = await ensureUserExists(session);
      console.log(`User ensured in database: ${user.id} - ${user.name}`);

      // Crea il viaggio con i dati di base
      const newTrip = await prisma.trip.create({
        data: {
          title: tripData.title,
          summary: tripData.summary,
          destination: tripData.destination,
          duration_days: tripData.duration_days,
          duration_nights: tripData.duration_nights,
          tags: tripData.tags,
          theme: tripData.theme,
          characteristics: tripData.characteristics,
          recommended_seasons: tripData.recommended_seasons,
          insights: tripData.insights,
          slug,
          user_id: user.id,
        },
      });
        // Aggiorna media e gpxFile in una seconda operazione per evitare conflitti
      const updateData: {
        media?: typeof body.media;
        gpxFile?: typeof body.gpxFile;
      } = {};
      
      // Aggiungi media se presenti
      if (body.media && Array.isArray(body.media)) {
        updateData.media = body.media;
      }
      
      // Aggiungi gpxFile solo se non è null
      if (body.gpxFile) {
        updateData.gpxFile = body.gpxFile;
      }
      
      // Esegui update solo se ci sono dati da aggiornare
      if (Object.keys(updateData).length > 0) {
        await prisma.trip.update({
          where: { id: newTrip.id },
          data: updateData
        });
        console.log('Viaggio creato con media:', newTrip.id);
      } else {
        console.log('Viaggio creato senza media:', newTrip.id);
      }

      
      
      return NextResponse.json(newTrip, { status: 201 });
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
