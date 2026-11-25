'use client';

import { useCallback, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, Lock } from 'lucide-react';
import dynamic from 'next/dynamic';

// Caricato solo per il pagamento con Stripe: il modulo Stripe del browser richiede la chiave
// pubblica e senza di essa (anteprima con pagamento simulato) farebbe fallire l'intera scheda.
const StripePaymentForm = dynamic(() => import('@/components/payment/StripePaymentForm'), {
  ssr: false,
  loading: () => <p className="text-center text-sm text-gray-600">Preparazione del pagamento…</p>,
});
import type { PaymentMode } from '@/lib/payment/paymentMode';
import { formatPrice } from '@/lib/guided-trips/rules';

export type ViewerState = 'anonymous' | 'organizer' | 'confirmed' | 'can-book';

interface BookingPanelProps {
  guidedTripId: string;
  title: string;
  price: number;
  full: boolean;
  open: boolean;
  viewer: ViewerState;
  paymentMode: PaymentMode;
}

interface Hold {
  bookingId: string;
  amount: number;
  holdExpiresAt: string;
}

const holdTime = (iso: string) => new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

export default function BookingPanel({ guidedTripId, title, price, full, open, viewer, paymentMode }: BookingPanelProps) {
  const router = useRouter();
  const [hold, setHold] = useState<Hold | null>(null);
  const [step, setStep] = useState<'idle' | 'payment' | 'confirmed'>(viewer === 'confirmed' ? 'confirmed' : 'idle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onConfirmed = useCallback(() => {
    setStep('confirmed');
    setHold(null);
    router.refresh();
  }, [router]);

  const onPaymentError = useCallback((message: string) => {
    setError(message);
  }, []);

  const startBooking = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/guided-trips/${guidedTripId}/bookings`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Impossibile avviare la prenotazione');
      setHold({ bookingId: data.bookingId, amount: data.amount, holdExpiresAt: data.holdExpiresAt });
      setStep('payment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const paySimulated = async () => {
    if (!hold) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/guided-trips/bookings/${hold.bookingId}/simulate`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Pagamento non riuscito');
      onConfirmed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setBusy(false);
    }
  };

  if (step === 'confirmed') {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center" role="status">
        <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-600" />
        <p className="text-lg font-semibold text-green-800">Il tuo posto è confermato</p>
        <p className="mt-1 text-sm text-green-700">Trovi la prenotazione nella tua Dashboard, tra «Le mie prenotazioni».</p>
      </div>
    );
  }

  const errorBox = error && (
    <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );

  if (step === 'payment' && hold) {
    return (
      <div>
        {errorBox}
        <p className="mb-3 text-sm text-gray-600">
          Il tuo posto è trattenuto fino alle <strong>{holdTime(hold.holdExpiresAt)}</strong>. Completa il pagamento di <strong>{formatPrice(hold.amount)}</strong> per confermarlo.
        </p>
        {paymentMode === 'stripe' ? (
          <StripePaymentForm
            purchaseId={hold.bookingId}
            amount={hold.amount}
            onSuccess={onConfirmed}
            onError={onPaymentError}
            endpoints={{
              createIntent: `/api/guided-trips/bookings/${hold.bookingId}/payment-intent`,
              confirm: `/api/guided-trips/bookings/${hold.bookingId}/confirm`,
            }}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Pagamento simulato</p>
            <p className="mb-3 mt-1 text-xs text-amber-800">Ambiente di prova senza Stripe: nessun addebito reale.</p>
            <button
              type="button"
              onClick={paySimulated}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              {busy ? 'Pagamento in corso…' : `Paga ${formatPrice(hold.amount)}`}
            </button>
          </div>
        )}
      </div>
    );
  }

  let action: ReactNode;
  if (!open) {
    action = <p className="rounded-lg bg-gray-100 p-3 text-center text-sm text-gray-600">Le prenotazioni per questo viaggio sono chiuse.</p>;
  } else if (viewer === 'organizer') {
    action = <p className="rounded-lg bg-gray-100 p-3 text-center text-sm text-gray-600">Sei l&apos;organizzatore di questo viaggio.</p>;
  } else if (full) {
    action = <button type="button" disabled className="w-full rounded-lg bg-gray-200 px-4 py-3 font-semibold text-gray-600">Posti esauriti</button>;
  } else if (viewer === 'anonymous') {
    action = (
      <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(`/guided-trips/${guidedTripId}`)}`} className="block w-full rounded-lg bg-primary-600 px-4 py-3 text-center font-semibold text-white hover:bg-primary-700">
        Accedi per prenotare
      </Link>
    );
  } else if (paymentMode === 'unavailable') {
    action = <p className="rounded-lg bg-gray-100 p-3 text-center text-sm text-gray-600">I pagamenti non sono al momento disponibili.</p>;
  } else {
    action = (
      <button
        type="button"
        onClick={startBooking}
        disabled={busy}
        aria-label={`Prenota e paga il tuo posto per ${title}`}
        className="w-full rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {busy ? 'Preparazione…' : 'Prenota e paga il tuo posto'}
      </button>
    );
  }

  return (
    <div>
      {errorBox}
      <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        Il pagamento conferma subito il posto. In caso di annullamento del viaggio verrai contattato per il rimborso.
      </div>
      {action}
      <p className="sr-only">Prezzo {formatPrice(price)}</p>
    </div>
  );
}
