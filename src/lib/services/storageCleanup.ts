import { getStorageProvider } from '@/lib/storage'
import { MediaItem, GpxFile } from '@/types/trip'

export interface StorageCleanupResult {
  deletedFiles: string[]
  failedFiles: string[]
  errors: string[]
}

export class StorageCleanupService {
  private storageProvider = getStorageProvider()
  
  constructor() {
    // Debug: mostra il provider storage attivo
    console.log(`🏭 StorageCleanupService inizializzato con provider: ${this.storageProvider.constructor.name}`)
  }

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
   * Estrae il path della directory del viaggio da un URL
   */
  extractTripDirectoryFromUrl(url: string): string | null {
    try {
      console.log(`🔍 Estraendo directory da URL: ${url}`);
      
      // Cerca pattern trips/{tripId} o trips/{tripId} - {tripName}
      const tripMatch = url.match(/trips\/([^\/]+)/);
      if (tripMatch) {
        const rawPath = tripMatch[1];
        console.log(`📁 Path grezzo estratto: ${rawPath}`);
        
        // Decodifica i caratteri URL-encoded
        const decodedPath = decodeURIComponent(rawPath);
        console.log(`📁 Path decodificato: ${decodedPath}`);
        
        const fullPath = `trips/${decodedPath}`;
        console.log(`📂 Path completo directory: ${fullPath}`);
        
        return fullPath;
      }
      
      console.log(`❌ Nessun match trovato per pattern trips/ nell'URL`);
      return null;
    } catch (error) {
      console.warn(`Impossibile estrarre directory del viaggio da URL: ${url}`, error);
      return null;
    }
  }

  /**
   * Estrae tutti i possibili path di directory da un URL (versioni encoded e decoded)
   * Per gestire inconsistenze nei provider di storage
   */
  extractAllPossibleDirectoryPaths(url: string): string[] {
    try {
      const tripMatch = url.match(/trips\/([^\/]+)/);
      if (!tripMatch) return [];
      
      const rawPath = tripMatch[1];
      const paths = [];
      
      // Per Vercel Blob, il path corretto è quello decodificato (scoperto tramite testing)
      // Lo mettiamo come prima opzione per evitare tentativi inutili
      try {
        const decodedPath = decodeURIComponent(rawPath);
        paths.push(`trips/${decodedPath}`);
        
        // Aggiungi il path encoded solo se diverso (per compatibilità con altri provider)
        if (decodedPath !== rawPath) {
          paths.push(`trips/${rawPath}`);
        }
      } catch (decodeError) {
        console.warn(`Errore decodifica URL per: ${rawPath}`, decodeError);
        // Se la decodifica fallisce, usa il path raw come fallback
        paths.push(`trips/${rawPath}`);
      }
      
      // Rimuove duplicati
      return Array.from(new Set(paths));
    } catch (error) {
      console.warn(`Errore estrazione path multipli da URL: ${url}`, error);
      return [];
    }
  }

  /**
   * Pulisce tutti i file storage associati a un viaggio usando l'eliminazione completa della directory
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

    // Prima, tenta di trovare la directory del viaggio da uno dei file
    let tripDirectory: string | null = null;
    let allPossiblePaths: string[] = [];
    
    console.log(`🔍 Iniziando ricerca directory del viaggio...`);
    
    // Cerca negli URL dei media del viaggio
    const tripMediaUrls = this.extractMediaUrls(tripMedia);
    console.log(`📷 Media del viaggio trovati: ${tripMediaUrls.length}`);
    for (const url of tripMediaUrls) {
      tripDirectory = this.extractTripDirectoryFromUrl(url);
      if (tripDirectory) {
        allPossiblePaths.push(...this.extractAllPossibleDirectoryPaths(url));
        console.log(`✅ Directory identificata da media viaggio: ${tripDirectory}`);
        break;
      }
    }
    
    // Se non trovato nei media, cerca nel GPX del viaggio
    if (!tripDirectory) {
      const tripGpxUrl = this.extractGpxUrl(tripGpxFile);
      console.log(`📄 GPX del viaggio: ${tripGpxUrl ? 'presente' : 'assente'}`);
      if (tripGpxUrl) {
        tripDirectory = this.extractTripDirectoryFromUrl(tripGpxUrl);
        if (tripDirectory) {
          allPossiblePaths.push(...this.extractAllPossibleDirectoryPaths(tripGpxUrl));
          console.log(`✅ Directory identificata da GPX viaggio: ${tripDirectory}`);
        }
      }
    }
    
    // Se ancora non trovato, cerca nei media/GPX delle tappe
    if (!tripDirectory) {
      console.log(`🔍 Cercando nelle tappe (${stages.length} tappe)...`);
      for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
        const stage = stages[stageIndex];
        const stageMediaUrls = this.extractMediaUrls(stage.media);
        console.log(`📷 Tappa ${stageIndex}: ${stageMediaUrls.length} media`);
        
        for (const url of stageMediaUrls) {
          tripDirectory = this.extractTripDirectoryFromUrl(url);
          if (tripDirectory) {
            allPossiblePaths.push(...this.extractAllPossibleDirectoryPaths(url));
            console.log(`✅ Directory identificata da media tappa ${stageIndex}: ${tripDirectory}`);
            break;
          }
        }
        
        if (!tripDirectory) {
          const stageGpxUrl = this.extractGpxUrl(stage.gpxFile);
          if (stageGpxUrl) {
            console.log(`📄 Tappa ${stageIndex}: GPX presente`);
            tripDirectory = this.extractTripDirectoryFromUrl(stageGpxUrl);
            if (tripDirectory) {
              allPossiblePaths.push(...this.extractAllPossibleDirectoryPaths(stageGpxUrl));
              console.log(`✅ Directory identificata da GPX tappa ${stageIndex}: ${tripDirectory}`);
              break;
            }
          }
        }
        
        if (tripDirectory) break;
      }
    }
    
    // Rimuovi duplicati dai possibili path
    allPossiblePaths = Array.from(new Set(allPossiblePaths));
    console.log(`📋 Path possibili identificati: ${JSON.stringify(allPossiblePaths)}`)

    // Se abbiamo trovato la directory del viaggio, eliminiamo l'intera directory
    if (tripDirectory && allPossiblePaths.length > 0) {
      console.log(`🗂️ Directory viaggio identificata: ${tripDirectory}`);
      console.log(`🎯 Tentativo eliminazione con ${allPossiblePaths.length} path possibili`);
      
      // Prova tutti i path possibili finché uno non funziona
      let directoryDeleted = false;
      for (let index = 0; index < allPossiblePaths.length; index++) {
        const pathToTry = allPossiblePaths[index];
        try {
          console.log(`🔄 Tentativo ${index + 1}/${allPossiblePaths.length}: ${pathToTry}`);
          await this.storageProvider.deleteDirectory(pathToTry);
          result.deletedFiles.push(`Directory: ${pathToTry}`);
          console.log(`✅ Directory viaggio eliminata completamente: ${pathToTry}`);
          directoryDeleted = true;
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
          console.warn(`⚠️ Tentativo ${index + 1} fallito per directory ${pathToTry}: ${errorMessage}`);
          result.errors.push(`Directory ${pathToTry}: ${errorMessage}`);
          
          // Se non è l'ultimo tentativo, continua
          if (index < allPossiblePaths.length - 1) {
            console.log(`🔄 Proseguendo con il prossimo path...`);
          }
        }
      }
      
      if (!directoryDeleted) {
        console.log(`❌ Tutti i tentativi di eliminazione directory falliti, usando fallback file-per-file`);
      }
    } else {
      console.log(`⚠️ Directory viaggio non identificata, eliminazione file per file`);
    }

    // Fallback: eliminazione file per file (metodo originale)
    const urlsToDelete: string[] = [];

    // URL media del viaggio principale
    urlsToDelete.push(...this.extractMediaUrls(tripMedia));

    // URL GPX del viaggio principale
    const tripGpxUrl = this.extractGpxUrl(tripGpxFile);
    if (tripGpxUrl) {
      urlsToDelete.push(tripGpxUrl);
    }

    // URL media e GPX delle tappe
    for (const stage of stages) {
      urlsToDelete.push(...this.extractMediaUrls(stage.media));
      
      const stageGpxUrl = this.extractGpxUrl(stage.gpxFile);
      if (stageGpxUrl) {
        urlsToDelete.push(stageGpxUrl);
      }
    }

    // Rimuove duplicati
    const uniqueUrls = Array.from(new Set(urlsToDelete));
    
    console.log(`🧹 Eliminazione file per file per ${uniqueUrls.length} file(s)`);

    // Elimina tutti i file
    for (const url of uniqueUrls) {
      const deleteResult = await this.deleteStorageFile(url);
      
      if (deleteResult.success) {
        result.deletedFiles.push(url);
      } else {
        result.failedFiles.push(url);
        if (deleteResult.error) {
          result.errors.push(`${url}: ${deleteResult.error}`);
        }
      }
    }

    console.log(`✅ Cleanup completato: ${result.deletedFiles.length} eliminati, ${result.failedFiles.length} falliti`);
    
    if (result.errors.length > 0) {
      console.warn('⚠️ Errori durante cleanup:', result.errors);
    }

    return result;
  }
}

export const storageCleanupService = new StorageCleanupService()