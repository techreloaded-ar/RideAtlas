'use client';

import { useState, useEffect, useCallback } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/payment/stripe-client';
import { CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';

interface StripePaymentFormProps {
  purchaseId: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: '"Inter", "Helvetica Neue", Helvetica, sans-serif',
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: false,
};

function CheckoutForm({ purchaseId, amount, onSuccess, onError }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [, setPaymentIntentId] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const createPaymentIntent = useCallback(async () => {
    try {
      const response = await fetch('/api/payments/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purchaseId,
          description: `Acquisto viaggio RideAtlas`
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore nella creazione del pagamento');
      }

      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    } catch (error) {
      console.error('Errore nella creazione del Payment Intent:', error);
      onError(error instanceof Error ? error.message : 'Errore nella preparazione del pagamento');
    }
  }, [purchaseId, onError]);

  useEffect(() => {
    createPaymentIntent();
  }, [createPaymentIntent]);

  const handleCardChange = (event: { complete: boolean; error?: { message: string } | null }) => {
    setCardComplete(event.complete);
    setCardError(event.error ? event.error.message : null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      onError('Stripe non è ancora caricato. Riprova tra un momento.');
      return;
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      onError('Elemento carta non trovato');
      return;
    }

    if (!cardComplete) {
      setCardError('Compila tutti i campi della carta');
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        console.error('Errore nella conferma del pagamento:', error);
        setCardError(error.message || 'Errore nel pagamento');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        const confirmResponse = await fetch('/api/payments/stripe/confirm-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            purchaseId,
          }),
        });

        const confirmData = await confirmResponse.json();

        if (!confirmResponse.ok) {
          throw new Error(confirmData.error || 'Errore nella conferma del pagamento');
        }

        onSuccess();
      } else {
        throw new Error(`Pagamento non completato. Status: ${paymentIntent?.status}`);
      }

    } catch (error) {
      console.error('Errore nel pagamento:', error);
      onError(error instanceof Error ? error.message : 'Errore sconosciuto nel pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!clientSecret) {
    return (
      <div className="max-w-md mx-auto">
        <div className="animate-pulse">
          <div className="bg-gray-200 h-10 rounded mb-4"></div>
          <div className="bg-gray-200 h-32 rounded mb-4"></div>
          <div className="bg-gray-200 h-12 rounded"></div>
        </div>
        <p className="text-center text-gray-600 mt-4">
          Preparazione del pagamento...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">
              Pagamento Sicuro con Stripe
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              I tuoi dati di pagamento sono protetti e crittografati.
            </p>
          </div>
        </div>
      </div>

     
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Informazioni carta di credito
          </label>
          <div className="relative">
            <div className="border border-gray-300 rounded-md p-3 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
              <CardElement
                options={CARD_ELEMENT_OPTIONS}
                onChange={handleCardChange}
              />
            </div>
            <CreditCard className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
          </div>
          {cardError && (
            <div className="mt-2 flex items-center text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              {cardError}
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-medium">Totale:</span>
            <span className="text-2xl font-bold text-blue-600">
              €{amount.toFixed(2)}
            </span>
          </div>

          <button
            type="submit"
            disabled={isProcessing || !stripe || !cardComplete}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Elaborazione pagamento...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Paga €{amount.toFixed(2)}
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-center text-xs text-gray-500">
          <Lock className="w-3 h-3 mr-1" />
          <span>Pagamento sicuro e crittografato con Stripe</span>
        </div>
      </form>
    </div>
  );
}

export default function StripePaymentForm(props: StripePaymentFormProps) {
  const [stripePromise] = useState(() => getStripe());

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
}