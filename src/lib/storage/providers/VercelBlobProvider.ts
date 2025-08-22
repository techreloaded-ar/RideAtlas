import { put, del } from '@vercel/blob';
import { IFileStorageProvider } from '../interfaces/IFileStorageProvider';
import { UploadResult, UploadOptions, sanitizeDirectoryName } from '../types/storage';

/**
 * Implementazione del provider Vercel Blob Storage
 * Gestisce internamente la configurazione specifica di Vercel
 */
export class VercelBlobProvider implements IFileStorageProvider {
  
  constructor() {
    this.validateConfiguration();
  }
  
  /**
   * Valida la configurazione per Vercel Blob
   * Vercel gestisce automaticamente le credenziali tramite il runtime
   */
  private validateConfiguration(): void {
    // Vercel Blob non richiede configurazioni esplicite
    // Le credenziali sono gestite automaticamente dal runtime Vercel
    // Eventualmente si potrebbe validare BLOB_READ_WRITE_TOKEN se necessario
    console.log('VercelBlobProvider: Configurazione automatica Vercel attiva');
  }
  
  /**
   * Carica un file su Vercel Blob Storage
   */
  async uploadFile(
    file: File, 
    fileName: string, 
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const pathname = this.generatePathname(fileName, options);
      
      const blob = await put(pathname, file, {
        access: 'public', // Vercel Blob supporta solo accesso pubblico
        addRandomSuffix: options.addRandomSuffix || false,
        allowOverwrite: true, // Consente di sovrascrivere file esistenti
      });
      
      console.log(`File caricato su Vercel Blob: ${blob.url}`);
      
      return {
        url: blob.url,
        publicId: pathname,
        fileName: file.name,
        size: file.size,
        type: file.type,
      };
    } catch (error) {
      console.error('Errore upload Vercel Blob:', error);
      throw new Error('Errore durante l\'upload del file su Vercel Storage');
    }
  }
  
  /**
   * Elimina un file da Vercel Blob Storage
   */
  async deleteFile(publicId: string): Promise<void> {
    try {
      await del(publicId);
      console.log(`File eliminato da Vercel Blob: ${publicId}`);
    } catch (error) {
      console.error('Errore eliminazione file Vercel Blob:', error);
      throw new Error('Errore durante l\'eliminazione del file da Vercel Storage');
    }
  }
  
  /**
   * Ottiene l'URL pubblico del file
   * Per Vercel Blob, l'URL è già completo
   */
  getFileUrl(publicId: string): string {
    return publicId;
  }
  
  /**
   * Valida un file prima dell'upload
   * Implementa le validazioni standard per Vercel Blob
   */
  async validateFile(file: File): Promise<boolean> {
    // Le validazioni specifiche di business logic rimangono nei route handlers
    // Qui solo validazioni tecniche del provider
    console.log(`Validazione file: ${file.name}, dimensione: ${file.size} bytes`);
    return true;
  }
  
  /**
   * Genera il pathname per il file basato sulle opzioni
   * Supporta nuova struttura organizzata per trip e stage
   */
  private generatePathname(fileName: string, options: UploadOptions): string {
    // Nuova struttura trip-based
    if (options.tripId && options.tripName) {
      const basePath = `trips/${sanitizeDirectoryName(`${options.tripId} - ${options.tripName}`)}`;
      
      // File stage-level: dentro sottodirectory stages
      if (options.stageIndex !== undefined && options.stageName) {
        const stagePath = `${basePath}/stages/${sanitizeDirectoryName(`${options.stageIndex} - ${options.stageName}`)}`;
        
        // Media della tappa vanno in sottodirectory media/
        if (fileName.match(/\.(jpg|jpeg|png|webp|mp4|mov|avi)$/i)) {
          return `${stagePath}/media/${fileName}`;
        }
        
        // GPX della tappa nella root della directory stage
        return `${stagePath}/${fileName}`;
      }
      
      // File trip-level: nella root della directory trip
      return `${basePath}/${fileName}`;
    }
    
    // Struttura legacy con solo tripId (backward compatibility)
    if (options.tripId) {
      return `trips/${options.tripId}/${fileName}`;
    }
    
    if (options.folder && options.userId) {
      // Logica legacy per file con struttura cartelle (es. GPX)
      const timestamp = Date.now();
      const sanitizedFilename = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${options.userId}-${timestamp}-${sanitizedFilename}`;
      return `${options.folder}/${options.userId}/${filename}`;
    }
    
    // Logica per media generici legacy (mantenendo il comportamento esistente)
    return fileName;
  }
} 