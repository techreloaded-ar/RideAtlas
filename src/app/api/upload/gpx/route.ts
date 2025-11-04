// src/app/api/upload/gpx/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { parseGpxMetadata, createGpxFileFromMetadata, isValidGpxFile, isValidGpxFileSize, parseGPXContent, extractKeyPoints } from '@/lib/gpx/gpx-utils'
import { getStorageProvider } from '@/lib/storage'

// Funzione per l'upload tramite storage provider configurato (legacy)
async function uploadFileToStorage(file: File, folder: string, userId: string): Promise<{ url: string; publicId: string }> {
  try {
    const storageProvider = getStorageProvider()
    const uploadResult = await storageProvider.uploadFile(file, file.name, {
      access: 'public',
      folder,
      userId,
      addRandomSuffix: false,
    })
    
    
    
    return {
      url: uploadResult.url,
      publicId: uploadResult.publicId
    }
  } catch (error) {
    console.error('Errore durante l\'upload:', error)
    throw new Error('Errore durante l\'upload del file su cloud storage')
  }
}

// Funzione per l'upload con tripId (nuova struttura directory-based)
async function uploadFileToStorageWithTripId(file: File, tripId: string): Promise<{ url: string; publicId: string }> {
  try {
    const storageProvider = getStorageProvider()
    const uploadResult = await storageProvider.uploadFile(file, `gpx/${file.name}`, {
      access: 'public',
      tripId,
      addRandomSuffix: false,
    })
    
    
    
    return {
      url: uploadResult.url,
      publicId: uploadResult.publicId
    }
  } catch (error) {
    console.error('Errore durante l\'upload:', error)
    throw new Error('Errore durante l\'upload del file su cloud storage')
  }
}

// Funzione per l'upload con nuova struttura organizzata (tripId + tripName + stage opzionale)
async function uploadFileToStorageWithTripStructure(
  file: File, 
  tripId: string, 
  tripName: string, 
  stageIndex?: string, 
  stageName?: string
): Promise<{ url: string; publicId: string }> {
  try {
    const storageProvider = getStorageProvider()
    const uploadOptions: {
      access: 'public';
      tripId: string;
      tripName: string;
      addRandomSuffix: boolean;
      stageIndex?: string;
      stageName?: string;
    } = {
      access: 'public',
      tripId,
      tripName,
      addRandomSuffix: false,
    }
    
    // Se sono specificati stageIndex e stageName, è un file stage-level
    if (stageIndex !== undefined && stageName) {
      uploadOptions.stageIndex = stageIndex
      uploadOptions.stageName = stageName
    }
    
    const uploadResult = await storageProvider.uploadFile(file, file.name, uploadOptions)
    
    
    
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

    // Estrai il file e parametri opzionali dal form data
    const formData = await request.formData()
    const file = formData.get('gpx') as File
    const tripId = formData.get('tripId') as string | null
    const tripName = formData.get('tripName') as string | null
    const stageIndex = formData.get('stageIndex') as string | null
    const stageName = formData.get('stageName') as string | null

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
    

    // Estrai metadati completi
    const metadata = await parseGpxMetadata(file)

    // Upload del file allo storage con nuova struttura organizzata
    let uploadResult;
    if (tripId && tripName) {
      // Usa la nuova struttura organizzata
      uploadResult = await uploadFileToStorageWithTripStructure(file, tripId, tripName, stageIndex || undefined, stageName || undefined)
    } else if (tripId) {
      // Fallback per compatibilità (vecchia struttura con solo tripId)  
      uploadResult = await uploadFileToStorageWithTripId(file, tripId)
    } else {
      // Legacy per upload standalone
      uploadResult = await uploadFileToStorage(file, 'gpx', session.user.id)
    }
    

    // Parse GPX content per estrarre punti chiave
    const gpxContent = await file.text()
    const gpxParseResult = parseGPXContent(gpxContent, file.name)

    

    // Estrai punti chiave ogni 30km
    const keyPoints = extractKeyPoints(gpxParseResult.tracks, gpxParseResult.routes, 30)
    
    

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
