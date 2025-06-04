// src/app/api/upload/gpx/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { parseGpxMetadata, createGpxFileFromMetadata, isValidGpxFile, isValidGpxFileSize } from '@/lib/gpx-utils'
import { put } from '@vercel/blob'

// Funzione per l'upload su Vercel Blob Storage
async function uploadFileToStorage(file: File, folder: string, userId: string): Promise<{ url: string; publicId: string }> {
  try {
    // Genera un nome file unico
    const timestamp = Date.now()
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${userId}-${timestamp}-${sanitizedFilename}`
    const pathname = `${folder}/${userId}/${filename}`
    
    // Upload su Vercel Blob Storage
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: false,
    })
    
    console.log(`File GPX caricato su Vercel Blob: ${blob.url}`)
    
    return {
      url: blob.url,
      publicId: pathname
    }
  } catch (error) {
    console.error('Errore durante l\'upload su Vercel Blob:', error)
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

    // Crea l'oggetto GpxFile completo
    const gpxFile = createGpxFileFromMetadata(metadata, uploadResult.url, true)

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
