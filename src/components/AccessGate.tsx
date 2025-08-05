'use client';

import { ReactNode } from 'react';
import { useTripAccess } from '@/hooks/useTripAccess';
import { Lock, ShoppingCart, User } from 'lucide-react';
import Link from 'next/link';

interface AccessGateProps {
  tripId: string;
  children: ReactNode;
  fallback?: ReactNode;
  showPreview?: boolean;
  premiumContentType?: string;
}

export default function AccessGate({ 
  tripId, 
  children, 
  fallback,
  showPreview = false,
  premiumContentType = "contenuto premium"
}: AccessGateProps) {
  const { accessInfo, loading, error } = useTripAccess(tripId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
        <span className="text-gray-600">Verifica accesso in corso...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Lock className="w-5 h-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Errore nel controllo accesso
            </h3>
            <div className="mt-2 text-sm text-red-700">
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (accessInfo?.canAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const PremiumContentPrompt = ({ reason }: { reason?: string }) => {
    if (reason === 'authentication_required') {
      return (
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <User className="w-6 h-6 text-blue-400" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                Accesso richiesto
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                È necessario effettuare il login per accedere a {premiumContentType}.
              </div>
              <div className="mt-4">
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Effettua il login
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ShoppingCart className="w-6 h-6 text-amber-500" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-amber-800">
              Contenuto Premium
            </h3>
            <div className="mt-2 text-sm text-amber-700">
              {accessInfo?.message || `Acquista questo viaggio per accedere a ${premiumContentType}.`}
            </div>
            {accessInfo?.price && (
              <div className="mt-2 text-lg font-semibold text-amber-800">
                €{accessInfo.price.toFixed(2)}
              </div>
            )}
            <div className="mt-4">
              <Link
                href={`/purchase/${tripId}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Acquista ora
              </Link>
            </div>
          </div>
        </div>
        
        {showPreview && (
          <div className="mt-4 pt-4 border-t border-amber-200">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-amber-50 via-transparent to-transparent z-10 pointer-events-none"></div>
              <div className="filter blur-sm opacity-60 pointer-events-none">
                {children}
              </div>
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-amber-300">
                  <Lock className="w-5 h-5 text-amber-600 mx-auto" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return <PremiumContentPrompt reason={accessInfo?.reason} />;
}