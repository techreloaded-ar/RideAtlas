import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/lib/stripeService';
import { PurchaseService } from '@/lib/purchaseService';
import { STRIPE_WEBHOOK_EVENTS } from '@/lib/stripe-server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const PROCESSED_EVENTS = new Set<string>();
const MAX_PROCESSED_EVENTS = 1000;

function addProcessedEvent(eventId: string) {
  if (PROCESSED_EVENTS.size >= MAX_PROCESSED_EVENTS) {
    const firstEvent = PROCESSED_EVENTS.values().next().value as string;
    PROCESSED_EVENTS.delete(firstEvent);
  }
  PROCESSED_EVENTS.add(eventId);
}

function isEventProcessed(eventId: string): boolean {
  return PROCESSED_EVENTS.has(eventId);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('❌ [STRIPE WEBHOOK] Signature mancante');
    return NextResponse.json(
      { error: 'Signature mancante' },
      { status: 400 }
    );
  }

  try {
    const event = await StripeService.constructWebhookEvent(body, signature!);

    if (!event) {
      console.error('❌ [STRIPE WEBHOOK] Impossibile costruire evento webhook');
      return NextResponse.json(
        { error: 'Evento webhook non valido' },
        { status: 400 }
      );
    }

    console.log(`📬 [STRIPE WEBHOOK] Ricevuto evento: ${event.type}, ID: ${event.id}`);

    if (isEventProcessed(event.id)) {
      console.log(`⚠️ [STRIPE WEBHOOK] Evento già processato: ${event.id}`);
      return NextResponse.json({ received: true, status: 'already_processed' });
    }

    let result;

    switch (event.type) {
      case STRIPE_WEBHOOK_EVENTS.PAYMENT_INTENT_SUCCEEDED:
        result = await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case STRIPE_WEBHOOK_EVENTS.PAYMENT_INTENT_PAYMENT_FAILED:
        result = await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      case STRIPE_WEBHOOK_EVENTS.PAYMENT_INTENT_CANCELED:
        result = await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;
      
      default:
        console.log(`ℹ️ [STRIPE WEBHOOK] Evento non gestito: ${event.type}`);
        return NextResponse.json({ received: true, status: 'ignored' });
    }

    if (result?.success) {
      addProcessedEvent(event.id);
      console.log(`✅ [STRIPE WEBHOOK] Evento processato con successo: ${event.id}`);
    } else {
      console.error(`❌ [STRIPE WEBHOOK] Errore nel processamento evento ${event.id}:`, result?.error);
    }

    return NextResponse.json({ 
      received: true, 
      status: result?.success ? 'processed' : 'error',
      error: result?.error
    });

  } catch (error) {
    console.error('❌ [STRIPE WEBHOOK] Errore generale nel webhook:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log(`✅ [STRIPE WEBHOOK] Payment Intent successo: ${paymentIntent.id}`);

    const { purchaseId } = paymentIntent.metadata;

    if (!purchaseId) {
      console.error('❌ [STRIPE WEBHOOK] Purchase ID mancante nei metadata');
      return { success: false, error: 'Purchase ID mancante' };
    }

    const existingPurchase = await PurchaseService.getPurchaseTransactions(purchaseId);
    
    if (!existingPurchase || existingPurchase.length === 0) {
      console.error(`❌ [STRIPE WEBHOOK] Purchase non trovato: ${purchaseId}`);
      return { success: false, error: 'Purchase non trovato' };
    }

    const latestTransaction = existingPurchase[0];
    
    if (latestTransaction.status === 'COMPLETED') {
      console.log(`ℹ️ [STRIPE WEBHOOK] Purchase già completato: ${purchaseId}`);
      return { success: true, status: 'already_completed' };
    }

    const completionResult = await PurchaseService.completePurchase(
      purchaseId,
      'stripe',
      paymentIntent.id
    );

    if (!completionResult.success) {
      console.error(`❌ [STRIPE WEBHOOK] Errore nel completamento purchase ${purchaseId}:`, completionResult.error);
      return { success: false, error: completionResult.error };
    }

    console.log(`✅ [STRIPE WEBHOOK] Purchase completato con successo: ${purchaseId}`);
    return { success: true };

  } catch (error) {
    console.error('❌ [STRIPE WEBHOOK] Errore in handlePaymentIntentSucceeded:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log(`❌ [STRIPE WEBHOOK] Payment Intent fallito: ${paymentIntent.id}`);

    const { purchaseId } = paymentIntent.metadata;

    if (!purchaseId) {
      console.error('❌ [STRIPE WEBHOOK] Purchase ID mancante nei metadata per pagamento fallito');
      return { success: false, error: 'Purchase ID mancante' };
    }

    const failureReason = paymentIntent.last_payment_error?.message || 'Pagamento fallito';

    const failureResult = await PurchaseService.failPurchase(
      purchaseId,
      failureReason,
      'stripe'
    );

    if (!failureResult.success) {
      console.error(`❌ [STRIPE WEBHOOK] Errore nel fallimento purchase ${purchaseId}:`, failureResult.error);
      return { success: false, error: failureResult.error };
    }

    console.log(`✅ [STRIPE WEBHOOK] Purchase segnato come fallito: ${purchaseId}`);
    return { success: true };

  } catch (error) {
    console.error('❌ [STRIPE WEBHOOK] Errore in handlePaymentIntentFailed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log(`🚫 [STRIPE WEBHOOK] Payment Intent cancellato: ${paymentIntent.id}`);

    const { purchaseId } = paymentIntent.metadata;

    if (!purchaseId) {
      console.error('❌ [STRIPE WEBHOOK] Purchase ID mancante nei metadata per pagamento cancellato');
      return { success: false, error: 'Purchase ID mancante' };
    }

    const failureResult = await PurchaseService.failPurchase(
      purchaseId,
      'Pagamento cancellato dall\'utente',
      'stripe'
    );

    if (!failureResult.success) {
      console.error(`❌ [STRIPE WEBHOOK] Errore nella cancellazione purchase ${purchaseId}:`, failureResult.error);
      return { success: false, error: failureResult.error };
    }

    console.log(`✅ [STRIPE WEBHOOK] Purchase segnato come cancellato: ${purchaseId}`);
    return { success: true };

  } catch (error) {
    console.error('❌ [STRIPE WEBHOOK] Errore in handlePaymentIntentCanceled:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}