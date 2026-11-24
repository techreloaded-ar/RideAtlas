import { guidedTripInputSchema } from '@/schemas/guided-trip'
import { resolvePaymentMode } from '@/lib/payment/payment-mode'

const valid = {
  title: 'Dolomiti, passi e rifugi',
  description: 'Tre giorni sui passi dolomitici con andatura tranquilla.',
  program: 'Giorno 1\nGiorno 2\nGiorno 3',
  includedServices: '',
  coverImageUrl: '',
  departureDate: '2027-06-14',
  returnDate: '2027-06-16',
  meetingPoint: 'Bassano del Grappa, piazza Libertà, ore 8:30',
  maxParticipants: '8',
  pricePerParticipant: '450',
  registrationDeadline: '2027-05-31',
  cancellationNoticeDays: '14',
}

describe('guidedTripInputSchema', () => {
  it('accetta i dati del form convertendo numeri e campi facoltativi vuoti', () => {
    const parsed = guidedTripInputSchema.parse(valid)
    expect(parsed.maxParticipants).toBe(8)
    expect(parsed.pricePerParticipant).toBe(450)
    expect(parsed.cancellationNoticeDays).toBe(14)
    expect(parsed.includedServices).toBeUndefined()
    expect(parsed.coverImageUrl).toBeUndefined()
  })

  it('richiede posti, prezzo e date coerenti', () => {
    const issues = (input: Record<string, unknown>) =>
      guidedTripInputSchema.safeParse({ ...valid, ...input }).error?.errors.map(e => e.path.join('.')) ?? []
    expect(issues({ maxParticipants: '0' })).toContain('maxParticipants')
    expect(issues({ pricePerParticipant: '0' })).toContain('pricePerParticipant')
    expect(issues({ returnDate: '2027-06-13' })).toContain('returnDate')
    expect(issues({ registrationDeadline: '2027-06-15' })).toContain('registrationDeadline')
    expect(issues({ departureDate: '14/06/2027' })).toContain('departureDate')
    expect(issues({ coverImageUrl: 'javascript:alert(1)' })).toContain('coverImageUrl')
  })
})

describe('resolvePaymentMode', () => {
  it('usa Stripe quando le chiavi sono configurate', () => {
    expect(resolvePaymentMode({ STRIPE_SECRET_KEY: 'sk', NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk', NODE_ENV: 'production' })).toBe('stripe')
  })

  it('simula il pagamento solo fuori produzione e senza Stripe', () => {
    expect(resolvePaymentMode({ NODE_ENV: 'development' })).toBe('simulated')
    expect(resolvePaymentMode({ NODE_ENV: 'production' })).toBe('unavailable')
    expect(resolvePaymentMode({ STRIPE_SECRET_KEY: 'sk', NODE_ENV: 'production' })).toBe('unavailable')
  })
})
