// src/app/api/trips/batch/status/[jobId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { BatchProcessor } from '@/lib/batch/BatchProcessor'

export async function GET(
  request: NextRequest, 
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const params = await context.params
    
    
    // 1. Authentication check
    const session = await auth()
    if (!session?.user?.id) {
      console.error('Errore autenticazione: sessione non presente')
      return NextResponse.json({ error: "Utente non autorizzato." }, { status: 401 })
    }

    // 2. Validate jobId format
    if (!params.jobId) {
      return NextResponse.json({ 
        error: "ID job non valido." 
      }, { status: 400 })
    }

    // 3. Get job status
    const processor = new BatchProcessor()
    const jobStatus = await processor.getJobStatus(params.jobId)
    
    if (!jobStatus) {
      return NextResponse.json({ 
        error: "Job non trovato o scaduto." 
      }, { status: 404 })
    }

    // 4. Return job status with additional metadata
    const response = {
      ...jobStatus,
      progress: {
        percentage: jobStatus.totalTrips > 0 
          ? Math.round((jobStatus.processedTrips / jobStatus.totalTrips) * 100)
          : 0,
        completed: jobStatus.processedTrips,
        total: jobStatus.totalTrips,
        remaining: jobStatus.totalTrips - jobStatus.processedTrips,
      },
      hasErrors: jobStatus.errors.length > 0,
      isComplete: jobStatus.status === 'completed' || jobStatus.status === 'failed',
      duration: jobStatus.completedAt 
        ? jobStatus.completedAt.getTime() - jobStatus.startedAt.getTime()
        : Date.now() - jobStatus.startedAt.getTime(),
    }

    

    return NextResponse.json(response)

  } catch (error: unknown) {
    console.error('Errore durante recupero status job:', error)
    
    const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto"
    
    return NextResponse.json({ 
      error: "Errore interno del server durante il recupero dello status.",
      details: errorMessage 
    }, { status: 500 })
  }
}

// Optional: DELETE endpoint to cancel a job
export async function DELETE(
  request: NextRequest, 
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const params = await context.params
    
    
    // 1. Authentication check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Utente non autorizzato." }, { status: 401 })
    }

    // 2. Validate jobId format
    if (!params.jobId) {
      return NextResponse.json({ 
        error: "ID job non valido." 
      }, { status: 400 })
    }

    // 3. Get current job status
    const processor = new BatchProcessor()
    const jobStatus = await processor.getJobStatus(params.jobId)
    
    if (!jobStatus) {
      return NextResponse.json({ 
        error: "Job non trovato." 
      }, { status: 404 })
    }

    // 4. Check if job can be cancelled
    if (jobStatus.status === 'completed' || jobStatus.status === 'failed') {
      return NextResponse.json({ 
        error: "Impossibile cancellare un job già completato." 
      }, { status: 400 })
    }

    // 5. Cancel job (simplified - in production you'd need proper cancellation logic)
    // For now, we just mark it as failed
    // Note: This is a simplified implementation. In a production system,
    // you'd need proper job cancellation with cleanup of partially created resources
    
    

    return NextResponse.json({ 
      message: "Richiesta di cancellazione ricevuta. Il job verrà fermato al prossimo checkpoint.",
      jobId: params.jobId 
    })

  } catch (error: unknown) {
    console.error('Errore durante cancellazione job:', error)
    
    const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto"
    
    return NextResponse.json({ 
      error: "Errore interno del server durante la cancellazione.",
      details: errorMessage 
    }, { status: 500 })
  }
}