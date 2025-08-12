import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PurchaseService } from '@/lib/payment/purchaseService';
import { UserRole } from '@/types/profile';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`🔍 [ACCESS API] Richiesta accesso per trip: ${params.id}`);
  
  // Validazione parametri di base
  if (!params?.id || typeof params.id !== 'string') {
    console.log(`❌ [ACCESS API] Parametro ID non valido: ${params?.id}`);
    return NextResponse.json(
      { error: 'ID viaggio non valido' },
      { status: 400 }
    );
  }
  
  try {
    console.log(`🔍 [ACCESS API] Verifico autenticazione...`);
    const session = await auth();
    
    if (!session?.user?.id) {
      console.log(`❌ [ACCESS API] Utente non autenticato`);
      return NextResponse.json(
        { 
          canAccess: false, 
          reason: 'authentication_required',
          message: 'È necessario effettuare il login'
        },
        { status: 401 }
      );
    }

    console.log(`✅ [ACCESS API] Utente autenticato: ${session.user.id}`);
    console.log(`🔍 [ACCESS API] Recupero informazioni viaggio tramite PurchaseService...`);

    const tripInfo = await PurchaseService.getTripWithPurchaseInfo(
      params.id, 
      session.user.id
    );

    console.log(`🔍 [ACCESS API] TripInfo ricevuto:`, tripInfo);

    if (!tripInfo) {
      console.log(`❌ [ACCESS API] Viaggio non trovato: ${params.id}`);
      return NextResponse.json(
        { error: 'Viaggio non trovato' },
        { status: 404 }
      );
    }

    const isSentinel = session.user.role === UserRole.Sentinel;
    const canAccess = tripInfo.isOwner || tripInfo.hasPurchased || isSentinel;
    console.log(`🔍 [ACCESS API] Controllo accesso - isOwner: ${tripInfo.isOwner}, hasPurchased: ${tripInfo.hasPurchased}, isSentinel: ${isSentinel}, canAccess: ${canAccess}`);

    const response = {
      canAccess,
      isOwner: tripInfo.isOwner,
      hasPurchased: tripInfo.hasPurchased,
      price: tripInfo.price,
      reason: canAccess ? null : 'purchase_required',
      message: canAccess ? null : 'È necessario acquistare questo viaggio per accedere al contenuto premium'
    };

    console.log(`✅ [ACCESS API] Risposta:`, response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [ACCESS API] Errore nel controllo accesso:', error);
    console.error('❌ [ACCESS API] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Assicuriamoci di restituire sempre JSON, mai HTML
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    return NextResponse.json(
      { 
        error: 'Errore interno del server',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// Handler per altri metodi HTTP non supportati
export async function POST() {
  return NextResponse.json(
    { error: 'Metodo non supportato' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Metodo non supportato' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Metodo non supportato' },
    { status: 405 }
  );
}