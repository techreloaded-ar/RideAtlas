import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/core/prisma';
import { UserRole } from '@/types/profile';
import { TripReorderRequest, TripReorderResponse } from '@/types/api/trips';

// Schema di validazione per la richiesta di riordinamento
const reorderRequestSchema = z.object({
  tripIds: z.array(z.string().cuid()).min(1, 'Almeno un ID viaggio è richiesto')
});

// Re-export dei tipi per compatibilità con import esistenti
export type { TripReorderRequest, TripReorderResponse };

export async function PATCH(request: NextRequest) {
  try {
    
    // Verifica autenticazione
    const session = await auth();
    if (!session?.user?.id) {
      console.error('Errore autenticazione: sessione non presente');
      return NextResponse.json({ 
        success: false,
        error: "Utente non autorizzato." 
      }, { status: 401 });
    }

    // Verifica ruolo Sentinel
    if (session.user.role !== UserRole.Sentinel) {
      console.error(`Errore autorizzazione: ruolo ${session.user.role} non autorizzato`);
      return NextResponse.json({ 
        success: false,
        error: "Permessi insufficienti. Solo i Sentinel possono riordinare i viaggi." 
      }, { status: 403 });
    }

    // Parsing e validazione del body
    const body = await request.json();
    
    const parsed = reorderRequestSchema.safeParse(body);
    if (!parsed.success) {
      console.error('Validazione fallita:', parsed.error);
      return NextResponse.json({ 
        success: false,
        error: "Dati non validi.", 
        details: parsed.error.flatten().fieldErrors 
      }, { status: 400 });
    }
    
    const { tripIds } = parsed.data;

    // Verifica che non ci siano ID duplicati (prima di qualsiasi operazione DB)
    const uniqueIds = new Set(tripIds);
    if (uniqueIds.size !== tripIds.length) {
      console.error('ID duplicati trovati nella richiesta');
      return NextResponse.json({
        success: false,
        error: "ID viaggi duplicati non sono permessi."
      }, { status: 400 });
    }

    // Verifica che tutti gli ID richiesti esistano nel database
    const existingTrips = await prisma.trip.findMany({
      where: {
        id: {
          in: tripIds
        }
      },
      select: {
        id: true,
        title: true
      }
    });

    const existingIds = existingTrips.map(trip => trip.id);
    const missingIds = tripIds.filter(id => !existingIds.includes(id));
    if (missingIds.length > 0) {
      console.error('ID viaggi non trovati:', missingIds);
      return NextResponse.json({
        success: false,
        error: "Alcuni viaggi non sono stati trovati.",
        details: { missingIds }
      }, { status: 400 });
    }

    // Aggiornamento atomico degli orderIndex in transazione
    const result = await prisma.$transaction(async (tx) => {
      const updatePromises = tripIds.map((tripId, index) =>
        tx.trip.update({
          where: { id: tripId },
          data: { orderIndex: index },
          select: { id: true, title: true }
        })
      );

      const updatedTrips = await Promise.all(updatePromises);
      return updatedTrips;
    });

    return NextResponse.json({
      success: true,
      message: `Ordinamento aggiornato con successo per ${result.length} viaggi.`,
      updatedCount: result.length
    });

  } catch (error: unknown) {
    console.error('Errore durante il riordinamento viaggi:', error);
    
    // Type guard per errori Prisma
    const prismaError = error as { code?: string; meta?: unknown; message?: string };
    
    // Gestione errori specifici di Prisma
    if (prismaError.code === 'P2002') {
      return NextResponse.json({ 
        success: false,
        error: "Conflitto di dati durante l'aggiornamento." 
      }, { status: 409 });
    }
    
    if (prismaError.code === 'P2025') {
      return NextResponse.json({ 
        success: false,
        error: "Uno o più viaggi non sono stati trovati." 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: false,
      error: "Errore interno del server.", 
      details: prismaError.message || "Errore sconosciuto"
    }, { status: 500 });
  }
}