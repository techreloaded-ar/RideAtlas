// src/app/api/upload/gpx/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { parseGpxMetadata, createGpxFileFromMetadata, isValidGpxFile, isValidGpxFileSize, parseGPXContent, extractKeyPoints } from '@/lib/gpx-utils'
import { getStorageProvider } from '@/lib/storage'

// Funzione per l'upload tramite storage provider configurato
async function uploadFileToStorage(file: File, folder: string, userId: string): Promise<{ url: string; publicId: string }> {
  try {
    const storageProvider = getStorageProvider()
    const uploadResult = await storageProvider.uploadFile(file, file.name, {
      access: 'public',
      folder,
      userId,
      addRandomSuffix: false,
    })
    
    console.log(`File GPX caricato: ${uploadResult.url}`)
    
    return {
      url: uploadResult.url,
      publicId: uploadResult.publicId
    }
  } catch (error) {
    console.error('Errore durante l\'upload:', error)
    throw new Error('Errore durante l\'upload del file su cloud storage')
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticazione
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    // Estrai il file dal form data
    const formData = await request.formData()
    const file = formData.get('gpx') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Nessun file GPX fornito' },
        { status: 400 }
      )
    }

    // Verifica dimensione file (max 20MB)
    if (!isValidGpxFileSize(file)) {
      return NextResponse.json(
        { error: 'File troppo grande', maxSize: '20MB' },
        { status: 400 }
      )
    }

    // Verifica tipo file
    if (!isValidGpxFile(file)) {
      return NextResponse.json(
        { 
          error: 'Tipo file non supportato',
          supportedTypes: ['application/gpx+xml', 'application/xml', 'text/xml']
        },
        { status: 400 }
      )
    }
    console.log(`Inizio upload GPX per utente: ${session.user.id}, file: ${file.name}`)

    // Estrai metadati completi
    const metadata = await parseGpxMetadata(file)
    console.log(`Metadati GPX estratti: ${JSON.stringify({
      filename: metadata.filename,
      distance: metadata.distance,
      waypoints: metadata.waypoints,
      elevationGain: metadata.elevationGain
    })}`)

    // Upload del file allo storage
    const uploadResult = await uploadFileToStorage(file, 'gpx', session.user.id)
    console.log(`Upload completato: ${uploadResult.url}`)

    // Parse GPX content per estrarre punti chiave
    const gpxContent = await file.text()
    const gpxParseResult = parseGPXContent(gpxContent, file.name)

    console.log(`GPX parsing result: tracks=${gpxParseResult.tracks.length}, routes=${gpxParseResult.routes.length}`)

    // Estrai punti chiave ogni 30km
    const keyPoints = extractKeyPoints(gpxParseResult.tracks, gpxParseResult.routes, 30)
    console.log(`Punti chiave estratti: ${keyPoints.length} punti`)
    console.log('Key points:', keyPoints)

    // Crea l'oggetto GpxFile completo con punti chiave
    const baseGpxFile = createGpxFileFromMetadata(metadata, uploadResult.url, true)
    const gpxFile = { ...baseGpxFile, keyPoints }

    return NextResponse.json(gpxFile, { status: 200 })

  } catch (error) {
    console.error('Errore durante l\'upload GPX:', error)
    
    // Gestione di errori specifici
    if (error instanceof Error) {
      if (error.message.includes('cloud storage')) {
        return NextResponse.json(
          { error: 'Errore durante il salvataggio del file. Riprova più tardi.' },
          { status: 503 }
        )
      }
      
      if (error.message.includes('GPX')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Errore interno del server durante l\'upload' },
      { status: 500 }
    )
  }
}
