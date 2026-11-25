// Canale di pagamento disponibile per le prenotazioni dei viaggi guidati.
// - stripe: chiavi Stripe configurate (produzione e ambienti di prova con Stripe test);
// - simulated: nessuna chiave Stripe fuori da produzione (anteprima locale);
// - unavailable: produzione senza Stripe, i pagamenti sono disattivati.
export type PaymentMode = 'stripe' | 'simulated' | 'unavailable';

export function getPaymentMode(env: Record<string, string | undefined> = process.env): PaymentMode {
  if (env.STRIPE_SECRET_KEY && env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) return 'stripe';
  if (env.NODE_ENV !== 'production') return 'simulated';
  return 'unavailable';
}
