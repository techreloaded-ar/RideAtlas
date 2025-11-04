import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { auth } from '@/auth'
import { UserRole } from '@/types/profile'
import { storageCleanupService } from '@/lib/services/storageCleanup'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET - Ottieni dettagli di un singolo viaggio (per completezza API)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const tripId = params.id

    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    if (session.user.role !== UserRole.Sentinel) {
      return NextResponse.json(
        { error: 'Permessi insufficienti' },
        { status: 403 }
      )
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        stages: {
          select: {
            id: true,
            title: true,
            orderIndex: true
          }
        }
      }
    })

    if (!trip) {
      return NextResponse.json(
        { error: 'Viaggio non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json(trip)

  } catch (error) {
    console.error('Errore nel recupero viaggio:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina definitivamente un viaggio (solo per Sentinel users)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const tripId = params.id

    // 1. Authentication check
    const session = await auth()
    
    if (!session?.user) {
      console.error('❌ Tentativo di eliminazione viaggio senza autenticazione')
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      )
    }

    // 2. Role authorization check - Solo Sentinel può eliminare viaggi
    if (session.user.role !== UserRole.Sentinel) {
      console.error(`❌ Tentativo di eliminazione viaggio da utente non autorizzato: ${session.user.email} (${session.user.role})`)
      return NextResponse.json(
        { error: 'Permessi insufficienti. Solo gli amministratori Sentinel possono eliminare viaggi.' },
        { status: 403 }
      )
    }

    // 2.5. Check trip status - Only draft trips can be deleted
    const tripStatus = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { status: true, title: true }
    })

    if (!tripStatus) {
      return NextResponse.json(
        { error: 'Viaggio non trovato' },
        { status: 404 }
      )
    }

    if (tripStatus.status !== 'Bozza') {
      console.error(`❌ Tentativo di eliminazione viaggio non in bozza: ${tripId} (stato: ${tripStatus.status})`)
      return NextResponse.json(
        { error: 'È possibile eliminare solo viaggi in stato bozza.' },
        { status: 400 }
      )
    }

    // 3. Validate trip ID
    if (!tripId || typeof tripId !== 'string') {
      return NextResponse.json(
        { error: 'ID viaggio non valido' },
        { status: 400 }
      )
    }

    // 4. Load trip with all related data for cleanup
    const tripWithStages = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        stages: {
          select: {
            id: true,
            media: true,
            gpxFile: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!tripWithStages) {
      console.warn(`⚠️ Tentativo di eliminazione viaggio inesistente: ${tripId}`)
      return NextResponse.json(
        { error: 'Viaggio non trovato' },
        { status: 404 }
      )
    }

    // 5. Cleanup storage files BEFORE deleting from database
    
    try {
      const cleanupResult = await storageCleanupService.cleanupTripStorage(
        tripWithStages.media as unknown[],
        tripWithStages.gpxFile,
        tripWithStages.stages.map(stage => ({
          media: stage.media as unknown[],
          gpxFile: stage.gpxFile
        }))
      )

      if (cleanupResult.failedFiles.length > 0) {
        console.warn(`⚠️ Alcuni file non sono stati eliminati dallo storage:`)
        cleanupResult.failedFiles.forEach((file, i) => {
          console.warn(`     ${i + 1}. ${file}`)
        })
      }
      
      if (cleanupResult.errors.length > 0) {
        console.error(`💥 Errori dettagliati durante cleanup:`)
        cleanupResult.errors.forEach((error, i) => {
          console.error(`     ${i + 1}. ${error}`)
        })
      }
    } catch (storageError) {
      console.error(`❌ Errore durante cleanup storage per viaggio ${tripId}:`, storageError)
      if (storageError instanceof Error && storageError.stack) {
        console.error(`Stack trace:`, storageError.stack)
      }
      // Non blocchiamo l'eliminazione del viaggio anche se il cleanup storage fallisce completamente
      console.warn(`⚠️ Continuo con eliminazione database nonostante errori storage`)
    }

    // 6. Delete from database (stages will be deleted automatically due to CASCADE)
    await prisma.trip.delete({
      where: { id: tripId }
    })

    return NextResponse.json({
      message: 'Viaggio eliminato con successo',
      deletedTrip: {
        id: tripWithStages.id,
        title: tripWithStages.title,
        owner: tripWithStages.user.email
      }
    })

  } catch (error) {
    console.error(`💥 Errore durante eliminazione viaggio:`, error)
    
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
    
    // Handle specific error types
    if (errorMessage.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Viaggio non trovato o già eliminato' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Errore interno del server durante l\'eliminazione del viaggio',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}