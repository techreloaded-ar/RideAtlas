import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PurchaseService } from '@/lib/purchaseService';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'È necessario effettuare il login per acquistare un viaggio' },
        { status: 401 }
      );
    }

    const result = await PurchaseService.createPurchase(
      session.user.id,
      params.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      purchaseId: result.purchaseId,
      message: 'Acquisto iniziato con successo'
    });

  } catch (error) {
    console.error('Errore nella creazione dell\'acquisto:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
      params.id,
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