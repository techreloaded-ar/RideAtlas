import { DocumentIcon } from '@heroicons/react/24/outline';

interface GpxUploadProps {
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  uploadError: string | null;
  isLoading: boolean;
  index: number;
  hasExistingFile: boolean;
}

export const GpxUpload = ({ 
  onUpload, 
  isUploading, 
  uploadError, 
  isLoading, 
  index, 
  hasExistingFile 
}: GpxUploadProps) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {hasExistingFile ? 'Sostituisci File GPX' : 'Carica File GPX'}
      </label>
      <div className={`border-2 border-dashed rounded-lg p-4 ${
        isUploading 
          ? 'border-blue-300 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
      } transition-colors`}>
        <div className="text-center">
          {isUploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          ) : (
            <DocumentIcon className="mx-auto h-8 w-8 text-gray-400" />
          )}
          <div className="mt-2">
            <label htmlFor={`gpx-file-${index}`} className={isUploading ? 'cursor-not-allowed' : 'cursor-pointer'}>
              <span className={`text-sm font-medium ${
                isUploading ? 'text-gray-400' : 'text-gray-900'
              }`}>
                {isUploading ? 'Caricamento GPX in corso...' : 'Seleziona file GPX'}
              </span>
              <input
                id={`gpx-file-${index}`}
                type="file"
                accept=".gpx"
                onChange={onUpload}
                className="sr-only"
                disabled={isLoading || isUploading}
              />
            </label>
            <p className="text-xs text-gray-500 mt-1">Solo file .gpx fino a 20MB</p>
          </div>
        </div>
      </div>
      
      {/* Upload Error Display */}
      {uploadError && (
        <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <div className="text-red-600 text-sm">
              <strong>Errore upload GPX:</strong> {uploadError}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};