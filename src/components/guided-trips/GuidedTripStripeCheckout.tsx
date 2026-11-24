'use client';

// Caricato solo quando Stripe è configurato: il modulo stripe-client richiede la chiave pubblica.
import { useState, type FormEvent } from 'react';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/payment/stripe-client';
import { formatEuro } from '@/lib/guided-trips/guidedTripRules';

interface GuidedTripStripeCheckoutProps {
  clientSecret: string;
  amount: number;
  onPaid: () => void;
}

function CardCheckoutForm({ clientSecret, amount, onPaid }: GuidedTripStripeCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const cardElement = elements?.getElement(CardElement);
    if (!stripe || !cardElement) return;
    setProcessing(true);
    setErrorMessage(null);
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, { payment_method: { card: cardElement } });
    if (error) {
      setErrorMessage(error.message ?? 'Pagamento non riuscito');
      setProcessing(false);
      return;
    }
    if (paymentIntent?.status === 'succeeded') onPaid();
    else setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="rounded-lg border border-gray-300 bg-white p-3">
        <CardElement options={{ hidePostalCode: true }} />
      </div>
      {errorMessage && <p className="text-sm text-red-600" role="alert">{errorMessage}</p>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full rounded-lg bg-primary-600 px-4 py-2.5 font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
      >
        {processing ? 'Pagamento in corso…' : `Paga ${formatEuro(amount)}`}
      </button>
    </form>
  );
}

export default function GuidedTripStripeCheckout(props: GuidedTripStripeCheckoutProps) {
  return (
    <Elements stripe={getStripe()} options={{ clientSecret: props.clientSecret, locale: 'it' }}>
      <CardCheckoutForm {...props} />
    </Elements>
  );
}
