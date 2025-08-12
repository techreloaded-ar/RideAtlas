import { useState } from 'react';
import { MapIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { DocumentIcon } from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import { GpxFile } from '@/schemas/trip';

const GPXMapViewer = dynamic(() => import('@/components/maps/GPXMapViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-lg">
      <div className="text-gray-500">Caricamento mappa...</div>
    </div>
  )
});

interface GpxDisplayProps {
  gpxFile: GpxFile | null | undefined;
  isLoading?: boolean;
}

// Costanti per evitare magic numbers
const METERS_TO_KM = 1000;

// Tipo per i metadati del GPX
interface GpxMetadataItem {
  label: string;
  value: string;
  condition: boolean;
}

// Componente per visualizzare i metadati del file GPX
const GpxMetadata = ({ gpxFile }: { gpxFile: GpxFile }) => {
  // Estrazione della logica di creazione metadati
  const createMetadataItems = (gpxFile: GpxFile): GpxMetadataItem[] => [
    {
      label: 'Distanza:',
      value: `${(gpxFile.distance / METERS_TO_KM).toFixed(1)} km`,
      condition: gpxFile.distance > 0
    },
    {
      label: 'Waypoints:',
      value: gpxFile.waypoints.toString(),
      condition: gpxFile.waypoints > 0
    },
    {
      label: 'Dislivello:',
      value: `${gpxFile.elevationGain?.toFixed(0)} m`,
      condition: Boolean(gpxFile.elevationGain && gpxFile.elevationGain > 0)
    },
    {
      label: 'Punti chiave:',
      value: gpxFile.keyPoints?.length.toString() || '0',
      condition: Boolean(gpxFile.keyPoints && gpxFile.keyPoints.length > 0)
    }
  ];

  const metadataItems = createMetadataItems(gpxFile).filter(item => item.condition);
  
  if (metadataItems.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
      {metadataItems.map((item, index) => (
        <div key={index} className="flex items-center">
          <span className="font-medium mr-1">{item.label}</span>
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  );
};

// Componente per il toggle della preview mappa
const MapPreviewToggle = ({ 
  showPreview, 
  onToggle, 
  isLoading 
}: { 
  showPreview: boolean; 
  onToggle: () => void; 
  isLoading: boolean; 
}) => (
  <div className="mt-3">
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
      disabled={isLoading}
    >
      <MapIcon className="w-4 h-4" />
      <span>
        {showPreview ? 'Nascondi anteprima mappa' : 'Mostra anteprima mappa'}
      </span>
      {showPreview ? (
        <ChevronUpIcon className="w-4 h-4" />
      ) : (
        <ChevronDownIcon className="w-4 h-4" />
      )}
    </button>
  </div>
);

// Componente per la preview della mappa
const MapPreview = ({ gpxFile }: { gpxFile: GpxFile }) => {
  const hasValidPoints = gpxFile.keyPoints && gpxFile.keyPoints.length > 0;

  return (
    <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            Anteprima percorso: {gpxFile.filename}
          </span>
        </div>
      </div>
      <div className="p-3">
        {hasValidPoints ? (
          <GPXMapViewer
            tracks={[{
              name: gpxFile.filename || 'Percorso GPX',
              points: gpxFile.keyPoints!
                .filter(kp => kp.lat && kp.lng)
                .map(kp => ({
                  lat: kp.lat,
                  lng: kp.lng,
                  elevation: kp.elevation
                }))
            }]}
            routes={[]}
            waypoints={[]}
            className="w-full"
            height="h-48"
            showControls={false}
            enableFullscreen={false}
            enableDownload={false}
            autoFit={true}
            showLayerControls={false}
            defaultShowTracks={true}
            defaultShowRoutes={false}
            defaultShowWaypoints={false}
          />
        ) : (
          <div className="w-full h-48 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nessun dato di percorso disponibile per la preview</p>
              <p className="text-xs mt-1">Il file GPX potrebbe non contenere punti chiave elaborati</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const GpxDisplay = ({ gpxFile, isLoading = false }: GpxDisplayProps) => {
  const [showPreview, setShowPreview] = useState(false);

  if (!gpxFile) return null;

  const togglePreview = () => setShowPreview(!showPreview);

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
      {/* Header del file GPX */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <DocumentIcon className="w-4 h-4 text-green-600 mr-2" />
          <span className="text-sm font-medium text-green-800">
            {gpxFile.filename}
          </span>
        </div>
        <span className="text-xs text-green-600">File attuale</span>
      </div>

      {/* Metadati GPX */}
      <GpxMetadata gpxFile={gpxFile} />
      
      {/* Toggle preview mappa */}
      {gpxFile.isValid && (
        <MapPreviewToggle 
          showPreview={showPreview}
          onToggle={togglePreview}
          isLoading={isLoading}
        />
      )}

      {/* Preview mappa */}
      {showPreview && <MapPreview gpxFile={gpxFile} />}
    </div>
  );
};