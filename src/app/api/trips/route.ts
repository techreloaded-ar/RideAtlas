// src/app/api/trips/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { TripCreationData, RecommendedSeason } from '@/types/trip';
import { auth } from '@/auth';
import { ensureUserExists } from '@/lib/user-sync';

// Funzione di utilità per generare lo slug
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Sostituisci gli spazi con -
    .replace(/[^\w-]+/g, '') // Rimuovi i caratteri non validi
    .replace(/--+/g, '-'); // Sostituisci multipli - con uno singolo
}

// Schema di validazione Zod per i dati di creazione del viaggio
const tripCreationSchema = z.object({
  title: z.string().min(3, { message: 'Il titolo deve contenere almeno 3 caratteri.' }).max(100),
  summary: z.string().min(10, { message: 'Il sommario deve contenere almeno 10 caratteri.' }).max(500),
  destination: z.string().min(3, { message: 'La destinazione deve contenere almeno 3 caratteri.' }).max(100),
  duration_days: z.number().int().positive({ message: 'La durata in giorni deve essere un numero positivo.' }),
  duration_nights: z.number().int().positive({ message: 'La durata in notti deve essere un numero positivo.' }),
  tags: z.array(z.string().min(1)).min(1, { message: 'Devi specificare almeno un tag.' }),
  theme: z.string().min(3, { message: 'Il tema deve contenere almeno 3 caratteri.' }).max(50),
  recommended_season: z.nativeEnum(RecommendedSeason),
});

export async function POST(request: NextRequest) {
  try {
    console.log('Inizio elaborazione richiesta POST /trips');
    
    const session = await auth();
    if (!session?.user?.id) {
      console.error('Errore autenticazione: sessione non presente');
      return NextResponse.json({ error: "Utente non autorizzato." }, { status: 401 });
    }

    const userId = session.user.id;

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

    const tripData: TripCreationData = parsed.data;
    const slug = slugify(tripData.title);

    console.log('Creazione nuovo viaggio:', JSON.stringify({ ...tripData, slug }, null, 2));
    
    try {
      // Ensure user exists in database (sync from JWT session)
      const user = await ensureUserExists(session);
      console.log(`User ensured in database: ${user.id} - ${user.name}`);

      const newTrip = await prisma.trip.create({
        data: {
          ...tripData,
          slug,
          user_id: user.id,
        },
      });

      console.log('Viaggio creato con successo:', newTrip.id);
      return NextResponse.json(newTrip, { status: 201 });
    } catch (error: any) {
      console.error('Errore Prisma:', error);
      
      // Gestione errore di duplicazione slug (constraint unique)
      if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
        return NextResponse.json({ 
          error: "Viaggio già esistente. Cambia titolo." 
        }, { status: 409 });
      }
      
      // Gestione errore foreign key constraint
      if (error.code === 'P2003') {
        return NextResponse.json({ 
          error: "Errore di collegamento utente. Riprova." 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: "Errore creazione viaggio.", 
        details: error.message 
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