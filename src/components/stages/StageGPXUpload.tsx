// src/components/stages/StageGPXUpload.tsx
"use client"

import { useState, useCallback, DragEvent } from 'react'
import { GpxFile } from '@/types/trip'
import { isValidGpxFile, isValidGpxFileSize } from '@/lib/gpx-utils'

interface StageGPXUploadProps {
  gpxFile: GpxFile | null | undefined
  onGpxUpload: (gpxFile: GpxFile) => void
  onGpxRemove: () => void
  isUploading?: boolean
}

const StageGPXUpload = ({ gpxFile, onGpxUpload, onGpxRemove, isUploading = false }: StageGPXUploadProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(false)

  const handleFileUpload = useCallback(async (file: File) => {
    // Validazioni preliminari
    if (!isValidGpxFile(file)) {
      alert('Tipo di file non supportato. Carica solo file GPX.')
      return
    }

    if (!isValidGpxFileSize(file)) {
      alert('Il file GPX non può superare 20MB')
      return
    }

    setUploadProgress(true)

    try {
      const formData = new FormData()
      formData.append('gpx', file)

      const response = await fetch('/api/upload/gpx', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Errore durante l\'upload')
      }

      const uploadedGpx = await response.json()
      onGpxUpload(uploadedGpx)

    } catch (error) {
      console.error('Errore upload GPX:', error)
      alert(error instanceof Error ? error.message : 'Errore durante l\'upload del file GPX')
    } finally {
      setUploadProgress(false)
    }
  }, [onGpxUpload])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])

  if (gpxFile) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-green-800 mb-2">Traccia GPX Caricata</h4>
            <div className="text-sm text-green-700 space-y-2">
              {/* Layout responsive: verticale su mobile, griglia su desktop */}
              <div className="space-y-1 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
                <div><strong>File:</strong> {gpxFile.filename}</div>
                <div><strong>Distanza:</strong> {gpxFile.distance} km</div>
                <div><strong>Waypoints:</strong> {gpxFile.waypoints}</div>
                {gpxFile.elevationGain && (
                  <div><strong>Dislivello:</strong> +{gpxFile.elevationGain}m</div>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onGpxRemove}
            className="ml-4 text-sm text-red-600 hover:text-red-800 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md px-2 py-1"
            aria-label={`Rimuovi traccia GPX ${gpxFile.filename}`}
          >
            Rimuovi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label 
        htmlFor="stage-gpx-file-input" 
        className="block text-sm font-medium text-gray-700"
      >
        Traccia GPX della Tappa
      </label>
      
      <div
        data-testid="stage-gpx-drop-zone"
        className={`
          border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2
          ${isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${uploadProgress || isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('stage-gpx-file-input')?.click()}
        role="button"
        tabIndex={0}
        aria-label="Area di caricamento file GPX. Trascina un file GPX qui o clicca per selezionare un file"
        aria-describedby="gpx-upload-instructions"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            document.getElementById('stage-gpx-file-input')?.click()
          }
        }}
      >
        {uploadProgress || isUploading ? (
          <div className="text-gray-600" aria-live="polite">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm">Caricamento file GPX in corso...</p>
          </div>
        ) : (
          <div className="text-gray-600">
            <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm font-medium">Trascina il file GPX o clicca per caricare</p>
            <p id="gpx-upload-instructions" className="text-xs text-gray-500">File GPX fino a 20MB per questa tappa</p>
          </div>
        )}
      </div>

      <input
        id="stage-gpx-file-input"
        type="file"
        accept=".gpx,application/gpx+xml,application/xml,text/xml"
        onChange={handleFileInput}
        className="hidden"
        aria-describedby="gpx-upload-instructions"
      />
    </div>
  )
}

export default StageGPXUpload