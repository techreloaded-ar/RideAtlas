'use client';

import { signOut } from 'next-auth/react';
import { useEffect } from 'react';
import Link from 'next/link';

export default function SignOut() {
  useEffect(() => {
    // Auto-signout dopo 3 secondi
    const timer = setTimeout(() => {
      signOut({ callbackUrl: '/' });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <Link href="/" className="flex justify-center">
            <h1 className="text-3xl font-display font-bold text-primary-700">
              RideAtlas
            </h1>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Disconnessione in corso...
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sarai reindirizzato alla home page
          </p>
        </div>

        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Disconnetti ora
          </button>

          <Link 
            href="/"
            className="block text-primary-600 hover:text-primary-500 text-sm font-medium"
          >
            ← Torna alla home
          </Link>
        </div>
      </div>
    </div>
  );
}
