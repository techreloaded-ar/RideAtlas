'use client';

import { signIn, getProviders } from 'next-auth/react';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Provider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

function SignInContent() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(
    null
  );
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [credentialsError, setCredentialsError] = useState('');
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    const setAuthProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    setAuthProviders();
  }, []);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setCredentialsError('');

    const result = await signIn('credentials', {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });

    if (result?.error) {
      if (result.error === 'EmailNotVerified') {
        setCredentialsError(
          'Email non verificata. Controlla la tua casella di posta per il link di verifica.'
        );
      } else if (result.error === 'PasswordSetupRequired') {
        setCredentialsError(
          'È necessario impostare la password. Controlla la tua email per il link di configurazione.'
        );
      } else {
        setCredentialsError('Email o password non corretti');
      }
      setIsLoading(false);
    } else if (result?.ok) {
      // Se il login è riuscito, reindirizza manualmente
      window.location.href = '/dashboard';
    }
  };

  const errorMessages: Record<string, string> = {
    Signin: "Prova a effettuare l'accesso con un account diverso.",
    OAuthSignin: "Prova a effettuare l'accesso con un account diverso.",
    OAuthCallback: "Prova a effettuare l'accesso con un account diverso.",
    OAuthCreateAccount: "Prova a effettuare l'accesso con un account diverso.",
    EmailCreateAccount: "Prova a effettuare l'accesso con un account diverso.",
    Callback: "Prova a effettuare l'accesso con un account diverso.",
    OAuthAccountNotLinked:
      'Per confermare la tua identità, accedi con lo stesso account che hai utilizzato in origine.',
    EmailSignin: 'Controlla la tua email per il link di accesso.',
    CredentialsSignin:
      'Accesso fallito. Controlla che i dettagli che hai fornito siano corretti.',
    SessionRequired: "Effettua l'accesso per accedere a questa pagina.",
    'email-verified': 'Email verificata con successo! Ora puoi accedere.',
    'password-reset-success':
      'Password reimpostata con successo! Ora puoi accedere con la nuova password.',
    default: "Si è verificato un errore durante l'accesso.",
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <Link href='/' className='flex justify-center'>
            <h1 className='text-3xl font-display font-bold text-primary-700'>
              RideAtlas
            </h1>
          </Link>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
            Accedi al tuo account
          </h2>
          <p className='mt-2 text-center text-sm text-gray-600'>
            Inizia a pianificare la tua prossima avventura in moto
          </p>
        </div>

        {(error || credentialsError) && (
          <div
            className={`border rounded-md p-4 ${
              ['email-verified', 'password-reset-success'].includes(
                searchParams.get('message') || ''
              )
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div
              className={`text-sm ${
                ['email-verified', 'password-reset-success'].includes(
                  searchParams.get('message') || ''
                )
                  ? 'text-green-800'
                  : 'text-red-800'
              }`}
            >
              {searchParams.get('message') &&
              errorMessages[searchParams.get('message')!]
                ? errorMessages[searchParams.get('message')!]
                : credentialsError ||
                  errorMessages[error!] ||
                  errorMessages.default}
            </div>
          </div>
        )}

        {['email-verified', 'password-reset-success'].includes(
          searchParams.get('message') || ''
        ) &&
          !error &&
          !credentialsError && (
            <div className='bg-green-50 border border-green-200 rounded-md p-4'>
              <div className='text-green-800 text-sm'>
                {errorMessages[searchParams.get('message')!]}
              </div>
            </div>
          )}

        <form className='mt-8 space-y-6' onSubmit={handleCredentialsSubmit}>
          <div className='space-y-4'>
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-gray-700'
              >
                Email
              </label>
              <input
                id='email'
                name='email'
                type='email'
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className='mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm'
                placeholder='la-tua-email@esempio.com'
              />
            </div>

            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700'
              >
                Password
              </label>
              <input
                id='password'
                name='password'
                type='password'
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className='mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm'
                placeholder='La tua password'
              />
            </div>
          </div>

          <div>
            <button
              type='submit'
              disabled={isLoading}
              className='group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {isLoading ? 'Accesso...' : 'Accedi'}
            </button>
          </div>
        </form>

        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t border-gray-300' />
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='px-2 bg-gray-50 text-gray-500'>oppure</span>
          </div>
        </div>

        <div className='space-y-4'>
          {providers &&
            Object.values(providers).map((provider) => {
              if (provider.name === 'Google') {
                return (
                  <button
                    key={provider.name}
                    onClick={() =>
                      signIn(provider.id, { callbackUrl: '/dashboard' })
                    }
                    className='group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors'
                  >
                    <svg className='w-5 h-5 mr-2' viewBox='0 0 24 24'>
                      <path
                        fill='currentColor'
                        d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                      />
                      <path
                        fill='currentColor'
                        d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                      />
                      <path
                        fill='currentColor'
                        d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                      />
                      <path
                        fill='currentColor'
                        d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                      />
                    </svg>
                    Accedi con {provider.name}
                  </button>
                );
              }
              return null;
            })}
        </div>

        <div className='text-center space-y-2'>
          <Link
            href='/auth/forgot-password'
            className='text-primary-600 hover:text-primary-500 text-sm font-medium block'
          >
            Password dimenticata?
          </Link>
          <p className='text-sm text-gray-600'>
            Non hai ancora un account?{' '}
            <Link
              href='/auth/register'
              className='text-primary-600 hover:text-primary-500 font-medium'
            >
              Registrati qui
            </Link>
          </p>
          <Link
            href='/'
            className='text-primary-600 hover:text-primary-500 text-sm font-medium block'
          >
            ← Torna alla home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<div>Caricamento...</div>}>
      <SignInContent />
    </Suspense>
  );
}
