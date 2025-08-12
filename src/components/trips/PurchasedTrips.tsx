'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ShoppingCart, Calendar, MapPin, Clock, Award, Download } from 'lucide-react';

interface PurchasedTrip {
  id: string;
  amount: number;
  status: string;
  purchasedAt: string;
  paymentMethod: string;
  trip: {
    id: string;
    title: string;
    slug: string;
    destination: string;
    duration_days: number;
    theme: string;
    created_at: string;
  };
}

export default function PurchasedTrips() {
  const { data: session, status } = useSession();
  const [purchases, setPurchases] = useState<PurchasedTrip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchPurchases();
    }
  }, [status, session?.user?.id]);

  const fetchPurchases = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/purchases');
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento degli acquisti');
      }

      const data = await response.json();
      setPurchases(data.purchases || []);

    } catch (err) {
      console.error('Errore nel caricamento degli acquisti:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <ShoppingCart className="w-5 h-5 text-green-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Viaggi Acquistati</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mr-3"></div>
          <span className="text-gray-600">Caricamento...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center mb-4">
          <ShoppingCart className="w-5 h-5 text-green-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Viaggi Acquistati</h2>
        </div>
        <div className="text-red-600 text-center py-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ShoppingCart className="w-5 h-5 text-green-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Viaggi Acquistati</h2>
          </div>
          {purchases.length > 0 && (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {purchases.length} {purchases.length === 1 ? 'viaggio' : 'viaggi'}
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        {purchases.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessun viaggio acquistato
            </h3>
            <p className="text-gray-500 mb-4">
              Non hai ancora acquistato nessun viaggio. Scopri i viaggi disponibili e inizia la tua avventura!
            </p>
            <Link
              href="/trips"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
            >
              Esplora viaggi
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <div key={purchase.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <Link
                        href={`/trips/${purchase.trip.slug}`}
                        className="text-lg font-medium text-gray-900 hover:text-blue-600"
                      >
                        {purchase.trip.title}
                      </Link>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          €{purchase.amount.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(purchase.purchasedAt).toLocaleDateString('it-IT', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {purchase.trip.duration_days} giorni
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {purchase.trip.destination}
                      </div>
                      <div className="flex items-center">
                        <Award className="w-4 h-4 mr-1" />
                        {purchase.trip.theme}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        Acquistato il {new Date(purchase.purchasedAt).toLocaleDateString('it-IT')}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/api/trips/${purchase.trip.id}/gpx`}
                          className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Scarica GPX
                        </Link>
                        <Link
                          href={`/trips/${purchase.trip.slug}`}
                          className="inline-flex items-center px-3 py-1 bg-gray-600 text-white text-xs font-medium rounded hover:bg-gray-700"
                        >
                          Vedi dettagli
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {purchases.length > 0 && (
              <div className="text-center pt-4 border-t">
                <Link
                  href="/trips"
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  Scopri altri viaggi →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}