/**
 * DraftAccessRestricted Component
 * 
 * Displays a generic informational message when users try to access draft trips
 * they don't have permission to view. Does not expose any trip details for security.
 */

'use client'

import { Clock, ArrowLeft, Home, Info } from 'lucide-react'
import Link from 'next/link'

export function DraftAccessRestricted() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Main content card */}
        <div className="bg-white shadow-sm border border-blue-200 rounded-xl p-8 text-center">
          {/* Icon with subtle animation */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-full p-4 shadow-sm">
              <Clock 
                className="w-12 h-12 text-blue-600 animate-pulse" 
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Main heading with better typography */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
            Viaggio in preparazione
          </h1>

          {/* Subtitle with improved contrast */}
          <p className="text-xl text-gray-700 mb-3 font-medium">
            Riprova più tardi
          </p>
          
          {/* Description with better readability */}
          <p className="text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
            Questo viaggio è ancora in fase di preparazione. Il ranger sta lavorando 
            sui dettagli e presto sarà disponibile per tutti.
          </p>

          {/* Enhanced navigation buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/trips"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-blue-300 text-blue-700 bg-white rounded-lg hover:bg-blue-50 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              aria-label="Torna alla lista dei viaggi"
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Torna ai viaggi
            </Link>
            
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              aria-label="Vai alla pagina principale"
            >
              <Home className="w-4 h-4 mr-2" aria-hidden="true" />
              Vai alla home
            </Link>
          </div>
        </div>

        {/* Enhanced helpful information section */}
        <div className="mt-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Cosa succede quando un viaggio è in preparazione?
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Il ranger sta completando i dettagli del percorso e verificando tutte le informazioni
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Vengono controllate le informazioni su tappe, punti di interesse e servizi disponibili
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Una volta completato, il viaggio sarà disponibile per tutti gli utenti
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle call-to-action */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Nel frattempo, puoi esplorare altri{' '}
            <Link 
              href="/trips" 
              className="text-blue-600 hover:text-blue-700 font-medium underline decoration-blue-300 hover:decoration-blue-500 transition-colors"
            >
              viaggi disponibili
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}