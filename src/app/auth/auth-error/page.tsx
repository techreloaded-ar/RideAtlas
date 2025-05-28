'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, { title: string; description: string }> = {
    Configuration: {
      title: 'Errore di configurazione',
      description: 'C&apos;è un problema con la configurazione del server. Riprova più tardi.'
    },
    AccessDenied: {
      title: 'Accesso negato',
      description: 'Non hai i permessi per accedere a questa risorsa.'
    },
    Verification: {
      title: 'Errore di verifica',
      description: 'Il token di verifica non è valido o è scaduto.'
    },
    Default: {
      title: 'Errore di autenticazione',
      description: 'Si è verificato un errore durante l&apos;autenticazione. Riprova.'
    }
  };

  const errorInfo = errorMessages[error || 'Default'] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link href="/" className="flex justify-center">
            <h1 className="text-3xl font-display font-bold text-primary-700">
              RideAtlas
            </h1>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-red-600">
            {errorInfo.title}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {errorInfo.description}
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Dettagli errore
              </h3>
              <div className="mt-2 text-sm text-red-700">
                Codice errore: {error || 'Unknown'}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            href="/auth/signin"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Riprova l&apos;accesso
          </Link>

          <Link 
            href="/"
            className="block text-center text-primary-600 hover:text-primary-500 text-sm font-medium"
          >
            ← Torna alla home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={<div>Caricamento...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}