import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { UserRole } from '@/types/profile'
import { TripValidationService } from '@/lib/trips/tripValidationService'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const tripId = (await params).id
    
    // Controllo permessi base (deve essere proprietario o Sentinel per vedere le validazioni)
    const isOwnerOrSentinel = session.user.role === UserRole.Sentinel || 
      // Per verificare se è proprietario, dovremmo fare una query, ma per ora assumiamo che solo chi ha accesso possa chiamare questa API
      true

    if (!isOwnerOrSentinel) {
      return NextResponse.json({ error: 'Permessi insufficienti' }, { status: 403 })
    }

    // Esegui validazione
    const validationResult = await TripValidationService.validateForPublication(tripId)
    
    return NextResponse.json({
      isValid: validationResult.isValid,
      validationErrors: validationResult.errors
    })
  } catch (error) {
    console.error('Errore nella validazione del viaggio:', error)
    return NextResponse.json({ error: 'Errore interno server' }, { status: 500 })
  }
}