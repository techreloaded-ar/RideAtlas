// src/app/api/trips/[id]/gpx/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { UserRole } from '@/types/profile'
import { castToGpxFile } from '@/types/trip'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Richiesta download GPX per viaggio: ${params.id}`)
    
    // Verifica che l'ID sia valido
    if (!params.id || typeof params.id !== 'string') {
      return NextResponse.json(
        { error: 'ID viaggio non valido' },
        { status: 400 }
      )
    }

    // Recupera il viaggio dal database
    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        status: true,
        gpxFile: true,
        user_id: true,
        user: {
          select: {
            name: true,
            email: true
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

    // Verifica se esiste un file GPX
    const gpxFile = castToGpxFile(trip.gpxFile)
    if (!gpxFile || !gpxFile.url) {
      return NextResponse.json(
        { error: 'Nessun file GPX disponibile per questo viaggio' },
        { status: 404 }
      )
    }

    // Controllo autenticazione obbligatoria
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Accesso negato. È necessario effettuare il login per scaricare le tracce GPX.' },
        { status: 401 }
      )
    }

    // Controllo permessi di accesso per utenti autenticati
    const isOwner = session.user.id === trip.user_id
    const isSentinel = session.user.role === UserRole.Sentinel
    const isPublished = trip.status === 'Pubblicato'

    // Permetti l'accesso solo se:
    // - Il viaggio è pubblicato E l'utente è autenticato
    // - L'utente è il proprietario del viaggio
    // - L'utente è un Sentinel (admin)
    if (!isPublished && !isOwner && !isSentinel) {
      return NextResponse.json(
        { error: 'Non hai i permessi per scaricare questo file GPX' },
        { status: 403 }
      )
    }

    // Verifica che il file esista sulla CDN prima del redirect
    try {
      const headResponse = await fetch(gpxFile.url, { method: 'HEAD' });
      if (!headResponse.ok) {
        console.error(`File GPX non trovato sulla CDN: ${gpxFile.url} - Status: ${headResponse.status}`);
        return NextResponse.json(
          { error: 'File GPX non disponibile. Il file potrebbe essere stato rimosso.' },
          { status: 404 }
        );
      }
    } catch (error) {
      console.error(`Errore nella verifica del file GPX: ${error}`);
      return NextResponse.json(
        { error: 'Impossibile verificare la disponibilità del file GPX.' },
        { status: 503 }
      );
    }

    // Log dell'operazione di download
    console.log(`Download GPX richiesto - Viaggio: ${trip.id}, Utente: ${session.user.id} (${session.user.email})`)

    // Redirect diretto al file originale sulla CDN
    return NextResponse.redirect(gpxFile.url);

  } catch (error) {
    console.error('Errore durante il download GPX:', error)
    return NextResponse.json(
      { error: 'Errore interno del server durante il download' },
      { status: 500 }
    )
  }
}


