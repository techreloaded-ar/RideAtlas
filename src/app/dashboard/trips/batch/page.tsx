// src/app/dashboard/trips/batch/page.tsx
"use client"

import { useState } from 'react'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { BatchUploadForm } from '@/components/trips/BatchUploadForm'
import { BatchProgressMonitor } from '@/components/trips/BatchProgressMonitor'
import { BatchProcessingResult } from '@/schemas/batch-trip'

type PageState = 'upload' | 'monitoring' | 'completed'

export default function BatchUploadPage() {
  const [pageState, setPageState] = useState<PageState>('upload')
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [completedResult, setCompletedResult] = useState<BatchProcessingResult | null>(null)

  const handleUploadStart = (jobId: string) => {
    setCurrentJobId(jobId)
    setPageState('monitoring')
    setUploadError(null)
  }

  const handleUploadError = (error: string) => {
    setUploadError(error)
    setCurrentJobId(null)
  }

  const handleProcessingComplete = (result: BatchProcessingResult) => {
    setCompletedResult(result)
    setPageState('completed')
  }

  const handleProcessingError = (error: string) => {
    // If it's a job expired error, show a more helpful message
    if (error.includes('Job scaduto') || error.includes('server riavviato')) {
      setUploadError('Il job è scaduto o il server è stato riavviato. I job vengono mantenuti solo durante la sessione del server. Riprova l\'upload.')
    } else {
      setUploadError(error)
    }
    setPageState('upload')
    setCurrentJobId(null)
  }

  const resetToUpload = () => {
    setPageState('upload')
    setCurrentJobId(null)
    setUploadError(null)
    setCompletedResult(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard/trips"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Torna ai viaggi
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Caricamento Batch Viaggi
          </h1>
          <p className="mt-2 text-gray-600">
            Carica più viaggi contemporaneamente utilizzando un file ZIP strutturato
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            {pageState === 'upload' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Seleziona il file ZIP
                  </h2>
                  <p className="text-gray-600">
                    Assicurati che il tuo ZIP contenga viaggi.json e le cartelle strutturate
                  </p>
                </div>
                
                <BatchUploadForm
                  onUploadStart={handleUploadStart}
                  onError={handleUploadError}
                />
                
                {uploadError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <h3 className="text-sm font-medium text-red-800">
                      Errore nel caricamento
                    </h3>
                    <p className="mt-1 text-sm text-red-700">{uploadError}</p>
                  </div>
                )}
              </div>
            )}

            {pageState === 'monitoring' && currentJobId && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Processamento in corso
                  </h2>
                  <p className="text-gray-600">
                    Il tuo batch è in elaborazione. Questo potrebbe richiedere alcuni minuti.
                  </p>
                </div>
                
                <BatchProgressMonitor
                  jobId={currentJobId}
                  onComplete={handleProcessingComplete}
                  onError={handleProcessingError}
                />
              </div>
            )}

            {pageState === 'completed' && completedResult && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {completedResult.errors.length > 0 ? 'Completato con errori' : 'Caricamento completato!'}
                  </h2>
                  <p className="text-gray-600">
                    {completedResult.errors.length > 0
                      ? 'Alcuni viaggi sono stati creati, ma ci sono stati degli errori'
                      : 'Tutti i viaggi sono stati caricati con successo'
                    }
                  </p>
                </div>
                
                {/* Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Riepilogo</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Totale viaggi:</span>
                      <div className="font-medium">{completedResult.totalTrips}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Processati:</span>
                      <div className="font-medium text-green-600">{completedResult.processedTrips}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Creati:</span>
                      <div className="font-medium text-green-600">{completedResult.createdTripIds.length}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Errori:</span>
                      <div className={`font-medium ${completedResult.errors.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {completedResult.errors.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/dashboard/trips"
                    className="px-6 py-3 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 text-center"
                  >
                    Vai ai tuoi viaggi
                  </Link>
                  <button
                    onClick={resetToUpload}
                    className="px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
                  >
                    Carica altro batch
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Documentation */}
        <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Documentazione struttura ZIP
          </h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">1. File viaggi.json</h4>
              <p className="text-sm text-gray-600 mb-2">
                Contiene i metadati di tutti i viaggi. Per un singolo viaggio:
              </p>
              <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs overflow-x-auto">
{`{
  "title": "Giro delle Dolomiti",
  "summary": "Descrizione del viaggio...",
  "destination": "Dolomiti, Trentino-Alto Adige",
  "theme": "Montagna e natura",
  "characteristics": ["Curve strette", "Bel paesaggio"],
  "recommended_seasons": ["Estate", "Autunno"],
  "tags": ["dolomiti", "montagna"],
  "travelDate": "2024-07-15",
  "stages": [
    {
      "title": "Bolzano - Ortisei",
      "description": "Prima tappa...",
      "routeType": "Strada statale",
      "duration": "2 ore"
    }
  ]
}`}
              </pre>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">2. Struttura cartelle</h4>
              <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs">
{`viaggio.zip
├── viaggi.json
├── main.gpx (opzionale)
├── media/
│   ├── hero.jpg
│   └── altre-foto.jpg
└── tappe/
    ├── 01-bolzano-ortisei/
    │   ├── tappa.gpx
    │   └── media/
    └── 02-ortisei-cortina/
        ├── tappa.gpx
        └── media/`}
              </pre>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">3. Convenzioni</h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Le cartelle tappe devono essere numerate: 01-, 02-, 03-...</li>
                <li>La prima immagine in /media/ diventa automaticamente l&apos;immagine hero</li>
                <li>I file GPX sono opzionali ma consigliati</li>
                <li>Formati supportati: JPG, PNG, MP4, MOV per i media</li>
                <li>Dimensione massima ZIP: 100MB</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}