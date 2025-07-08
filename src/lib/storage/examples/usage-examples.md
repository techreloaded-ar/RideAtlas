# Esempi di Utilizzo - Sistema Storage Multi-Provider

## Configurazione Ambiente

### Sviluppo Locale con Vercel Blob
```env
# .env.local
STORAGE_PROVIDER=vercel-blob
# Nessuna altra configurazione richiesta
```

### Produzione con AWS S3
```env
# .env.production
STORAGE_PROVIDER=aws-s3
AWS_REGION=eu-west-1
AWS_S3_BUCKET=rideatlas-production-media
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxx...
```

### Sviluppo con MinIO (locale)
```env
# .env.local
STORAGE_PROVIDER=aws-s3
AWS_REGION=us-east-1
AWS_S3_BUCKET=rideatlas-dev
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_S3_ENDPOINT=http://localhost:9000
```

## Esempi di Codice

### Upload Semplice
```typescript
import { getStorageProvider } from '@/lib/storage';

// Funziona con qualsiasi provider configurato
export async function uploadImage(file: File) {
  const storageProvider = getStorageProvider();
  
  const result = await storageProvider.uploadFile(file, file.name, {
    access: 'public'
  });
  
  return {
    url: result.url,
    publicId: result.publicId
  };
}
```

### Upload con Struttura Cartelle
```typescript
// Upload file GPX con organizzazione per utente
export async function uploadGPXFile(file: File, userId: string) {
  const storageProvider = getStorageProvider();
  
  const result = await storageProvider.uploadFile(file, file.name, {
    access: 'public',
    folder: 'gpx',
    userId: userId,
    addRandomSuffix: false
  });
  
  // Risultato identico indipendentemente dal provider:
  // Vercel: https://blob.vercel-storage.com/gpx/user123/user123-1640995200000-route.gpx
  // AWS S3:  https://bucket.s3.region.amazonaws.com/gpx/user123/user123-1640995200000-route.gpx
  
  return result;
}
```

### Gestione Errori
```typescript
export async function safeUpload(file: File) {
  try {
    const storageProvider = getStorageProvider();
    
    // Validazione opzionale
    const isValid = await storageProvider.validateFile(file);
    if (!isValid) {
      throw new Error('File non valido per questo provider');
    }
    
    const result = await storageProvider.uploadFile(file, file.name);
    return { success: true, data: result };
    
  } catch (error) {
    // Errori standardizzati da tutti i provider
    console.error('Upload fallito:', error.message);
    return { 
      success: false, 
      error: error.message 
    };
  }
}
```

### Eliminazione File
```typescript
export async function deleteFile(publicId: string) {
  try {
    const storageProvider = getStorageProvider();
    await storageProvider.deleteFile(publicId);
    console.log('File eliminato con successo');
  } catch (error) {
    console.error('Errore eliminazione:', error.message);
  }
}
```

### Switch di Provider Runtime
```typescript
// Non è necessario riavviare l'applicazione
// Basta cambiare la variabile d'ambiente e resettare il factory

import { StorageFactory } from '@/lib/storage';

export function switchStorageProvider() {
  // Dopo aver cambiato STORAGE_PROVIDER nell'ambiente
  StorageFactory.resetInstance();
  
  // Il prossimo getStorageProvider() creerà il nuovo provider
  const newProvider = getStorageProvider();
  console.log('Provider cambiato con successo');
}
```

## Migrazione Tra Provider

### Script di Migrazione
```typescript
import { getStorageProvider, StorageFactory } from '@/lib/storage';

export async function migrateFiles(filesList: Array<{publicId: string, originalName: string}>) {
  // Provider di origine
  process.env.STORAGE_PROVIDER = 'vercel-blob';
  StorageFactory.resetInstance();
  const sourceProvider = getStorageProvider();
  
  // Provider di destinazione  
  process.env.STORAGE_PROVIDER = 'aws-s3';
  StorageFactory.resetInstance();
  const targetProvider = getStorageProvider();
  
  for (const fileInfo of filesList) {
    try {
      // 1. Scarica dal provider di origine
      const sourceUrl = sourceProvider.getFileUrl(fileInfo.publicId);
      const response = await fetch(sourceUrl);
      const fileBlob = await response.blob();
      const file = new File([fileBlob], fileInfo.originalName);
      
      // 2. Carica sul provider di destinazione
      const result = await targetProvider.uploadFile(file, fileInfo.originalName);
      
      // 3. Aggiorna database con nuovo URL
      console.log(`Migrato: ${fileInfo.publicId} -> ${result.publicId}`);
      
    } catch (error) {
      console.error(`Errore migrazione ${fileInfo.publicId}:`, error);
    }
  }
}
```

### Fallback Strategy
```typescript
export async function uploadWithFallback(file: File) {
  const primaryProvider = process.env.STORAGE_PROVIDER || 'vercel-blob';
  const fallbackProvider = primaryProvider === 'aws-s3' ? 'vercel-blob' : 'aws-s3';
  
  try {
    // Prova con il provider primario
    const storageProvider = getStorageProvider();
    return await storageProvider.uploadFile(file, file.name);
    
  } catch (error) {
    console.warn(`Provider ${primaryProvider} fallito, provo fallback ${fallbackProvider}`);
    
    // Cambia provider e riprova
    const originalProvider = process.env.STORAGE_PROVIDER;
    process.env.STORAGE_PROVIDER = fallbackProvider;
    StorageFactory.resetInstance();
    
    try {
      const fallbackStorageProvider = getStorageProvider();
      const result = await fallbackStorageProvider.uploadFile(file, file.name);
      
      // Restore provider originale
      process.env.STORAGE_PROVIDER = originalProvider;
      StorageFactory.resetInstance();
      
      return result;
      
    } catch (fallbackError) {
      // Restore provider originale
      process.env.STORAGE_PROVIDER = originalProvider;
      StorageFactory.resetInstance();
      
      throw new Error(`Entrambi i provider falliti: ${error.message}, ${fallbackError.message}`);
    }
  }
}
```

## Testing

### Mock per Unit Test
```typescript
// jest.setup.ts
import { StorageFactory } from '@/lib/storage';

const mockStorageProvider = {
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  getFileUrl: jest.fn(),
  validateFile: jest.fn(),
};

beforeEach(() => {
  StorageFactory.resetInstance();
  
  // Mock del getStorageProvider
  jest.doMock('@/lib/storage', () => ({
    getStorageProvider: () => mockStorageProvider,
    StorageFactory: {
      resetInstance: jest.fn(),
    },
  }));
});
```

### Test di Integrazione
```typescript
// integration.test.ts
describe('Storage Integration', () => {
  beforeEach(() => {
    StorageFactory.resetInstance();
  });

  it('should upload file with Vercel provider', async () => {
    process.env.STORAGE_PROVIDER = 'vercel-blob';
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const provider = getStorageProvider();
    const result = await provider.uploadFile(file, 'test.txt');
    
    expect(result.url).toContain('vercel-storage.com');
  });

  it('should upload file with AWS S3 provider', async () => {
    process.env.STORAGE_PROVIDER = 'aws-s3';
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_S3_BUCKET = 'test-bucket';
    // ... altre env vars
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const provider = getStorageProvider();
    const result = await provider.uploadFile(file, 'test.txt');
    
    expect(result.url).toContain('s3.amazonaws.com');
  });
});
``` 