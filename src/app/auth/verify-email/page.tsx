'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token di verifica mancante');
      return;
    }

    // Verifica il token
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(response => response.json())
      .then(data => {
        if (data.verified) {
          setStatus('success');
          setMessage('Email verificata con successo!');
          // Reindirizza alla pagina di login dopo 3 secondi
          setTimeout(() => {
            router.push('/auth/signin?message=email-verified');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Errore durante la verifica');
        }
      })
      .catch(error => {
        console.error('Errore verifica:', error);
        setStatus('error');
        setMessage('Errore durante la verifica dell\'email');
      });
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-12 px-6 shadow-xl rounded-2xl sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6">
              {status === 'loading' && (
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              )}
              {status === 'success' && (
                <CheckCircle className="h-8 w-8 text-green-600" />
              )}
              {status === 'error' && (
                <XCircle className="h-8 w-8 text-red-600" />
              )}
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {status === 'loading' && 'Verifica in corso...'}
              {status === 'success' && 'Email Verificata!'}
              {status === 'error' && 'Verifica Fallita'}
            </h2>

            <p className="text-sm text-gray-600 mb-8">
              {status === 'loading' && 'Stiamo verificando il tuo indirizzo email...'}
              {status === 'success' && 'Il tuo account è stato attivato con successo.'}
              {status === 'error' && message}
            </p>

            {status === 'success' && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    Sarai reindirizzato alla pagina di accesso tra pochi secondi...
                  </p>
                </div>
                <Link
                  href="/auth/signin"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  Accedi Ora
                </Link>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    {message.includes('scaduto') && (
                      <>
                        Il link di verifica è scaduto. 
                        <br />
                        Registrati nuovamente per ricevere un nuovo link.
                      </>
                    )}
                    {!message.includes('scaduto') && message}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Link
                    href="/auth/register"
                    className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    Registrati
                  </Link>
                  <Link
                    href="/auth/signin"
                    className="flex-1 flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    Accedi
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link
                href="/"
                className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
              >
                ← Torna alla homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-12 px-6 shadow-xl rounded-2xl sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Caricamento...</h2>
              <p className="text-sm text-gray-600 mb-8">Stiamo preparando la verifica...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
