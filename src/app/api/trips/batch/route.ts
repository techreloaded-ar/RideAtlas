// src/app/api/trips/batch/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ensureUserExists } from '@/lib/auth/user-sync'
import { UserRole } from '@/types/profile'
import { BatchProcessor } from '@/lib/batch/BatchProcessor'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export async function POST(request: NextRequest) {
  try {
    
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
    
    let zipBuffer: Buffer
    try {
      const arrayBuffer = await zipFile.arrayBuffer()
      zipBuffer = Buffer.from(arrayBuffer)
      
      
      if (zipBuffer.length !== zipFile.size) {
        console.warn(`Buffer size mismatch: expected ${zipFile.size}, got ${zipBuffer.length}`)
      }
    } catch (error) {
      console.error('Error converting file to buffer:', error)
      return NextResponse.json({ 
        error: "Errore durante la conversione del file." 
      }, { status: 400 })
    }

    // 8. Start batch processing job
    
    const processor = new BatchProcessor()
    let jobId: string
    try {
      jobId = await processor.startBatchJob(user.id, zipBuffer)
    } catch (error) {
      console.error('Error starting batch job:', error)
      const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto"
      return NextResponse.json({ 
        error: "Errore durante l'avvio del processamento batch.",
        details: errorMessage 
      }, { status: 500 })
    }

    

    // 9. Return job ID for status tracking
    return NextResponse.json({
      jobId,
      message: "Caricamento batch avviato. Usa l'ID per monitorare il progresso.",
      statusUrl: `/api/trips/batch/status/${jobId}`
    }, { status: 202 }) // 202 Accepted for async processing

  } catch (error: unknown) {
    console.error('Errore durante caricamento batch:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto"
    
    // Handle specific error types with more granular error checking
    if (errorMessage.includes('Struttura ZIP non valida') || errorMessage.includes('ZIP structure')) {
      return NextResponse.json({ 
        error: "Struttura del file ZIP non valida. Verificare che contenga il file viaggi.json.",
        details: errorMessage
      }, { status: 400 })
    }
    
    if (errorMessage.includes('File ZIP troppo grande') || errorMessage.includes('ZIP buffer troppo grande')) {
      return NextResponse.json({ 
        error: "File ZIP troppo grande. Massimo 100MB consentiti." 
      }, { status: 400 })
    }
    
    if (errorMessage.includes('JSON non valido') || errorMessage.includes('viaggi.json')) {
      return NextResponse.json({ 
        error: "Il file viaggi.json contiene errori di formato o non è presente.",
        details: errorMessage 
      }, { status: 400 })
    }
    
    if (errorMessage.includes('Errore caricamento ZIP') || errorMessage.includes('ZIP buffer')) {
      return NextResponse.json({ 
        error: "Errore durante il caricamento del file ZIP. Il file potrebbe essere corrotto.",
        details: errorMessage 
      }, { status: 400 })
    }
    
    if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
      return NextResponse.json({ 
        error: "Timeout durante l'elaborazione del file. Riprovare con un file più piccolo.",
        details: errorMessage 
      }, { status: 408 })
    }
    
    return NextResponse.json({ 
      error: "Errore interno del server durante l'elaborazione del batch.",
      details: process.env.NODE_ENV === 'development' ? errorMessage : 'Errore interno' 
    }, { status: 500 })
  }
}

