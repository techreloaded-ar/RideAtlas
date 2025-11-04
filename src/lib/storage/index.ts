import { IFileStorageProvider } from './interfaces/IFileStorageProvider';
import { getStorageConfig } from './config/storageConfig';
import { VercelBlobProvider } from './providers/VercelBlobProvider';
import { AWSS3Provider } from './providers/AWSS3Provider';
import { AWSCloudFrontProvider } from './providers/AWSCloudFrontProvider';

/**
 * Factory per la creazione e gestione dei provider di storage
 * Implementa il pattern Singleton per ottimizzare le performance
 */
export class StorageFactory {
  private static instance: IFileStorageProvider | null = null;
  
  /**
   * Ottiene l'istanza singleton del provider di storage configurato
   * @returns Istanza del provider di storage
   */
  static getInstance(): IFileStorageProvider {
    if (!this.instance) {
      const config = getStorageConfig();
      
      switch (config.provider) {
        case 'vercel-blob':
          this.instance = new VercelBlobProvider();
          break;
        case 'aws-s3':
          this.instance = new AWSS3Provider();
          break;
        case 'aws-cloudfront':
          this.instance = new AWSCloudFrontProvider();
          break;
        default:
          throw new Error(`Provider storage non supportato: ${config.provider}`);
      }
      
      
    }
    
    return this.instance;
  }
  
  /**
   * Reset dell'istanza singleton (utile per testing e re-configurazione)
   */
  static resetInstance(): void {
    this.instance = null;
  }
}

/**
 * Funzione di convenienza per ottenere il provider di storage
 * @returns Istanza del provider di storage configurato
 */
export const getStorageProvider = (): IFileStorageProvider => {
  return StorageFactory.getInstance();
};

// Re-export dei tipi per facilità d'uso
export type { IFileStorageProvider } from './interfaces/IFileStorageProvider';
export type { UploadResult, UploadOptions, StorageProviderType } from './types/storage'; 