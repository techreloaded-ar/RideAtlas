import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PurchaseService } from '@/lib/payment/purchaseService';
import { UserRole } from '@/types/profile';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Validazione parametri di base
  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      { error: 'ID viaggio non valido' },
      { status: 400 }
    );
  }
  
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { 
          canAccess: false, 
          reason: 'authentication_required',
          message: 'È necessario effettuare il login'
        },
        { status: 401 }
      );
    }

    const tripInfo = await PurchaseService.getTripWithPurchaseInfo(
      id, 
      session.user.id
    );

    if (!tripInfo) {
      return NextResponse.json(
        { error: 'Viaggio non trovato' },
        { status: 404 }
      );
    }

    const isSentinel = session.user.role === UserRole.Sentinel;
    const canAccess = tripInfo.isOwner || tripInfo.hasPurchased || isSentinel;

    const response = {
      canAccess,
      isOwner: tripInfo.isOwner,
      hasPurchased: tripInfo.hasPurchased,
      price: tripInfo.price,
      reason: canAccess ? null : 'purchase_required',
      message: canAccess ? null : 'È necessario acquistare questo viaggio per accedere al contenuto premium'
    };

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