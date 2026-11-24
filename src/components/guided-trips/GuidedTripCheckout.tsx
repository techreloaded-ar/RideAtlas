'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft, CalendarDays, CheckCircle, FlaskConical, MapPin } from 'lucide-react'
import type { PaymentMode } from '@/lib/payment/payment-mode'
import { formatEuro } from './guided-trip-format'

// Stripe viene caricato solo quando è configurato: senza chiavi il modulo client fallirebbe.
const StripePaymentForm = dynamic(() => import('@/components/payment/StripePaymentForm'), { ssr: false })

interface GuidedTripCheckoutProps {
  paymentMode: PaymentMode
  trip: {
    id: string
    slug: string
    title: string
    dates: string
    meetingPoint: string
    price: number
    organizerName: string
    cancellationNoticeDays: number
    selfCancellationLastDay: string
    closedMessage: string | null
  }
}

type CheckoutStep = 'review' | 'payment' | 'success'

export default function GuidedTripCheckout({ paymentMode, trip }: GuidedTripCheckoutProps) {
  const router = useRouter()
  const [step, setStep] = useState<CheckoutStep>('review')
  const [registrationId, setRegistrationId] = useState<string | null>(null)
  const [amount, setAmount] = useState(trip.price)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tripUrl = `/guided-trips/${trip.slug}`

  const goToTripAfterSuccess = () => {
    setStep('success')
    setTimeout(() => {
      router.push(tripUrl)
      router.refresh()
    }, 1500)
  }

  const startRegistration = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/guided-trips/${trip.id}/registrations`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Impossibile avviare l\'iscrizione')
      setRegistrationId(data.registrationId)
      setAmount(data.amount)
      setStep('payment')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossibile avviare l\'iscrizione')
    } finally {
      setLoading(false)
    }
  }

  const paySimulated = async () => {
    if (!registrationId) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/guided-trip-registrations/${registrationId}/simulated-payment`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Pagamento non riuscito')
      goToTripAfterSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pagamento non riuscito')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-xl mx-auto px-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center" data-testid="guided-trip-registration-success">
            <CheckCircle className="w-14 h-14 text-primary-600 mx-auto" aria-hidden="true" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Iscrizione confermata!</h1>
            <p className="mt-2 text-gray-700">
              Il tuo posto per «{trip.title}» è confermato. Lo trovi anche nella tua dashboard.
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto px-4">
        <Link href={tripUrl} className="inline-flex items-center text-primary-700 hover:text-primary-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" /> Torna al viaggio
        </Link>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">Iscrizione al viaggio guidato</h1>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{trip.title}</h2>
              <p className="text-gray-600">Organizzato da {trip.organizerName}</p>
            </div>
            <p className="flex items-center text-gray-800">
              <CalendarDays className="w-5 h-5 mr-2" aria-hidden="true" /> {trip.dates}
            </p>
            <p className="flex items-center text-gray-800">
              <MapPin className="w-5 h-5 mr-2" aria-hidden="true" /> {trip.meetingPoint}
            </p>
            <div className="flex justify-between items-center border-t border-gray-100 pt-4">
              <span className="text-lg text-gray-700">Totale (1 partecipante)</span>
              <span className="text-3xl font-bold text-gray-900">{formatEuro(amount)}</span>
            </div>
            <p className="text-sm text-gray-600">
              Disdetta gratuita fino al {trip.selfCancellationLastDay} ({trip.cancellationNoticeDays} giorni prima della partenza): il posto torna
              libero e il rimborso viene eseguito dallo staff RideAtlas.
            </p>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 rounded-lg p-3" role="alert">
                <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" /> {error}
              </div>
            )}

            {step === 'review' && (
              trip.closedMessage ? (
                <button type="button" disabled className="w-full bg-gray-300 text-gray-700 text-lg font-bold py-4 rounded-xl cursor-not-allowed">
                  {trip.closedMessage}
                </button>
              ) : paymentMode === 'unavailable' ? (
                <p className="text-gray-700">I pagamenti non sono al momento disponibili. Riprova più tardi.</p>
              ) : (
                <button
                  type="button"
                  onClick={startRegistration}
                  disabled={loading}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white text-lg font-bold py-4 rounded-xl disabled:opacity-50"
                  data-testid="guided-trip-start-registration"
                >
                  {loading ? 'Prenotazione del posto…' : 'Prenota il posto e procedi al pagamento'}
                </button>
              )
            )}

            {step === 'payment' && registrationId && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-600 mb-4">Il posto è trattenuto per 15 minuti mentre completi il pagamento.</p>
                {paymentMode === 'stripe' ? (
                  <StripePaymentForm
                    purchaseId={registrationId}
                    amount={amount}
                    onSuccess={goToTripAfterSuccess}
                    onError={setError}
                    paymentIntentEndpoint={`/api/guided-trip-registrations/${registrationId}/payment-intent`}
                    confirmEndpoint={`/api/guided-trip-registrations/${registrationId}/confirm-payment`}
                  />
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4" data-testid="guided-trip-simulated-payment">
                    <p className="flex items-center font-semibold text-amber-900">
                      <FlaskConical className="w-5 h-5 mr-2" aria-hidden="true" /> Ambiente di prova: pagamento simulato
                    </p>
                    <p className="mt-1 text-sm text-amber-900">
                      Stripe non è configurato in questo ambiente. Nessun addebito reale verrà effettuato.
                    </p>
                    <button
                      type="button"
                      onClick={paySimulated}
                      disabled={loading}
                      className="mt-4 w-full bg-primary-600 hover:bg-primary-700 text-white text-lg font-bold py-4 rounded-xl disabled:opacity-50"
                    >
                      {loading ? 'Pagamento in corso…' : `Paga ${formatEuro(amount)} (simulato)`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
