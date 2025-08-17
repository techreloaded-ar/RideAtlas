// src/app/api/trips/batch/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ensureUserExists } from '@/lib/auth/user-sync'
import { UserRole } from '@/types/profile'
import { BatchProcessor } from '@/lib/batch/BatchProcessor'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export async function POST(request: NextRequest) {
  try {
    console.log('Elaborazione richiesta POST /api/trips/batch')
    
    // 1. Authentication check
    const session = await auth()
    if (!session?.user?.id) {
      console.error('Errore autenticazione: sessione non presente')
      return NextResponse.json({ error: "Utente non autorizzato." }, { status: 401 })
    }

    // 2. Role authorization check
    const userRole = session.user.role as UserRole
    if (userRole !== UserRole.Ranger && userRole !== UserRole.Sentinel) {
      console.error(`Ruolo non autorizzato: ${userRole}`)
      return NextResponse.json({ 
        error: "Solo i Ranger e Sentinel possono caricare viaggi in modalità batch." 
      }, { status: 403 })
    }

    // 3. Ensure user exists in database
    const user = await ensureUserExists(session)
    console.log(`User ensured in database: ${user.id} - ${user.name}`)

    // 4. Parse multipart form data
    const formData = await request.formData()
    const zipFile = formData.get('zipFile') as File | null
    
    if (!zipFile) {
      return NextResponse.json({ 
        error: "File ZIP richiesto." 
      }, { status: 400 })
    }

    // 5. Validate file type
    if (!zipFile.name.toLowerCase().endsWith('.zip')) {
      return NextResponse.json({ 
        error: "Solo file ZIP sono supportati." 
      }, { status: 400 })
    }

    // 6. Validate file size
    if (zipFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File troppo grande. Massimo ${MAX_FILE_SIZE / (1024 * 1024)}MB consentiti.` 
      }, { status: 400 })
    }

    // 7. Convert file to buffer
    const zipBuffer = Buffer.from(await zipFile.arrayBuffer())

    // 8. Start batch processing job
    const processor = new BatchProcessor()
    const jobId = await processor.startBatchJob(user.id, zipBuffer)

    console.log(`Batch job avviato: ${jobId} per utente ${user.id}`)

    // 9. Return job ID for status tracking
    return NextResponse.json({
      jobId,
      message: "Caricamento batch avviato. Usa l'ID per monitorare il progresso.",
      statusUrl: `/api/trips/batch/status/${jobId}`
    }, { status: 202 }) // 202 Accepted for async processing

  } catch (error: unknown) {
    console.error('Errore durante caricamento batch:', error)
    
    const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto"
    
    // Handle specific error types
    if (errorMessage.includes('Struttura ZIP non valida')) {
      return NextResponse.json({ 
        error: errorMessage 
      }, { status: 400 })
    }
    
    if (errorMessage.includes('File ZIP troppo grande')) {
      return NextResponse.json({ 
        error: errorMessage 
      }, { status: 400 })
    }
    
    if (errorMessage.includes('JSON non valido')) {
      return NextResponse.json({ 
        error: "Il file viaggi.json contiene errori di formato." 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: "Errore interno del server durante l'elaborazione del batch.",
      details: errorMessage 
    }, { status: 500 })
  }
}

