import { put, del, list } from '@vercel/blob';
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
      
    } catch (error) {
      console.error('Errore eliminazione file Vercel Blob:', error);
      throw new Error('Errore durante l\'eliminazione del file da Vercel Storage');
    }
  }
  
  /**
   * Elimina una directory e tutto il suo contenuto da Vercel Blob Storage
   */
  async deleteDirectory(directoryPath: string): Promise<void> {
    
    
    // Prima controlla se il token è configurato
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      const errorMsg = `Token Vercel Blob non configurato (BLOB_READ_WRITE_TOKEN mancante)`;
      console.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    try {
      // Per Vercel Blob, prova direttamente con il path fornito (ora dovrebbe essere già decodificato)
      let blobs = await this.listBlobsWithPrefix(directoryPath);
      
      // Se non trova nulla, prova variazioni solo se necessario
      if (blobs.length === 0) {
        // Prova senza trailing slash se presente
        const pathWithoutSlash = directoryPath.endsWith('/') ? directoryPath.slice(0, -1) : directoryPath;
        if (pathWithoutSlash !== directoryPath) {
          
          blobs = await this.listBlobsWithPrefix(pathWithoutSlash);
        }
      }
      
      if (blobs.length === 0) {
        throw new Error(`Directory non trovata in Vercel Blob: ${directoryPath}`);
      }
      
      
      
      const deletePromises = blobs.map(async (blob) => {
        try {
          await del(blob.url);
          
          return { success: true, pathname: blob.pathname };
        } catch (deleteError) {
          console.error(`❌ Errore eliminazione file ${blob.pathname}:`, deleteError);
          return { success: false, pathname: blob.pathname, error: deleteError };
        }
      });
      
      const results = await Promise.all(deletePromises);
      const failed = results.filter(r => !r.success).length;
      
      
      
      if (failed > 0) {
        const failedFiles = results.filter(r => !r.success).map(r => r.pathname);
        console.warn(`⚠️ File non eliminati: ${failedFiles.join(', ')}`);
      }
      
    } catch (error) {
      console.error(`💥 Errore eliminazione directory Vercel Blob ${directoryPath}:`, error);
      
      // Se l'errore è dovuto al token mancante, rilancialo come errore specifico
      if (error instanceof Error && error.message.includes('No token found')) {
        throw new Error(`Token Vercel Blob non configurato: ${error.message}`);
      }
      
      throw new Error(`Errore durante l'eliminazione della directory da Vercel Blob: ${directoryPath}`);
    }
  }

  /**
   * Lista i blob con un determinato prefix, gestendo diversi formati
   */
  private async listBlobsWithPrefix(prefix: string): Promise<Array<{ url: string; pathname: string }>> {
    try {
      const prefixWithSlash = prefix.endsWith('/') ? prefix : prefix + '/';
      
      
      const listResponse = await list({
        prefix: prefixWithSlash,
      });
      
      
      
      if (!listResponse.blobs || listResponse.blobs.length === 0) {
        // Se non ha trovato nulla, fai un test generico solo per debug (limitato)
        console.debug(`🔍 Test generico: cerco primi blob con prefix "trips/" per debug`);
        try {
          const genericTest = await list({ prefix: 'trips/', limit: 5 });
          console.debug(`📋 Test generico trovato ${genericTest.blobs?.length || 0} blob(s) (primi 5)`);
          if (genericTest.blobs && genericTest.blobs.length > 0) {
            console.debug(`🎯 Primi blob in trips/ per confronto:`);
            genericTest.blobs.forEach((blob, index) => {
              console.debug(`     ${index + 1}. ${blob.pathname}`);
            });
          }
        } catch (genericError) {
          console.error(`Errore test generico:`, genericError);
        }
      }
      
      return listResponse.blobs || [];
    } catch (error) {
      console.error(`Errore list blobs per prefix ${prefix}:`, error);
      return [];
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
    
    return file != null;
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