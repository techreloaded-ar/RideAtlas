// src/app/api/trips/[id]/gpx/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { auth } from '@/auth'
import { UserRole } from '@/types/profile'
import { castToGpxFile } from '@/types/trip'
import { PurchaseService } from '@/lib/payment/purchaseService'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    // Verifica che l'ID sia valido
    if (!(await params).id || typeof (await params).id !== 'string') {
      return NextResponse.json(
        { error: 'ID viaggio non valido' },
        { status: 400 }
      )
    }

    // Recupera il viaggio dal database
    const trip = await prisma.trip.findUnique({
      where: { id: (await params).id },
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

    // Controllo permessi usando il nuovo sistema di acquisti
    const canAccess = await PurchaseService.canAccessPremiumContent(
      session.user.id,
      trip.id
    );

    const isSentinel = session.user.role === UserRole.Sentinel;
    const isPublished = trip.status === 'Pubblicato';

    // Permetti l'accesso solo se:
    // - L'utente può accedere al contenuto premium (proprietario o ha acquistato)
    // - L'utente è un Sentinel (admin)
    // - Il viaggio deve essere pubblicato (tranne per proprietari e admin)
    if (!canAccess && !isSentinel) {
      return NextResponse.json(
        { error: 'È necessario acquistare questo viaggio per scaricare il file GPX' },
        { status: 403 }
      )
    }

    if (!isPublished && !canAccess && !isSentinel) {
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


