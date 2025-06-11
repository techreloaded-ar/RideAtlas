"use client"

import { useState } from 'react'
import { Download, AlertCircle, CheckCircle } from 'lucide-react'

interface GPXDownloadButtonProps {
  tripId: string
  tripTitle: string
  className?: string
}

export default function GPXDownloadButton({ tripId, tripTitle, className = "" }: GPXDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleDownload = async () => {
    if (isDownloading) return

    setIsDownloading(true)
    setDownloadStatus('idle')

    try {
      const response = await fetch(`/api/trips/${tripId}/gpx`)
      
      if (!response.ok) {
        const errorData = await response.json()
        
        // Gestione specifica per errori di autenticazione
        if (response.status === 401) {
          alert('È necessario effettuare il login per scaricare le tracce GPX.')
          // Potresti anche reindirizzare alla pagina di login
          // window.location.href = '/auth/signin'
          return
        }
        
        throw new Error(errorData.error || 'Errore durante il download')
      }

      // Crea un blob dal contenuto della risposta
      const blob = await response.blob()
      
      // Crea un URL temporaneo per il download
      const downloadUrl = window.URL.createObjectURL(blob)
      
      // Crea un elemento anchor temporaneo per il download
      const link = document.createElement('a')
      link.href = downloadUrl
      
      // Ottieni il nome file dall'header Content-Disposition o usa un fallback
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `${tripTitle.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase()}.gpx`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      link.download = filename
      
      // Appendi al DOM temporaneamente, clicca e rimuovi
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Pulisci l'URL temporaneo
      window.URL.revokeObjectURL(downloadUrl)
      
      setDownloadStatus('success')
      
      // Reset status dopo 3 secondi
      setTimeout(() => setDownloadStatus('idle'), 3000)
      
    } catch (error) {
      console.error('Errore durante il download GPX:', error)
      setDownloadStatus('error')
      
      // Reset status dopo 5 secondi
      setTimeout(() => setDownloadStatus('idle'), 5000)
    } finally {
      setIsDownloading(false)
    }
  }

  const getButtonContent = () => {
    if (isDownloading) {
      return (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Download...
        </>
      )
    }

    if (downloadStatus === 'success') {
      return (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Scaricato!
        </>
      )
    }

    if (downloadStatus === 'error') {
      return (
        <>
          <AlertCircle className="w-4 h-4 mr-2" />
          Errore
        </>
      )
    }

    return (
      <>
        <Download className="w-4 h-4 mr-2" />
        Scarica GPX
      </>
    )
  }

  const getButtonClass = () => {
    const baseClass = `inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${className}`
    
    if (downloadStatus === 'success') {
      return `${baseClass} bg-green-600 text-white hover:bg-green-700`
    }
    
    if (downloadStatus === 'error') {
      return `${baseClass} bg-red-600 text-white hover:bg-red-700`
    }
    
    if (isDownloading) {
      return `${baseClass} bg-blue-500 text-white cursor-not-allowed opacity-75`
    }
    
    return `${baseClass} bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md`
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={getButtonClass()}
      title={downloadStatus === 'error' ? 'Si è verificato un errore. Riprova.' : undefined}
    >
      {getButtonContent()}
    </button>
  )
}
