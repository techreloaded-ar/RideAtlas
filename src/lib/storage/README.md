# Sistema Storage Multi-Provider

Questo sistema permette di cambiare facilmente il provider di storage per i file dell'applicazione tramite configurazione, senza modificare il codice esistente.

## Architettura

Il sistema utilizza il **Strategy Pattern** combinato con **Dependency Injection** per permettere l'intercambiabilità dei provider di storage.

### Struttura

```
src/lib/storage/
├── index.ts                          # Factory e export principali
├── interfaces/
│   └── IFileStorageProvider.ts       # Interfaccia comune
├── providers/
│   ├── VercelBlobProvider.ts         # Implementazione Vercel Blob
│   └── AWSS3Provider.ts              # Implementazione AWS S3 (futura)
├── types/
│   └── storage.ts                    # Tipi TypeScript
├── config/
│   └── storageConfig.ts              # Configurazione generale
└── README.md                         # Questa documentazione
```

## Configurazione

### Variabile d'Ambiente

Aggiungi al tuo file `.env.local`:

```env
# Provider storage: 'vercel-blob' (default) | 'aws-s3'
STORAGE_PROVIDER=vercel-blob
```

### Provider Supportati

#### 1. Vercel Blob (default)
- **Configurazione**: Automatica (gestita dal runtime Vercel)
- **Variabili richieste**: Nessuna (credenziali automatiche)
- **Caratteristiche**: Accesso solo pubblico, integrazione nativa con Vercel

#### 2. AWS S3 ✅
- **Configurazione**: Manuale tramite variabili d'ambiente
- **Variabili richieste**: 
  ```env
  AWS_REGION=us-east-1
  AWS_S3_BUCKET=rideatlas-media
  AWS_ACCESS_KEY_ID=your-access-key
  AWS_SECRET_ACCESS_KEY=your-secret-key
  ```
- **Variabili opzionali**:
  ```env
  # Per servizi S3-compatible (MinIO, DigitalOcean Spaces, etc.)
  AWS_S3_ENDPOINT=https://your-s3-compatible-service.com
  ```
- **Caratteristiche**:
  - Accesso pubblico tramite Bucket Policy (ACL non utilizzati)
  - Supporto endpoint personalizzati per servizi S3-compatible
  - Validazione bucket al primo upload (lazy initialization)
  - Metadata automatici (nome originale, timestamp)

## Utilizzo

### Nei Route Handlers

```typescript
// src/app/api/upload/route.ts
import { getStorageProvider } from '@/lib/storage';

export async function POST(request: NextRequest) {
  // ... validazioni ...
  
  const storageProvider = getStorageProvider();
  const uploadResult = await storageProvider.uploadFile(file, file.name, {
    access: 'public'
  });
  
  return NextResponse.json({
    url: uploadResult.url,
    filename: uploadResult.fileName,
    size: uploadResult.size,
    type: uploadResult.type
  });
}
```

### Upload con Opzioni

```typescript
// Upload di file GPX con struttura cartelle
const uploadResult = await storageProvider.uploadFile(file, file.name, {
  access: 'public',
  folder: 'gpx',
  userId: session.user.id,
  addRandomSuffix: false
});
```

## Interfaccia IFileStorageProvider

Tutti i provider devono implementare:

```typescript
interface IFileStorageProvider {
  uploadFile(file: File, fileName: string, options?: UploadOptions): Promise<UploadResult>;
  deleteFile(publicId: string): Promise<void>;
  getFileUrl(publicId: string): string;
  validateFile(file: File): Promise<boolean>;
}
```

## Gestione degli Errori

Ogni provider gestisce i propri errori specifici e li standardizza:

```typescript
try {
  const result = await storageProvider.uploadFile(file, fileName);
} catch (error) {
  // Error standardizzato per tutti i provider
  console.error('Errore upload:', error.message);
}
```

## Backward Compatibility

Il refactoring mantiene la **completa compatibilità** con il codice esistente:

- I path dei file esistenti rimangono invariati
- Le URL dei file già caricati continuano a funzionare
- Il comportamento di default è identico al sistema precedente

## Testing

```typescript
// Mock del provider per i test
import { StorageFactory } from '@/lib/storage';

beforeEach(() => {
  StorageFactory.resetInstance();
});

// Il factory crea automaticamente l'istanza basata su STORAGE_PROVIDER
```

## Aggiungere un Nuovo Provider

1. **Creare l'implementazione**:
   ```typescript
   // src/lib/storage/providers/NewProvider.ts
   export class NewProvider implements IFileStorageProvider {
     // Implementazione metodi richiesti
   }
   ```

2. **Aggiornare il tipo**:
   ```typescript
   // src/lib/storage/types/storage.ts
   export type StorageProviderType = 'vercel-blob' | 'aws-s3' | 'new-provider';
   ```

3. **Aggiornare il factory**:
   ```typescript
   // src/lib/storage/index.ts
   case 'new-provider':
     this.instance = new NewProvider();
     break;
   ```

## Vantaggi

- ✅ **Zero Breaking Changes**: Il codice esistente continua a funzionare
- ✅ **Configurazione Runtime**: Cambio provider senza rebuild
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Testabilità**: Facile mock e test isolati
- ✅ **Estendibilità**: Semplice aggiunta di nuovi provider
- ✅ **Separation of Concerns**: Ogni provider gestisce la propria configurazione

## Configurazione AWS S3

### Creazione Bucket S3

1. **Crea un bucket S3** nella console AWS
2. **Disabilita Block Public Access** (se necessario per accesso pubblico)
3. **Configura Bucket Policy** per accesso pubblico (invece di ACL):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```
4. **Crea utente IAM** con policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:PutObjectAcl",
           "s3:DeleteObject",
           "s3:HeadBucket"
         ],
         "Resource": [
           "arn:aws:s3:::your-bucket-name",
           "arn:aws:s3:::your-bucket-name/*"
         ]
       }
     ]
   }
   ```

### ⚠️ Importante: ACL vs Bucket Policy

Il provider **non utilizza ACL** per evitare l'errore `AccessControlListNotSupported`.

**Problema comune:**
```
AccessControlListNotSupported: The bucket does not allow ACLs
```

**Soluzione:**
- Usa **Bucket Policy** invece di ACL per l'accesso pubblico
- I bucket S3 moderni hanno spesso gli ACL disabilitati per sicurezza
- Il codice è stato aggiornato per non utilizzare `ACL: 'public-read'`

### Servizi S3-Compatible

Il provider supporta anche servizi compatibili con S3:

```env
# DigitalOcean Spaces
AWS_S3_ENDPOINT=https://fra1.digitaloceanspaces.com
AWS_REGION=fra1

# MinIO
AWS_S3_ENDPOINT=https://your-minio-server.com
AWS_REGION=us-east-1
```

## Roadmap

- [x] Implementazione AWS S3 Provider
- [ ] Supporto per accesso privato con URL firmati
- [ ] Implementazione CloudFlare R2 Provider  
- [ ] Sistema di migrazione automatica tra provider
- [ ] Supporto multipart upload per file grandi
- [ ] Cache layer per metadati file 