import Stripe from 'stripe';
import { stripe, formatAmountForStripe, formatAmountFromStripe, STRIPE_CONFIG } from './stripe-server';

export interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  purchaseId: string;
  userId: string;
  tripId: string;
  description?: string;
}

export interface CreatePaymentIntentResult {
  success: boolean;
  paymentIntent?: Stripe.PaymentIntent;
  clientSecret?: string;
  error?: string;
}

export interface ConfirmPaymentResult {
  success: boolean;
  paymentIntent?: Stripe.PaymentIntent;
  error?: string;
}

export class StripeService {
  static async createPaymentIntent({
    amount,
    currency = STRIPE_CONFIG.currency,
    purchaseId,
    userId,
    tripId,
    description
  }: CreatePaymentIntentParams): Promise<CreatePaymentIntentResult> {
    try {
      

      const existingPaymentIntent = await this.findExistingPaymentIntent(purchaseId);

      if (existingPaymentIntent) {
        

        // If succeeded, this might be from a previous purchase that was refunded
        // Create a new Payment Intent instead of reusing (allows repurchase after refund)
        if (existingPaymentIntent.status === 'succeeded') {
          
          // Fall through to create new Payment Intent
        } else if (existingPaymentIntent.status === 'requires_payment_method' ||
                   existingPaymentIntent.status === 'requires_confirmation') {
          return {
            success: true,
            paymentIntent: existingPaymentIntent,
            clientSecret: existingPaymentIntent.client_secret!
          };
        }
      }

      const stripeAmount = formatAmountForStripe(amount, currency);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: stripeAmount,
        currency,
        automatic_payment_methods: STRIPE_CONFIG.automaticPaymentMethods,
        description: description || `Acquisto viaggio RideAtlas`,
        metadata: {
          purchaseId,
          userId,
          tripId,
          originalAmount: amount.toString(),
          platform: 'RideAtlas'
        },
        statement_descriptor_suffix: 'RIDEATLAS',
      });

      

      return {
        success: true,
        paymentIntent,
        clientSecret: paymentIntent.client_secret!
      };

    } catch (error) {
      console.error('❌ [STRIPE SERVICE] Errore nella creazione del Payment Intent:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore nella creazione del pagamento'
      };
    }
  }

  static async confirmPayment(paymentIntentId: string): Promise<ConfirmPaymentResult> {
    try {
      

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (!paymentIntent) {
        return {
          success: false,
          error: 'Payment Intent non trovato'
        };
      }

      

      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          paymentIntent
        };
      }

      if (paymentIntent.status === 'requires_confirmation') {
        const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
        return {
          success: confirmedPaymentIntent.status === 'succeeded',
          paymentIntent: confirmedPaymentIntent,
          error: confirmedPaymentIntent.status !== 'succeeded' 
            ? `Pagamento non completato. Status: ${confirmedPaymentIntent.status}`
            : undefined
        };
      }

      return {
        success: false,
        paymentIntent,
        error: `Stato del pagamento non valido: ${paymentIntent.status}`
      };

    } catch (error) {
      console.error('❌ [STRIPE SERVICE] Errore nella conferma del pagamento:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore nella conferma del pagamento'
      };
    }
  }

  static async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent | null> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error('❌ [STRIPE SERVICE] Errore nel recupero Payment Intent:', error);
      return null;
    }
  }

  private static async findExistingPaymentIntent(purchaseId: string): Promise<Stripe.PaymentIntent | null> {
    try {
      const paymentIntents = await stripe.paymentIntents.list({
        limit: 10,
      });

      const existingPaymentIntent = paymentIntents.data.find(
        pi => pi.metadata.purchaseId === purchaseId
      );

      return existingPaymentIntent || null;
    } catch (error) {
      console.error('❌ [STRIPE SERVICE] Errore nella ricerca Payment Intent esistente:', error);
      return null;
    }
  }

  static async constructWebhookEvent(body: string, signature: string): Promise<Stripe.Event | null> {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        console.error('❌ [STRIPE SERVICE] STRIPE_WEBHOOK_SECRET non configurato');
        return null;
      }

      const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      return event;
    } catch (error) {
      console.error('❌ [STRIPE SERVICE] Errore nella costruzione webhook event:', error);
      return null;
    }
  }

  static async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<{
    success: boolean;
    purchaseId?: string;
    error?: string;
  }> {
    try {
      const { purchaseId } = paymentIntent.metadata;

      if (!purchaseId) {
        return {
          success: false,
          error: 'Purchase ID mancante nei metadata'
        };
      }

      

      return {
        success: true,
        purchaseId
      };

    } catch (error) {
      console.error('❌ [STRIPE SERVICE] Errore nella gestione pagamento riuscito:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore nella gestione del pagamento'
      };
    }
  }

  static async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<{
    success: boolean;
    purchaseId?: string;
    error?: string;
  }> {
    try {
      const { purchaseId } = paymentIntent.metadata;

      if (!purchaseId) {
        return {
          success: false,
          error: 'Purchase ID mancante nei metadata'
        };
      }

      const failureReason = paymentIntent.last_payment_error?.message || 'Pagamento fallito';
      
      console.error(`❌ [STRIPE SERVICE] Pagamento fallito per purchaseId: ${purchaseId}, motivo: ${failureReason}`);

      return {
        success: true,
        purchaseId
      };

    } catch (error) {
      console.error('❌ [STRIPE SERVICE] Errore nella gestione pagamento fallito:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore nella gestione del pagamento fallito'
      };
    }
  }

  static formatAmountForDisplay(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  }

  static getStripeAmountFromPrice(price: number): number {
    return formatAmountForStripe(price, STRIPE_CONFIG.currency);
  }

  static getPriceFromStripeAmount(amount: number): number {
    return formatAmountFromStripe(amount, STRIPE_CONFIG.currency);
  }
}