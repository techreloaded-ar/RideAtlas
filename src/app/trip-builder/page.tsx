// src/app/trip-builder/page.tsx
"use client";


import { useSession } from 'next-auth/react';
import { MessageSquare, Route, MapPin, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';
import TripBuilderChat from '@/components/trip-builder/TripBuilderChat';
import { UserRole } from '@/types/profile';

export default function TripBuilderPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-gray-50">
        <section className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <div className="flex items-center justify-center mb-6">
                <MessageSquare className="w-12 h-12 mr-4" />
                <h1 className="text-4xl md:text-5xl font-display font-bold">
                  Trip Builder AI
                </h1>
              </div>
              <p className="text-xl text-primary-100 mb-6">
                Il tuo assistente esperto per pianificare viaggi in moto personalizzati
              </p>
            </div>
          </div>
        </section>
        <section className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Accesso Richiesto
              </h2>
              <p className="text-gray-600 mb-6">
                Per utilizzare il Trip Builder AI e accedere a tutti i viaggi disponibili,
                è necessario effettuare l&apos;accesso al tuo account.
              </p>
              <a
                href="/auth/signin"
                className="btn-primary inline-flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Accedi per iniziare
              </a>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (session.user.role !== UserRole.Sentinel) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Accesso Non Autorizzato
          </h2>
          <p className="text-gray-600 mb-6">
            Questa funzionalità è riservata agli amministratori del sistema.
          </p>
          <a
            href="/"
            className="btn-primary inline-flex items-center gap-2"
          >
            Torna alla Home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <MessageSquare className="w-12 h-12 mr-4" />
              <h1 className="text-4xl md:text-5xl font-display font-bold">
                Trip Builder AI
              </h1>
            </div>
            <p className="text-xl text-primary-100 mb-6">
              Il tuo assistente esperto per pianificare viaggi in moto personalizzati
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <Route className="w-8 h-8 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Itinerari Intelligenti</h3>
                <p className="text-sm text-primary-100">
                  Combina più viaggi per creare il percorso perfetto
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <MapPin className="w-8 h-8 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Conoscenza Locale</h3>
                <p className="text-sm text-primary-100">
                  Accesso a tutti i viaggi e tracce GPX del sistema
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Avvisi Intelligenti</h3>
                <p className="text-sm text-primary-100">
                  Notifiche per distanze superiori a 30km tra viaggi
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <TripBuilderChat />
        </div>
      </section>

      {/* How it works section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Come Funziona
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Il nostro AI analizza tutti i viaggi disponibili per creare itinerari personalizzati
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Descrivi il tuo viaggio</h3>
              <p className="text-gray-600">
                Racconta all&apos;AI dove vuoi andare, quanto tempo hai e che tipo di esperienza cerchi
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Analisi intelligente</h3>
              <p className="text-gray-600">
                L&apos;AI analizza tutti i viaggi e le tracce GPX per trovare le migliori combinazioni
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Itinerario personalizzato</h3>
              <p className="text-gray-600">
                Ricevi un itinerario completo con collegamenti tra viaggi e avvisi per le distanze
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
