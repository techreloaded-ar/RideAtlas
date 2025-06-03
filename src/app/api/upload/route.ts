// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { put } from '@vercel/blob'

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

    // Upload su Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public'
    })

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('Errore upload:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
