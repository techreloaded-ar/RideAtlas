import { StorageConfig, StorageProviderType } from '../types/storage';

/**
 * Configurazione centralizzata per il sistema storage
 * Gestisce solo il tipo di provider, ogni provider gestisce le proprie configurazioni interne
 */
export const getStorageConfig = (): StorageConfig => {
  const provider = (process.env.STORAGE_PROVIDER as StorageProviderType) || 'vercel-blob';
  
  // Validazione del provider supportato
  const supportedProviders: StorageProviderType[] = ['vercel-blob', 'aws-s3', 'aws-cloudfront'];
  
  if (!supportedProviders.includes(provider)) {
    console.warn(`Provider storage non supportato: ${provider}. Fallback a 'vercel-blob'`);
    return { provider: 'vercel-blob' };
  }
  
  return {
    provider,
  };
}; 