'use client';

import { Download, Route, MapPin, Mountain } from 'lucide-react';
import { useGPXMap } from '@/hooks/useGPXMap';
import { useEffect } from 'react';
import UnifiedGPXMapViewer from '@/components/UnifiedGPXMapViewer';

interface GPXSectionStageProps {
  gpxUrl: string;
  filename: string;
  onDownload?: () => void;
}

export default function GPXSectionStage({
  gpxUrl,
  filename,
  onDownload
}: GPXSectionStageProps) {
  const {
    metadata,
    isLoading,
    error,
    loadGPXFromUrl,
    tracks,
    routes,
    waypoints
  } = useGPXMap();

  useEffect(() => {
    if (gpxUrl) {
      loadGPXFromUrl(gpxUrl);
    }
  }, [gpxUrl, loadGPXFromUrl]);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Fallback per download diretto
      const link = document.createElement('a');
      link.href = gpxUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Calcola la distanza totale dai metadati
  const totalDistance = tracks.reduce((total, track) => {
    let trackDistance = 0;
    for (let i = 1; i < track.points.length; i++) {
      const prev = track.points[i - 1];
      const curr = track.points[i];
      // Calcolo haversine semplificato
      const R = 6371;
      const dLat = (curr.lat - prev.lat) * Math.PI / 180;
      const dLon = (curr.lng - prev.lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      trackDistance += R * c;
    }
    return total + trackDistance;
  }, 0);

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-blue-600">Caricamento traccia GPX...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6">
        <div className="bg-red-50 border border-red-100 rounded-lg p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-red-600">Errore nel caricamento: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Header separato con titolo e bottone download */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Traccia GPX</h3>
        </div>
        <button
          onClick={handleDownload}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>

      {/* Container blu con le informazioni */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
        <div className="flex gap-6 h-32">
          {/* Sezione metriche */}
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-8 h-full">
              {/* Distanza */}
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Route className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Distanza</p>
                  <p className="text-2xl font-medium text-blue-600">
                    {totalDistance > 0 ? `${totalDistance.toFixed(1)} km` : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Waypoints (punti traccia) */}
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Punti traccia</p>
                  <p className="text-2xl font-medium text-blue-600">
                    {metadata.totalPoints.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mappa preview */}
          <div className="w-48 flex-shrink-0">
            {tracks.length > 0 && (
              <UnifiedGPXMapViewer
                tracks={tracks}
                routes={routes}
                waypoints={waypoints}
                height="h-32"
                showControls={false}
                enableFullscreen={false}
                autoFit={true}
                className="rounded-lg overflow-hidden"
              />
            )}
          </div>
        </div>

        {/* Filename separato con border */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mountain className="w-4 h-4" />
            <span className="font-mono">{filename}</span>
          </div>
        </div>
      </div>
    </div>
  );
}