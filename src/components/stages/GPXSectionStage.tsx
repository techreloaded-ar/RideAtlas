'use client';

import { Download, Route, MapPin, Mountain } from 'lucide-react';
import { useGPXMap } from '@/hooks/maps/useGPXMap';
import { useEffect, useMemo, useState } from 'react';
import SafeGPXMapViewer from '@/components/maps/SafeGPXMapViewer';

interface GPXSectionStageProps {
  gpxUrl: string;
  filename: string;
  onDownload?: () => void;
}

export default function GPXSectionStage({
  gpxUrl,
  filename,
  onDownload,
}: GPXSectionStageProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isLoading, error, loadGPXFromUrl, tracks, routes, waypoints } =
    useGPXMap();

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

  const handleFullscreenOpen = () => {
    setIsFullscreen(true);
  };

  const handleFullscreenClose = () => {
    setIsFullscreen(false);
  };

  // Gestione tasto ESC per chiudere fullscreen
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isFullscreen]);

  // Calcola la distanza totale dai metadati - Memoizzato per performance
  const totalDistance = useMemo(() => {
    return tracks.reduce((total, track) => {
      let trackDistance = 0;
      for (let i = 1; i < track.points.length; i++) {
        const prev = track.points[i - 1];
        const curr = track.points[i];
        // Calcolo haversine semplificato
        const R = 6371;
        const dLat = ((curr.lat - prev.lat) * Math.PI) / 180;
        const dLon = ((curr.lng - prev.lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((prev.lat * Math.PI) / 180) *
            Math.cos((curr.lat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        trackDistance += R * c;
      }
      return total + trackDistance;
    }, 0);
  }, [tracks]);

  if (isLoading) {
    return (
      <div className='mb-6'>
        <div className='bg-blue-50 border border-blue-100 rounded-lg p-6'>
          <div className='flex items-center justify-center h-32'>
            <div className='text-blue-600'>Caricamento traccia GPX...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='mb-6'>
        <div className='bg-red-50 border border-red-100 rounded-lg p-6'>
          <div className='flex items-center justify-center h-32'>
            <div className='text-red-600'>Errore nel caricamento: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='mb-6'>
      {/* Header separato con titolo e bottone download */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2'>
          <Download className='w-5 h-5 text-gray-600' />
          <h3 className='text-lg font-semibold text-gray-900'>Traccia GPX</h3>
        </div>
        <button
          onClick={handleDownload}
          className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          aria-label={`Scarica traccia GPX ${filename}`}
        >
          <Download className='w-4 h-4' aria-hidden='true' />
          Download
        </button>
      </div>

      {/* Container blu con layout a due colonne */}
      <div className='bg-blue-50 border border-blue-100 rounded-lg p-4'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 h-48'>
          {/* Colonna sinistra: Metriche + Filename - 2/3 dello spazio */}
          <div className='flex flex-col justify-between lg:col-span-2'>
            {/* Sezione metriche */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {/* Distanza */}
              <div className='flex items-center gap-3'>
                <div className='bg-blue-100 p-2 rounded-lg'>
                  <Route className='w-6 h-6 text-blue-600' aria-hidden='true' />
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Distanza</p>
                  <p className='text-2xl font-medium text-blue-600'>
                    {totalDistance > 0
                      ? `${totalDistance.toFixed(1)} km`
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Waypoints */}
              <div className='flex items-center gap-3'>
                <div className='bg-blue-100 p-2 rounded-lg'>
                  <MapPin
                    className='w-6 h-6 text-blue-600'
                    aria-hidden='true'
                  />
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Waypoints</p>
                  <p className='text-2xl font-medium text-blue-600'>
                    {waypoints.length.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Filename separato con border */}
            <div className='border-t border-gray-200 pt-4 mt-4'>
              <div className='flex items-center gap-2 text-sm text-gray-600'>
                <Mountain className='w-4 h-4' />
                <span className='font-mono'>{filename}</span>
              </div>
            </div>
          </div>

          {/* Colonna destra: Mappa preview - 1/3 dello spazio */}
          <div className='w-full h-full lg:col-span-1'>
            {tracks.length > 0 && (
              <SafeGPXMapViewer
                tracks={tracks}
                routes={routes}
                waypoints={waypoints}
                height='h-full'
                showControls={false}
                enableFullscreen={true}
                onFullscreenClick={handleFullscreenOpen}
                autoFit={true}
                className='rounded-lg overflow-hidden'
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal Fullscreen */}
      {isFullscreen && (
        <div className='fixed inset-0 z-[9999] bg-black bg-opacity-75 flex items-center justify-center'>
          <div className='w-full h-full max-w-full max-h-full p-4'>
            <SafeGPXMapViewer
              tracks={tracks}
              routes={routes}
              waypoints={waypoints}
              height='h-full'
              showControls={false}
              enableFullscreen={false}
              isFullscreenMode={true}
              onFullscreenClose={handleFullscreenClose}
              autoFit={true}
              showLayerControls={true}
              className='rounded-lg overflow-hidden'
            />
          </div>
        </div>
      )}
    </div>
  );
}
