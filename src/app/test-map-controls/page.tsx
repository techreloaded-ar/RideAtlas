'use client'

import { useState } from 'react'
import { MapWithFullscreen } from '@/components/maps'
import { GPXPoint, GPXRoute, GPXWaypoint } from '@/types/gpx'

// Dati di esempio per testare i controlli
const sampleGPXData: GPXPoint[] = [
  { lat: 45.0642, lng: 7.6677, elevation: 239 }, // Torino
  { lat: 45.0702, lng: 7.6862, elevation: 245 },
  { lat: 45.0772, lng: 7.7025, elevation: 251 },
  { lat: 45.0835, lng: 7.7195, elevation: 258 },
  { lat: 45.0892, lng: 7.7345, elevation: 264 }
]

const sampleRoutes: GPXRoute[] = [
  {
    name: "Percorso consigliato",
    points: [
      { lat: 45.0642, lng: 7.6677, elevation: 239 },
      { lat: 45.0750, lng: 7.6900, elevation: 250 },
      { lat: 45.0850, lng: 7.7100, elevation: 260 },
      { lat: 45.0900, lng: 7.7200, elevation: 265 }
    ]
  }
]

const sampleWaypoints: GPXWaypoint[] = [
  { lat: 45.0642, lng: 7.6677, name: "Partenza", elevation: 239 },
  { lat: 45.0835, lng: 7.7195, name: "Punto panoramico", elevation: 258 },
  { lat: 45.0892, lng: 7.7345, name: "Arrivo", elevation: 264 }
]

export default function TestMapControlsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Test Controlli Mappa GPX
          </h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Mappa con tutti i controlli layer attivi
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Questa mappa include traccia GPS (blu), percorsi consigliati (rosso tratteggiato) e waypoints (arancione).
                Usa i controlli nella barra di navigazione per mostrare/nascondere i diversi layer.
                Clicca sull'icona fullscreen nel footer per aprire la mappa in modalità fullscreen.
              </p>
              
              <MapWithFullscreen
                gpxData={sampleGPXData}
                routes={sampleRoutes}
                waypoints={sampleWaypoints}
                title="Tracciato di esempio - Torino"
                height="h-96"
                showControls={true}
                enableDownload={true}
                showLayerControls={true}
                defaultShowTrack={true}
                defaultShowRoutes={true}
                defaultShowWaypoints={true}
                onDownload={() => {
                  console.log('Download richiesto')
                  alert('Funzionalità download attivata!')
                }}
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Mappa con controlli parziali
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Questa mappa mostra inizialmente solo la traccia GPS e i waypoints, nascondendo le rotte.
              </p>
              
              <MapWithFullscreen
                gpxData={sampleGPXData}
                routes={sampleRoutes}
                waypoints={sampleWaypoints}
                title="Configurazione personalizzata"
                height="h-80"
                showControls={false}
                showLayerControls={true}
                defaultShowTrack={true}
                defaultShowRoutes={false}
                defaultShowWaypoints={true}
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Mappa senza controlli layer (versione classica)
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Questa mappa mostra tutti gli elementi senza possibilità di nasconderli.
              </p>
              
              <MapWithFullscreen
                gpxData={sampleGPXData}
                routes={sampleRoutes}
                waypoints={sampleWaypoints}
                title="Visualizzazione completa"
                height="h-80"
                showControls={true}
                showLayerControls={false}
                defaultShowTrack={true}
                defaultShowRoutes={true}
                defaultShowWaypoints={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
