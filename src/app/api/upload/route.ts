// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getStorageProvider } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const tripId = formData.get('tripId') as string | null
    const tripName = formData.get('tripName') as string | null
    const stageIndex = formData.get('stageIndex') as string | null
    const stageName = formData.get('stageName') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'Nessun file fornito' },
        { status: 400 }
      )
    }

    // Validazione tipo file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo di file non supportato. Usa JPEG, PNG o WebP.' },
        { status: 400 }
      )
    }

    // Validazione dimensioni (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File troppo grande. Massimo 5MB.' },
        { status: 400 }
      )
    }

    // Upload tramite storage provider configurato
    const storageProvider = getStorageProvider()
    
    // Prepara le opzioni per il nuovo sistema di storage organizzato
    const uploadOptions: {
      access: 'public';
      tripId?: string;
      tripName?: string;
      stageIndex?: string;
      stageName?: string;
    } = {
      access: 'public' as const,
    }
    
    // Se abbiamo tripId e tripName, usa la nuova struttura organizzata
    if (tripId && tripName) {
      uploadOptions.tripId = tripId
      uploadOptions.tripName = tripName
      
      // Se abbiamo anche stage info, è un file stage-level
      if (stageIndex && stageName) {
        uploadOptions.stageIndex = stageIndex // Ora è già una stringa
        uploadOptions.stageName = stageName
      }
    } else if (tripId) {
      // Fallback per compatibilità con vecchia struttura (solo tripId)
      uploadOptions.tripId = tripId
    }
    
    const uploadResult = await storageProvider.uploadFile(file, file.name, uploadOptions)

    return NextResponse.json({
      url: uploadResult.url,
      filename: uploadResult.fileName,
      size: uploadResult.size,
      type: uploadResult.type
    })

  } catch (error) {
    console.error('Errore upload:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
