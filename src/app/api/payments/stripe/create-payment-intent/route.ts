import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PurchaseService } from '@/lib/payment/purchaseService';
import { StripeService } from '@/lib/payment/stripeService';
import { prisma } from '@/lib/core/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const CreatePaymentIntentSchema = z.object({
  purchaseId: z.string().min(1, 'Purchase ID è richiesto'),
  description: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'È necessario effettuare il login per creare un pagamento' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { purchaseId, description } = CreatePaymentIntentSchema.parse(body);


    const tripInfo = await PurchaseService.getPurchaseTransactions(purchaseId);
    
    if (!tripInfo || tripInfo.length === 0) {
      return NextResponse.json(
        { error: 'Acquisto non trovato' },
        { status: 404 }
      );
    }

    const latestTransaction = tripInfo[0];
    
    if (latestTransaction.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'L\'acquisto è già stato completato' },
        { status: 400 }
      );
    }

    // Trovare l'acquisto originale per ottenere i dettagli del trip
    const purchase = await prisma.tripPurchase.findUnique({
      where: { id: purchaseId },
      include: {
        trip: {
          select: {
            id: true,
            title: true,
            price: true,
            user_id: true
          }
        }
      }
    });
    
    if (!purchase) {
      return NextResponse.json(
        { error: 'Acquisto non trovato' },
        { status: 404 }
      );
    }

    if (purchase.trip.user_id === session.user.id) {
      return NextResponse.json(
        { error: 'Non puoi acquistare il tuo stesso viaggio' },
        { status: 400 }
      );
    }

    if (purchase.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Hai già acquistato questo viaggio' },
        { status: 400 }
      );
    }

    const result = await StripeService.createPaymentIntent({
      amount: Number(purchase.trip.price),
      purchaseId,
      userId: session.user.id,
      tripId: purchase.trip.id,
      description: description || `Acquisto ${purchase.trip.title}`
    });

    if (!result.success) {
      console.error('❌ [CREATE PAYMENT INTENT] Errore nella creazione:', result.error);
      return NextResponse.json(
        { error: result.error || 'Errore nella creazione del pagamento' },
        { status: 400 }
      );
    }


    return NextResponse.json({
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntent?.id,
      amount: Number(purchase.trip.price),
      currency: 'eur'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati della richiesta non validi', details: error.errors },
        { status: 400 }
      );
    }

    console.error('❌ [CREATE PAYMENT INTENT] Errore interno:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}