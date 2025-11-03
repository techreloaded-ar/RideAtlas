import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PurchaseService } from '@/lib/payment/purchaseService';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'È necessario effettuare il login per acquistare un viaggio' },
        { status: 401 }
      );
    }

    const tripId = (await params).id;
    console.log(`📥 [PURCHASE API] Starting purchase for trip ${tripId}, user ${session.user.id}`);

    const result = await PurchaseService.createPurchase(
      session.user.id,
      tripId
    );

    console.log(`📤 [PURCHASE API] Purchase result:`, result);

    if (!result.success) {
      console.log(`❌ [PURCHASE API] Purchase failed: ${result.error}`);
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    const response = {
      success: true,
      purchaseId: result.purchaseId,
      free: result.free || false,
      message: result.free ? 'Viaggio acquisito gratuitamente' : 'Acquisto iniziato con successo'
    };

    console.log(`✅ [PURCHASE API] Returning response:`, response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [PURCHASE API] Errore nella creazione dell\'acquisto:', error);
    console.error('❌ [PURCHASE API] Stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { purchased: false, reason: 'not_authenticated' },
        { status: 401 }
      );
    }

    const tripInfo = await PurchaseService.getTripWithPurchaseInfo(
      (await params).id,
      session.user.id
    );

    if (!tripInfo) {
      return NextResponse.json(
        { error: 'Viaggio non trovato' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      purchased: tripInfo.hasPurchased,
      isOwner: tripInfo.isOwner,
      price: tripInfo.price,
      purchase: tripInfo.purchase
    });

  } catch (error) {
    console.error('Errore nel controllo acquisto:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}