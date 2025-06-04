// src/app/api/upload/gpx/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { parseGpxMetadata, createGpxFileFromMetadata, isValidGpxFile, isValidGpxFileSize } from '@/lib/gpx-utils'

// Mock della funzione di upload - in una implementazione reale useremmo cloud storage
async function uploadFileToStorage(file: File, folder: string, userId: string): Promise<{ url: string; publicId: string }> {
  // Per ora simuliamo un upload restituendo un URL fittizio
  // In produzione questo sarebbe sostituito con Cloudinary, AWS S3, etc.
  const filename = `${userId}-${Date.now()}-${file.name}`
  const url = `https://storage.example.com/${folder}/${userId}/${filename}`
  
  return {
    url,
    publicId: `${folder}/${userId}/${filename}`
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


    // Estrai metadati completi
    const metadata = await parseGpxMetadata(file)

    // Upload del file allo storage
    const uploadResult = await uploadFileToStorage(file, 'gpx', session.user.id)

    // Crea l'oggetto GpxFile completo
    const gpxFile = createGpxFileFromMetadata(metadata, uploadResult.url, true)

    return NextResponse.json(gpxFile, { status: 200 })

  } catch (error) {
    console.error('Errore durante l\'upload GPX:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'upload del file' },
      { status: 500 }
    )
  }
}
