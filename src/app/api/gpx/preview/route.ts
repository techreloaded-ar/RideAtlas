// src/app/api/gpx/preview/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Forza la renderizzazione dinamica per questo endpoint
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const blobUrl = searchParams.get('url')
    
    if (!blobUrl) {
      return NextResponse.json(
        { error: 'URL del file GPX richiesto' },
        { status: 400 }
      )
    }
    
    // Verifica che l'URL sia formalmente valido
    try {
      new URL(blobUrl) // Validazione formale dell'URL
    } catch {
      return NextResponse.json(
        { error: 'URL malformato' },
        { status: 400 }
      )
    }
    
    // Scarica il file GPX direttamente con fetch
    let gpxContent: string
    try {
      // Fetch del file originale dall'URL con timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 secondi timeout
      
      const gpxResponse = await fetch(blobUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'RideAtlas/1.0',
          'Cache-Control': 'no-cache',
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!gpxResponse.ok) {
        console.error(`Errore nel recupero del file GPX: ${gpxResponse.status} ${gpxResponse.statusText}`)
        throw new Error(`Impossibile recuperare il file GPX: ${gpxResponse.status}`)
      }

      gpxContent = await gpxResponse.text()
      
    } catch (error) {
      console.error('Errore nel fetch del file GPX:', error)
      
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Timeout nel download del file' },
          { status: 504 }
        )
      }
      
      return NextResponse.json(
        { error: 'File GPX non disponibile' },
        { status: 404 }
      )
    }
    
    if (!gpxContent) {
      return NextResponse.json(
        { error: 'File GPX non trovato' },
        { status: 404 }
      )
    }
    
    // Validazione base del contenuto GPX
    if (!gpxContent.includes('<gpx') || !gpxContent.includes('</gpx>')) {
      return NextResponse.json(
        { error: 'Contenuto GPX non valido' },
        { status: 422 }
      )
    }
    
    // Restituisci il contenuto GPX come testo
    return new NextResponse(gpxContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/gpx+xml',
        'Cache-Control': 'public, max-age=3600', // Cache 1 ora
      },
    })
    
  } catch (error) {
    console.error('Errore nel recupero GPX per preview:', error)
    
    // Gestione errori specifici
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Timeout nel download del file' },
          { status: 504 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
