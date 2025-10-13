// src/app/ranger/[username]/not-found.tsx
import Link from 'next/link';

export default function RangerNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Profilo non trovato
          </h2>
          <p className="text-gray-600">
            Il profilo Ranger che stai cercando non esiste o non è disponibile.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Questo può accadere se:
          </p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• Il nome utente è stato scritto in modo errato</li>
            <li>• L&apos;account non esiste più</li>
            <li>• L&apos;utente non ha il ruolo di Ranger</li>
          </ul>
        </div>

        <div className="mt-8">
          <Link
            href="/trips"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Torna all&apos;elenco viaggi
          </Link>
        </div>
      </div>
    </div>
  );
}
