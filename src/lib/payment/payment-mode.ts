// Modalità di pagamento disponibile nell'ambiente corrente.
//
// - "stripe": chiavi Stripe configurate (produzione e ambienti di prova con chiavi test).
// - "simulated": nessuna chiave Stripe e ambiente NON di produzione (sviluppo e anteprima
//   locale): il pagamento viene simulato per poter provare il flusso.
// - "unavailable": produzione senza Stripe; nessun pagamento possibile, mai simulato.

export type PaymentMode = 'stripe' | 'simulated' | 'unavailable'

export function resolvePaymentMode(env: Record<string, string | undefined> = process.env): PaymentMode {
  const stripeConfigured = Boolean(env.STRIPE_SECRET_KEY && env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  if (stripeConfigured) return 'stripe'
  if (env.NODE_ENV === 'production') return 'unavailable'
  return 'simulated'
}
