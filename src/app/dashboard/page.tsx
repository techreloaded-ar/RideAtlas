'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function Dashboard() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center space-x-4 mb-6">
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Benvenuto, {session.user?.name || 'Utente'}!
                </h1>
                <p className="text-gray-600">{session.user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link 
                href="/create-trip"
                className="p-6 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
              >
                <h3 className="text-lg font-semibold text-primary-900 mb-2">
                  Crea Nuovo Viaggio
                </h3>
                <p className="text-primary-700">
                  Inizia a pianificare la tua prossima avventura in moto
                </p>
              </Link>

              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  I Tuoi Viaggi
                </h3>
                <p className="text-gray-600">
                  Visualizza e gestisci i tuoi viaggi salvati
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Funzione in arrivo...
                </p>
              </div>

              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Statistiche
                </h3>
                <p className="text-gray-600">
                  Traccia i tuoi viaggi e le tue avventure
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Funzione in arrivo...
                </p>
              </div>
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Migrazione completata!
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    L'autenticazione è ora gestita da NextAuth.js con Google OAuth. 
                    Puoi iniziare a creare i tuoi viaggi in moto!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
