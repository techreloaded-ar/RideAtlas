import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getStorageProvider } from '@/lib/storage'
import { prisma } from '@/lib/core/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

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

    // Validazione dimensioni (2MB max per avatar)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File troppo grande. Massimo 2MB per l\'avatar.' },
        { status: 400 }
      )
    }

    // Upload tramite storage provider configurato
    const storageProvider = getStorageProvider()
    
    // Genera nome file unico per avatar
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const filename = `avatar-${session.user.id}-${timestamp}.${fileExtension}`

    const uploadResult = await storageProvider.uploadFile(file, filename, {
      access: 'public',
      folder: 'avatars',
      userId: session.user.id,
      addRandomSuffix: false,
    })

    // Aggiorna il database con il nuovo URL avatar
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: uploadResult.url },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Avatar aggiornato con successo'
    })

  } catch (error) {
    console.error('Errore aggiornamento avatar:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}