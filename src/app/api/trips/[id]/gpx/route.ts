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

    // Controllo permessi di accesso
    const session = await auth()
    const isOwner = session?.user?.id === trip.user_id
    const isSentinel = session?.user?.role === UserRole.Sentinel
    const isPublished = trip.status === 'Pubblicato'

    // Permetti l'accesso se:
    // - Il viaggio è pubblicato (accesso pubblico)
    // - L'utente è il proprietario del viaggio
    // - L'utente è un Sentinel (admin)
    if (!isPublished && !isOwner && !isSentinel) {
      return NextResponse.json(
        { error: 'Non hai i permessi per scaricare questo file GPX' },
        { status: 403 }
      )
    }

    // Scarica il file GPX originale dall'URL del cloud storage
    let gpxContent: string
    let filename: string

    try {
      console.log(`Recupero del file GPX da Vercel Blob Storage: ${gpxFile.url}`)
      
      // Fetch del file originale dall'URL con timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 secondi timeout per Vercel Blob
      
      const gpxResponse = await fetch(gpxFile.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'RideAtlas/1.0',
          'Cache-Control': 'no-cache', // Forza il fetch fresco per Vercel Blob
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!gpxResponse.ok) {
        console.error(`Errore nel recupero del file GPX da ${gpxFile.url}: ${gpxResponse.status} ${gpxResponse.statusText}`)
        throw new Error(`Impossibile recuperare il file GPX: ${gpxResponse.status} ${gpxResponse.statusText}`)
      }

      // Usa il contenuto originale del file
      gpxContent = await gpxResponse.text()
      
      // Verifica che il contenuto sia un GPX valido
      if (!gpxContent.includes('<gpx') || !gpxContent.includes('</gpx>')) {
        throw new Error('Il file scaricato non è un GPX valido')
      }

      // Usa il filename originale se disponibile, altrimenti genera uno sicuro
      filename = gpxFile.filename || generateSafeFilename(trip.title, trip.id)
      console.log(`File GPX originale recuperato con successo da Vercel Blob: ${filename}`)

    } catch (error) {
      console.error('Errore nel fetch del file GPX da Vercel Blob:', error)
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Timeout nel download del file GPX da Vercel Blob')
        return NextResponse.json(
          { error: 'Timeout durante il download del file GPX. Riprova più tardi.' },
          { status: 504 }
        )
      }
      
      // Ritorna errore invece di fallback
      return NextResponse.json(
        { error: 'File GPX non disponibile o danneggiato' },
        { status: 404 }
      )
    }

    // Log dell'operazione di download
    console.log(`Download GPX completato - Viaggio: ${trip.id}, File: ${filename}, Utente: ${session?.user?.id || 'anonimo'}`)

    // Restituisce il file GPX con headers appropriati
    const response = NextResponse.json({gpxContent} , {
      status: 200
    })
    response.headers.set('Content-Type', 'application/gpx+xml')
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    response.headers.set('Cache-Control', 'public, max-age=3600') // Cache per 1 ora
    response.headers.set('X-Content-Type-Options', 'nosniff') // Sicurezza per evitare sniffing del tipo di contenuto
    return response;

  } catch (error) {
    console.error('Errore durante il download GPX:', error)
    return NextResponse.json(
      { error: 'Errore interno del server durante il download' },
      { status: 500 }
    )
  }
}

/**
 * Genera un nome file sicuro per il download
 */
function generateSafeFilename(tripTitle: string, tripId: string, originalFilename?: string): string {
  if (originalFilename && originalFilename.endsWith('.gpx')) {
    return originalFilename
  }
  
  const safeTitle = tripTitle
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Rimuove caratteri speciali
    .replace(/\s+/g, '-') // Sostituisce spazi con trattini
    .toLowerCase()
  
  return `${safeTitle}-${tripId}.gpx`
}
