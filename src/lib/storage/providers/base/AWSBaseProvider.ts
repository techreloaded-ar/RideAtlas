import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadBucketCommand, S3ClientConfig } from '@aws-sdk/client-s3';
import { IFileStorageProvider } from '../../interfaces/IFileStorageProvider';
import { UploadResult, UploadOptions, sanitizeDirectoryName } from '../../types/storage';

/**
 * Configurazione base comune per tutti i provider AWS
 */
export interface AWSBaseConfig {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string; // Per servizi S3-compatible (MinIO, DigitalOcean Spaces, etc.)
}

/**
 * Classe base astratta per tutti i provider AWS
 * Contiene la logica comune per S3, CloudFront e altri servizi AWS
 * 
 * Implementa il pattern Template Method:
 * - Definisce l'algoritmo comune per upload/delete/validation
 * - Delega la generazione URL ai provider specifici
 */
export abstract class AWSBaseProvider implements IFileStorageProvider {
  protected config: AWSBaseConfig;
  protected s3Client: S3Client;
  private bucketInitialized: boolean = false;
  
  constructor() {
    this.config = this.loadBaseConfiguration();
    this.validateBaseConfiguration();
    this.s3Client = this.createS3Client();
    // L'inizializzazione del bucket verrà fatta lazy al primo upload
  }
  
  /**
   * Carica la configurazione AWS base dalle variabili d'ambiente
   * I provider specifici possono estendere questa configurazione
   */
  protected loadBaseConfiguration(): AWSBaseConfig {
    const config: AWSBaseConfig = {
      region: process.env.AWS_REGION || '',
      bucket: process.env.AWS_S3_BUCKET || '',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      endpoint: process.env.AWS_S3_ENDPOINT, // Opzionale per servizi S3-compatible
    };
    
    return config;
  }
  
  /**
   * Valida che tutte le configurazioni base richieste siano presenti
   */
  protected validateBaseConfiguration(): void {
    const { region, bucket, accessKeyId, secretAccessKey } = this.config;
    
    if (!region || !bucket || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'Configurazione AWS base incompleta. Verificare le variabili d\'ambiente: ' +
        'AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY'
      );
    }
    
    
  }
  
  /**
   * Crea il client S3 con la configurazione caricata
   * Utilizzato per tutte le operazioni di storage (upload, delete, etc.)
   */
  protected createS3Client(): S3Client {
    const clientConfig: S3ClientConfig = {
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    };
    
    // Supporto per endpoint personalizzati (MinIO, DigitalOcean Spaces, etc.)
    if (this.config.endpoint) {
      clientConfig.endpoint = this.config.endpoint;
      clientConfig.forcePathStyle = true; // Necessario per alcuni servizi S3-compatible
      
    }
    
    return new S3Client(clientConfig);
  }
  
  /**
   * Inizializza il provider verificando l'accesso al bucket (lazy initialization)
   */
  private async ensureBucketInitialized(): Promise<void> {
    if (this.bucketInitialized) {
      return;
    }
    
    try {
      // Verifica che il bucket sia accessibile
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.config.bucket }));
      
      this.bucketInitialized = true;
    } catch (error) {
      console.error(`AWSBaseProvider: Errore verifica bucket '${this.config.bucket}':`, error);
      throw new Error(`Bucket S3 '${this.config.bucket}' non accessibile. Verificare credenziali e permessi.`);
    }
  }
  
  /**
   * Carica un file su AWS S3
   * L'URL finale dipende dall'implementazione specifica del provider (S3 vs CloudFront)
   */
  async uploadFile(
    file: File, 
    fileName: string, 
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      // Verifica l'accesso al bucket al primo upload
      await this.ensureBucketInitialized();
      
      const key = this.generateS3Key(fileName, options);
      
      // Converte il File in Buffer per S3
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      
      const putCommand = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: file.type,
        ContentLength: file.size,
        // Rimosso ACL per compatibilità con bucket che hanno ACL disabilitati
        // L'accesso pubblico deve essere configurato tramite Bucket Policy
        // Metadata opzionali
        Metadata: {
          'original-filename': file.name,
          'upload-timestamp': Date.now().toString(),
        },
      });
      
      await this.s3Client.send(putCommand);
      
      const url = this.generatePublicUrl(key);
      
      
      return {
        url,
        publicId: key, // Usiamo solo la key S3 come publicId
        fileName: file.name,
        size: file.size,
        type: file.type,
      };
    } catch (error) {
      console.error('Errore upload AWS:', error);
      throw new Error('Errore durante l\'upload del file su AWS');
    }
  }
  
  /**
   * Elimina un file da AWS S3
   */
  async deleteFile(publicId: string): Promise<void> {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: publicId, // publicId è la key S3
      });
      
      await this.s3Client.send(deleteCommand);
      
    } catch (error) {
      console.error('Errore eliminazione file AWS S3:', error);
      throw new Error('Errore durante l\'eliminazione del file da AWS S3');
    }
  }
  
  /**
   * Elimina una directory e tutto il suo contenuto da AWS S3
   */
  async deleteDirectory(directoryPath: string): Promise<void> {
    try {
      // Lista tutti gli oggetti nella directory
      const listCommand = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: directoryPath + '/', // Assicura che il prefisso termini con slash
      });
      
      const listResponse = await this.s3Client.send(listCommand);
      
      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        
        return;
      }
      
      // Elimina tutti gli oggetti trovati
      
      
      const deletePromises = listResponse.Contents.map(async (object) => {
        if (object.Key) {
          await this.deleteFile(object.Key);
        }
      });
      
      await Promise.all(deletePromises);
      
      
      // Gestione per directory con più di 1000 oggetti (paginazione S3)
      if (listResponse.IsTruncated) {
        
        await this.deleteDirectory(directoryPath);
      }
      
    } catch (error) {
      console.error(`Errore eliminazione directory AWS S3 ${directoryPath}:`, error);
      throw new Error(`Errore durante l'eliminazione della directory da AWS S3: ${directoryPath}`);
    }
  }
  
  /**
   * Ottiene l'URL pubblico di un file
   * Implementazione delegata ai provider specifici
   */
  getFileUrl(publicId: string): string {
    return this.generatePublicUrl(publicId);
  }
  
  /**
   * Valida un file prima dell'upload
   */
  async validateFile(file: File): Promise<boolean> {
    // Validazioni tecniche specifiche per AWS S3
    
    
    // S3 ha un limite di 5TB per file singolo, ma per ora non implementiamo multipart
    const maxSingleUploadSize = 5 * 1024 * 1024 * 1024; // 5GB (limite pratico per singolo upload)
    
    if (file.size > maxSingleUploadSize) {
      console.warn(`File troppo grande per upload singolo S3: ${file.size} bytes`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Genera la key S3 per il file usando la nuova struttura organizzata per trip e stage
   * Mantiene compatibilità con Vercel
   */
  protected generateS3Key(fileName: string, options: UploadOptions): string {
    // Nuova struttura trip-based
    if (options.tripId && options.tripName) {
      const basePath = `trips/${sanitizeDirectoryName(`${options.tripId} - ${options.tripName}`)}`;
      
      // File stage-level: dentro sottodirectory stages
      if (options.stageIndex !== undefined && options.stageName) {
        const stagePath = `${basePath}/stages/${sanitizeDirectoryName(`${options.stageIndex} - ${options.stageName}`)}`;
        
        // Media della tappa vanno in sottodirectory media/
        if (fileName.match(/\.(jpg|jpeg|png|webp|mp4|mov|avi)$/i)) {
          return `${stagePath}/media/${fileName}`;
        }
        
        // GPX della tappa nella root della directory stage
        return `${stagePath}/${fileName}`;
      }
      
      // File trip-level: nella root della directory trip
      return `${basePath}/${fileName}`;
    }
    
    // Struttura legacy con solo tripId (backward compatibility)
    if (options.tripId) {
      return `trips/${options.tripId}/${fileName}`;
    }
    
    if (options.folder && options.userId) {
      // Struttura legacy per file con cartelle (es. GPX) - identica a Vercel
      const timestamp = Date.now();
      const sanitizedFilename = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${options.userId}-${timestamp}-${sanitizedFilename}`;
      return `${options.folder}/${options.userId}/${filename}`;
    }
    
    // Struttura per media generici legacy - identica a Vercel
    return fileName;
  }
  
  /**
   * Metodo astratto per generare l'URL pubblico
   * Ogni provider implementa la propria logica (S3 diretto vs CloudFront)
   */
  protected abstract generatePublicUrl(key: string): string;
}
