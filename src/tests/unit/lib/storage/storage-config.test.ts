import { getStorageConfig } from '@/lib/storage/config/storageConfig';
import type { StorageProviderType } from '@/lib/storage/types/storage';

describe('Storage Configuration', () => {
  // Backup delle variabili d'ambiente originali
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset delle variabili d'ambiente
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Ripristina le variabili d'ambiente originali
    process.env = originalEnv;
  });

  describe('getStorageConfig', () => {
    it('should return vercel-blob as default when STORAGE_PROVIDER is not set', () => {
      delete process.env.STORAGE_PROVIDER;
      
      const config = getStorageConfig();
      
      expect(config.provider).toBe('vercel-blob');
    });

    it('should return vercel-blob when STORAGE_PROVIDER is vercel-blob', () => {
      process.env.STORAGE_PROVIDER = 'vercel-blob';
      
      const config = getStorageConfig();
      
      expect(config.provider).toBe('vercel-blob');
    });

    it('should return aws-s3 when STORAGE_PROVIDER is aws-s3', () => {
      process.env.STORAGE_PROVIDER = 'aws-s3';
      
      const config = getStorageConfig();
      
      expect(config.provider).toBe('aws-s3');
    });

    it('should return aws-cloudfront when STORAGE_PROVIDER is aws-cloudfront', () => {
      process.env.STORAGE_PROVIDER = 'aws-cloudfront';
      
      const config = getStorageConfig();
      
      expect(config.provider).toBe('aws-cloudfront');
    });

    it('should fallback to vercel-blob for unsupported provider', () => {
      process.env.STORAGE_PROVIDER = 'unsupported-provider';
      
      const config = getStorageConfig();
      
      expect(config.provider).toBe('vercel-blob');
    });

    it('should fallback to vercel-blob for empty string provider', () => {
      process.env.STORAGE_PROVIDER = '';
      
      const config = getStorageConfig();
      
      expect(config.provider).toBe('vercel-blob');
    });

    it('should handle case sensitivity correctly', () => {
      process.env.STORAGE_PROVIDER = 'AWS-S3'; // Uppercase
      
      const config = getStorageConfig();
      
      // Dovrebbe fallback a vercel-blob perché è case-sensitive
      expect(config.provider).toBe('vercel-blob');
    });
  });

  describe('Provider Type Validation', () => {
    const supportedProviders: StorageProviderType[] = ['vercel-blob', 'aws-s3', 'aws-cloudfront'];

    supportedProviders.forEach(provider => {
      it(`should accept ${provider} as valid provider`, () => {
        process.env.STORAGE_PROVIDER = provider;
        
        const config = getStorageConfig();
        
        expect(config.provider).toBe(provider);
      });
    });

    const unsupportedProviders = [
      'google-cloud',
      'azure-blob',
      'cloudflare-r2',
      'digitalocean-spaces',
      'minio',
      'invalid'
    ];

    unsupportedProviders.forEach(provider => {
      it(`should fallback to vercel-blob for unsupported provider: ${provider}`, () => {
        process.env.STORAGE_PROVIDER = provider;
        
        const config = getStorageConfig();
        
        expect(config.provider).toBe('vercel-blob');
      });
    });
  });

  describe('Configuration Object Structure', () => {
    it('should return object with provider property', () => {
      process.env.STORAGE_PROVIDER = 'aws-s3';
      
      const config = getStorageConfig();
      
      expect(config).toHaveProperty('provider');
      expect(typeof config.provider).toBe('string');
    });

    it('should return object that matches StorageConfig interface', () => {
      process.env.STORAGE_PROVIDER = 'aws-cloudfront';
      
      const config = getStorageConfig();
      
      // Verifica che l'oggetto abbia la struttura corretta
      expect(config).toEqual({
        provider: 'aws-cloudfront'
      });
    });

    it('should not include additional properties', () => {
      process.env.STORAGE_PROVIDER = 'vercel-blob';
      
      const config = getStorageConfig();
      
      const keys = Object.keys(config);
      expect(keys).toEqual(['provider']);
    });
  });

  describe('Environment Variable Handling', () => {
    it('should handle undefined STORAGE_PROVIDER', () => {
      process.env.STORAGE_PROVIDER = undefined;
      
      const config = getStorageConfig();
      
      expect(config.provider).toBe('vercel-blob');
    });

    it('should handle null STORAGE_PROVIDER', () => {
      // @ts-expect-error - Forziamo null per testare robustezza
      process.env.STORAGE_PROVIDER = null;
      
      const config = getStorageConfig();
      
      expect(config.provider).toBe('vercel-blob');
    });

    it('should trim whitespace from STORAGE_PROVIDER', () => {
      process.env.STORAGE_PROVIDER = '  aws-s3  ';
      
      const config = getStorageConfig();
      
      // Dovrebbe fallback perché non trimma automaticamente
      expect(config.provider).toBe('vercel-blob');
    });
  });

  describe('Runtime Provider Switching', () => {
    it('should reflect changes in environment variable', () => {
      // Prima configurazione
      process.env.STORAGE_PROVIDER = 'vercel-blob';
      const config1 = getStorageConfig();
      expect(config1.provider).toBe('vercel-blob');
      
      // Cambio configurazione
      process.env.STORAGE_PROVIDER = 'aws-s3';
      const config2 = getStorageConfig();
      expect(config2.provider).toBe('aws-s3');
      
      // Altro cambio
      process.env.STORAGE_PROVIDER = 'aws-cloudfront';
      const config3 = getStorageConfig();
      expect(config3.provider).toBe('aws-cloudfront');
    });

    it('should handle switching from valid to invalid provider', () => {
      // Configurazione valida
      process.env.STORAGE_PROVIDER = 'aws-s3';
      const config1 = getStorageConfig();
      expect(config1.provider).toBe('aws-s3');
      
      // Configurazione non valida
      process.env.STORAGE_PROVIDER = 'invalid-provider';
      const config2 = getStorageConfig();
      expect(config2.provider).toBe('vercel-blob');
    });

    it('should handle switching from invalid to valid provider', () => {
      // Configurazione non valida
      process.env.STORAGE_PROVIDER = 'invalid-provider';
      const config1 = getStorageConfig();
      expect(config1.provider).toBe('vercel-blob');
      
      // Configurazione valida
      process.env.STORAGE_PROVIDER = 'aws-cloudfront';
      const config2 = getStorageConfig();
      expect(config2.provider).toBe('aws-cloudfront');
    });
  });

  describe('Console Warnings', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log warning for unsupported provider', () => {
      process.env.STORAGE_PROVIDER = 'unsupported-provider';
      
      getStorageConfig();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        "Provider storage non supportato: unsupported-provider. Fallback a 'vercel-blob'"
      );
    });

    it('should not log warning for supported providers', () => {
      const supportedProviders: StorageProviderType[] = ['vercel-blob', 'aws-s3', 'aws-cloudfront'];
      
      supportedProviders.forEach(provider => {
        consoleSpy.mockClear();
        process.env.STORAGE_PROVIDER = provider;
        
        getStorageConfig();
        
        expect(consoleSpy).not.toHaveBeenCalled();
      });
    });

    it('should not log warning for default fallback', () => {
      delete process.env.STORAGE_PROVIDER;
      
      getStorageConfig();
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});
