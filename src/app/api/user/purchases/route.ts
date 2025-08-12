import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PurchaseService } from '@/lib/payment/purchaseService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'È necessario effettuare il login per visualizzare gli acquisti' },
        { status: 401 }
      );
    }

    const purchases = await PurchaseService.getUserPurchasesWithTrips(session.user.id);

    return NextResponse.json({
      purchases: purchases.map(purchase => ({
        id: purchase.id,
        amount: Number(purchase.amount),
        status: purchase.status,
        purchasedAt: purchase.purchasedAt,
        paymentMethod: purchase.paymentMethod,
        trip: purchase.trip
      }))
    });

  } catch (error) {
    console.error('Errore nel recupero degli acquisti:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}