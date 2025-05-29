'use client';

import { useSession, signIn } from 'next-auth/react';

export default function ReadyToStart() {
  const { data: session, status } = useSession();
  
  // Non mostrare nulla finché non sappiamo se l'utente è autenticato
  if (status === 'loading') return null;
  
  // Non mostrare nulla se l'utente è autenticato
  if (session) return null;
  
  return (
    <section className="py-16 bg-primary-700 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-6">Pronto a partire?</h2>
        <p className="text-xl max-w-2xl mx-auto mb-4">Iscriviti ora per accedere a itinerari esclusivi e iniziare a pianificare la tua prossima avventura in moto.</p>
        <p className="text-lg text-primary-200 italic font-medium mb-8">
          "Il viaggio lo progettiamo insieme, tu guidi l'avventura"
        </p>
        <button
          onClick={() => signIn('google')}
          className="btn-primary bg-white text-primary-700 hover:bg-gray-100"
        >
          Inizia Gratuitamente
        </button>
      </div>
    </section>
  );
}