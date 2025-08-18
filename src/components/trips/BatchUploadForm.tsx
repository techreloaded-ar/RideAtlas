// src/components/trips/BatchUploadForm.tsx
"use client"

import { useState, useRef, useCallback } from 'react'
import { CloudArrowUpIcon, DocumentArrowUpIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface BatchUploadFormProps {
  onUploadStart: (jobId: string) => void
  onError: (error: string) => void
  disabled?: boolean
}

interface UploadState {
  isDragging: boolean
  isUploading: boolean
  error: string | null
  file: File | null
}

export const BatchUploadForm = ({ onUploadStart, onError, disabled = false }: BatchUploadFormProps) => {
  const [state, setState] = useState<UploadState>({
    isDragging: false,
    isUploading: false,
    error: null,
    file: null,
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const maxFileSize = 100 * 1024 * 1024 // 100MB

  const validateFile = useCallback((file: File): string | null => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      return 'Solo file ZIP sono supportati'
    }
    
    if (file.size > maxFileSize) {
      return `File troppo grande. Massimo ${maxFileSize / (1024 * 1024)}MB consentiti`
    }
    
    return null
  }, [maxFileSize])

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file)
    if (error) {
      setState(prev => ({ ...prev, error, file: null }))
      return
    }
    
    setState(prev => ({ ...prev, error: null, file }))
  }, [validateFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setState(prev => ({ ...prev, isDragging: true }))
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState(prev => ({ ...prev, isDragging: false }))
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setState(prev => ({ ...prev, isDragging: false }))
    
    if (disabled) return
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [disabled, handleFileSelect])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleUpload = useCallback(async () => {
    if (!state.file || state.isUploading || disabled) return
    
    setState(prev => ({ ...prev, isUploading: true, error: null }))
    
    try {
      const formData = new FormData()
      formData.append('zipFile', state.file)
      
      const response = await fetch('/api/trips/batch', {
        method: 'POST',
        body: formData,
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Errore durante il caricamento')
      }
      
      // Reset state and notify parent
      setState({
        isDragging: false,
        isUploading: false,
        error: null,
        file: null,
      })
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      onUploadStart(result.jobId)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
      setState(prev => ({ ...prev, isUploading: false, error: errorMessage }))
      onError(errorMessage)
    }
  }, [state.file, state.isUploading, disabled, onUploadStart, onError])

  const handleRemoveFile = useCallback(() => {
    setState(prev => ({ ...prev, file: null, error: null }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${state.isDragging 
            ? 'border-primary-400 bg-primary-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="space-y-4">
          <div className="mx-auto h-12 w-12 text-gray-400">
            {state.file ? (
              <DocumentArrowUpIcon />
            ) : (
              <CloudArrowUpIcon />
            )}
          </div>
          
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">
              {state.file ? state.file.name : 'Carica file ZIP'}
            </p>
            <p className="text-sm text-gray-500">
              {state.file 
                ? `${formatFileSize(state.file.size)} - Clicca "Carica" per iniziare`
                : 'Trascina qui il tuo file ZIP o clicca per selezionare'
              }
            </p>
          </div>
          
          {!state.file && (
            <div className="text-xs text-gray-400 space-y-1">
              <p>Massimo 100MB</p>
              <p>Struttura: viaggi.json + cartelle media/tappe</p>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Errore nel caricamento
              </h3>
              <p className="mt-1 text-sm text-red-700">{state.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* File Info and Actions */}
      {state.file && !state.error && (
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DocumentArrowUpIcon className="h-8 w-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">{state.file.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(state.file.size)}</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleRemoveFile}
                disabled={state.isUploading || disabled}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Rimuovi
              </button>
              <button
                onClick={handleUpload}
                disabled={state.isUploading || disabled}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.isUploading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Caricando...
                  </div>
                ) : (
                  'Carica'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}