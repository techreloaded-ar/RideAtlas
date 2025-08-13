'use client';

import { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email non valida'),
});

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    // Validazione client-side
    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setError('Inserisci un indirizzo email valido');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setEmail(''); // Pulisci il form
      } else {
        setError(data.error || 'Si è verificato un errore');
      }
    } catch (error) {
      console.error('Errore richiesta reset password:', error);
      setError('Si è verificato un errore di connessione');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link href="/" className="flex justify-center">
            <h1 className="text-3xl font-display font-bold text-primary-700">
              RideAtlas
            </h1>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Password dimenticata?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Inserisci la tua email e ti invieremo un link per reimpostare la password
          </p>
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="text-green-800 text-sm">
              {message}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800 text-sm">
              {error}
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Indirizzo Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="la-tua-email@esempio.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Invio in corso...' : 'Invia link di reset'}
            </button>
          </div>
        </form>

        <div className="text-center space-y-2">
          <Link 
            href="/auth/signin"
            className="text-primary-600 hover:text-primary-500 text-sm font-medium"
          >
            ← Torna al login
          </Link>
          <p className="text-sm text-gray-600">
            Non hai ancora un account?{' '}
            <Link 
              href="/auth/register"
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Registrati qui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}