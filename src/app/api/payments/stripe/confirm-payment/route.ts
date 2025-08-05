import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PurchaseService } from '@/lib/purchaseService';
import { StripeService } from '@/lib/stripeService';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ConfirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment Intent ID è richiesto'),
  purchaseId: z.string().min(1, 'Purchase ID è richiesto')
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'È necessario effettuare il login per confermare il pagamento' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { paymentIntentId, purchaseId } = ConfirmPaymentSchema.parse(body);

    console.log(`🔄 [CONFIRM PAYMENT] Conferma per paymentIntentId: ${paymentIntentId}, purchaseId: ${purchaseId}`);

    const confirmResult = await StripeService.confirmPayment(paymentIntentId);

    if (!confirmResult.success || !confirmResult.paymentIntent) {
      console.error('❌ [CONFIRM PAYMENT] Errore nella conferma Stripe:', confirmResult.error);
      return NextResponse.json(
        { error: confirmResult.error || 'Errore nella conferma del pagamento' },
        { status: 400 }
      );
    }

    const paymentIntent = confirmResult.paymentIntent;

    if (paymentIntent.status !== 'succeeded') {
      console.log(`⚠️ [CONFIRM PAYMENT] Payment Intent non riuscito, status: ${paymentIntent.status}`);
      
      if (paymentIntent.status === 'requires_action') {
        return NextResponse.json({
          success: false,
          requiresAction: true,
          clientSecret: paymentIntent.client_secret,
          error: 'È richiesta un\'azione aggiuntiva per completare il pagamento'
        });
      }

      await PurchaseService.failPurchase(
        purchaseId, 
        `Pagamento Stripe fallito: ${paymentIntent.status}`,
        'stripe'
      );

      return NextResponse.json(
        { error: `Pagamento non riuscito. Status: ${paymentIntent.status}` },
        { status: 400 }
      );
    }

    if (paymentIntent.metadata.purchaseId !== purchaseId) {
      console.error('❌ [CONFIRM PAYMENT] Mismatch purchase ID nei metadata');
      return NextResponse.json(
        { error: 'Dati del pagamento non corrispondenti' },
        { status: 400 }
      );
    }

    const completionResult = await PurchaseService.completePurchase(
      purchaseId,
      'stripe',
      paymentIntent.id
    );

    if (!completionResult.success) {
      console.error('❌ [CONFIRM PAYMENT] Errore nel completamento acquisto:', completionResult.error);
      return NextResponse.json(
        { error: completionResult.error || 'Errore nel completamento dell\'acquisto' },
        { status: 400 }
      );
    }

    console.log(`✅ [CONFIRM PAYMENT] Pagamento e acquisto completati con successo`);

    return NextResponse.json({
      success: true,
      message: 'Pagamento completato con successo',
      paymentIntentId: paymentIntent.id,
      purchaseId,
      amount: StripeService.getPriceFromStripeAmount(paymentIntent.amount),
      currency: paymentIntent.currency
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dati della richiesta non validi', details: error.errors },
        { status: 400 }
      );
    }

    console.error('❌ [CONFIRM PAYMENT] Errore interno:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}