'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, MapPin, Award, User, CreditCard, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import MockPaymentForm from '@/components/MockPaymentForm';

interface TripData {
  id: string;
  title: string;
  summary: string;
  destination: string;
  duration_days: number;
  duration_nights: number;
  theme: string;
  price: number;
  slug: string;
  media: unknown[];
  creator: {
    name: string;
  };
}

interface PurchasePageClientProps {
  trip: TripData;
}

export default function PurchasePageClient({ trip }: PurchasePageClientProps) {
  const router = useRouter();
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [step, setStep] = useState<'review' | 'payment' | 'success' | 'error'>('review');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartPurchase = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/trips/${trip.id}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante l\'avvio dell\'acquisto');
      }

      const data = await response.json();
      setPurchaseId(data.purchaseId);
      setStep('payment');

    } catch (err) {
      console.error('Errore nell\'avvio dell\'acquisto:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setStep('success');
    setTimeout(() => {
      router.push(`/trips/${trip.slug}?purchased=true`);
    }, 3000);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setStep('error');
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Acquisto completato!
              </h1>
              <p className="text-gray-600 mb-6">
                Hai acquistato con successo &quot;{trip.title}&quot;. 
                Ora puoi accedere a tutti i contenuti premium del viaggio.
              </p>
              <div className="text-sm text-gray-500">
                Reindirizzamento in corso...
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Errore nell&apos;acquisto
              </h1>
              <p className="text-gray-600 mb-6">
                {error || 'Si è verificato un errore durante l&apos;acquisto.'}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setStep('review');
                    setError(null);
                    setPurchaseId(null);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Riprova
                </button>
                <Link
                  href={`/trips/${trip.slug}`}
                  className="block w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-center"
                >
                  Torna al viaggio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'payment' && purchaseId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center">
                <button
                  onClick={() => setStep('review')}
                  className="mr-4 p-2 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-semibold">Pagamento</h1>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">{trip.title}</h3>
                <div className="text-2xl font-bold text-blue-600">
                  €{trip.price.toFixed(2)}
                </div>
              </div>

              <MockPaymentForm
                purchaseId={purchaseId}
                amount={trip.price}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                Acquista Viaggio
              </h1>
              <Link
                href={`/trips/${trip.slug}`}
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Torna al viaggio
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Dettagli del viaggio</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {trip.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {trip.summary}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    {trip.duration_days} giorni / {trip.duration_nights} notti
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    {trip.destination}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Award className="w-4 h-4 mr-1" />
                    {trip.theme}
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <User className="w-4 h-4 mr-1" />
                  Creato da: {trip.creator.name}
                </div>

                {trip.media && trip.media.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Anteprima media</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {trip.media.slice(0, 4).map((media: unknown, index: number) => {
                        const mediaItem = media as { url: string };
                        return (
                        <div key={index} className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={mediaItem.url}
                            alt={`Media ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Riepilogo acquisto</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Viaggio:</span>
                    <span className="font-medium">{trip.title}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Prezzo:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      €{trip.price.toFixed(2)}
                    </span>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <h3 className="font-medium text-blue-800 mb-2">
                      Cosa otterrai:
                    </h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Download del file GPX del percorso</li>
                      <li>• Accesso completo a mappe e dettagli</li>
                      <li>• Contenuti multimediali in alta qualità</li>
                      <li>• Approfondimenti e suggerimenti dell&apos;autore</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleStartPurchase}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Preparazione...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Procedi al pagamento
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    Il pagamento è sicuro e protetto. 
                    Potrai accedere immediatamente al contenuto dopo l&apos;acquisto.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}