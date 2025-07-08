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
} 