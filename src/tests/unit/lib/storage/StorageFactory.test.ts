import { StorageFactory, getStorageProvider } from '@/lib/storage';
import { VercelBlobProvider } from '@/lib/storage/providers/VercelBlobProvider';
import { AWSS3Provider } from '@/lib/storage/providers/AWSS3Provider';
import { AWSCloudFrontProvider } from '@/lib/storage/providers/AWSCloudFrontProvider';

// Mock dei provider per evitare chiamate reali
jest.mock('@/lib/storage/providers/VercelBlobProvider');
jest.mock('@/lib/storage/providers/AWSS3Provider');
jest.mock('@/lib/storage/providers/AWSCloudFrontProvider');

// Mock delle dipendenze AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({})),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  HeadBucketCommand: jest.fn(),
}));

// Mock di Vercel Blob
jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
  del: jest.fn(),
}));

describe('StorageFactory', () => {
  // Backup delle variabili d'ambiente originali
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset dell'istanza singleton prima di ogni test
    StorageFactory.resetInstance();
    
    // Reset delle variabili d'ambiente
    process.env = { ...originalEnv };
    
    // Clear dei mock
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Ripristina le variabili d'ambiente originali
    process.env = originalEnv;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      process.env.STORAGE_PROVIDER = 'vercel-blob';
      
      const instance1 = StorageFactory.getInstance();
      const instance2 = StorageFactory.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(VercelBlobProvider).toHaveBeenCalledTimes(1);
    });

    it('should create new instance after reset', () => {
      process.env.STORAGE_PROVIDER = 'vercel-blob';
      
      const instance1 = StorageFactory.getInstance();
      StorageFactory.resetInstance();
      const instance2 = StorageFactory.getInstance();
      
      expect(instance1).not.toBe(instance2);
      expect(VercelBlobProvider).toHaveBeenCalledTimes(2);
    });
  });

  describe('Provider Selection', () => {
    it('should create VercelBlobProvider when STORAGE_PROVIDER is vercel-blob', () => {
      process.env.STORAGE_PROVIDER = 'vercel-blob';
      
      const instance = StorageFactory.getInstance();
      
      expect(VercelBlobProvider).toHaveBeenCalledTimes(1);
      expect(AWSS3Provider).not.toHaveBeenCalled();
      expect(AWSCloudFrontProvider).not.toHaveBeenCalled();
    });

    it('should create AWSS3Provider when STORAGE_PROVIDER is aws-s3', () => {
      process.env.STORAGE_PROVIDER = 'aws-s3';
      process.env.AWS_REGION = 'us-east-1';
      process.env.AWS_S3_BUCKET = 'test-bucket';
      process.env.AWS_ACCESS_KEY_ID = 'test-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
      
      const instance = StorageFactory.getInstance();
      
      expect(AWSS3Provider).toHaveBeenCalledTimes(1);
      expect(VercelBlobProvider).not.toHaveBeenCalled();
      expect(AWSCloudFrontProvider).not.toHaveBeenCalled();
    });

    it('should create AWSCloudFrontProvider when STORAGE_PROVIDER is aws-cloudfront', () => {
      process.env.STORAGE_PROVIDER = 'aws-cloudfront';
      process.env.AWS_REGION = 'us-east-1';
      process.env.AWS_S3_BUCKET = 'test-bucket';
      process.env.AWS_ACCESS_KEY_ID = 'test-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
      process.env.AWS_CLOUDFRONT_DOMAIN = 'd1234567890.cloudfront.net';
      
      const instance = StorageFactory.getInstance();
      
      expect(AWSCloudFrontProvider).toHaveBeenCalledTimes(1);
      expect(VercelBlobProvider).not.toHaveBeenCalled();
      expect(AWSS3Provider).not.toHaveBeenCalled();
    });

    it('should default to vercel-blob when STORAGE_PROVIDER is not set', () => {
      delete process.env.STORAGE_PROVIDER;
      
      const instance = StorageFactory.getInstance();
      
      expect(VercelBlobProvider).toHaveBeenCalledTimes(1);
    });

    it('should default to vercel-blob when STORAGE_PROVIDER is invalid', () => {
      process.env.STORAGE_PROVIDER = 'invalid-provider';
      
      const instance = StorageFactory.getInstance();
      
      expect(VercelBlobProvider).toHaveBeenCalledTimes(1);
    });

    // Nota: Il test per provider non supportati è gestito da getStorageConfig
    // che fa automaticamente fallback a 'vercel-blob' per provider non validi
  });

  describe('Provider Switching', () => {
    it('should switch from vercel-blob to aws-s3', () => {
      // Inizia con Vercel
      process.env.STORAGE_PROVIDER = 'vercel-blob';
      const instance1 = StorageFactory.getInstance();
      expect(VercelBlobProvider).toHaveBeenCalledTimes(1);
      
      // Switch a AWS S3
      process.env.STORAGE_PROVIDER = 'aws-s3';
      process.env.AWS_REGION = 'us-east-1';
      process.env.AWS_S3_BUCKET = 'test-bucket';
      process.env.AWS_ACCESS_KEY_ID = 'test-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
      
      StorageFactory.resetInstance();
      const instance2 = StorageFactory.getInstance();
      
      expect(AWSS3Provider).toHaveBeenCalledTimes(1);
      expect(instance1).not.toBe(instance2);
    });

    it('should switch from aws-s3 to aws-cloudfront', () => {
      // Inizia con AWS S3
      process.env.STORAGE_PROVIDER = 'aws-s3';
      process.env.AWS_REGION = 'us-east-1';
      process.env.AWS_S3_BUCKET = 'test-bucket';
      process.env.AWS_ACCESS_KEY_ID = 'test-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
      
      const instance1 = StorageFactory.getInstance();
      expect(AWSS3Provider).toHaveBeenCalledTimes(1);
      
      // Switch a AWS CloudFront
      process.env.STORAGE_PROVIDER = 'aws-cloudfront';
      process.env.AWS_CLOUDFRONT_DOMAIN = 'd1234567890.cloudfront.net';
      
      StorageFactory.resetInstance();
      const instance2 = StorageFactory.getInstance();
      
      expect(AWSCloudFrontProvider).toHaveBeenCalledTimes(1);
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('getStorageProvider convenience function', () => {
    it('should return the same instance as StorageFactory.getInstance()', () => {
      process.env.STORAGE_PROVIDER = 'vercel-blob';
      
      const factoryInstance = StorageFactory.getInstance();
      const convenienceInstance = getStorageProvider();
      
      expect(factoryInstance).toBe(convenienceInstance);
    });

    it('should work with different providers', () => {
      process.env.STORAGE_PROVIDER = 'aws-cloudfront';
      process.env.AWS_REGION = 'us-east-1';
      process.env.AWS_S3_BUCKET = 'test-bucket';
      process.env.AWS_ACCESS_KEY_ID = 'test-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
      process.env.AWS_CLOUDFRONT_DOMAIN = 'd1234567890.cloudfront.net';
      
      const provider = getStorageProvider();
      
      expect(AWSCloudFrontProvider).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle provider initialization errors gracefully', () => {
      // Mock del provider per lanciare un errore durante l'inizializzazione
      (VercelBlobProvider as jest.Mock).mockImplementation(() => {
        throw new Error('Provider initialization failed');
      });
      
      process.env.STORAGE_PROVIDER = 'vercel-blob';
      
      expect(() => {
        StorageFactory.getInstance();
      }).toThrow('Provider initialization failed');
    });
  });

  describe('Configuration Validation', () => {
    it('should handle missing AWS configuration for S3 provider', () => {
      process.env.STORAGE_PROVIDER = 'aws-s3';
      // Non impostiamo le variabili AWS richieste
      
      // Il provider dovrebbe lanciare un errore di configurazione
      (AWSS3Provider as jest.Mock).mockImplementation(() => {
        throw new Error('Configurazione AWS S3 incompleta');
      });
      
      expect(() => {
        StorageFactory.getInstance();
      }).toThrow('Configurazione AWS S3 incompleta');
    });

    it('should handle missing CloudFront configuration', () => {
      process.env.STORAGE_PROVIDER = 'aws-cloudfront';
      process.env.AWS_REGION = 'us-east-1';
      process.env.AWS_S3_BUCKET = 'test-bucket';
      process.env.AWS_ACCESS_KEY_ID = 'test-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
      // Manca AWS_CLOUDFRONT_DOMAIN
      
      (AWSCloudFrontProvider as jest.Mock).mockImplementation(() => {
        throw new Error('Configurazione AWS CloudFront incompleta');
      });
      
      expect(() => {
        StorageFactory.getInstance();
      }).toThrow('Configurazione AWS CloudFront incompleta');
    });
  });
});
