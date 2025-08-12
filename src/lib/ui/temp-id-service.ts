/**
 * Servizio centralizzato per la gestione degli ID temporanei
 * Utilizzato per entità non ancora persistite nel database
 */

const TEMP_ID_PREFIX = 'temp-';
const STAGE_PREFIX = 'stage-';
const MEDIA_PREFIX = 'media-';

export class TempIdService {
  /**
   * Genera un ID temporaneo generico
   */
  static generateTempId(prefix?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    if (prefix) {
      return `${TEMP_ID_PREFIX}${prefix}-${timestamp}-${random}`;
    }
    
    return `${TEMP_ID_PREFIX}${timestamp}-${random}`;
  }

  /**
   * Genera un ID temporaneo specifico per le tappe
   */
  static generateTempStageId(): string {
    return this.generateTempId(STAGE_PREFIX);
  }

  /**
   * Genera un ID temporaneo specifico per i media
   */
  static generateTempMediaId(): string {
    return this.generateTempId(MEDIA_PREFIX);
  }

  /**
   * Genera un ID temporaneo con un suffisso numerico (utile per batch operations)
   */
  static generateTempIdWithIndex(prefix: string, index: number): string {
    const timestamp = Date.now();
    return `${TEMP_ID_PREFIX}${prefix}-${timestamp}-${index}`;
  }

  /**
   * Verifica se un ID è temporaneo
   */
  static isTempId(id: string | undefined | null): boolean {
    if (!id) return false;
    return id.startsWith(TEMP_ID_PREFIX);
  }

  /**
   * Verifica se un ID è permanente (non temporaneo)
   */
  static isPermanentId(id: string | undefined | null): boolean {
    if (!id) return false;
    return !this.isTempId(id);
  }

  /**
   * Filtra un array di entità restituendo solo quelle con ID temporanei
   */
  static filterTempEntities<T>(
    entities: T[], 
    idGetter: (entity: T) => string | undefined | null
  ): T[] {
    return entities.filter(entity => this.isTempId(idGetter(entity)));
  }

  /**
   * Filtra un array di entità restituendo solo quelle con ID permanenti
   */
  static filterPermanentEntities<T>(
    entities: T[], 
    idGetter: (entity: T) => string | undefined | null
  ): T[] {
    return entities.filter(entity => this.isPermanentId(idGetter(entity)));
  }

  /**
   * Rimuove le entità temporanee da un array
   */
  static removeTempEntities<T>(
    entities: T[], 
    idGetter: (entity: T) => string | undefined | null
  ): T[] {
    return this.filterPermanentEntities(entities, idGetter);
  }

  /**
   * Estrae il prefisso da un ID temporaneo
   */
  static extractPrefix(tempId: string): string | null {
    if (!this.isTempId(tempId)) return null;
    
    const withoutTempPrefix = tempId.substring(TEMP_ID_PREFIX.length);
    const parts = withoutTempPrefix.split('-');
    
    if (parts.length >= 2) {
      return parts[0];
    }
    
    return null;
  }

  /**
   * Verifica se un ID temporaneo ha un prefisso specifico
   */
  static hasTempPrefix(tempId: string, expectedPrefix: string): boolean {
    const prefix = this.extractPrefix(tempId);
    return prefix === expectedPrefix;
  }
}

// Export delle funzioni statiche come named exports per maggiore convenienza
export const generateTempId = TempIdService.generateTempId.bind(TempIdService);
export const generateTempStageId = TempIdService.generateTempStageId.bind(TempIdService);
export const generateTempMediaId = TempIdService.generateTempMediaId.bind(TempIdService);
export const generateTempIdWithIndex = TempIdService.generateTempIdWithIndex.bind(TempIdService);
export const isTempId = TempIdService.isTempId.bind(TempIdService);
export const isPermanentId = TempIdService.isPermanentId.bind(TempIdService);
export const filterTempEntities = TempIdService.filterTempEntities.bind(TempIdService);
export const filterPermanentEntities = TempIdService.filterPermanentEntities.bind(TempIdService);
export const removeTempEntities = TempIdService.removeTempEntities.bind(TempIdService);
export const extractPrefix = TempIdService.extractPrefix.bind(TempIdService);
export const hasTempPrefix = TempIdService.hasTempPrefix.bind(TempIdService);