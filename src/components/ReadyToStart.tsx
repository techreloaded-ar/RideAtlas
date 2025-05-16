'use client';

import Link from 'next/link';
import { SignUpButton, useUser } from '@clerk/nextjs';

export default function ReadyToStart() {
  const { isSignedIn, isLoaded } = useUser();
  
  // Non mostrare nulla finché non sappiamo se l'utente è autenticato
  if (!isLoaded) return null;
  
  // Non mostrare nulla se l'utente è autenticato
  if (isSignedIn) return null;
  
  return (
    <section className="py-16 bg-secondary-700 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-6">Pronto a partire?</h2>
        <p className="text-xl max-w-2xl mx-auto mb-8">Iscriviti ora per accedere a itinerari esclusivi e iniziare a pianificare la tua prossima avventura in moto.</p>
        <SignUpButton mode="modal">
          <button className="btn-primary bg-white text-secondary-700 hover:bg-gray-100">
            Inizia Gratuitamente
          </button>
        </SignUpButton>
      </div>
    </section>
  );
}