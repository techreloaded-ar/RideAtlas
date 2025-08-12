import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PurchaseService } from '@/lib/payment/purchaseService';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const MockPaymentSchema = z.object({
  purchaseId: z.string(),
  simulateFailure: z.boolean().optional().default(false)
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'È necessario effettuare il login per completare il pagamento' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { purchaseId, simulateFailure } = MockPaymentSchema.parse(body);

    await new Promise(resolve => setTimeout(resolve, 2000));

    if (simulateFailure) {
      const result = await PurchaseService.failPurchase(purchaseId);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: false,
        error: 'Pagamento fallito (simulazione)'
      }, { status: 400 });
    }

    const result = await PurchaseService.completePurchase(purchaseId, 'mock');

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pagamento completato con successo',
      paymentId: `mock_payment_${Date.now()}`,
      purchaseId
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati di pagamento non validi', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Errore nel pagamento mock:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}