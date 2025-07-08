import { UploadResult, UploadOptions } from '../types/storage';

/**
 * Interfaccia comune per tutti i provider di storage
 * Ogni implementazione deve fornire questi metodi
 */
export interface IFileStorageProvider {
  /**
   * Carica un file sul provider di storage
   * @param file File da caricare
   * @param fileName Nome del file
   * @param options Opzioni di upload (cartella, accesso, ecc.)
   * @returns Risultato dell'upload con URL e metadati
   */
  uploadFile(
    file: File, 
    fileName: string, 
    options?: UploadOptions
  ): Promise<UploadResult>;
  
  /**
   * Elimina un file dal provider di storage
   * @param publicId ID pubblico del file da eliminare
   */
  deleteFile(publicId: string): Promise<void>;
  
  /**
   * Ottiene l'URL pubblico di un file
   * @param publicId ID pubblico del file
   * @returns URL pubblico del file
   */
  getFileUrl(publicId: string): string;
  
  /**
   * Valida un file prima dell'upload
   * @param file File da validare
   * @returns true se il file è valido, false altrimenti
   */
  validateFile(file: File): Promise<boolean>;
} 