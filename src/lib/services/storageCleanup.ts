import { getStorageProvider } from '@/lib/storage'
import { MediaItem, GpxFile } from '@/types/trip'

export interface StorageCleanupResult {
  deletedFiles: string[]
  failedFiles: string[]
  errors: string[]
}

export class StorageCleanupService {
  private storageProvider = getStorageProvider()

  /**
   * Estrae gli URL dei file storage da un array di media
   */
  extractMediaUrls(mediaArray: unknown[]): string[] {
    const urls: string[] = []
    
    for (const item of mediaArray) {
      if (typeof item === 'object' && item !== null) {
        const mediaItem = item as MediaItem
        if (mediaItem.url && typeof mediaItem.url === 'string') {
          urls.push(mediaItem.url)
        }
        // Include anche thumbnailUrl se presente
        if (mediaItem.thumbnailUrl && typeof mediaItem.thumbnailUrl === 'string') {
          urls.push(mediaItem.thumbnailUrl)
        }
      }
    }
    
    return urls
  }

  /**
   * Estrae l'URL del file GPX
   */
  extractGpxUrl(gpxFile: unknown): string | null {
    if (typeof gpxFile === 'object' && gpxFile !== null) {
      const gpx = gpxFile as GpxFile
      if (gpx.url && typeof gpx.url === 'string') {
        return gpx.url
      }
    }
    return null
  }

  /**
   * Estrae il publicId dall'URL del file storage
   * Funziona con diversi provider (Vercel Blob, AWS S3, CloudFront)
   */
  extractPublicIdFromUrl(url: string): string | null {
    try {
      // Per Vercel Blob: https://abc123.public.blob.vercel-storage.com/filename-abc123.jpg
      if (url.includes('blob.vercel-storage.com')) {
        const filename = url.split('/').pop()
        return filename || null
      }
      
      // Per AWS S3: https://bucket.s3.region.amazonaws.com/path/filename
      if (url.includes('amazonaws.com') || url.includes('s3.')) {
        const urlObj = new URL(url)
        return urlObj.pathname.substring(1) // Remove leading slash
      }
      
      // Per CloudFront: https://abc123.cloudfront.net/path/filename
      if (url.includes('cloudfront.net')) {
        const urlObj = new URL(url)
        return urlObj.pathname.substring(1) // Remove leading slash
      }
      
      // Fallback: usa l'ultimo segmento dell'URL
      const filename = url.split('/').pop()
      return filename || null
    } catch (error) {
      console.warn(`Impossibile estrarre publicId da URL: ${url}`, error)
      return null
    }
  }

  /**
   * Elimina un singolo file dallo storage
   */
  async deleteStorageFile(url: string): Promise<{ success: boolean; error?: string }> {
    try {
      const publicId = this.extractPublicIdFromUrl(url)
      if (!publicId) {
        return { success: false, error: `Impossibile estrarre publicId da ${url}` }
      }

      await this.storageProvider.deleteFile(publicId)
      console.log(`✅ File eliminato dallo storage: ${url}`)
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto'
      console.error(`❌ Errore eliminazione file storage ${url}:`, errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Pulisce tutti i file storage associati a un viaggio
   */
  async cleanupTripStorage(
    tripMedia: unknown[], 
    tripGpxFile: unknown,
    stages: Array<{ media: unknown[]; gpxFile: unknown }>
  ): Promise<StorageCleanupResult> {
    const result: StorageCleanupResult = {
      deletedFiles: [],
      failedFiles: [],
      errors: []
    }

    // Raccoglie tutti gli URL da eliminare
    const urlsToDelete: string[] = []

    // URL media del viaggio principale
    urlsToDelete.push(...this.extractMediaUrls(tripMedia))

    // URL GPX del viaggio principale
    const tripGpxUrl = this.extractGpxUrl(tripGpxFile)
    if (tripGpxUrl) {
      urlsToDelete.push(tripGpxUrl)
    }

    // URL media e GPX delle tappe
    for (const stage of stages) {
      urlsToDelete.push(...this.extractMediaUrls(stage.media))
      
      const stageGpxUrl = this.extractGpxUrl(stage.gpxFile)
      if (stageGpxUrl) {
        urlsToDelete.push(stageGpxUrl)
      }
    }

    // Rimuove duplicati
    const uniqueUrls = Array.from(new Set(urlsToDelete))
    
    console.log(`🧹 Inizio cleanup storage per ${uniqueUrls.length} file(s)`)

    // Elimina tutti i file
    for (const url of uniqueUrls) {
      const deleteResult = await this.deleteStorageFile(url)
      
      if (deleteResult.success) {
        result.deletedFiles.push(url)
      } else {
        result.failedFiles.push(url)
        if (deleteResult.error) {
          result.errors.push(`${url}: ${deleteResult.error}`)
        }
      }
    }

    console.log(`✅ Cleanup completato: ${result.deletedFiles.length} eliminati, ${result.failedFiles.length} falliti`)
    
    if (result.errors.length > 0) {
      console.warn('⚠️ Errori durante cleanup:', result.errors)
    }

    return result
  }
}

export const storageCleanupService = new StorageCleanupService()