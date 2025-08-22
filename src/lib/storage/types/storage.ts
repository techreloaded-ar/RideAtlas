/**
 * Tipi per il sistema di storage multi-provider
 */

export type StorageProviderType = 'vercel-blob' | 'aws-s3' | 'aws-cloudfront';

export interface StorageConfig {
  provider: StorageProviderType;
}

export interface UploadResult {
  url: string;
  publicId: string;
  fileName: string;
  size: number;
  type: string;
}

export interface UploadOptions {
  access?: 'public' | 'private';
  folder?: string;
  userId?: string;
  addRandomSuffix?: boolean;
  tripId?: string;
  tripName?: string;
  stageIndex?: string;
  stageName?: string;
}

/**
 * Sanitizza un nome per essere usato come nome di directory/file
 * Rimuove caratteri non sicuri e tronca se troppo lungo
 */
export function sanitizeDirectoryName(name: string): string {
  return name
    .trim()
    // Sostituisce caratteri non sicuri con underscore
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    // Rimuove spazi multipli
    .replace(/\s+/g, ' ')
    // Rimuove punti finali (problematici su Windows)
    .replace(/\.+$/, '')
    // Tronca se troppo lungo (mantenendo leggibilità)
    .slice(0, 100)
    // Rimuove spazi iniziali/finali che potrebbero essersi creati
    .trim()
} 