// src/app/api/trips/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { supabase, createSupabaseClientForServer } from '@/lib/supabase'; // Assumendo che il client Supabase sia configurato qui
import { Trip, TripCreationData } from '@/types/trip';
import { auth } from '@clerk/nextjs/server'; // Per ottenere l'ID dell'utente

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
  recommended_season: z.enum(['Primavera', 'Estate', 'Autunno', 'Inverno', 'Tutte']),
});

export async function POST(request: NextRequest) {
  try {
    console.log('Inizio elaborazione richiesta POST /trips');
    
    const { userId, getToken } = auth();
    if (!userId) {
      console.error('Errore autenticazione: userId non presente');
      return NextResponse.json({ error: "Utente non autorizzato." }, { status: 401 });
    }

    const token = await getToken({ template: "supabase" });
    if (!token) {
      console.error('Errore autenticazione: token Supabase non disponibile');
      return NextResponse.json({ error: "Token di sessione Supabase non disponibile." }, { status: 401 });
    }

    const supabaseClient = createSupabaseClientForServer(token);
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
    const now = new Date().toISOString();

    const newTrip: Omit<Trip, "id"> = {
      ...tripData,
      slug,
      status: "Bozza",
      created_at: now,
      updated_at: now,
      user_id: userId,
    };

    console.log('Creazione nuovo viaggio:', JSON.stringify(newTrip, null, 2));
    
    const { data, error } = await supabaseClient
      .from("trips")
      .insert([newTrip])
      .select()
      .single();

    if (error) {
      console.error('Errore Supabase:', error);
      if (error.code === "23505") {
        return NextResponse.json({ 
          error: "Viaggio già esistente. Cambia titolo." 
        }, { status: 409 });
      }
      return NextResponse.json({ 
        error: "Errore creazione viaggio.", 
        details: error.message 
      }, { status: 500 });
    }

    console.log('Viaggio creato con successo:', data.id);
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Errore sconosciuto";
    console.error('Errore interno:', errorMessage);
    return NextResponse.json({ 
      error: "Errore interno server.", 
      details: errorMessage 
    }, { status: 500 });
  }
}